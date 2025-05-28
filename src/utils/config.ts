import { mkdir, readTextFile, rename } from "@tauri-apps/plugin-fs";
import { joinPath, recrReadDir, sort } from "./fs";
import { IGNORE, RESTORE, UNCATEGORIZED } from "@/init";
import { categoriesAtom, plannedChangesAtom, store } from "@/variables";

export async function refreshDir(root: string, dir: string, data: any) {
	let entries = await recrReadDir(joinPath(root, dir), 2);
	initFolderStructure(root, entries);
	entries =(await detectHotkeysLoadDate(await recrReadDir(joinPath(root, dir), 3), data,root))[0];
    entries = dir==""? entries.map((entry:any)=>(entry.children)).flat().sort(sort  ):entries
	return entries;
}
async function detectHotkeysLoadDate(entries: any, data: any,root:any) {
	let hotkeyData: any = [];
	for (let entry of entries) {
		if (data[entry.truePath]) {
			for (let key of Object.keys(data[entry.truePath])) {
				entry[key] = data[entry.truePath][key];
			}
		}
		if (entry.name.endsWith(".ini")) {
			let file = await readTextFile(joinPath(root, entry.path));
			let lines = file.split("\n");
			let counter = 0;
			let key = "";
			let type = "";
			let target = "";
			for (let line of lines) {
				line = line
					.trim()
					.replaceAll(/[\r\n]+/g, "")
					.replaceAll(" ", "");
				if (counter == 0 && line.startsWith("key=")) {
					key = line.split("=")[1].trim();
					counter++;
				} else if (counter == 1 && line.startsWith("type=")) {
					type = line.split("=")[1].trim();
					counter++;
				} else if (counter == 2 && line.startsWith("$")) {
					target = line.split("=")[0].trim().slice(1);
					counter = 0;
					hotkeyData.push({
						key,
						type,
						target,
						name: target,
					});
				}
			}
		}
		if (entry.isDir && entry.children.length > 0) {
			let childHK;
			[entry.children, childHK] = await detectHotkeysLoadDate(entry.children, data,root);
			if (childHK.length > 0) {
				entry.keys = childHK;
			}
		}
	}
	return [entries, hotkeyData];
}
export async function getInitPlan(root: string) {
	const categories = store.get(categoriesAtom) || [];
	let entries = await recrReadDir(joinPath(root, ""), 0);
	let cats:any={}
	let finalEntries = [];
	let found = false;
	for (let entry of entries) {
		found=false;
		for (let category of categories) {
			if (category._sName.toLowerCase() == entry.name.toLowerCase()) {
				if(!cats[category._sName]) cats[category._sName] = {
					name: category._sName,
					icon: category._sIconUrl,
					children: [],
				}
				found=true;
				break
			}
			else if(
				entry.name.toLowerCase().includes(category._sName.toLowerCase()) 
			) {
				if(!cats[category._sName]) cats[category._sName] = {
					name: category._sName,
					icon: category._sIconUrl,
					children: [],
				}
				cats[category._sName].children.push(entry);
				found=true;
				break;
			}
		}
		if(!found){
			if(!cats[UNCATEGORIZED]) cats[UNCATEGORIZED] = {
				name: UNCATEGORIZED,
				icon: "",
				children: [],
			}
			cats[UNCATEGORIZED].children.push(entry);
		}
		
	}
	for (let category of Object.keys(cats)) {
		finalEntries.push({
			name: category,
			icon: cats[category].icon,
			children: cats[category].children,
		});
	}
	finalEntries= finalEntries.sort(sort);
	console.log({
		from: entries,
		to: finalEntries
	});
	store.set(plannedChangesAtom,{
		title:"Confirm changes",
		from: entries,
		to: finalEntries,
	})
	return {from: entries, to: finalEntries};
}
async function initFolderStructure(root: string, entries: any) {
	let categories = store.get(categoriesAtom) || [];
	try {
		await mkdir(joinPath(root, RESTORE));
	} catch (e) {
		console.log("Folder already exists", e);
	}
	try {
		await mkdir(joinPath(root, IGNORE));
	} catch (e) {
		console.log("Folder already exists", e);
	}
	try {
		await mkdir(joinPath(root, UNCATEGORIZED));
	} catch (e) {
		console.log("Folder already exists", e);
	}
	entries = entries.filter((x: any) => x.name !== UNCATEGORIZED && x.name != IGNORE && x.name != RESTORE && categories.filter((y: any) => y._sName == x.name).length == 0);
	for (let entry of entries) {
		let moved = false;
		for (let category of categories) {
			if (entry.name.toLowerCase().includes(category._sName.toLowerCase())) {
				moved = true;
				try {
					await mkdir(joinPath(root, category._sName));
				} catch (e) {
					console.log("Folder already exists", e);
				}
				try {
					await rename(joinPath(root,entry.path), joinPath(root, category._sName, entry.name));
				} catch (e) {
					console.log("Folder already exists", e);
				}
				break;
			}
		}
		if (!moved) {
			try {
				await mkdir(joinPath(root, UNCATEGORIZED));
			} catch (e) {
				console.log("Folder already exists", e);
			}
			try {
				await rename(joinPath(root,entry.path), joinPath(root, UNCATEGORIZED, entry.name));
			} catch (e) {
				console.log("Folder already exists", e);
			}
		}
	}
}
