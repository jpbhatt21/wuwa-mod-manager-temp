import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { onlineModeAtom } from "@/variables";
import logo from "@/logo.png";
import { useAtom } from "jotai";
import { Globe, HardDriveDownload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Restore from "@/minor-components/Restore";
import Settings from "@/minor-components/Settings";
import LSCLocal from "@/minor-components/LSCLocal";
import LSCOnline from "@/minor-components/LSCOnline";

function LeftSidebar({ open,firstRender }: { open: boolean, firstRender: boolean }) {
	const [online, setOnline] = useAtom(onlineModeAtom);
	return (
		<Sidebar collapsible="icon">
			<SidebarContent className=" overflow-hidden gap-0 border border-r-0">
				<div className="flex items-center p-0 justify-center gap-5 h-16 min-h-16 min-w-16 border-b">
					<div
						className="h-10 aspect-square"
						style={{
							background: "url(" + logo + ")",
							backgroundSize: "contain",
							backgroundRepeat: "no-repeat",
							backgroundPosition: "center",
						}}></div>
					<div
						className="text-center w-24 ease-linear duration-200 flex flex-col"
						style={{
							marginRight: open ? "" : "-7.125rem",
							opacity: open ? "" : "0",
						}}>
						<label className="text-2xl text-[#eaeaea] min-w-fit font-bold">WuWa</label>
						<label className="text-sm min-w-fit text-accent/75">Mod Manager</label>
					</div>
				</div>
				<SidebarGroup
					className="duration-200 px-0  mt-2.5"
					style={{
						minHeight: open ? "4.5rem" : "5.5rem",
					}}>
					<SidebarGroupLabel>Mode</SidebarGroupLabel>
					<div
						className="w-full flex flex-row gap-2 overflow-hidden px-2 items-center justify-between min-h-fit"
						style={{
							flexDirection: open ? "row" : "column",
						}}>
						<Button
							onClick={() => {
								setOnline(false);
							}}
							className={"w-38.75 overflow-hidden text-ellipsis " + (!online && "hover:brightness-125 bg-accent text-background")}
							style={{ width: open ? "" : "2.5rem" }}>
							<HardDriveDownload className="h-6 w-6" />
							{open && "Installed"}
						</Button>
						<Button
							onClick={() => {
								setOnline(true);
							}}
							className={"w-38.75 overflow-hidden text-ellipsis " + (online && "hover:brightness-125 bg-accent text-background")}
							style={{ width: open ? "" : "2.5rem" }}>
							<Globe className="h-6 w-6" />
							{open && "Online"}
						</Button>
					</div>
				</SidebarGroup>
				<Separator
					className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
					style={{
						opacity: open ? "0" : "",
						height: open ? "0px" : "",
						marginBlock: open ? "4px" : "",
					}}
				/>
				<SidebarGroup className="w-full h-full flex flex-row overflow-hidden p-0">
					<LSCLocal {...{ open, online,firstRender }} />
					<LSCOnline {...{ open, online }} />
				</SidebarGroup>
				<Separator
					className="w-full ease-linear duration-200 min-h-[1px] mt-2.5 bg-border"
					style={{
						opacity: open ? "0" : "",
						height: open ? "0px" : "",
						marginTop: open ? "4px" : "",
					}}
				/>
				<SidebarFooter
					className="flex overflow-hidden items-center duration-200 justify-center w-full"
					style={{
						flexDirection: open ? "row" : "column",
						minHeight: open ? "5rem" : "8.5rem",
					}}>
					<Restore {...{ open }} />

					<Settings {...{ open }} />
				</SidebarFooter>
			</SidebarContent>
		</Sidebar>
	);
}

export default LeftSidebar;
