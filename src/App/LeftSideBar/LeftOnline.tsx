import { genericCategories, localDataAtom, localModListAtom, onlineDownloadListAtom, onlinePathAtom, modRootDirAtom, leftSidebarOpenAtom, onlineModeAtom, DownloadItem, LocalData, LocalMod, LocalDataContent, apiRoutes, onlineSelectedItemAtom, OnlineMod, OnlineData } from "@/utils/vars";
import { AppWindow, Check, Clock, FileQuestionIcon, FolderCheckIcon, Loader2, ShieldQuestion, Shirt, UploadIcon, X } from "lucide-react";
import { SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { createModDownloadDir, modRouteFromURL, sanitizeFileName, saveConfig, validateModDownload } from "@/utils/fsutils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Separator } from "@radix-ui/react-separator";
import { refreshRootDir } from "@/utils/fsutils";
import { Button } from "@/components/ui/button";
import { listen } from "@tauri-apps/api/event";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
interface InstalledListItem {
	name: string;
	source: string;
	updated: number;
	updateAvailable: boolean;
}
let path = "";
let downloadElement: any = null;
let updateCache = {} as { [key: string]: number };
const Icons = {
	pending: <Clock className="min-h-4 min-w-4 text-accent" />,
	downloading: <Loader2 className="min-h-4 min-w-4 animate-spin text-accent" />,
	completed: <Check className="min-h-4 min-w-4 text-accent" />,
	failed: <X className="min-h-4 min-w-4 text-red-300" />,
};

const downloadFile = async (root: string, item: DownloadItem) => {
	// console.log("Downloadingsssss ", item);
	if (item.category == "Other/Misc") item.category = "Other";
	item.name = sanitizeFileName(item.name);
	
	item.name = (await createModDownloadDir(item.category, item.name)) ? "DISABLED_" + item.name : item.name;
	
	path = root + "\\" + item.category + "\\" + item.name;
	downloadElement = {
		name: item.name.replaceAll("DISABLED_", ""),
		path:"\\" + item.category + "\\" + item.name.replaceAll("DISABLED_", ""),
		source: item.source,
		updatedAt: item.updated * 1000,
	};
	invoke("download_and_unzip", {
		fileName: item.name,
		downloadUrl: item.file,
		savePath: path,
		emit: true,
	});
	invoke("download_and_unzip", {
		fileName: "preview",
		downloadUrl: item.preview,
		savePath: path,
		emit: false,
	});
};
function sort(a: InstalledListItem, b: InstalledListItem) {
	const flagDiff = a.updateAvailable === b.updateAvailable ? 0 : a.updateAvailable ? -1 : 1;
	if (flagDiff !== 0) return flagDiff;
	return a.name.toLocaleLowerCase().split("\\").slice(-1)[0].localeCompare(b.name.toLocaleLowerCase().split("\\").slice(-1)[0]);
}
// function modRouteFromURL(url: string): string {
// 	// let path = url.replace("https://gamebanana.com/", "").split("/");
// 	// path[0] = path[0][0].toUpperCase() + (path[0].endsWith("s") ? path[0].slice(1, -1) : path[0].slice(1));
// 	let modId=url?.split("mods/").pop()?.split("/")[0]
// 	return path.join("/");
// }
function LeftOnline() {
	const [onlineDownloadList, setOnlineDownloadList] = useAtom(onlineDownloadListAtom);
	const [onlinePath, setOnlinePath] = useAtom(onlinePathAtom);
	const [localData, setLocalData] = useAtom(localDataAtom);
	const leftSidebarOpen = useAtomValue(leftSidebarOpenAtom);
	let panelHeight = `calc(50vh - ${leftSidebarOpen ? 10.5 : 14.5}rem)`;
	const rootDir = useAtomValue(modRootDirAtom);
	const online = useAtomValue(onlineModeAtom);

	const setLocalModList = useSetAtom(localModListAtom);
	const setOnlineSelectedItem = useSetAtom(onlineSelectedItemAtom);

	const [installed, setInstalled] = useState([] as InstalledListItem[]);
	async function checkUpdateAvailable(item: InstalledListItem) {
		let updateAvailable = false;
		if (updateCache[item.name]) {
			updateAvailable = item.updated < updateCache[item.name];
		} else {
			const res = await fetch(apiRoutes.mod(modRouteFromURL(item.source)));
			if (res.ok) {
				const data = await res.json();

				if (data._tsDateModified) {
					let latest = item.updated || 0;
					data._aFiles.map((file: any) => {
						latest = Math.max(latest, (file._tsDateModified || file._tsDateAdded || 0) * 1000);
					});
					updateCache[item.name] = latest;
					// console.log("Checked update for", item.name, item.updated, latest, item.updated < latest);
					updateAvailable = item.updated < latest || false;
				}
			} else {
				// console.log("Failed to fetch mod data for", item.name);
				return false;
			}
		}
		// console.log("Update available for", item.name, updateAvailable);
		return updateAvailable;
	}
	async function sortInstalled(localData: any) {
		for (const key of Object.keys(localData)) {
			localData[key].updateAvailable = await checkUpdateAvailable({
				name: key,
				source: localData[key].source || "",
				updated: localData[key].updatedAt || 0,
				updateAvailable: false,
			});
		}
		// console.log(localData);
		setInstalled(
			Object.keys(localData)
				.filter((key) => localData[key].source)
				.map((key) => {
					return {
						name: key,
						source: localData[key].source,
						updated: localData[key].updatedAt,
						updateAvailable: localData[key].updateAvailable,
					} as InstalledListItem;
				})
				.sort(sort) as InstalledListItem[]
		);
	}
	useEffect(() => {
		sortInstalled({ ...localData });
	}, [localData]);

	const downloadRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listen("download-progress", (event) => {
			if (downloadRef.current) {
				downloadRef.current.style.width = event.payload + "%";
			}
		});
		listen("fin", async () => {
			await validateModDownload(path);
			if (downloadRef.current) downloadRef.current.style.width = "0%";
			setLocalData((prevData: LocalData) => {
				if (downloadElement.path)
					prevData[downloadElement.path] = {
						source: downloadElement.source,
						updatedAt: downloadElement.updatedAt || Date.now(),
					};
				return { ...prevData };
			});
			setOnlineDownloadList((prev) => {
				let cur = prev.shift();
				if (!cur) return prev;
				path="";
				return [...prev];
			});
			let items = await refreshRootDir("");
			setLocalModList(items);
			saveConfig();
		});
	}, []);

	useEffect(() => {
		if (onlineDownloadList && onlineDownloadList.length < 1) return;
		if (path !== "") return;
		if (onlineDownloadList[0].status == "pending" && path != rootDir + "\\" + onlineDownloadList[0].category + "\\" + onlineDownloadList[0].name) {
			let name = onlineDownloadList[0].name;
			let count = 0;
			for (let key in localData) {
				if (localData[key].source == onlineDownloadList[0].source) {
					count++;
					name = key.split("\\").slice(-1)[0];
				}
			}
			if (count == 1) {
				onlineDownloadList[0].name = name;
			}
			setOnlineDownloadList((prev) => {
				prev[0].status = "downloading";
				downloadFile(rootDir, prev[0]);
				return [...prev];
			});
		}
	}, [onlineDownloadList]);

	return (
		<div
			className="flex flex-col h-full min-w-full duration-300"
			style={{
				opacity: online ? 1 : 0,
				transitionDelay: online ? "0.3s" : "0s",
				pointerEvents: online ? "auto" : "none",
				marginLeft: "-100%",
			}}>
			<SidebarGroup className="min-h-fit p-0">
				<SidebarGroupLabel>Type</SidebarGroupLabel>
				<SidebarContent
					className="flex flex-row items-center justify-between w-full gap-2 px-2 overflow-hidden"
					style={{
						flexDirection: leftSidebarOpen ? "row" : "column",
					}}>
					{genericCategories.map((category, index) => {
						return (
							<Button
								key={"filter" + category._sName}
								id={"type " + category._sName}
								onClick={() => {
									if (onlinePath == category._sName) {
										setOnlinePath("home");
										return;
									}
									setOnlinePath(category._sName);
								}}
								className={"w-25 " + (onlinePath.startsWith(category._sName) && " bg-accent text-background")}
								style={{ width: leftSidebarOpen ? "" : "2.5rem" }}>
								{[<Shirt className="w-6 h-6" />, <AppWindow className="w-6 h-6" />, <ShieldQuestion className="w-6 h-6" />][index % 3]}
								{leftSidebarOpen && category._sName}
							</Button>
						);
					})}
				</SidebarContent>
			</SidebarGroup>
			<Separator
				className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
				style={{
					opacity: leftSidebarOpen ? "0" : "",
					height: leftSidebarOpen ? "0px" : "",
					marginBlock: leftSidebarOpen ? "4px" : "",
				}}
			/>
			<SidebarGroup
				style={{
					maxHeight: panelHeight,
					minHeight: panelHeight,
				}}>
				<SidebarGroupLabel>Downloads</SidebarGroupLabel>
				<SidebarContent className="justify -evenly min-w-14 flex flex-col items-center w-full max-h-full gap-2 px-2 overflow-hidden overflow-y-auto duration-200">
					{onlineDownloadList.length > 0 ? (
						<>
							{" "}
							<div ref={downloadRef} key={"cur" + JSON.stringify(onlineDownloadList[0])} className="min-h-12 -mb-14 height-in bg-accent text-background hover:brightness-125 z-10 flex flex-col self-start justify-center w-0 overflow-hidden rounded-lg">
								<div className="min-w-79 fade-in flex items-center gap-1 pl-2 pointer-events-none">
									<Loader2 className="min-h-4 min-w-4 animate-spin" />
									<Input readOnly type="text" className="min-w-71.5 p-0 pr-2 h-12   pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={downloadElement?.name} />
								</div>
							</div>
							{onlineDownloadList.map((item, index) => (
								<div
									key={item.name.replaceAll("DISABLED_", "")}
									className={"w-full min-h-12 flex-col justify-center height-in overflow-hidden rounded-lg flex duration-200 " + (true ? " bg-input/50 text-accent hover:bg-input/80" : " bg-accent text-background hover:brightness-125")}
									onClick={(e) => {
										if (e.target == e.currentTarget) {
											// socket.emit("apply_preset", { preset: i });
											// setSelectedPreset(i);
										}
									}}
									style={{
										height: leftSidebarOpen ? "" : "2.5rem",
										width: leftSidebarOpen ? "" : "2.5rem",
										padding: leftSidebarOpen ? "" : "0px",
									}}>
									{leftSidebarOpen ? (
										<div className="fade-in flex items-center w-full gap-1 pl-2 pointer-events-none">
											{Icons[item.status] || <FileQuestionIcon className="min-h-4 min-w-4" />}
											<Input readOnly type="text" className="min-w-72 h-12 p-0 pr-2 pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={item.name.replaceAll("DISABLED_", "")} />
										</div>
									) : (
										<div className="flex items-center justify-center w-full h-full">{index + 1}</div>
									)}
									{item.status == "downloading" && <div className="bg-accent w-0 h-1 -mt-1" id="downloader"></div>}
								</div>
							))}
						</>
					) : (
						<div key="loner" className="text-foreground/50 flex items-center justify-center w-64 h-full duration-200 ease-linear">
							{leftSidebarOpen ? "Queue Empty" : "-"}
						</div>
					)}
				</SidebarContent>
			</SidebarGroup>
			<Separator
				className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
				style={{
					opacity: leftSidebarOpen ? "0" : "",
					height: leftSidebarOpen ? "0px" : "",
					marginBlock: leftSidebarOpen ? "4px" : "",
				}}
			/>
			<SidebarGroup className="min-h-[calc(50vh-10.5rem)] max-h-[calc(50vh-10.5rem)]">
				<SidebarGroupLabel>Installed</SidebarGroupLabel>
				<SidebarContent className="min-w-14 flex flex-col items-center w-full max-h-full gap-2 px-2 overflow-hidden overflow-y-auto duration-200">
					{installed.length > 0 ? (
						<>
							{installed.map((item, index) => (
								<div
									key={item.name}
									className={"w-full min-h-12 flex-col justify -center height-in overflow-hidden rounded-lg flex duration-200 " + (true ? " bg-input/50 text-accent hover:bg-input/80" : " bg-accent text-background hover:brightness-125")}
									onClick={(e) => {
										if (e.target == e.currentTarget) {
											setOnlineSelectedItem(modRouteFromURL(item.source));
										}
									}}
									style={{
										height: leftSidebarOpen ? "" : "2.5rem",
										width: leftSidebarOpen ? "" : "2.5rem",
										padding: leftSidebarOpen ? "" : "0px",
									}}>
									{leftSidebarOpen ? (
										<div className="fade-in flex items-center w-full gap-1 pl-2 pointer-events-none">
											{item.updateAvailable ? <UploadIcon className="min-h-4 min-w-4" /> : <FolderCheckIcon className="min-h-4 min-w-4" />}
											<Input readOnly type="text" className="min-w-72 h-12 p-0 pr-2 pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={item.name.split("\\").slice(-1)} />
										</div>
									) : (
										<div className="flex items-center justify-center w-full h-full">{index + 1}</div>
									)}
								</div>
							))}
						</>
					) : (
						<div key="loner" className="text-foreground/50 flex items-center justify-center w-64 h-12 duration-200 ease-linear">
							{leftSidebarOpen ? "Nothing to show here." : "-"}
						</div>
					)}
				</SidebarContent>
			</SidebarGroup>
		</div>
	);
}

export default LeftOnline;
