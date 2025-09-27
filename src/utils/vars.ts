import { FocusEvent, FocusEventHandler } from "react";
import { atom, createStore } from "jotai";

type TimeoutOrNull = ReturnType<typeof setTimeout> | null;

interface WWMMHotkey {
	name: string;
	type: string;
	value: string;
}

interface ModHotkey {
	key: string;
	type: string;
	target: string;
	name: string;
}

interface Settings {
	hotKeys: { [key: string]: WWMMHotkey };
	hotReload: boolean;
	toggle: 0 | 2;
	open: 0;
	opacity: number;
	type: 0 | 1 | 2;
	listType: 0 | 1;
}

interface DirRestructureItem {
	name: string;
	isDirectory?: boolean;
	icon?: string;
	children?: DirRestructureItem[];
}

interface LocalDataContent {
	source?: string;
	updatedAt?: number;
	note?: string;
}

interface LocalData {
	[path: string]: LocalDataContent;
}

interface Preset {
	name: string;
	data: string[];
	hotkey: string;
}

interface LocalMod {
	name: string;
	isDir: boolean;
	path: string;
	truePath: string;
	parent: string;
	trueParent: string;
	preview: string;
	keys: ModHotkey[];
	enabled: boolean;
	children: LocalMod[];
	depth: number;
	source?: string;
	updatedAt?: number;
	note?: string;
	icon?: string;
}

interface Category {
	_idRow: number;
	_sName: string;
	_nItemCount: number;
	_nCategoryCount: number;
	_sUrl: string;
	_sIconUrl: string;
	_special?: boolean;
}

interface DownloadItem {
	status: "pending" | "downloading" | "completed" | "failed";
	preview: string;
	category: string;
	source: string;
	file: string;
	updated: number;
	name: string;
	fname: string;
}

interface OnlineModImage {
	_sType: string;
	_sBaseUrl: string;
	_sFile: string;
	_sFile220?: string;
	_hFile220?: number;
	_wFile220?: number;
	_sFile530?: string;
	_hFile530?: number;
	_wFile530?: number;
	_sFile100: string;
	_hFile100: number;
	_wFile100: number;
}

interface OnlineModPreviewMedia {
	_aImages: OnlineModImage[];
}

interface OnlineModSubmitter {
	_idRow: number;
	_sName: string;
	_bIsOnline: boolean;
	_bHasRipe?: boolean;
	_sProfileUrl: string;
	_sAvatarUrl: string;
	_sHdAvatarUrl: string;
	_sUpicUrl?: string;
	_sMoreByUrl?: string;
}

interface OnlineModCategory {
	_sName: string;
	_sProfileUrl: string;
	_sIconUrl: string;
}

interface OnlineMod {
	_idRow: number;
	_sModelName: string;
	_sSingularTitle?: string;
	_sIconClasses?: string;
	_sName: string;
	_sProfileUrl: string;
	_tsDateAdded?: number;
	_tsDateModified?: number;
	_tsDateUpdated?: number;
	_bHasFiles?: boolean;
	_aTags?: any[];
	_aPreviewMedia?: OnlineModPreviewMedia;
	_aSubmitter: OnlineModSubmitter;
	_aRootCategory: OnlineModCategory;
	_sVersion?: string;
	_bIsObsolete?: boolean;
	_sInitialVisibility: string;
	_bHasContentRatings?: boolean;
	_nLikeCount: number;
	_nPostCount: number;
	_bWasFeatured?: boolean;
	_nViewCount?: number;
	_bIsOwnedByAccessor?: boolean;
	_sImageUrl?: string;
	_sPeriod?: "today" | "yesterday" | "week" | "month" | "3month" | "6month" | "year" | "alltime";
}

interface OnlineData {
	banner: OnlineMod[];
	[key: string]: OnlineMod[];
}

function dontFocus(e: FocusEvent<HTMLInputElement, Element>): FocusEventHandler<HTMLInputElement> {
	e.preventDefault();
	e.stopPropagation();
	e.currentTarget.blur();
	return () => {};
}

const previewUri = "http://127.0.0.1:5000/preview/";
const store = createStore();

const firstLoadAtom = atom(false);
const onlineModeAtom = atom(false);
const leftSidebarOpenAtom = atom(true);
const rightSidebarOpenAtom = atom(true);

const tutorialOpenAtom = atom(false);
const tutorialPageAtom = atom(0);
const refreshAppIdAtom = atom(0);
const modRootDirAtom = atom("");
const settingsDataAtom = atom({} as Settings);
const categoryListAtom = atom([] as Category[]);

const progressOverlayDataAtom = atom({ title: "", open: false, finished: false });
const consentOverlayDataAtom = atom({ title: "", from: [] as DirRestructureItem[], to: [] as DirRestructureItem[], next: false });

const localModListAtom = atom([] as LocalMod[]);
const localFilteredModListAtom = atom([] as LocalMod[]);
const localPresetListAtom = atom([] as Preset[]);

