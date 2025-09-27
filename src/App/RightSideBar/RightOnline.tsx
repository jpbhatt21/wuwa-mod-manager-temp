import { apiRoutes, DownloadItem, getTimeDifference, onlineDownloadListAtom, onlineModeAtom, OnlineModImage, onlineSelectedItemAtom, rightSidebarOpenAtom } from "@/utils/vars";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Disc, Download, Loader2 } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

let now = Math.round(Date.now() / 1000);
let cache = new Map();
let cur: string;

function RightOnline() {
	const setOnlineDownloadList = useSetAtom(onlineDownloadListAtom);

	const onlineSelectedItem = useAtomValue(onlineSelectedItemAtom);
	const online = useAtomValue(onlineModeAtom);

	const [popoverOpen, setPopoverOpen] = useState(false);
	const [updateOpen, setUpdateOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(true);
	const [curPreview, setCurPreview] = useState(0);
	const [item, setItem] = useState({} as any);
	const setRightSidebarOpen = useSetAtom(rightSidebarOpenAtom)

	cur = onlineSelectedItem.split("/").slice(-1)[0];

	useEffect(() => {
		const controller = new AbortController();
		now = Math.round(Date.now() / 1000);
		if (onlineSelectedItem != "-1" && online) {
			setRightSidebarOpen(true);
			if (cache.has(cur)) {
				setItem(cache.get(cur));
				setAboutOpen(true);
				setUpdateOpen(false);
				setCurPreview(0);
				setPopoverOpen(false);
			} else setItem((prev: any) => ({ ...prev, status: "Loading", loaded: false }));
			fetch(apiRoutes.modUpdates(onlineSelectedItem), { signal: controller.signal })
				.then((res) => res.json())
				.then((data) => {
					fetch(apiRoutes.mod(onlineSelectedItem), { signal: controller.signal })
						.then((res) => res.json())
						.then((data2) => {
							if (data._aRecords && data._aRecords.length > 0) {
								data2._eUpdate = true;
								data2._sUpdateText = data._aRecords[0]._sText;
								data2._sUpdateVersion = data._aRecords[0]._sVersion;
								data2._sUpdateDate = data._aRecords[0]._tsDateModified || data._aRecords[0]._tsDateAdded;
								data2._aUpdateChangeLog = data._aRecords[0]._aChangeLog;
								data2._sUpdateName = data._aRecords[0]._sName;
							}
							data2.loaded = true;
							data2.status = "Loaded";
							cache.set(data2._idRow, data2);
							if (data2._idRow != cur) return;
							setAboutOpen(true);
							setUpdateOpen(false);
							setCurPreview(0);
							setItem(data2);
						});
				});
		} else {
			setItem((prev: any) => ({ ...prev, status: "Select an Item", loaded: false }));
		}
		return () => {
			controller.abort();
		};
	}, [onlineSelectedItem, online]);

	return (
		<div
			className="flex flex-col items-center h-full min-w-full overflow-hidden duration-300"
			style={{
				opacity: online ? 1 : 0,
				transitionDelay: online ? "0.3s" : "0s",
				pointerEvents: online ? "auto" : "none",
				marginLeft: "-100%",
			}}>
			<div
				className="absolute flex items-center min-h-full gap-2 pointer-events-none"
				style={{
					opacity: !item.loaded ? 1 : 0,
				}}>
				{item.status == "Loading" ? <Loader2 className="animate-spin text-accent w-8 h-8" /> : <></>}
				<div className="text-accent text-xl">{item.status}</div>
			</div>
			<div className="text-accent min-w-16 flex items-center justify-center h-16 gap-3 px-3 border-b">
				<Input readOnly type="text" key={item._sName} className="w-full border-0 rounded-none border-border border-b-1 select-none focus-within:select-auto overflow-hidden min-h-16 focus-visible:ring-[0px] focus-within:border-0 text-ellipsis" style={{ backgroundColor: "#fff0", fontSize: "1.5rem", opacity: !item.loaded ? 0 : 1 }} defaultValue={item._sName} />
			</div>
			<div
				className="flex flex-col w-full pb-2 mb-24 overflow-hidden overflow-y-scroll"
				style={{
					opacity: !item.loaded ? 0 : 1,
				}}>
				{
					<div key={item._sName + "pix"} className="min-h-64 flex flex-col w-full gap-2 px-2">
						<Dialog>
							<DialogTrigger asChild>
								<div className="min-h-56 flex w-full h-56 gap-1 overflow-hidden border rounded-lg">{item._aPreviewMedia && item._aPreviewMedia._aImages && item._aPreviewMedia._aImages.length > 0 && item._aPreviewMedia._aImages.map((image: OnlineModImage, index: number) => <img className="object-contain min-w-full duration-200" src={image._sBaseUrl + "/" + image._sFile} alt={item._sName} style={{ marginLeft: index == 0 ? -20.25 * curPreview + "rem" : "" }} />)}</div>
							</DialogTrigger>
							<DialogContent className="min-w-[800px] min-h-[600px] flex flex-col items-center justify-center">
								<DialogHeader className="text-accent flex items-center w-full">
									<DialogTitle className="lft text-2xl">Preview Images</DialogTitle>
								</DialogHeader>
								{/* <Carousel className="w-[768px] h-[468px] border rounded-lg flex items-center overflow-hidden justify-center">
										<CarouselPrevious className="z-20 w-8 -mr-8" />
										<CarouselContent className="w-[768px] h-[468px] flex gap-1">
											{item._aPreviewMedia &&
												item._aPreviewMedia._aImages &&
												item._aPreviewMedia._aImages.length > 0 &&
												item._aPreviewMedia._aImages.map((image: any, index: number) => (
													<CarouselItem className="min-w-[768px] h-[468px] flex items-center justify-center duration-200">
														<img className="max-w-[768px] max-h-[468px] duration-200     object-contain" src={image._sBaseUrl + "/" + image._sFile} alt={item._sName} style={{ marginLeft: index == 0 ? -768 * curPreview + "px " : "" }} />
													</CarouselItem>
												))}
										</CarouselContent>
										<CarouselNext className=" -ml-8" />
									</Carousel> */}
							</DialogContent>
						</Dialog>
						<div className="flex w-full h-2 gap-1 mt-0.5 items-center justify-center">
							{item._aPreviewMedia &&
								item._aPreviewMedia._aImages &&
								item._aPreviewMedia._aImages.length > 0 &&
								item._aPreviewMedia._aImages.map((_: any, index: number) => (
									<div
										className={"h-full aspect-square rounded-full border duration-200 " + (index == curPreview ? "bg-accent border-accent" : " hover:bg-border")}
										onClick={() => {
											setCurPreview(index);
										}}
									/>
								))}
						</div>
					</div>
				}
				{item._sText && (
					<Collapsible key={item._sName + "abt"} className="w-full px-2 pb-3" open={aboutOpen} onOpenChange={setAboutOpen}>
						<CollapsibleTrigger className="text-accent flex items-center justify-between w-full h-8">
							<Button className={"w-full flex justify-between bg-accent text-background " + (aboutOpen ? "hover:brightness-125" : "bg-input/50 text-accent hover:text-accent hover:bg-input")}>
								About <ChevronDown id="deschev" className=" transform-[roate(180deg)] duration-200" style={{ transform: aboutOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="border-accent w-full pt-2 pl-2 mt-2">
							<div className="w-full font-sans" dangerouslySetInnerHTML={{ __html: item._sText }}></div>
						</CollapsibleContent>
					</Collapsible>
				)}
				{item._eUpdate && (
					<Collapsible key={item._sName + "upd"} className=" w-full px-2 pt-1 pb-1" open={updateOpen} onOpenChange={setUpdateOpen}>
						<CollapsibleTrigger className="text-accent flex items-center justify-between w-full h-8">
							<Button className={"w-full flex justify-between bg-accent text-background " + (updateOpen ? "hover:brightness-125" : "bg-input/50 text-accent hover:text-accent hover:bg-input")}>
								Latest Update <ChevronDown id="deschev" className=" transform-[roate(180deg)] duration-200" style={{ transform: updateOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="border-accent flex flex-col w-full gap-4 px-2 pt-2 mt-2">
							<div className="text-accent flex items-center justify-between pb-4 border-b">
								{item._sUpdateName}
								<label className="flex flex-col text-xs text-gray-300">
									{" "}
									<label>{item._sUpdateVersion}</label> <label className=" text-cyan-200">{getTimeDifference(now, item._sUpdateDate)}</label>
								</label>
							</div>
							<div className=" flex flex-col gap-2">
								{item._aUpdateChangeLog &&
									item._aUpdateChangeLog.map((item: any, index: number) => (
										<div key={index} className="flex items-center gap-2">
											<div className="min-w-2 min-h-2 bg-accent rounded-full" />
											<label className=" text-cyan-100 font-sans">{item.text}</label>
										</div>
									))}
							</div>
							<div className="w-full font-sans" dangerouslySetInnerHTML={{ __html: item._sUpdateText }}></div>
						</CollapsibleContent>
					</Collapsible>
				)}
			</div>
			<div
				className="text-accent min-h-22 h-22 min-w-84 absolute bottom-0 flex items-center justify-center gap-3 px-3 border-t"
				style={{
					opacity: !item.loaded ? 0 : 1,
				}}>
				<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
					<PopoverTrigger className="w-full flex h-10 gap-4 overflow-hidden text-ellipsis bg-button text-accent shadow-xs hover:brightness-120  duration-300  items-center justify-center active:scale-90 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive" disabled={!item._aFiles || item._aFiles?.length == 0}>
						<Download />
						Install
					</PopoverTrigger>
					<PopoverContent className="w-80  max-h-[75vh] overflow-auto gap-1 bg-sidebar p-1 flex flex-col">
						{item._aFiles?.map((file: any) => (
							<Button
								className="min-h-fit flex items-center justify-center w-full gap-1 p-2 overflow-hidden"
								onClick={() => {
									setOnlineDownloadList((prev) => {
										let temp = [...prev];
										let dlitem = {
											status: "pending",
											preview: item._aPreviewMedia && item._aPreviewMedia._aImages && item._aPreviewMedia._aImages.length > 0 ? item._aPreviewMedia._aImages[0]._sBaseUrl + "/" + item._aPreviewMedia._aImages[0]._sFile : "",
											category: item._aCategory._sName,
											source: item._sProfileUrl,
											file: file._sDownloadUrl,
											updated: file._tsDateAdded,
											name: item._sName,
											fname: file._sFile,
										} as DownloadItem;
										for (let i = 0; i <= temp.length; i++) {
											if (i == temp.length) {
												temp.push(dlitem);
												//console.log(temp);
												return temp;
											} else if (temp[i].status == "completed" || temp[i].status == "failed") {
												temp = [...temp.slice(0, i), { ...dlitem }, ...temp.slice(i)];
												break;
											}
										}
										return temp;
									});
								}}>
								<div className="w-54 text-start  flex flex-col gap-1">
									<p className="w-54 text-ellipsis wrap-break-word overflow-hidden text-base resize-none">{file._sFile}</p>
									<div className="text-background flex flex-wrap w-full gap-1 text-xs">
										{file._sAnalysisResultCode == "contains_exe" ? <div className=" w-12 px-1 text-center bg-red-300 rounded-lg">exe</div> : ""}
										{file._sAnalysisState == "done" ? (
											<>
												{file._sAvastAvResult == "clean" ? <div className=" w-16 px-1 text-center bg-green-300 rounded-lg">AvastAV</div> : <div className=" w-16 px-1 text-center bg-red-300 rounded-lg">AvastAV</div>}
												{file._sClamAvResult == "clean" ? <div className=" w-16 px-1 text-center bg-green-300 rounded-lg">ClamAV</div> : <div className=" w-16 px-1 text-center bg-red-300 rounded-lg">ClamAV</div>}
											</>
										) : (
											<div className=" w-12 px-1 text-center bg-yellow-300 rounded-lg">pending</div>
										)}
									</div>
									<p className="w-54 text-ellipsis brightness-75 wrap-break-word overflow-hidden text-xs resize-none">{file._sDescription}</p>
								</div>
								<div className="min-w-20 flex flex-col items-center">
									{getTimeDifference(now, file._tsDateAdded)}
									<div className=" item flex w-10 gap-1">
										{" "}
										<Download />
										{file._nDownloadCount}
									</div>
									<div className=" flex gap-1">
										{" "}
										<Disc />
										{file._nFilesize < 100 ? file._nFilesize.toFixed(2) + "B" : file._nFilesize < 100000 ? (file._nFilesize / 1000).toFixed(2) + "KB" : file._nFilesize < 100000000 ? (file._nFilesize / 1000000).toFixed(2) + "MB" : (file._nFilesize / 1000000000).toFixed(2) + "GB"}
									</div>
								</div>
							</Button>
						))}
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}

export default RightOnline;
