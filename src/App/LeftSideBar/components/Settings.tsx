import { AppWindow, CircleSlash, Focus, Maximize, Maximize2, Mouse, MousePointerClick, SettingsIcon } from "lucide-react";
import { leftSidebarOpenAtom, localPresetListAtom, settingsDataAtom } from "@/utils/vars";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAtom, useAtomValue } from "jotai";
import { setWindowType } from "@/utils/init";
import { keySort, saveConfig } from "@/utils/fsutils";
import { setHotreload } from "@/utils/hotreload";

let keysdown: any = [];
let keys: any = [];
let bg = document.querySelector("body");

function Settings() {
	const [presets, setPresets] = useAtom(localPresetListAtom);
	const [settings, setSettings] = useAtom(settingsDataAtom);
	const leftSidebarOpen = useAtomValue(leftSidebarOpenAtom);

	if (JSON.stringify(settings) == "{}") return <></>;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="w-38 text-ellipsis h-12 overflow-hidden" style={{ width: leftSidebarOpen ? "" : "3rem" }}>
					<SettingsIcon />
					{leftSidebarOpen && "Settings"}
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-180 wuwa-ft min-h-150 bg-background/50 border-border gap -4 flex flex-col items-center p-4 overflow-hidden border-2 rounded-lg">
				<div className="min-h-fit text-accent my-6 text-3xl">Settings</div>
				<div className="h-110 flex items-center w-full gap-4 p-0">
					<div className="min-w-1/2 flex flex-col h-full gap-4 pr-4 overflow-y-auto border-r">
						<div className="flex flex-col w-full gap-4">
							Game Hot Reload{" "}
							<Tabs
								defaultValue={settings.hotReload ? "1" : "0"}
								className="w-full"
								onValueChange={(e) => {
									setSettings((prev) => {
										prev.hotReload = e == "1";
										return prev;
									});
									setHotreload(e == "1");
									saveConfig();
								}}>
								<TabsList className="bg-background/50 w-full">
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
						<div className="flex flex-col w-full gap-4">
							<label className="min-w-fit">Toggle On</label>
							<Tabs
								defaultValue={settings.toggle.toString()}
								className="w-full"
								onValueChange={(e) => {
									setSettings((prev) => {
										prev.toggle = parseInt(e) as 0 | 2;
										return prev;
									});
									saveConfig();
								}}>
								<TabsList className="bg-background/50 w-full">
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

						<div className="flex flex-col w-full gap-4 pt-2">
							<div className="flex flex-col w-full gap-4">
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
										setSettings((prev) => {
											prev.opacity = e[0] / 100;
											return prev;
										});
										saveConfig();
									}}
								/>
							</div>
							<div className="flex flex-col w-full gap-4">
								<label>Type</label>
								<Tabs
									defaultValue={settings.type.toString()}
									onValueChange={(e) => {
										setSettings((prev) => {
											prev.type = parseInt(e) as 0 | 1 | 2;
											return prev;
										});
										setWindowType(parseInt(e));
										saveConfig();
									}}
									className="w-full">
									<TabsList className="bg-background/50 w-full">
										<TabsTrigger value="0" className="w-1/3 h-10">
											<AppWindow className="aspect-square h-full pointer-events-none" /> Windowed
										</TabsTrigger>
										<TabsTrigger value="1" className="w-1/3 h-10">
											<Maximize className="aspect-square h-full pointer-events-none" /> Borderless
										</TabsTrigger>
										<TabsTrigger value="2" className="w-1/3 h-10">
											<Maximize2 className="aspect-square h-full pointer-events-none" /> Maximized
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
						</div>
					</div>
					<div className="min-w-1/2 flex flex-col h-full gap-4 px-4 overflow-y-auto">
						<div className="flex flex-col w-full h-full gap-2">
							Hot Keys
							<div className="max-h-72 flex flex-col w-full h-full gap-1 p-2 ml-2 overflow-x-hidden overflow-y-auto">
								{presets.length > 0 ? (
									presets.map((preset, index) => (
										<div className="flex items-center justify-between w-full h-10 gap-2">
											<Input
												className="w-25 text-ellipsis h-10 p-0 overflow-hidden break-words border-0"
												style={{ backgroundColor: "#0000" }}
												onFocus={(e) => {
													e.currentTarget.blur();
												}}
												value={preset.name}></Input>
											<Input
												defaultValue={preset.hotkey.replaceAll("+", "xx+xx").replaceAll("comma", ",").replaceAll("space", "Space").replaceAll("plus", "+").replaceAll("minus", "-").replaceAll("multiply", "*").replaceAll("divide", "/").replaceAll("decimal", ".").replaceAll("enter", "↵").replaceAll("backquote", "`").replaceAll("backslash", "\\").replaceAll("bracketleft", "[").replaceAll("bracketright", "]").replaceAll("semicolon", ";").replaceAll("quote", "'").replaceAll("period", ".").replaceAll("slash", "/").replaceAll("equal", "=").replaceAll("xx+xx", " ﹢ ")}
												autoFocus={false}
												contentEditable={false}
												onKeyDownCapture={(e) => {
													e.preventDefault();
													// console.log(e);
													if (e.code == "Backspace") {
														e.currentTarget.value = "";
														saveConfig();
													}
													if (e.code == "Escape") {
														e.currentTarget.value = preset.hotkey.replaceAll("+", "xx+xx").replaceAll("comma", ",").replaceAll("space", "Space").replaceAll("plus", "+").replaceAll("minus", "-").replaceAll("multiply", "*").replaceAll("divide", "/").replaceAll("decimal", ".").replaceAll("enter", "↵").replaceAll("backquote", "`").replaceAll("backslash", "\\").replaceAll("bracketleft", "[").replaceAll("bracketright", "]").replaceAll("semicolon", ";").replaceAll("quote", "'").replaceAll("period", ".").replaceAll("slash", "/").replaceAll("equal", "=").replaceAll("xx+xx", " ﹢ ");
														keysdown = [];
														keys = [];
													} else {
														let next: any = [];
														let key = e.code
															.toLowerCase()
															// Remove prefixes
															.replaceAll("key", "")
															.replaceAll("digit", "")
															.replaceAll("numpad", "")
															// Handle special numpad keys
															.replaceAll("plus", "+")
															.replaceAll("minus", "-")
															.replaceAll("multiply", "*")
															.replaceAll("divide", "/")
															.replaceAll("decimal", ".")
															.replaceAll("enter", "↵")
															// Handle modifier keys
															.replaceAll("altright", "Alt")
															.replaceAll("controlright", "Ctrl")
															.replaceAll("shiftright", "Shift")
															.replaceAll("altleft", "Alt")
															.replaceAll("controlleft", "Ctrl")
															.replaceAll("shiftleft", "Shift")
															// Handle arrow keys
															.replaceAll("arrow", "")
															// Handle special keys
															.replaceAll("backquote", "`")
															.replaceAll("backslash", "\\")
															.replaceAll("bracketleft", "[")
															.replaceAll("bracketright", "]")
															.replaceAll("semicolon", ";")
															.replaceAll("quote", "'")
															.replaceAll("comma", ",")
															.replaceAll("period", ".")
															.replaceAll("slash", "/")
															.replaceAll("equal", "=")
															.replaceAll("minus", "-")
															// Handle function keys (keep as is but uppercase)
															.replace(/^f(\d+)$/, "F$1")
															// Handle space
															.split("")
															.map((x, i) => (i == 0 ? x.toUpperCase() : x))
															.join("");
														if (keys.includes(key)) {
															next = keys;
														} else {
															if (!keysdown.includes(e.code)) {
																keysdown.push(e.code);
															}
															keys.push(key);
															next = keySort(keys);
														}

														e.currentTarget.value = next.join(" ﹢ ");
													}
												}}
												onKeyUpCapture={(e) => {
													let key = e.code;
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
													setPresets((prev) => {
														prev[index].hotkey = e.currentTarget.value.replaceAll(" ﹢ ", "xxplusxx").replaceAll(",", "comma").replaceAll("Space", "space").replaceAll("+", "plus").replaceAll("-", "minus").replaceAll("*", "multiply").replaceAll("/", "divide").replaceAll(".", "decimal").replaceAll("↵", "enter").replaceAll("`", "backquote").replaceAll("\\", "backslash").replaceAll("[", "bracketleft").replaceAll("]", "bracketright").replaceAll(";", "semicolon").replaceAll("'", "quote").replaceAll("=", "equal").replaceAll("xxplusxx", "+");
														return [...prev];
													});
													saveConfig();
												}}
												className=" caret-transparent w-full text-center select-none"
												type="text"
											/>
										</div>
									))
								) : (
									<div className="text-white/50 flex items-center justify-center w-full h-full">Create a preset to set hotkeys.</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default Settings;
