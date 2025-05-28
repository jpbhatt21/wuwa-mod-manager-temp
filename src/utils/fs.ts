import { IGNORE, RESTORE } from "@/init";
import { lastUpdatedAtom, localDataAtom, localItemsAtom, presetsAtom, rootPathAtom, settingsAtom, store } from "@/variables";
import { readDir, writeTextFile, rename, exists, mkdir,remove, copyFile } from "@tauri-apps/plugin-fs";
import { open } from '@tauri-apps/plugin-dialog';
let root = "";
export function sort(a: any, b: any) {
	let x = a.name.replaceAll("DISABLED_", "");
	let y = b.name.replaceAll("DISABLED_", "");
	return x.localeCompare(y) * (x[0].toLowerCase() == y[0].toLowerCase() ? (x[0] == x[0].toUpperCase() && y[0] != y[0].toUpperCase() ? 1 : -1) : 1);
}
export async function recrReadDir(path: string, maxDepth = 2, depth = 0, def = true) {
	if (def && depth == 0) root = path;
	if (depth > maxDepth) return [];
	let entries = [] as any[];
	try {
		entries = await readDir(path);
	} catch {
		return [];
	}
	let files = [] as any;
	for (let entry of entries) {
		if ((entry.name == RESTORE || entry.name == IGNORE) && def) continue;
		let children = [];
		if (entry.isDirectory) children = await recrReadDir(path + "\\" + entry.name, maxDepth, depth + 1);
		let tpath = path.replaceAll(root, "");
		files.push({
			name: entry.name,
			isDir: entry.isDirectory,
			path: tpath + "\\" + entry.name,
			truePath: (tpath + "\\" + entry.name).replaceAll("DISABLED_", ""),
			parent: tpath,
			trueParent: tpath.replaceAll("DSABLED_", ""),
			preview: "http://127.0.0.1:5000/preview/" + path,
			keys: [],
			enabled: !entry.name.startsWith("DISABLED_"),
			children,
			depth,
		});
	}
	return files.sort(sort);
}
export function joinPath(path: string, ...paths: string[]) {
	let p = path.trim();
	for (let p2 of paths) {
		if (p.endsWith("\\")) p = p.slice(0, -1);
		if (p2.startsWith("\\")) p2 = p2.slice(1);
		if (p2.trim().length == 0) continue;
		p += "\\" + p2.trim();
	}
	return p;
}
export function saveConfig() {
	const config = {
		dir: store.get(rootPathAtom) || "",
		presets: store.get(presetsAtom) || [],
		settings: store.get(settingsAtom) || {},
		data: store.get(localDataAtom) || {},
		version: "1.0.0",
		savedAt: Date.now(),
	};
	writeTextFile("config.json", JSON.stringify(config, null, 2));
}
export function recrReplaceName(items: any, find: string, replace: string) {
	for (let item of items) {
		item.path = item.path.replaceAll(find, replace);
		item.truePath = item.truePath.replaceAll(find, replace);
		item.parent = item.parent.replaceAll(find, replace);
		item.trueParent = item.trueParent.replaceAll(find, replace);
		if (item.children && item.children.length > 0) {
			item.children = recrReplaceName(item.children, find, replace);
		}
	}
	return items;
}

export async function renameItem(root: string, path: any, newName: string, pathMode = false) {
	let newPath = path.split("\\").slice(0, -1).join("\\") + "\\" + newName;
	if (pathMode) {
		let splitPath = newName.split("\\");
		for (let i = 1; i < splitPath.length - 1; i++) {
			if (!(await exists(root + splitPath.slice(0, i + 1).join("\\")))) {
				await mkdir(root + splitPath.slice(0, i + 1).join("\\"));
			}
		}
		newPath = newName;
	}

	try {
		await rename(root + path, pathMode ? root + newName : root + newPath);
		store.set(localItemsAtom, (prev: any) => {
			for (let item of prev) {
				if (item.path === path || item.truePath === path) {
					if (!pathMode) item.enabled = newName.startsWith("DISABLED_") ? false : true;
					else {
						item.parent = newPath.split("\\").slice(0, -1).join("\\");
						item.trueParent = item.parent.replaceAll("DISABLED_", "");
					}
					item.path = newPath;
					item.truePath = newPath.replaceAll("DISABLED_", "");
					item.children = recrReplaceName(item.children, path, newPath);
					break;
				}
			}
			return [...prev];
		});
	} catch (e) {
		console.error("Error renaming disabled item:", e);
	}
}
export async function savePreviewImage(path: string) {
	const file = await open({
		multiple: false,
		directory: false,
	});
    if(!file) return;
    let exts = ["png", "jpg", "jpeg", "webp", "gif"]
    for (let ext of exts) {
       try{
        await remove(path+"\\"+"preview."+ext)
       }
       catch{}
    }
    await copyFile(file, path + "\\" + "preview."+ file.split(".").pop());
    store.set(lastUpdatedAtom, Date.now());
}
export async function saveRootPath(){
    const file = await open({
        multiple: false,
        directory: true,
    });
    if(!file) return;
    store.set(rootPathAtom, file);
    store.set(localItemsAtom, await recrReadDir(file));
    // store.set(localDataAtom, {});
    // store.set(presetsAtom, []);
    // store.set(settingsAtom, {
    //     type: 0,
    //     opacity: 0.5,
    //     showHidden: false,
    //     showDisabled: false,
    //     showPreview: true,
    //     showHotkeys: true,
    //     showCategories: true,
    // });
    saveConfig();
}
export async function applyPreset(root:string,preset:any){
    if(!preset || !preset.data || preset.data.length == 0) return;
    console.log("Applying preset", preset.name, preset.data);
    for (let item of preset.data) {
        let path = item.split("\\")
        let name = path.pop();
        if (name.startsWith("DISABLED_")) {
            name = name.slice(9);
        }
        else{
            name = "DISABLED_" + name;
        }
        path.push(name);
        path = path.join("\\");
        try{
        await rename(root + path, root + item);}
        catch{
        }

    }
}