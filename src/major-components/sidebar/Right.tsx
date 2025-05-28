import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import RSCLocal from "@/minor-components/RSCLocal";
import RSCOnline from "@/minor-components/RSCOnline";
import { saveConfig } from "@/utils/fs";
import { localDataAtom, onlineModeAtom } from "@/variables";
import { useAtom } from "jotai";
import { useEffect } from "react";

function RightSidebar({firstRender}: { firstRender: boolean }) {
	const [online, setOnline] = useAtom(onlineModeAtom);
	const [localData, setLocalData] = useAtom(localDataAtom);
	useEffect(()=>{
		if(Object.keys(localData).length>0){
			// saveConfig()
		}
	},[localData])
	return (
		<Sidebar side="right">
			<SidebarContent className="w-full h-full flex flex-row overflow-hidden p-0 gap-0 border border-l-0">
				<RSCLocal {...{online,firstRender,localData,setLocalData}}/>
				<RSCOnline {...{online}}/>
			</SidebarContent>
		</Sidebar>
	);
}

export default RightSidebar;
