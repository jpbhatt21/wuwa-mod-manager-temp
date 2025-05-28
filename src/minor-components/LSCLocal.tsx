import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { refreshDir } from "@/utils/config";
import { applyPreset, saveConfig } from "@/utils/fs";
import { localFilterAtom, selectedPresetAtom, presetsAtom, rootPathAtom, store, localItemsAtom, localDataAtom } from "@/variables";
import { Separator } from "@radix-ui/react-separator";
import { useAtom, useAtomValue } from "jotai";
import { Check, Circle, Edit, Folder, Plus, Save, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
let focusedPreset = -1;
function LSCLocal({ open, online, firstRender }: { open: boolean; online: boolean; firstRender: boolean }) {
	const [filter, setFilter] = useAtom(localFilterAtom);
	const [presets, setPresets] = useAtom(presetsAtom);
	const [selectedPreset, setSelectedPreset] = useAtom(selectedPresetAtom);
	const [localItems, setLocalItems] = useAtom(localItemsAtom);
	const root = useAtomValue(rootPathAtom);
	function update_preset(i: number, name: string, save = false, del = false) {
		let temp: any = [...presets];
		let created = false;
		if (i == temp.length) {
			temp.push({ name: name, data: [], hotkey: "" });
			created = true;
		}
		temp[i].name = name;
		if (save) {
			temp[i].data = [];
			function explorer(items: any) {
				for (let item of items) {
					temp[i].data.push(item.path);
					if (item.children && item.children.length > 0 && item.depth < 2) explorer(item.children);
				}
			}
			explorer(localItems);
		}
		if (del) {
			temp.splice(i, 1);
			if (selectedPreset == i) {
				setSelectedPreset(-1);
			} else if (selectedPreset > i) {
				setSelectedPreset(selectedPreset - 1);
			}
		} else if (created) {
			setSelectedPreset(i);
		}
		setPresets(temp);
		if (created) {
			setSelectedPreset(i);
			focusedPreset = i;
		}
		saveConfig();
	}
	return (
		<AnimatePresence>
			{!online && (
				<motion.div initial={firstRender ? false : { opacity: 1, marginLeft: "-100%", filter: "blur(6px)" }} animate={{ opacity: 1, marginLeft: "0rem", filter: "blur(0px)" }} exit={{ opacity: 1, marginLeft: "-100%", filter: "blur(6px)" }} layout transition={{ duration: 0.3 }} className="flex min-w-full h-full flex-col">
					<SidebarGroup className="p-0 ">
						<SidebarGroupLabel>Filter</SidebarGroupLabel>
						<SidebarContent
							className="w-full px-2 flex flex-row gap-2 overflow-hidden items-center justify-between"
							style={{
								flexDirection: open ? "row" : "column",
							}}>
							{[
								{
									name: "All",
									icon: <Circle className="h-4 aspect-square" />,
								},
								{
									name: "Enabled",
									icon: <Check className="h-4 aspect-square" />,
								},
								{
									name: "Disabled",
									icon: <X className="h-4 aspect-square" />,
								},
							].map((x, i: number) => (
								<Button
									onClick={() => {
										setFilter(x.name);
									}}
									className={"w-25 " + (filter == x.name ? "bg-accent text-background " : "")}
									style={{ width: open ? "" : "2.5rem" }}>
									{x.icon}
									{open && x.name}
								</Button>
							))}
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
					<SidebarGroup className="">
						<SidebarGroupLabel>Presets</SidebarGroupLabel>
						<SidebarContent className="w-full flex items-center justify-evenly overflow-hidden gap-0">
							<div
								className="w-full   min-w-14 flex gap-2 thin items-center justify-evenly pl-2 overflow-hidden flex-col duration-200  overflow-y-scroll"
								style={{
									maxHeight: open ? "calc(100vh - 30.125rem)" : "calc(100vh - 40.25rem)",
								}}>
									<AnimatePresence>
								{presets.length > 0 ? (
									presets.map((x: any, i: any) => (
										<motion.div
											initial={{ opacity: 0, scale: 0, marginBottom:"-2.5rem" }}
											animate={{ opacity: 1, scale: 1, marginBottom:"0rem" }}
											exit={{ opacity: 0, scale: 0 , marginBottom:"-3rem"}}
											key={x.name}
											layout
											transition={{ duration: 0.2 }}
											className="w-full min-h-10 justify-center flex"
											onClick={async (e) => {
												if (e.target == e.currentTarget) {
													// socket.emit("apply_preset", { preset: i });
													setSelectedPreset(i);
													await applyPreset(root, x);
													setLocalItems(await refreshDir(root, "", store.get(localDataAtom)));
												}
											}}
											style={{
												height: open ? "" : "2.5rem",
												width: open ? "" : "2.5rem",
												padding: open ? "" : "0px",
											}}>
											{open ? (
												<div className={"w-full text-accent duration-200 rounded-lg px-2 fade-in pointer-events-none items-center flex gap-1 " + (selectedPreset == i ? " bg-accent text-background" : "bg-input/10")}>
													<Input
														autoFocus={i == focusedPreset}
														onFocus={(e) => {
															e.currentTarget.select();
															focusedPreset = -1;
														}}
														onBlur={(e) => {
															if (e.currentTarget.value != x.name) update_preset(i, e.currentTarget.value);
														}}
														type="text"
														className="w-full h-full p-2  pointer-events-none focus-within:pointer-events-auto overflow-hidden focus-visible:ring-[0px] border-0  text-ellipsis"
														style={{ backgroundColor: "#fff0" }}
														defaultValue={x.name}
													/>
													<Edit
														onClick={(e) => {
															let prev = e.currentTarget.previousSibling as HTMLInputElement;
															prev?.focus();
														}}
														className="scale-75 pointer-events-auto"
													/>
													<X
														onClick={() => {
															update_preset(i, x.name, false, true);
														}}
														className=" pointer-events-auto"
													/>
												</div>
											) : (
												<Button className="w-full h-full">{i + 1}</Button>
											)}
										</motion.div>
									))
								) : (
									<motion.div
									initial={{ opacity: 0,height:"0px" }}
									animate={{ opacity: 1, height:"2.5rem" }}
									
									key="loner" className="w-64 h-10 ease-linear overflow-hidden duration-200 text-foreground/50 items-center justify-center flex " style={{ opacity: open ? "" : "0", scale: open ? "" : "0", height: open ? "" : "0px" }}>
										It's lonely here, create a preset!
									</motion.div>
								)}</AnimatePresence>
							</div>
							<div
								className="flex w-full gap-2 px-2 mt-2 justify-between items-center"
								style={{
									flexDirection: open ? "row" : "column",
								}}>
								<Button
									className="w-38.75"
									style={{ width: open ? "" : "2.5rem" }}
									onClick={() => {
										let len = presets.length;
										update_preset(len, "Preset" + (len + 1), true);
									}}>
									<Plus className="h-6 w-6" />
									<label className="ease-linear duration-200" style={{ opacity: open ? "" : "0", width: open ? "2.5rem" : "0rem", marginRight: open ? "" : "-0.5rem" }}>
										New
									</label>
								</Button>
								<Button
									onClick={(e) => {
										if (selectedPreset == -1) {
											let prev = e.currentTarget.previousElementSibling as HTMLButtonElement;
											prev?.click();
										} else {
											update_preset(selectedPreset, presets[selectedPreset].name, true);
										}
									}}
									className="w-38.75"
									style={{ width: open ? "" : "2.5rem" }}>
									<Save className="h-6 w-6" />
									<label className="ease-linear duration-200" style={{ opacity: open ? "" : "0", width: open ? "2.5rem" : "0rem", marginRight: open ? "" : "-0.5rem" }}>
										Save
									</label>
								</Button>
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

export default LSCLocal;
