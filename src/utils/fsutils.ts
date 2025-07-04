import { refreshAppIdAtom, localModListAtom, localPresetListAtom, settingsDataAtom, categoryListAtom, localDataAtom, consentOverlayDataAtom, progressOverlayDataAtom, modRootDirAtom, store, LocalMod, DirRestructureItem, LocalData, ModHotkey, Preset } from "@/utils/vars";
import { readDir, readTextFile, writeTextFile, rename, exists, mkdir, remove, copyFile, DirEntry } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import sanitize from "sanitize-filename";
import { IGNORE, RESTORE, UNCATEGORIZED } from "@/utils/init";
let root = "";
let completedFiles = 0;
let totalFiles = 0;
let canceled = false;
let result = "Ok";

function formatDateTime() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}
function sort(a: LocalMod | DirRestructureItem, b: LocalMod | DirRestructureItem) {
	let x = a.name.replaceAll("DISABLED_", "");
	let y = b.name.replaceAll("DISABLED_", "");
	return x.localeCompare(y) * (x[0].toLowerCase() == y[0].toLowerCase() ? (x[0] == x[0].toUpperCase() && y[0] != y[0].toUpperCase() ? 1 : -1) : 1);
}
function joinPath(path: string, ...paths: string[]) {
	let p = path.trim();
	for (let p2 of paths) {
		if (p.endsWith("\\")) p = p.slice(0, -1);
		if (p2.startsWith("\\")) p2 = p2.slice(1);
		if (p2.trim().length == 0) continue;
		p += "\\" + p2.trim();
	}
	return p;
}
function renameDirContentRecr(items: LocalMod[], from: string, to: string) {
	for (let item of items) {
		item.path = item.path.replaceAll(from, to);
		item.truePath = item.truePath.replaceAll(from, to);
		item.parent = item.parent.replaceAll(from, to);
		item.trueParent = item.trueParent.replaceAll(from, to);
		if (item.children && item.children.length > 0) {
			item.children = renameDirContentRecr(item.children, from, to);
		}
	}
	return items;
}
async function readDirRecr(path: string, maxDepth = 2, depth = 0, def = true) {
	if (depth > maxDepth) return [];
	let entries = [] as DirEntry[];
	try {
		entries = await readDir(joinPath(root, path));
	} catch {
		return [];
	}
	let files = [] as LocalMod[];
	for (let entry of entries) {
		if ((entry.name == RESTORE || entry.name == IGNORE) && def && depth == 0) continue;
		let children = [] as LocalMod[];
		if (entry.isDirectory) children = await readDirRecr(path + "\\" + entry.name, maxDepth, depth + 1);
		files.push({
			name: entry.name,
			isDir: entry.isDirectory,
			path: path + "\\" + entry.name,
			truePath: (path + "\\" + entry.name).replaceAll("DISABLED_", ""),
			parent: path,
			trueParent: path.replaceAll("DSABLED_", ""),
			preview: "http://127.0.0.1:5000/preview/" + path,
			keys: [],
			enabled: !entry.name.startsWith("DISABLED_"),
			children,
			depth,
		});
	}
	return files.sort(sort);
}
async function copyDir(src: string, dest: string) {
	try {
		await mkdir(dest, { recursive: true });
		const entries = await readDir(src);
		for (const entry of entries) {
			const srcPath = `${src}/${entry.name}`;
			const destPath = `${dest}/${entry.name}`;

			if (!entry.isDirectory) {
				await copyFile(srcPath, destPath);
			} else {
				await copyDir(srcPath, destPath);
			}
		}
	} catch (error) {
		console.error("Error copying directory:", error);
		throw error;
	}
}
async function copyDirWithProgress(source: string, destination: string, progressBar: HTMLElement | null = null, progressPerct: HTMLElement | null = null, progressMessage: HTMLElement | null = null, isRoot = true) {
	try {
		try {
			await mkdir(destination);
		} catch {}
		const dirContents = (await readDir(source)).filter((item) => !isRoot || (item.name != RESTORE && item.name != IGNORE));
		for (const entry of dirContents) {
			if (canceled) {
				if (result == "Ok") result = "Operation Cancelled";
				return;
			}
			const fullSourcePath = `${source}\\${entry.name}`;
			const fullDestinationPath = `${destination}\\${entry.name}`;
			if (entry.isDirectory) {
				await copyDirWithProgress(fullSourcePath, fullDestinationPath, progressBar, progressPerct, progressMessage, false);
			} else {
				await copyFile(fullSourcePath, fullDestinationPath);
				completedFiles++;
				if (progressBar && progressPerct && progressMessage) {
					const percentage = ((completedFiles / totalFiles) * 100).toFixed(2);
					progressBar.style.width = percentage + "%";
					progressPerct.innerText = percentage + "%";
					progressMessage.innerText = `File ${completedFiles} of ${totalFiles}: ${entry.name} in ${source}`;
				}
			}
		}
	} catch (error) {
		canceled = true;
		result = "An Error Occurred";
		console.error("Error copying directory:", error);
	}
}
async function removeDirRecursive(path: string) {
	try {
		const entries = await readDir(path);
		for (const entry of entries) {
			if (entry.name == RESTORE || entry.name == IGNORE) continue;
			const fullPath = joinPath(path, entry.name);
			if (entry.isDirectory) {
				await removeDirRecursive(fullPath);
			} else {
				await remove(fullPath);
			}
		}
		await remove(path);
	} catch (error) {
		console.error("Error removing directory:", error);
	}
}
async function countFilesInDir(path: string, messageBox: HTMLElement | null = null) {
	let entries = (await readDir(joinPath(path, ""))).filter((item) => item.name != RESTORE && item.name != IGNORE);
	for (let entry of entries) {
		if (entry.isDirectory) {
			await countFilesInDir(joinPath(path, entry.name), messageBox);
		} else {
			totalFiles++;
			if (messageBox) {
				messageBox.innerText = "Discovering files ( " + totalFiles + " / ? )";
			}
		}
	}
}
async function detectHotkeys(entries: LocalMod[], data: LocalData, src: string): Promise<[LocalMod[], ModHotkey[]]> {
	let hotkeyData: ModHotkey[] = [];
	for (let entry of entries) {
		try {
			if (data[entry.truePath]) {
				for (let key of Object.keys(data[entry.truePath])) {
					entry[key as "source" | "updatedAt" | "note"] = data[entry.truePath as keyof typeof data][key as "source" | "updatedAt" | "note"] as undefined;
				}
			}
			if (entry.name.endsWith(".ini")) {
				let file = await readTextFile(joinPath(src, entry.path));
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
				[entry.children, childHK] = await detectHotkeys(entry.children, data, src);
				if (childHK.length > 0) {
					entry.keys = childHK;
				}
			}
		} catch {}
	}
	return [entries, hotkeyData];
}
async function restructureDir(entries: LocalMod[]) {
	let categories = store.get(categoryListAtom) || [];
	try {
		await mkdir(joinPath(root, RESTORE));
	} catch (e) {
		console.log("Restore Folder already exists");
	}
	try {
		await mkdir(joinPath(root, IGNORE));
	} catch (e) {
		console.log("Ignore Folder already exists");
	}
	try {
		await mkdir(joinPath(root, UNCATEGORIZED));
	} catch (e) {
		console.log("Folder Uncat already exists");
	}
	entries = entries.filter((item) => item.name !== UNCATEGORIZED && item.name != IGNORE && item.name != RESTORE && categories.filter((category) => category._sName == item.name).length == 0);
	for (let entry of entries) {
		let moved = false;
		for (let category of categories) {
			if (entry.name.toLowerCase().includes(category._sName.toLowerCase())) {
				moved = true;
				try {
					await mkdir(joinPath(root, category._sName));
				} catch (e) {}
				let suffix = "";
				let counter = 0;
				while (true) {
					try {
						await rename(joinPath(root, entry.path), joinPath(root, category._sName, entry.name + suffix));
						break;
					} catch (e) {
						suffix = " (" + ++counter + ")";
					}
				}
				break;
			}
		}
		if (!moved) {
			try {
				await mkdir(joinPath(root, UNCATEGORIZED));
			} catch (e) {
				//console.log("Folder already exists", e);
			}
			try {
				let suffix = "";
				let counter = 0;
				while (true) {
					try {
						await rename(joinPath(root, entry.path), joinPath(root, UNCATEGORIZED, entry.name + suffix));
						break;
					} catch (e) {
						suffix = " (" + ++counter + ")";
					}
				}
			} catch (e) {
				//console.log("Folder already exists", e);
			}
		}
	}
}

