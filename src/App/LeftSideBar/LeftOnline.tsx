import {genericCategories, localDataAtom, localModListAtom, onlineDataAtom, onlineDownloadListAtom, onlinePathAtom, modRootDirAtom, leftSidebarOpenAtom, onlineModeAtom, DownloadItem, LocalData, Category, OnlineData } from "@/utils/vars";
import { AppWindow, Check, Clock, FileQuestionIcon, Loader2, ShieldQuestion, Shirt, X } from "lucide-react";
import { SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { createModDownloadDir, saveConfig, validateModDownload } from "@/utils/fsutils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Separator } from "@radix-ui/react-separator";
import { refreshRootDir } from "@/utils/fsutils";
import { Button } from "@/components/ui/button";
import { listen } from "@tauri-apps/api/event";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";

let path = "";
let pathdir = "";
const downloadFile = async (root: string, item: DownloadItem) => {
	//console.log("Downloadingsssss ", item);
	if (item.category == "Other/Misc") item.category = "Other";
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
const Icons = {
	pending: <Clock className="min-h-4 min-w-4 text-accent" />,
	downloading: <Loader2 className="min-h-4 min-w-4 animate-spin text-accent" />,
	completed: <Check className="min-h-4 min-w-4 text-accent" />,
	failed: <X className="min-h-4 min-w-4 text-red-300" />,
	// downloading:<LoaderPinwheelIcon className="min-h-4 min-w-4 animate-spin text-accent" />,
};

function LSCOnline() {
	const [onlineDownloadList, setOnlineDownloadList] = useAtom(onlineDownloadListAtom);
	const [onlinePath, setOnlinePath] = useAtom(onlinePathAtom);
	const leftSidebarOpen = useAtomValue(leftSidebarOpenAtom);
	const setLocalModList = useSetAtom(localModListAtom);
	const setOnlineData = useSetAtom(onlineDataAtom);
	const setLocalData = useSetAtom(localDataAtom);
	const rootDir = useAtomValue(modRootDirAtom);
	const online = useAtomValue(onlineModeAtom);
	const downloadRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		listen("download-progress", (event) => {
			if (downloadRef.current) {
				downloadRef.current.style.width = event.payload + "%";
			}
		});
		listen("fin", async () => {
			if (downloadRef.current) downloadRef.current.style.width = "0%";
			await validateModDownload(path);
			let cur: DownloadItem|undefined ;
			setOnlineDownloadList((prev) => {
				cur = prev.shift();
				if(!cur) return prev;
				cur.status = "completed";
				path = "";
				return [...prev, cur];
			});
			setLocalData((prevData: LocalData) => {
				if(cur)
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
		console.log(onlineDownloadList);
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
			<SidebarGroup className="p-0">
				<SidebarGroupLabel>Type</SidebarGroupLabel>
				<SidebarContent
					className="flex flex-row items-center justify-between w-full gap-2 px-2 overflow-hidden"
					style={{
						flexDirection: leftSidebarOpen ? "row" : "column",
					}}>
					{genericCategories.map((category, index) => {
						return (
							<Button
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
			<SidebarGroup>
				<SidebarGroupLabel>Downloads</SidebarGroupLabel>
				<SidebarContent className="justify-evenly  flex items-center w-full overflow-hidden">
					<div
						className="min-w-14 justify-evenly flex flex-col items-center w-full gap-2 px-1 overflow-hidden overflow-y-auto duration-200"
						style={{
							maxHeight: leftSidebarOpen ? "calc(100vh - 31rem)" : "calc(100vh - 39rem)",
						}}>
						{onlineDownloadList.length > 0 ? (
							<>
								{" "}
								<div ref={downloadRef} key={"cur" + JSON.stringify(onlineDownloadList[0])} className="min-h-12 -mb-14 height-in bg-accent text-background hover:brightness-125 z-10 flex flex-col self-start justify-center w-0 overflow-hidden rounded-lg">
									<div className="min-w-81 fade-in flex items-center gap-1 pl-2 pointer-events-none">
										<Loader2 className="min-h-4 min-w-4 animate-spin" />
										<Input readOnly type="text" className="min-w-72 p-0 pr-2 h-12   pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={onlineDownloadList[0].name} />
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
							<div key="loner" className="text-foreground/50  flex items-center justify-center w-64 h-12 duration-200 ease-linear">
								{leftSidebarOpen ? "Queue Empty" : "-"}
							</div>
						)}
					</div>
				</SidebarContent>
			</SidebarGroup>
			{/* <Separator
				className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
				style={{
					opacity: leftSidebarOpen ? "0" : "",
					height: leftSidebarOpen ? "0px" : "",
					marginBlock: leftSidebarOpen ? "4px" : "",
				}}
			/>
			<SidebarGroup>
				<SidebarGroupLabel>Mod Directory</SidebarGroupLabel>
				<SidebarContent className="flex flex-row items-center w-full gap-2 px-2">
					<Button
						className="aspect-square flex items-center justify-center w-10 h-10"
						onClick={() => {
							// socket.emit("set_root_dir", { prompt: true });
						}}
						style={{
							marginLeft: leftSidebarOpen ? "" : "0.25rem",
						}}>
						<Folder className="aspect-square w-5" />
					</Button>
					<Input
						readOnly
						type="text"
						className="w-67.75 overflow-hidden border-border/0 bg-input/50 cursor-default duration-200 text-ellipsis h-10"
						value={root ?? "-"}
						style={{
							width: leftSidebarOpen ? "" : "0px",
							opacity: leftSidebarOpen ? "" : "0",
						}}
					/>
				</SidebarContent>
			</SidebarGroup> */}
		</div>
	);
}

export default LSCOnline;
