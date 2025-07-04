import { path } from "@tauri-apps/api";
import { exists, writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import * as defConfig from "../default.json";
import { currentMonitor, PhysicalSize } from "@tauri-apps/api/window";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getDirResructurePlan, setRoot } from "./fsutils";
import { categoryListAtom, firstLoadAtom, localDataAtom, localPresetListAtom, modRootDirAtom, OnlineMod, Settings, settingsDataAtom, store } from "./vars";
export const window = getCurrentWebviewWindow();
currentMonitor().then((x) => {
	if (x?.size) window.setSize(new PhysicalSize(x.size.width * 0.8, x.size.height * 0.8));
});
export const RESTORE = "DISABLED_RESTORE";
export const IGNORE = "IGNORE";
export const UNCATEGORIZED = "Uncategorized";
export function setWindowType(type: number) {
	if (type == 0) {
		window.setFullscreen(false);
		window.setDecorations(true);
	} else if (type == 1) {
		window.setFullscreen(false);
		window.setDecorations(false);
	} else if (type == 2) {
		window.setFullscreen(true);
	}
}
let firstLoad = false;
let config = { ...defConfig };
export async function main() {
	const apd = (await path.dataDir()) + "\\XXMI Launcher\\WWMI\\Mods";
	if (await exists("config.json")) config = JSON.parse(await readTextFile("config.json"));
	else {
		console.warn("Config file not found, creating default config.");
		writeTextFile("config.json", JSON.stringify(defConfig, null, 2));
		firstLoad = true;
		config = { ...defConfig };
	}
	setWindowType(config.settings.type);
	const bg = document.querySelector("body");
	if (bg) bg.style.backgroundColor = "color-mix(in oklab, var(--background) " + config.settings.opacity * 100 + "%, transparent)";
	if (config.dir == "") {
		firstLoad = true;
		if (await exists(apd)) {
			config.dir = apd;
		}
	}
	store.set(firstLoadAtom, firstLoad);
	store.set(modRootDirAtom, config.dir);
	setRoot(config.dir);
	store.set(localPresetListAtom, config.presets);
	store.set(localDataAtom, config.data);
	store.set(settingsDataAtom, config.settings as Settings);
	store.set(categoryListAtom, [
		...(await fetch("https://gamebanana.com/apiv11/Mod/Categories?_idCategoryRow=29524&_sSort=a_to_z&_bShowEmpty=true")
			.then((res) => res.json())
			.then((data) => data.filter((x:OnlineMod) => x._idRow !== 31838))),
		{
			_idRow: 31838,
			_sName: "NPCs & Entities",
			_nItemCount: 12,
			_nCategoryCount: 0,
			_sUrl: "https://gamebanana.com/mods/cats/31838",
			_sIconUrl: "https://images.gamebanana.com/img/ico/ModCategory/66e0d90771ac5.png",
		},
		{ _special: true, _idRow: 29493, _sName: "Other", _nItemCount: 75, _nCategoryCount: 0, _sUrl: "https://gamebanana.com/mods/cats/29493", _sIconUrl: "https://images.gamebanana.com/img/ico/ModCategory/6692c90cba314.png" },
		{ _special: true, _idRow: 29496, _sName: "UI", _nItemCount: 55, _nCategoryCount: 0, _sUrl: "https://gamebanana.com/mods/cats/29496", _sIconUrl: "https://images.gamebanana.com/img/ico/ModCategory/6692c913ddf00.png" },
	]);
	if (!firstLoad) {
		getDirResructurePlan();
	}
	// pending hotkeys
}