export function setRoot(val: string) {
	root = val;
}
export function cancelRestore() {
	canceled = true;
}
export async function selectRootDir() {
	const file = await open({
		multiple: false,
		directory: true,
	});
	if (!file) return;
	store.set(modRootDirAtom, file);
	setRoot(file);
	getDirResructurePlan();
	// store.set(localModListAtom, await readDirRecr(""));
	// saveConfig();
}
export async function createModDownloadDir(cat: string, dir: string) {
	if (!cat || !dir) return;
	let path = root + "\\" + cat + "\\" + sanitize(dir);
	if (await exists(path)) return;
	return mkdir(path, { recursive: true });
}
export async function validateModDownload(path: string) {
	try {
		const entries = await readDir(path);
		if (entries.length < 3) {
			let ini = false;
			let dirs = [];
			for (let entry of entries) {
				if (entry.name.endsWith(".ini")) ini = true;
				if (entry.isDirectory) dirs.push(entry.name);
			}
			if (!ini && dirs.length == 1) {
				await copyDir(path + "\\" + dirs[0], path);
				await removeDirRecursive(path + "\\" + dirs[0]);
			}
		}
	} catch {}
	return true;
}
export async function refreshRootDir(dir = "") {
	let data = store.get(localDataAtom) || {};
	let entries = await readDirRecr(dir, 2);
	restructureDir(entries);
	entries = await readDirRecr(dir, 2);
	entries = (await detectHotkeys(await readDirRecr(dir, 3), data, root))[0];
	entries =
		dir == ""
			? entries
					.map((entry) => entry.children)
					.flat()
					.sort(sort)
			: entries;
	return entries;
}
export function saveConfig() {
	const config = {
		dir: root,
		presets: store.get(localPresetListAtom) || [],
		settings: store.get(settingsDataAtom) || {},
		data: store.get(localDataAtom) || {},
		version: "1.0.0",
		savedAt: Date.now(),
	};
	writeTextFile("config.json", JSON.stringify(config, null, 2));
}
export async function renameMod(path: string, newName: string, pathMode = false) {
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
		store.set(localModListAtom, (prev) => {
			for (let item of prev) {
				if (item.path === path || item.truePath === path) {
					if (!pathMode) item.enabled = newName.startsWith("DISABLED_") ? false : true;
					else {
						item.parent = newPath.split("\\").slice(0, -1).join("\\");
						item.trueParent = item.parent.replaceAll("DISABLED_", "");
					}
					item.path = newPath;
					item.truePath = newPath.replaceAll("DISABLED_", "");
					item.children = renameDirContentRecr(item.children, path, newPath);
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
	if (!file) return;
	let exts = ["png", "jpg", "jpeg", "webp", "gif"];
	for (let ext of exts) {
		try {
			await remove(path + "\\" + "preview." + ext);
		} catch {}
	}
	await copyFile(file, path + "\\" + "preview." + file.split(".").pop());
	store.set(refreshAppIdAtom, Date.now());
}
export async function getDirResructurePlan() {
	const categories = store.get(categoryListAtom) || [];
	let entries = (await readDir(root))
		.filter((item) => item.name != RESTORE && item.name != IGNORE)
		.map((item) => ({
			name: item.name,
			isDirectory: item.isDirectory,
		}));
	let cats: {[key:string]:DirRestructureItem} = {};
	let finalEntries = [];
	let found = false;
	let next = true;
	for (let entry of entries) {
		found = false;
		for (let category of categories) {
			if (category._sName.toLowerCase() == entry.name.toLowerCase()) {
				if (!cats[category._sName])
					cats[category._sName] = {
						name: category._sName,
						icon: category._sIconUrl,
						children: [],
					};
				found = true;
				break;
			} else if (entry.name.toLowerCase().includes(category._sName.toLowerCase())) {
				next = false;
				if (!cats[category._sName])
					cats[category._sName] = {
						name: category._sName,
						icon: category._sIconUrl,
						children: [],
					};
				cats[category._sName]?.children?.push(entry);
				found = true;
				break;
			}
		}
		if (!found) {
			if (!cats[UNCATEGORIZED])
				cats[UNCATEGORIZED] = {
					name: UNCATEGORIZED,
					icon: "",
					children: [],
				};
			if (UNCATEGORIZED.toLowerCase() !== entry.name.toLowerCase()) {
				next = false;
				cats[UNCATEGORIZED]?.children?.push(entry);
			}
		}
	}
	for (let category of Object.keys(cats)) {
		finalEntries.push({
			name: category,
			icon: cats[category].icon,
			children: cats[category].children,
		} as DirRestructureItem);
	}
	finalEntries = finalEntries.sort(sort);
	//console.log({
	// 	from: entries,
	// 	to: finalEntries,
	// });
	console.log(next);
	store.set(consentOverlayDataAtom, {
		title: "Confirm changes",
		from: entries,
		to: finalEntries,
		next,
	});
	return { from: entries, to: finalEntries };
}
export async function createRestorePoint(prefix = "") {
	store.set(progressOverlayDataAtom, {
		title: "Creating Restore Point",
		finished: false,
		open: true,
	});
	let progressBar: HTMLElement|null = document.querySelector("#restore-progress");
	let progressMessage: HTMLElement|null = document.querySelector("#restore-progress-message");
	let progressPerct: HTMLElement|null = document.querySelector("#restore-progress-percentage");
	while (!progressBar || !progressMessage || !progressPerct) {
		await new Promise((resolve) => setTimeout(resolve, 10));
		progressBar = progressBar || document.querySelector("#restore-progress");
		progressMessage = progressMessage || document.querySelector("#restore-progress-message");
		progressPerct = progressPerct || document.querySelector("#restore-progress-percentage");
	}
	progressMessage.innerText = "Discovering files";
	completedFiles = 0;
	totalFiles = 0;
	canceled = false;
	try {
		await mkdir(joinPath(root, RESTORE));
	} catch (e) {
		//console.log("Folder already exists", e);
	}
	let restorePointName = prefix + "RESTORE-" + formatDateTime();
	await countFilesInDir(root, progressMessage);
	try {
		await mkdir(joinPath(root, RESTORE, restorePointName));
	} catch (e) {
		return null;
	}
	result = "Ok";
	await copyDirWithProgress(root, joinPath(root, RESTORE, restorePointName), progressBar, progressPerct, progressMessage);

	store.set(progressOverlayDataAtom, (prev) => ({
		title: result == "Ok" ? "Restore Point Created" : result,
		finished: true,
		open: prev.open,
	}));
	return null;
}
export async function restoreFromPoint(name: string) {
	if (!root) return;
	let restorePath = joinPath(RESTORE, name);
	let path = joinPath(root, restorePath);
	if (!(await exists(path))) return;
	store.set(progressOverlayDataAtom, {
		title: "Restoring from " + name,
		finished: false,
		open: true,
	});
	let progressBar: HTMLElement|null = document.querySelector("#restore-progress");
	let progressMessage: HTMLElement|null = document.querySelector("#restore-progress-message");
	let progressPerct: HTMLElement|null = document.querySelector("#restore-progress-percentage");
	while (!progressBar || !progressMessage || !progressPerct) {
		await new Promise((resolve) => setTimeout(resolve, 10));
		progressBar = progressBar || document.querySelector("#restore-progress");
		progressMessage = progressMessage || document.querySelector("#restore-progress-message");
		progressPerct = progressPerct || document.querySelector("#restore-progress-percentage");
	}
	progressMessage.innerText = "Discovering files";
	completedFiles = 0;
	totalFiles = 0;
	canceled = false;
	if (canceled) {
		result = "Operation Cancelled";
	} else {
		await countFilesInDir(path, progressMessage);
		progressMessage.innerText = "Deleting old files";
		await removeDirRecursive("");
		result = "Ok";
		await copyDirWithProgress(path, root, progressBar, progressPerct, progressMessage);
	}

	store.set(progressOverlayDataAtom, (prev) => ({
		title: result == "Ok" ? "Restoration Completed" : result,
		finished: true,
		open: prev.open,
	}));
	return null;
}
export async function listRestorePoints() {
	let path = root + "\\" + RESTORE;
	if (!(await exists(path))) return [];
	let entries = await readDir(path);
	entries = entries.filter((entry) => entry.isDirectory);
	return entries.map((entry) => entry.name);
}
export async function listRestorePointContents(name: string) {
	let path = root + "\\" + RESTORE + "\\" + name;
	if (!(await exists(path))) return [];
	let entries = await readDirRecr(RESTORE + "\\" + name, 2);
	let categories = store.get(categoryListAtom) || [];
	return entries.map((entry) => {
		let category = categories.find((cat) => cat._sName == entry.name);
		if (category && entry.isDir) entry.icon = category._sIconUrl;
		return entry;
	});
}
export async function applyPreset(root: string, preset: Preset) {
	if (!preset || !preset.data || preset.data.length == 0) return;
	for (let item of preset.data) {
		let path:string|string[] = item.split("\\");
		let name = path.pop();
		if( !name) continue;
		if (name.startsWith("DISABLED_")) {
			name = name.slice(9);
		} else {
			name = "DISABLED_" + name;
		}
		path.push(name);
		path = path.join("\\");
		try {
			await rename(root + path, root + item);
		} catch {}
	}
}
