import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarGroup } from "@/components/ui/sidebar";
import { categoryListAtom, refreshAppIdAtom, localFilteredModListAtom, localSelectedModAtom, previewUri, modRootDirAtom, onlineModeAtom, localDataAtom, LocalMod } from "@/utils/vars";
import { useAtom, useAtomValue } from "jotai";
import { ArrowUpRightFromSquareIcon, Check, ChevronDown, CircleSlash, Edit, File, Folder, Link } from "lucide-react";
import { useEffect, useState } from "react";
import wwmm from "@/wwmm.png";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { renameMod, saveConfig, savePreviewImage } from "@/utils/fsutils";
import { openPath } from "@tauri-apps/plugin-opener";
function RSCLocal() {
	const [item, setItem] = useState({} as LocalMod);
	const online = useAtomValue(onlineModeAtom);
	const [localData, setLocalData] = useAtom(localDataAtom);
	const localSelectedItem = useAtomValue(localSelectedModAtom);
	const localFilteredItems = useAtomValue(localFilteredModListAtom);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const root = useAtomValue(modRootDirAtom);
	const lastUpdated = useAtomValue(refreshAppIdAtom);
	const [category, setCategory] = useState({ name: "-1", icon: "" });
	const categories = useAtomValue(categoryListAtom);
	useEffect(() => {
		if (localFilteredItems.length > localSelectedItem && localFilteredItems[localSelectedItem]) setItem(localFilteredItems[localSelectedItem]);
		if (!localFilteredItems[localSelectedItem]) return;
		let cat = localFilteredItems[localSelectedItem].trueParent.split("\\")[1];
		let findCat = categories.find((x) => x._sName == cat);
		if (findCat) {
			setCategory({ name: findCat._sName, icon: findCat._sIconUrl });
		} else setCategory({ name: "-1", icon: "" });
	}, [localSelectedItem, localFilteredItems]);

	return (
		<div
			className="flex min-w-full h-full flex-col gap-0 duration-300"
			style={{
				opacity: online ? 0 : 1,
				transitionDelay: online ? "0s" : "0.3s",
				pointerEvents: online ? "none" : "auto",
			}}>
			<div className="flex items-center justify-center gap-3 px-3 h-16 min-w-16 border-b">
				<Button className="bg-input/0 hover:bg-input/0 h-10 w-6 -mr-2 text-white">{item.isDir ? <Folder className="scale-150" /> : <File className="scale-150" />}</Button>
				<Input
					onBlur={(e) => {
						let currentValue = e.currentTarget.value.replaceAll("DISABLED_", "");
						let new_path:string|string[] = item.path.split("\\");
						new_path.pop();
						new_path.push(currentValue);
						new_path = new_path.join("\\");
						renameMod(item.path, item.enabled ? e.currentTarget.value.replaceAll("DISABLED_", "") : "DISABLED_" + e.currentTarget.value.replaceAll("DISABLED_", ""));
						setLocalData((prev) => {
							if (prev[item.truePath]) {
								prev[new_path.replaceAll("DISABLED_", "")] = {
									...prev[item.truePath],
								};
								delete prev[item.truePath];
							}
							return {
								...prev,
							};
						});
						saveConfig();
					}}
					type="text"
					key={item.truePath}
					className="w-full border-0 rounded-none border-border border-b-1 select-none focus-within:select-auto overflow-hidden min-h-16 focus-visible:ring-[0px] focus-within:border-0   text-ellipsis"
					style={{ backgroundColor: "#fff0", fontSize: "1rem" }}
					defaultValue={item.name?.replaceAll("DISABLED_", "")}
				/>

				<div
					className="min-h-8 text-accent hover:border-border border-border/0 border min-w-8 p-2 flex items-center justify-center rounded-lg bg-pat2 duration-200 hover:bg-pat1"
					onClick={() => {
						openPath(root + item.path);
					}}>
					<ArrowUpRightFromSquareIcon className="h-full w-full" />
				</div>
			</div>
			<SidebarGroup className="px-1 min-h-82 mt-1 select-none">
				<Edit
					onClick={() => {
						// socket.emit("set_preview_image", { path: item.path });
						savePreviewImage(root + item.path);
					}}
					className="min-h-12 p-3 min-w-12 w-12 bg-background/50 z-25 border text-accent rounded-tr-md rounded-bl-md self-end -mb-12"
				/>
				<img
					id="preview"
					className="w-82 h-82 duration-150 bg-background  rounded-lg border object-cover"
					onError={(e) => {
						e.currentTarget.src = wwmm;
					}}
					src={previewUri + root + item.path + "?" + lastUpdated + "?" + lastUpdated}></img>
			</SidebarGroup>
			<SidebarGroup className="px-1 min-h-42.5 mt-1">
				<div className="flex flex-col border  rounded-lg w-full">
					<div className="flex w-full rounded-lg items-center justify-between bg-pat2 p-1 ">
						<Button className=" h-12 bg-accent/0 hover:bg-accent/0   min-w-28.5 w-28.5 text-accent">Category</Button>

						{item.depth == 1 ? (
							<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
								<PopoverTrigger asChild>
									<div role="combobox" className="overflow-hidden text-ellipsis  active:scale-90 whitespace-nowrap rounded-md text-sm font-medium transition-all p-2 gap-2 bg-sidebar text-accent shadow-xs hover:brightness-120  duration-300 h-12 flex items-center justify-between w-48.5">
										{category.name != "-1" ? (
											<>
												<div
													className="h-full  rounded-full aspect-square pointer-events-none flex items-center justify-center"
													style={
														category.name != "Uncategorized"
															? {
																	backgroundImage: "url('" + category.icon + "')",
																	backgroundSize: "cover",
																	backgroundRepeat: "no-repeat",
																	backgroundPosition: "center",
															  }
															: {}
													}>
													{/* {category.name == "Uncategorized" && ques({ className: " h-full aspect-square scale-175 pointer-events-none " })} */}
												</div>
												<div className="w-30 overflow-hidden text-ellipsis pointer-events-none break-words">{category.name}</div>
											</>
										) : (
											"Select"
										)}
										<ChevronDown />
									</div>
								</PopoverTrigger>
								<PopoverContent className="w-80 border rounded-lg my-2 p-0 mr-2">
									<Command>
										<CommandInput placeholder="Search category..." className="h-12" />
										<CommandList>
											<CommandEmpty>No such category.</CommandEmpty>
											<CommandGroup>
												{categories.map((cat) => (
													<CommandItem
														key={cat._sName}
														value={cat._sName}
														onSelect={(currentValue) => {
															let new_path: string|string[] = item.path.split("\\");
															new_path[1] = currentValue;
															new_path = new_path.join("\\");
															renameMod(item.path, new_path, true);
															setLocalData((prev) => {
																if (prev[item.truePath]) {
																	prev[new_path.replaceAll("DISABLED_", "")] = {
																		...prev[item.truePath],
																	};
																	delete prev[item.truePath];
																}
																return {
																	...prev,
																};
															});
															saveConfig();
															setPopoverOpen(false);
														}}>
														<div
															className="h-12 rounded-full flex items-center justify-center aspect-square pointer-events-none"
															style={
																cat._sName != "Uncategorized"
																	? {
																			background: "url('" + cat._sIconUrl + "')",
																			backgroundSize: "cover",
																			backgroundRepeat: "no-repeat",
																			backgroundPosition: "center",
																	  }
																	: {}
															}>
															{/* {cat.name == "Uncategorized" && ques({ className: " h-full text-inherit aspect-square scale-175 pointer-events-none " })} */}
														</div>
														<div className="w-35  overflow-hidden text-ellipsis break-words">{cat._sName}</div>
														<Check className={cn("ml-auto", category.name === cat._sName ? "opacity-100" : "opacity-0")} />
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						) : (
							<div className="w-48.5 min-w-48.5 text-accent flex items-center justify-center">
								<CircleSlash />
							</div>
						)}
					</div>

					<div className="flex bg-pat1 rounded-lg w-full p-1 justify-between">
						<Button className="bg-input/0 hover:bg-input/0 h-12 w-28.5 text-accent">Source</Button>
						<div className="w-48.5 flex items-center px-1">
							<Input
								onBlur={(e) => {
									if (e.currentTarget.value !== localData[item.truePath]?.source) {
										setLocalData((prev) => {
											prev[item.truePath] = {
												...prev[item.truePath],
												source: e.currentTarget.value,
												updatedAt: Date.now(),
											};
											return { ...prev };
										});
										saveConfig();
									}
								}}
								type="text"
								placeholder="No source"
								className="w-full select-none focus-within:select-auto overflow-hidden h-12 focus-visible:ring-[0px] border-0  text-ellipsis"
								style={{ backgroundColor: "#fff0" }}
								key={localData[item.truePath]?.source}
								defaultValue={localData[item.truePath]?.source}
							/>
							<a href={localData[item.truePath]?.source} target="_blank" className="rounded-lg bg-pat2 duration-200 hover:brightness-150 p-2">
								<Link className="h-4 w-4 " />
							</a>
						</div>
					</div>
					<div className="flex bg-pat2 rounded-lg w-full p-1 justify-between">
						<Button className="bg-input/0 hover:bg-input/0 h-12 w-28.5 text-accent">Note</Button>
						<div className="w-48.5 flex items-center px-1">
							<Input
								onBlur={(e) => {
									if (e.currentTarget.value !== localData[item.truePath]?.note) {
										setLocalData((prev) => {
											prev[item.truePath] = {
												...prev[item.truePath],
												note: e.currentTarget.value,
											};
											return { ...prev };
										});
										saveConfig();
									}
								}}
								type="text"
								className="w-full select-none focus-within:select-auto overflow-hidden h-12 focus-visible:ring-[0px] border-0  text-ellipsis"
								style={{ backgroundColor: "#fff0" }}
								key={localData[item.truePath]?.note}
								placeholder="No notes"
								defaultValue={localData[item.truePath]?.note}
							/>
						</div>
					</div>
				</div>
			</SidebarGroup>
			<SidebarGroup
				className="px-1 my-1 opacity-0 duration-200"
				style={{
					opacity: item.keys?.length > 0 ? 1 : 0,
				}}>
				<div className="flex flex-col border h-full  overflow-hidden rounded-lg w-full">
					<div className="flex bg-pat1 text-accent  rounded-lg w-full p-1 justify-center items-center min-h-14">Hot Keys</div>
					<div className="w-full h-full">
						<div className="text-gray-300 h-full max-h-[calc(100vh-39.75rem)] w-full overflow-y-auto overflow-x-hidden">
							<div className="min-h-8 flex text-accent items-center justify-center bg-pat2">
								<label className="w-1/2 text-c px-4">Key</label>
								<label className="w-1/2 text-c px-4">Action</label>
							</div>
							{item.keys?.map((hotkey, index) => (
								<div className={"flex w-full items-center justify-center h-8 bg-pat" + (1 + (index % 2))}>
									<label className="w-1/2 text-c px-4">{hotkey.key}</label>
									<label className="w-1/2 text-c px-4">{hotkey.name}</label>
								</div>
							))}
						</div>
					</div>
				</div>
			</SidebarGroup>
		</div>
	);
}

export default RSCLocal;
