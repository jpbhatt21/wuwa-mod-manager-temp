import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRoutes, DownloadItem, getTimeDifference, onlineDownloadListAtom, OnlineMod, onlineModeAtom, OnlineModImage, onlineSelectedItemAtom } from "@/utils/vars";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronDown, Disc, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
let now = Math.round(Date.now() / 1000);
let cache = new Map();
let cur:string;
function RSCOnline() {
	const online = useAtomValue(onlineModeAtom);
	const [item, setItem] = useState({} as any);
	const [curPreview, setCurPreview] = useState(0);
	const onlineSelectedItem = useAtomValue(onlineSelectedItemAtom);
	const [aboutOpen, setAboutOpen] = useState(true);
	const [updateOpen, setUpdateOpen] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const setOnlineDownloadList = useSetAtom(onlineDownloadListAtom);
	cur = onlineSelectedItem.split("/").slice(-1)[0];
	useEffect(() => {
		now = Math.round(Date.now() / 1000);
		if (onlineSelectedItem != "-1" && online) {
			if (cache.has(cur)) {
				setItem(cache.get(cur));
				setAboutOpen(true);
				setUpdateOpen(false);
				setCurPreview(0);
				setPopoverOpen(false);
			} else setItem((prev:any) => ({ ...prev, status: "Loading", loaded: false }));
			fetch(apiRoutes.modUpdates(onlineSelectedItem))
				.then((res) => res.json())
				.then((data) => {
					fetch(apiRoutes.mod(onlineSelectedItem))
						.then((res) => res.json())
						.then((data2) => {
							console.log(data2);
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
							console.log(data2, onlineSelectedItem.split("/").slice(-1)[0]);
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
	}, [onlineSelectedItem, online]);

	return (
		<div
			className="overflow-hidden flex min-w-full items-center h-full flex-col duration-300"
			style={{
				opacity: online ? 1 : 0,
				transitionDelay: online ? "0.3s" : "0s",
				pointerEvents: online ? "auto" : "none",
				marginLeft: "-100%",
			}}>
			<div
				className="absolute min-h-full flex gap-2 pointer-events-none items-center"
				style={{
					opacity: !item.loaded ? 1 : 0,
				}}>
				{item.status == "Loading" ? <Loader2 className="animate-spin h-8 w-8 text-accent" /> : <></>}
				<div className="text-accent text-xl">{item.status}</div>
			</div>
			<div className="flex items-center text-accent justify-center gap-3 px-3 h-16 min-w-16 border-b">
				<Input readOnly type="text" key={item._sName} className="w-full border-0 rounded-none border-border border-b-1 select-none focus-within:select-auto overflow-hidden min-h-16 focus-visible:ring-[0px] focus-within:border-0 text-ellipsis" style={{ backgroundColor: "#fff0", fontSize: "1.5rem", opacity: !item.loaded ? 0 : 1 }} defaultValue={item._sName} />
			</div>
			<div
				className="w-full flex flex-col overflow-hidden overflow-y-scroll mb-24 pb-2"
				style={{
					opacity: !item.loaded ? 0 : 1,
				}}>
				{
					<div key={item._sName + "pix"} className="w-full min-h-64 gap-2 flex  flex-col px-2">
						<Dialog>
							<DialogTrigger asChild>
								<div className="w-full min-h-56 h-56 overflow-hidden border rounded-lg  flex gap-1">{item._aPreviewMedia && item._aPreviewMedia._aImages && item._aPreviewMedia._aImages.length > 0 && item._aPreviewMedia._aImages.map((image: OnlineModImage, index: number) => <img className="min-w-full duration-200 object-contain" src={image._sBaseUrl + "/" + image._sFile} alt={item._sName} style={{ marginLeft: index == 0 ? -20.25 * curPreview + "rem" : "" }} />)}</div>
							</DialogTrigger>
							<DialogContent className="min-w-[800px] min-h-[600px] flex flex-col items-center justify-center">
								<DialogHeader className="w-full flex items-center text-accent">
									<DialogTitle className="text-2xl lft">Preview Images</DialogTitle>
								</DialogHeader>
								{/* <Carousel className="w-[768px] h-[468px] border rounded-lg flex items-center overflow-hidden justify-center">
										<CarouselPrevious className="w-8 -mr-8 z-20" />
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
					<Collapsible key={item._sName + "abt"} className="w-full pb-3 px-2" open={aboutOpen} onOpenChange={setAboutOpen}>
						<CollapsibleTrigger className="w-full h-8 text-accent flex items-center justify-between">
							<Button className={"w-full flex justify-between bg-accent text-background " + (aboutOpen ? "hover:brightness-125" : "bg-input/50 text-accent hover:text-accent hover:bg-input")}>
								About <ChevronDown id="deschev" className=" transform-[roate(180deg)] duration-200" style={{ transform: aboutOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="w-full pt-2 mt-2 pl-2 border-accent">
							<div className="w-full font-sans" dangerouslySetInnerHTML={{ __html: item._sText }}></div>
						</CollapsibleContent>
					</Collapsible>
				)}
				{item._eUpdate && (
					<Collapsible key={item._sName + "upd"} className="w-full pb-1 pt-1 px-2 " open={updateOpen} onOpenChange={setUpdateOpen}>
						<CollapsibleTrigger className="w-full h-8 text-accent flex items-center justify-between">
							<Button className={"w-full flex justify-between bg-accent text-background " + (updateOpen ? "hover:brightness-125" : "bg-input/50 text-accent hover:text-accent hover:bg-input")}>
								Latest Update <ChevronDown id="deschev" className=" transform-[roate(180deg)] duration-200" style={{ transform: updateOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="w-full pt-2 mt-2 gap-4 px-2  border-accent flex flex-col">
							<div className="flex text-accent justify-between border-b pb-4 items-center">
								{item._sUpdateName}
								<label className="text-xs text-gray-300 flex flex-col">
									{" "}
									<label>{item._sUpdateVersion}</label> <label className=" text-cyan-200">{getTimeDifference(now, item._sUpdateDate)}</label>
								</label>
							</div>
							<div className=" flex flex-col gap-2">
								{item._aUpdateChangeLog &&
									item._aUpdateChangeLog.map((item: any, index: number) => (
										<div key={index} className="flex gap-2 items-center">
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
				className="absolute  bottom-0  items-center text-accent justify-center gap-3 px-3 min-h-22 flex h-22 min-w-84 border-t"
				style={{
					opacity: !item.loaded ? 0 : 1,
				}}>
				<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
					<PopoverTrigger className="w-full" disabled={!item._aFiles || item._aFiles?.length == 0}>
						<Button className="w-full flex h-10 gap-4 ">
							<Download />
							Install
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80  max-h-[75vh] overflow-auto gap-1 bg-sidebar p-1 flex flex-col">
						{item._aFiles?.map((file: any) => (
							<Button
								className="flex w-full items-center overflow-hidden justify-center min-h-fit p-2 gap-1"
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
								<div className="flex  flex-col w-54 gap-1 text-start ">
									<p className="w-54 overflow-hidden text-ellipsis  resize-none text-base wrap-break-word">{file._sFile}</p>
									<div className="w-full flex gap-1 text-xs flex-wrap text-background">
										{file._sAnalysisResultCode == "contains_exe" ? <div className=" rounded-lg px-1 w-12 text-center bg-red-300">exe</div> : ""}
										{file._sAnalysisState == "done" ? (
											<>
												{file._sAvastAvResult == "clean" ? <div className=" rounded-lg px-1 w-16 text-center bg-green-300">AvastAV</div> : <div className=" rounded-lg px-1 w-16 text-center bg-red-300">AvastAV</div>}
												{file._sClamAvResult == "clean" ? <div className=" rounded-lg px-1 w-16 text-center bg-green-300">ClamAV</div> : <div className=" rounded-lg px-1 w-16 text-center bg-red-300">ClamAV</div>}
											</>
										) : (
											<div className=" rounded-lg px-1 w-12 text-center bg-yellow-300">pending</div>
										)}
									</div>
									<p className="w-54 overflow-hidden text-ellipsis resize-none text-xs brightness-75 wrap-break-word">{file._sDescription}</p>
								</div>
								<div className="flex flex-col  min-w-20 items-center">
									{getTimeDifference(now, file._tsDateAdded)}
									<div className=" flex item gap-1 w-10">
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

export default RSCOnline;
