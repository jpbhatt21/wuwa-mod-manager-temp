import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

function Navbar({ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen }:any) {
    
    return ( 
		<div className="text-accent min-h-16 flex items-center justify-center w-full h-16 gap-2 p-2">
            <div
				onClick={(e) => {
					e.stopPropagation();
					setLeftSidebarOpen((prev:boolean) => !prev);
				}}
				className="bg-background border-background hover:border-border hover:bg-sidebar text-accent flex items-center justify-center w-10 h-10 p-2 duration-200 border rounded-lg">
				<PanelLeftClose
					className=" w-6 h-full duration-200 stroke-1"
					style={{
						width: leftSidebarOpen ? "1.5rem" : "0rem",
					}}
				/>
				<PanelLeftOpen
					className=" w-6 h-full duration-200 stroke-1"
					style={{
						width: leftSidebarOpen ? "0rem" : "1.5rem",
					}}
				/>
			</div>
            <div className="bg-sidebar flex items-center justify-between w-full h-full px-1 py-1 overflow-hidden border rounded-lg"></div>
            <div className="bg-sidebar w-32 h-full border rounded-lg"></div>
			<div
				onClick={(e) => {
					e.stopPropagation();
					setRightSidebarOpen((prev: boolean) => !prev);
				}}
				className="bg-background border-background hover:border-border hover:bg-sidebar text-accent flex items-center justify-center w-10 h-10 p-2 duration-200 border rounded-lg">
				<PanelRightOpen
					className=" w-6 h-full duration-200 stroke-1"
					style={{
						width: rightSidebarOpen ? "0rem" : "1.5rem",
					}}
				/>
				<PanelRightClose
					className=" w-6 h-full duration-200 stroke-1"
					style={{
						width: rightSidebarOpen ? "1.5rem" : "0rem",
					}}
				/>
			</div>
        </div>

     );
}

export default Navbar;