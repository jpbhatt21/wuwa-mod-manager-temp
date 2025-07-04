import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import LSCOnline from "@/App/LeftSideBar/LeftOnline";
import LSCLocal from "@/App/LeftSideBar/LeftLocal";
import Settings from "@/App/LeftSideBar/components/Settings";
import Restore from "@/App/LeftSideBar/components/Restore";

import { Globe, HardDriveDownload } from "lucide-react";
import { leftSidebarOpenAtom, onlineModeAtom } from "@/utils/vars";
import { useAtom, useAtomValue } from "jotai";
import logo from "@/logo.png";

function LeftSidebar() {
	const leftSidebarOpen = useAtomValue(leftSidebarOpenAtom);
	const [online, setOnline] = useAtom(onlineModeAtom);
	return (
		<Sidebar collapsible="icon">
			<SidebarContent className=" gap-0 overflow-hidden border border-r-0">
				<div className="min-h-16 min-w-16 flex items-center justify-center h-16 gap-5 p-0 border-b">
					<div
						className="aspect-square h-10"
						style={{
							background: "url(" + logo + ")",
							backgroundSize: "contain",
							backgroundRepeat: "no-repeat",
							backgroundPosition: "center",
						}}></div>
					<div
						className="flex flex-col w-24 text-center duration-200 ease-linear"
						style={{
							marginRight: leftSidebarOpen ? "" : "-7.125rem",
							opacity: leftSidebarOpen ? "" : "0",
						}}>
						<label className="text-2xl text-[#eaeaea] min-w-fit font-bold">WuWa</label>
						<label className="min-w-fit text-accent/75 text-sm">Mod Manager</label>
					</div>
				</div>
				<SidebarGroup
					className="duration-200 px-0  mt-2.5"
					style={{
						minHeight: leftSidebarOpen ? "4.5rem" : "5.5rem",
					}}>
					<SidebarGroupLabel>Mode</SidebarGroupLabel>
					<div
						className="min-h-fit flex flex-row items-center justify-between w-full gap-2 px-2 overflow-hidden"
						style={{
							flexDirection: leftSidebarOpen ? "row" : "column",
						}}>
						<Button
							onClick={() => {
								setOnline(false);
							}}
							className={"w-38.75 overflow-hidden text-ellipsis " + (!online && "hover:brightness-125 bg-accent text-background")}
							style={{ width: leftSidebarOpen ? "" : "2.5rem" }}>
							<HardDriveDownload className="w-6 h-6" />
							{leftSidebarOpen && "Installed"}
						</Button>
						<Button
							onClick={() => {
								setOnline(true);
							}}
							className={"w-38.75 overflow-hidden text-ellipsis " + (online && "hover:brightness-125 bg-accent text-background")}
							style={{ width: leftSidebarOpen ? "" : "2.5rem" }}>
							<Globe className="w-6 h-6" />
							{leftSidebarOpen && "Online"}
						</Button>
					</div>
				</SidebarGroup>
				<Separator
					className="w-full ease-linear duration-200 min-h-[1px] my-2.5 bg-border"
					style={{
						opacity: leftSidebarOpen ? "0" : "",
						height: leftSidebarOpen ? "0px" : "",
						marginBlock: leftSidebarOpen ? "4px" : "",
					}}
				/>
				<SidebarGroup className="flex flex-row w-full h-full p-0 overflow-hidden">
					<LSCLocal />
					<LSCOnline />
				</SidebarGroup>
				<Separator
					className="w-full ease-linear duration-200 min-h-[1px] mt-2.5 bg-border"
					style={{
						opacity: leftSidebarOpen ? "0" : "",
						height: leftSidebarOpen ? "0px" : "",
						marginTop: leftSidebarOpen ? "4px" : "",
					}}
				/>
				<SidebarFooter
					className="flex items-center justify-center w-full overflow-hidden duration-200"
					style={{
						flexDirection: leftSidebarOpen ? "row" : "column",
						minHeight: leftSidebarOpen ? "5rem" : "8.5rem",
					}}>
					<Restore />
					<Settings />
				</SidebarFooter>
			</SidebarContent>
		</Sidebar>
	);
}

export default LeftSidebar;
