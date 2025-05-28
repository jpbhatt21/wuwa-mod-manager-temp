import { Button } from "@/components/ui/button";
import { AppWindow, CircleSlash, Focus, Maximize, Maximize2, Mouse, MousePointerClick, SettingsIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { presetsAtom, settingsAtom } from "@/variables";
import { useAtom, useAtomValue } from "jotai";
import { Slider } from "@/components/ui/slider";
import { useEffect } from "react";
import { saveConfig } from "@/utils/fs";
import { setWindowType } from "@/init";

let keysdown: any = [];
let keys: any = [];
function Settings({ open }: { open: boolean }) {
	const [settings, setSettings] = useAtom(settingsAtom);
	const [presets, setPresets] = useAtom(presetsAtom);
	let bg = document.querySelector("body");
	if (JSON.stringify(settings) == "{}") return <></>;
	return (
		<Button className="w-38 overflow-hidden text-ellipsis h-12 " style={{ width: open ? "" : "3rem" }}>
			<Dialog>
				<DialogTrigger asChild>
					<Button className="w-38 overflow-hidden text-ellipsis h-12" style={{ width: open ? "" : "3rem" }}>
						<SettingsIcon />
						{open && "Settings"}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[800px] wuwa-ft text-accent h-124 flex flex-col pb-2 overflow-hidden lft">
					<DialogHeader>
						<DialogTitle className="text-accent flex gap-1 my-5 items-center w-full justify-center">
							<SettingsIcon />{" "}
							<input
								className=" focus-within:border-none focus-within:outline-0 w-25 text-2xl select-none"
								onFocus={(e) => {
									e.currentTarget.blur();
								}}
								value={"Settings"}
								readOnly
							/>
						</DialogTitle>
						{/* <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription> */}
					</DialogHeader>
					<div className=" flex p-1 py-4 h-full w-full">
						<div className="flex flex-col pr-4 border-r gap-4 h-full  w-1/2 overflow-y-auto">
							<div className="w-full flex flex-col gap-4">
								Game Hot Reload{" "}
								<Tabs
									defaultValue={settings.hotReload ? "1" : "0"}
									className="w-full"
									onValueChange={(e) => {
										setSettings((prev: any) => {
											prev.hotReload = e == "1";
											return prev;
										});
										saveConfig();
									}}>
									<TabsList className="w-full bg-background">
										<TabsTrigger value="0" className="w-1/2 h-10">
											<CircleSlash />
											Disable
										</TabsTrigger>
										<TabsTrigger value="1" className="w-1/2 h-10">
											<Focus />
											On Focus
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
							<div className="w-full flex flex-col gap-4">
								<label className="min-w-fit">Toggle On</label>
								<Tabs
									defaultValue={settings.toggle.toString()}
									className="w-full"
									onValueChange={(e) => {
										setSettings((prev: any) => {
											prev.toggle = parseInt(e);
											return prev;
										});
										saveConfig();
									}}>
									<TabsList className="w-full bg-background">
										<TabsTrigger value="0" className="w-1/2 h-10">
											<MousePointerClick className=" rotate-y-180 w-4 -mr-2" />
											<Mouse />
											Left Click
										</TabsTrigger>
										<TabsTrigger value="2" className="w-1/2 h-10">
											<Mouse />
											<MousePointerClick className=" w-4 -ml-2" /> Right Click
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							<div className="w-full flex flex-col gap-4 pt-2">
								<div className="w-full flex bg-background/80 gap-4 flex-col">
									Window BG Opacity
									<Slider
										defaultValue={[settings.opacity * 100]}
										max={100}
										min={0}
										step={1}
										className="w-full"
										onValueChange={(e) => {
											bg = bg || document.querySelector("body");
											if (bg) bg.style.backgroundColor = "color-mix(in oklab, var(--background) " + e + "%, transparent)";
										}}
										onValueCommit={(e) => {
											// setSettings((prev) => {
											// 	let temp = JSON.parse(JSON.stringify(prev));
											// 	temp.opacity = e[0] / 100;
											// 	socket.emit("set_settings", { key: "opacity", value: temp.opacity });
											// 	return temp;
											// });
											setSettings((prev: any) => {
												prev.opacity = e[0] / 100;
												return prev;
											});
											saveConfig();
										}}
									/>
								</div>
								<div className="w-full flex flex-col gap-4">
									<label>Type</label>
									<Tabs
										defaultValue={settings.type.toString()}
										onValueChange={(e) => {
											setSettings((prev: any) => {
												prev.type = parseInt(e);
												return prev;
											});
											setWindowType(parseInt(e));
											saveConfig();
										}}
										className="w-full">
										<TabsList className="w-full  bg-background">
											<TabsTrigger value="0" className="w-1/2 h-10">
												<AppWindow className="h-full pointer-events-none aspect-square" /> Windowed
											</TabsTrigger>
											<TabsTrigger value="1" className="w-1/2 h-10">
												<Maximize className="h-full pointer-events-none aspect-square" /> Borderless
											</TabsTrigger>
											<TabsTrigger value="2" className="w-1/2 h-10">
												<Maximize2 className="h-full pointer-events-none aspect-square" /> Maximized
											</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-4 h-full px-4 w-1/2 overflow-y-auto">
							<div className="w-full h-full flex flex-col gap-2">
								Hot Keys
								<div className="w-full max-h-72 h-full ml-2 p-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
									{presets.length > 0 ? (
										presets.map((x: any, i: any) => (
											<div className="w-full h-10 gap-2 flex items-center justify-between">
												<Input
													className="w-25 p-0 h-10 overflow-hidden border-0  text-ellipsis break-words"
													style={{ backgroundColor: "#0000" }}
													onFocus={(e) => {
														e.currentTarget.blur();
													}}
													value={x.name}></Input>
												<Input
													defaultValue={x.hotkey.replaceAll("+", "xx+xx").replaceAll("comma", ",").replaceAll("space", " ").replaceAll("plus", "+").replaceAll("xx+xx", " ﹢ ")}
													autoFocus={false}
													contentEditable={false}
													onKeyDownCapture={(e) => {
														e.preventDefault();
														if (e.code == "Backspace") {
															setPresets((prev: any) => {
																prev[i].hotkey = "";
																return prev;
															});
															saveConfig();
														} else {
															let next: any = [];
															let key = e.key.toLowerCase().replaceAll("control", "ctrl").replaceAll("arrow", "");
															if (keys.includes(key)) {
																next = keys;
															} else {
																if (!keysdown.includes(key)) {
																	keysdown.push(key);
																}
																keys.push(key);
																const priority = ["alt", "ctrl", "shift", "caps", "tab", "up", "down", "left", "right"];
																next = keys.sort((a: any, b: any) => {
																	return (a.length + a).toString().localeCompare((b.length + b).toString());
																});

																for (let i = priority.length - 1; i > -1; i--) {
																	let element = priority[i];
																	let index = next.indexOf(element);
																	if (index > -1) {
																		next.splice(index, 1);
																		next.unshift(element);
																	}
																}
															}

															e.currentTarget.value = next.join(" ﹢ ");
														}
													}}
													onKeyUpCapture={(e) => {
														let key = e.key.toLowerCase().replaceAll("control", "ctrl").replaceAll("arrow", "");
														let index = keysdown.indexOf(key);
														if (index > -1) keysdown.splice(index, 1);
														if (keysdown.length == 0) {
															keys = [];
															e.currentTarget.blur();
														}
													}}
													onBlur={(e) => {
														keysdown = [];
														keys = [];
														setPresets((prev: any) => {
															console.log(e.currentTarget.value.replaceAll(" ﹢ ", "xxplusxx"));
															prev[i].hotkey = e.currentTarget.value.replaceAll(" ﹢ ", "xxplusxx").replaceAll(",", "comma").replaceAll(" ", "space").replaceAll("+", "plus").replaceAll("xxplusxx", "+");
															return prev;
														});
														saveConfig();
													}}
													className=" caret-transparent select-none text-center w-full"
													type="text"
												/>
											</div>
										))
									) : (
										<div className="w-full h-full  text-white/50 items-center justify-center flex ">Create a preset to set hotkeys.</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</Button>
	);
}

export default Settings;
