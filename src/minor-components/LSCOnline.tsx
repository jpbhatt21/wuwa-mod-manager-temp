import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import {  onlineDownloadListAtom, rootPathAtom } from "@/variables";
import { Separator } from "@radix-ui/react-separator";
import { useAtom, useAtomValue } from "jotai";
import { AppWindow, Check, Clock, Folder, Loader2, ShieldQuestion, Shirt, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

function LSCOnline({ open, online }: { open: boolean; online: boolean }) {
	const [onlineDownloads, setOnlineDownloads] = useAtom(onlineDownloadListAtom);
	const root = useAtomValue(rootPathAtom);
	const genericTypes = [
    {
        "_idRow": 29524,
        "_sName": "Skins",
        "_nItemCount": 1483,
        "_nCategoryCount": 34,
        "_sUrl": "https://gamebanana.com/mods/cats/29524",
        "_sIconUrl": "https://images.gamebanana.com/img/ico/ModCategory/6654b6596ba11.png"
    },
    {
        "_idRow": 29496,
        "_sName": "UI",
        "_nItemCount": 57,
        "_nCategoryCount": 0,
        "_sUrl": "https://gamebanana.com/mods/cats/29496",
        "_sIconUrl": "https://images.gamebanana.com/img/ico/ModCategory/6692c913ddf00.png"
    },
    {
        "_idRow": 29493,
        "_sName": "Other",
        "_nItemCount": 75,
        "_nCategoryCount": 0,
        "_sUrl": "https://gamebanana.com/mods/cats/29493",
        "_sIconUrl": "https://images.gamebanana.com/img/ico/ModCategory/6692c90cba314.png"
    }
]
	return (
		<AnimatePresence>
			{online && (
				<motion.div initial={{ filter: "blur(6px)",opacity:1 }}
							animate={{ filter: "blur(0px)",opacity:1 }}
							exit={{ filter: "blur(6px)",opacity:1 }} layout transition={{ duration: 0.3 }} className="flex min-w-full  h-full flex-col">
					<SidebarGroup className="p-0">
						<SidebarGroupLabel>Type</SidebarGroupLabel>
						<SidebarContent
							className="w-full flex flex-row gap-2 overflow-hidden items-center justify-between px-2"
							style={{
								flexDirection: open ? "row" : "column",
							}}>
							{genericTypes.map((x: any, index: any) => {
								return (
									<Button
										id={"type " + x._sName}
										onClick={() => {
											// if (onlinePath == x._sName) {
											// 	store.set(onlinePathAtom, "home");
											// 	return;
											// }
											// store.set(onlineDataAtom, (prev: any) => {
											// 	prev.id = x._idRow;
											// 	return prev;
											// });
											// store.set(onlinePathAtom, x._sName);
										}}
										className={"w-25 "} // (onlinePath.startsWith(x._sName) ? " bg-accent text-background"
										style={{ width: open ? "" : "2.5rem" }}>
										{/* <Shirt className="h-6 w-6" /> */}
										{/* <AppWindow className="h-6 w-6" /> */}
										{/* <ShieldQuestion className="h-6 w-6" /> */}
										{[<Shirt className="h-6 w-6" />, <AppWindow className="h-6 w-6" />, <ShieldQuestion className="h-6 w-6" />][index % 3]}

										{/* <img className="h-full rounded-full aspect-square pointer-events-none" src={x._sIconUrl} /> */}
										{open && x._sName}
									</Button>
								);
							})}
						</SidebarContent>
					</SidebarGroup>
					<Separator
						className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
						style={{
							opacity: open ? "0" : "",
							height: open ? "0px" : "",
							marginBlock: open ? "4px" : "",
						}}
					/>
					<SidebarGroup>
						<SidebarGroupLabel>Downloads</SidebarGroupLabel>
						<SidebarContent className="w-full flex items-center justify-evenly overflow-hidden ">
							<div
								className="w-full   min-w-14 flex gap-2 items-center justify-evenly px-1 overflow-hidden flex-col  duration-200  overflow-y-auto"
								style={{
									maxHeight: open ? "calc(100vh - 31rem)" : "calc(100vh - 39rem)",
								}}>
								{onlineDownloads.length > 0 ? (
									onlineDownloads.map((x: any, i: any) => (
										<div
											key={x.name}
											className={"w-full min-h-12 flex-col justify-center height-in overflow-hidden rounded-lg flex duration-200 " + (true ? " bg-input/50 text-accent hover:bg-input/80" : " bg-accent text-background hover:brightness-125")}
											onClick={(e) => {
												if (e.target == e.currentTarget) {
													// socket.emit("apply_preset", { preset: i });
													// setSelectedPreset(i);
												}
											}}
											style={{
												height: open ? "" : "2.5rem",
												width: open ? "" : "2.5rem",
												padding: open ? "" : "0px",
											}}>
											{open ? (
												<div className="w-full fade-in pointer-events-none items-center flex gap-1 px-2">
													{x.status == "downloading" ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : x.status == "completed" ? <Check className="h-4 w-4 text-accent" /> : x.status == "failed" ? <X className="h-4 w-4 text-red-300" /> : <Clock className="h-4 w-4 text-accent" />}
													<Input readOnly type="text" className="w-full h-12 p-0  pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={x.name} />
												</div>
											) : (
												<div className="w-full h-full flex items-center justify-center">{i + 1}</div>
											)}
											{x.status == "downloading" && <div className="w-0 bg-accent h-1 -mt-1" id="downloader"></div>}
										</div>
									))
								) : (
									<div key="loner" className="w-64 h-12 ease-linear duration-200 text-foreground/50 items-center justify-center flex ">
										{open ? "Queue Empty" : "-"}
									</div>
								)}
							</div>
						</SidebarContent>
					</SidebarGroup>
					<Separator
						className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
						style={{
							opacity: open ? "0" : "",
							height: open ? "0px" : "",
							marginBlock: open ? "4px" : "",
						}}
					/>
					<SidebarGroup>
						<SidebarGroupLabel>Mod Directory</SidebarGroupLabel>
						<SidebarContent className="w-full flex flex-row gap-2 items-center px-2">
							<Button
								className="w-10 h-10 flex items-center justify-center aspect-square"
								onClick={() => {
									// socket.emit("set_root_dir", { prompt: true });
								}}
								style={{
									marginLeft: open ? "" : "0.25rem",
								}}>
								<Folder className="w-5 aspect-square" />
							</Button>
							<Input
								readOnly
								type="text"
								className="w-67.75 overflow-hidden border-border/0 bg-input/50 cursor-default duration-200 text-ellipsis h-10"
								value={root ?? "-"}
								style={{
									width: open ? "" : "0px",
									opacity: open ? "" : "0",
								}}
							/>
						</SidebarContent>
					</SidebarGroup>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default LSCOnline;
