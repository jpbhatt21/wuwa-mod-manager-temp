import { genericCategories, localDataAtom, localModListAtom, onlineDownloadListAtom, onlinePathAtom, modRootDirAtom, leftSidebarOpenAtom, onlineModeAtom, DownloadItem, LocalData, LocalMod, LocalDataContent, apiRoutes, onlineSelectedItemAtom } from "@/utils/vars";
import { AppWindow, Check, Clock, FileQuestionIcon, FolderCheckIcon, Loader2, ShieldQuestion, Shirt, UploadIcon, X } from "lucide-react";
import { SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { createModDownloadDir, sanitizeFileName, saveConfig, validateModDownload } from "@/utils/fsutils";
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
let pathdir = "";
let updateCache = {} as { [key: string]: number };
const Icons = {
	pending: <Clock className="min-h-4 min-w-4 text-accent" />,
	downloading: <Loader2 className="min-h-4 min-w-4 animate-spin text-accent" />,
	completed: <Check className="min-h-4 min-w-4 text-accent" />,
	failed: <X className="min-h-4 min-w-4 text-red-300" />,
};

const downloadFile = async (root: string, item: DownloadItem) => {
	//console.log("Downloadingsssss ", item);
	if (item.category == "Other/Misc") item.category = "Other";
	item.name = sanitizeFileName(item.name);
	pathdir = "\\" + item.category + "\\" + item.name;
	path = root + "\\" + item.category + "\\" + item.name;
	await createModDownloadDir(item.category, item.name);
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
	if (a.updateAvailable !== b.updateAvailable) {
		return a.updateAvailable ? -1 : 1;
	}
	return a.name.localeCompare(b.name);
}
function modRouteFromURL(url: string): string {
	let path = url.replace("https://gamebanana.com/", "").split("/");
	path[0] = path[0][0].toUpperCase() + (path[0].endsWith("s") ? path[0].slice(1, -1) : path[0].slice(1));
	return path.join("/");
}
function LeftOnline() {
	const [onlineDownloadList, setOnlineDownloadList] = useAtom(onlineDownloadListAtom);
	const [onlinePath, setOnlinePath] = useAtom(onlinePathAtom);
	const [localData, setLocalData] = useAtom(localDataAtom);

	const leftSidebarOpen = useAtomValue(leftSidebarOpenAtom);
	const rootDir = useAtomValue(modRootDirAtom);
	const online = useAtomValue(onlineModeAtom);

	const setLocalModList = useSetAtom(localModListAtom);
	const setOnlineSelectedItem = useSetAtom(onlineSelectedItemAtom);

	const [installed, setInstalled] = useState([] as InstalledListItem[]);
	function checkUpdateAvailable(item: InstalledListItem) {
		if (updateCache[item.name]) {
			return item.updated < updateCache[item.name];
		} else {
			
			fetch(modRouteFromURL(item.source)).then((res) => {
				if (res.ok) {
					res.json().then((data) => {
						console.log("Update data for", item.name, ":", data);
						if (data._tsDateModified) {
							updateCache[item.name] = data._tsDateModified;
							if (item.updated < data._tsDateModified) {
								setInstalled((prev) => {
									return prev.map((i) => (i.name === item.name ? { ...i, updateAvailable: true } : i)).sort(sort);
								});
							}
						}
					});
				} else {
					console.error("Failed to fetch update info for", item.name);
				}
			});
		}
		return false;
	}
	useEffect(() => {
		setInstalled(
			Object.keys(localData)
				.filter((key) => localData[key].source)
				.map((key) => {
					let updateAvailable = false;
					if (updateCache[key]) {
						updateAvailable = updateCache[key] > (localData[key].updatedAt || 0);
					} else {
						checkUpdateAvailable({
							name: key,
							source: localData[key].source || "",
							updated: localData[key].updatedAt || 0,
							updateAvailable: false,
						});
					}
					return {
						name: key,
						source: localData[key].source,
						updated: localData[key].updatedAt,
						updateAvailable: updateAvailable,
					} as InstalledListItem;
				})
				.sort(sort) as InstalledListItem[]
		);
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
			let cur: DownloadItem | undefined;
			setOnlineDownloadList((prev) => {
				cur = prev.shift();
				if (!cur) return prev;
				cur.status = "completed";
				path = "";
				return [...prev, cur];
			});
			if (downloadRef.current) downloadRef.current.style.width = "0%";
			setLocalData((prevData: LocalData) => {
				if (cur)
					prevData[pathdir] = {
						source: cur.source,
						updatedAt: cur.updated * 1000,
					};
				return { ...prevData };
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
			<SidebarGroup className="max-h-1/2">
				<SidebarGroupLabel>Downloads</SidebarGroupLabel>
				<SidebarContent className="justify-evenly min-w-14 flex flex-col items-center w-full max-h-full gap-2 px-2 overflow-hidden overflow-y-auto duration-200">
					{onlineDownloadList.length > 0 ? (
						<>
							{" "}
							<div ref={downloadRef} key={"cur" + JSON.stringify(onlineDownloadList[0])} className="min-h-12 -mb-14 height-in bg-accent text-background hover:brightness-125 z-10 flex flex-col self-start justify-center w-0 overflow-hidden rounded-lg">
								<div className="min-w-79 fade-in flex items-center gap-1 pl-2 pointer-events-none">
									<Loader2 className="min-h-4 min-w-4 animate-spin" />
									<Input readOnly type="text" className="min-w-71.5 p-0 pr-2 h-12   pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={onlineDownloadList[0].name} />
								</div>
							</div>
							{onlineDownloadList.map((item, index) => (
								<div
									key={item.name}
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
											<Input readOnly type="text" className="min-w-72 h-12 p-0 pr-2 pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={item.name} />
										</div>
									) : (
										<div className="flex items-center justify-center w-full h-full">{index + 1}</div>
									)}
									{item.status == "downloading" && <div className="bg-accent w-0 h-1 -mt-1" id="downloader"></div>}
								</div>
							))}
						</>
					) : (
						<div key="loner" className="text-foreground/50 flex items-center justify-center w-64 h-12 duration-200 ease-linear">
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
			<SidebarGroup className="h-1/2">
				<SidebarGroupLabel>Installed</SidebarGroupLabel>
				<SidebarContent className="min-w-14 flex flex-col items-center w-full max-h-full gap-2 px-2 overflow-hidden overflow-y-auto duration-200">
					{installed.length > 0 ? (
						<>
							{installed.map((item, index) => (
								<div
									key={item.name}
									className={"w-full min-h-12 flex-col justify-center height-in overflow-hidden rounded-lg flex duration-200 " + (true ? " bg-input/50 text-accent hover:bg-input/80" : " bg-accent text-background hover:brightness-125")}
									onClick={(e) => {
										if (e.target == e.currentTarget) {
											setOnlineSelectedItem(modRouteFromURL(item.source))
										}
									}}
									style={{
										height: leftSidebarOpen ? "" : "2.5rem",
										width: leftSidebarOpen ? "" : "2.5rem",
										padding: leftSidebarOpen ? "" : "0px",
									}}>
									{leftSidebarOpen ? (
										<div className="fade-in flex items-center w-full gap-1 pl-2 pointer-events-none">
											{item.updateAvailable?<UploadIcon className="min-h-4 min-w-4" />:<FolderCheckIcon className="min-h-4 min-w-4" />}
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