const localFilterNameAtom = atom("All");
const localCategoryNameAtom = atom("All");

const localSelectedModAtom = atom(0);
const localSelectedPresetAtom = atom(-1);

const localPathAtom = atom("");
const localDataAtom = atom({} as LocalData);

const onlinePathAtom = atom("home");
const onlineDataAtom = atom({ banner: [] } as OnlineData);

const onlineDownloadListAtom = atom([] as DownloadItem[]);
const onlineSelectedItemAtom = atom("-1");

const apiRoutes = {
	getCategoryList: () => "https://gamebanana.com/apiv11/Mod/Categories?_idCategoryRow=29524&_sSort=a_to_z&_bShowEmpty=true", //Char Categories
	getGenericCategoryList: () => "https://gamebanana.com/apiv11/Mod/Categories?_idGameRow=20357&_sSort=a_to_z&_bShowEmpty=true", //Skins | UI | Other/Misc
	home: (sort = "default", page = 1) => "https://gamebanana.com/apiv11/Game/20357/Subfeed?_sSort=" + sort + "&_nPage=" + page,
	category: (cat = "Skins", sort = "", page = 1) => "https://gamebanana.com/apiv11/Mod/Index?_nPerpage=15&_aFilters%5BGeneric_Category%5D=" + ((cat.split("/").length > 1 ? store.get(categoryListAtom).find((x) => x._sName == cat.split("/")[1])?._idRow : genericCategories.find((x) => x._sName == cat.split("/")[0])?._idRow) || 0) + (sort != "" ? " &_sSort=" + sort : "") + "&_nPage=" + page,
	banner: () => "https://gamebanana.com/apiv11/Game/20357/TopSubs",
	mod: (modTitle = "Mod/0") => "https://gamebanana.com/apiv11/" + modTitle + "/ProfilePage",
	modUpdates: (modTitle = "Mod/0") => "https://gamebanana.com/apiv11/" + modTitle + "/Updates?_nPage=1&_nPerpage=1",
};
const genericCategories = [
	{
		_idRow: 29524,
		_sName: "Skins",
		_nItemCount: 1483,
		_nCategoryCount: 34,
		_sUrl: "https://gamebanana.com/mods/cats/29524",
		_sIconUrl: "https://images.gamebanana.com/img/ico/ModCategory/6654b6596ba11.png",
	},
	{
		_idRow: 29496,
		_sName: "UI",
		_nItemCount: 57,
		_nCategoryCount: 0,
		_sUrl: "https://gamebanana.com/mods/cats/29496",
		_sIconUrl: "https://images.gamebanana.com/img/ico/ModCategory/6692c913ddf00.png",
	},
	{
		_idRow: 29493,
		_sName: "Other",
		_nItemCount: 75,
		_nCategoryCount: 0,
		_sUrl: "https://gamebanana.com/mods/cats/29493",
		_sIconUrl: "https://images.gamebanana.com/img/ico/ModCategory/6692c90cba314.png",
	},
];
function getTimeDifference(startTimestamp: number, endTimestamp: number) {
	const secInMinute = 60;
	const secInHour = secInMinute * 60;
	const secInDay = secInHour * 24;
	const secInYear = secInDay * 365;

	const diff = Math.abs(endTimestamp - startTimestamp);

	if (diff < secInMinute) {
		return "now";
	} else if (diff < secInHour) {
		const minutes = Math.floor(diff / secInMinute);
		return minutes + "m";
	} else if (diff < secInDay) {
		const hours = Math.floor(diff / secInHour);
		return hours + "h";
	} else if (diff < secInYear) {
		const days = Math.floor(diff / secInDay);
		return days + "d";
	} else {
		const years = Math.floor(diff / secInYear);
		return years + "y";
	}
}
export type { TimeoutOrNull, WWMMHotkey, ModHotkey, Settings, DirRestructureItem, LocalDataContent, LocalData, Preset, LocalMod, Category, DownloadItem, OnlineModImage, OnlineModPreviewMedia, OnlineModSubmitter, OnlineModCategory, OnlineMod, OnlineData };
export { dontFocus, previewUri, store, firstLoadAtom, onlineModeAtom, leftSidebarOpenAtom, rightSidebarOpenAtom, tutorialOpenAtom, tutorialPageAtom, refreshAppIdAtom, modRootDirAtom, settingsDataAtom, categoryListAtom, progressOverlayDataAtom, consentOverlayDataAtom, localModListAtom, localFilteredModListAtom, localPresetListAtom, localFilterNameAtom, localCategoryNameAtom, localSelectedModAtom, localSelectedPresetAtom, localPathAtom, localDataAtom, onlinePathAtom, onlineDataAtom, onlineDownloadListAtom, onlineSelectedItemAtom, apiRoutes, genericCategories, getTimeDifference };
