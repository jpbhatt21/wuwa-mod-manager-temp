import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import RSCOnline from "@/App/RightSideBar/RSCOnline";
import RSCLocal from "@/App/RightSideBar/RightLocal";

function RightSidebar() {
	return (
		<Sidebar side="right">
			<SidebarContent className="w-full h-full flex flex-row overflow-hidden p-0 gap-0 border border-l-0">
				<RSCLocal />
				<RSCOnline />
			</SidebarContent>
		</Sidebar>
	);
}

export default RightSidebar;
