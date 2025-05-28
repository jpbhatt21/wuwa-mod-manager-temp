import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

function Navbar({ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen }:any) {
    
    return ( 
		<div className="w-full text-accent  h-16 min-h-16 flex items-center justify-center gap-2 p-2">
            <div
				onClick={(e) => {
					e.stopPropagation();
					setLeftSidebarOpen((prev: any) => !prev);
				}}
				className="h-10 w-10 rounded-lg p-2 bg-background border-background border hover:border-border hover:bg-sidebar duration-200 text-accent flex items-center justify-center">
				<PanelLeftClose
					className=" h-full w-6 duration-200 stroke-1"
					style={{
						width: leftSidebarOpen ? "1.5rem" : "0rem",
					}}
				/>
				<PanelLeftOpen
					className=" h-full w-6 duration-200 stroke-1"
					style={{
						width: leftSidebarOpen ? "0rem" : "1.5rem",
					}}
				/>
			</div>
            <div className="flex items-center px-1 py-1 justify-between overflow-hidden w-full h-full bg-sidebar border rounded-lg"></div>
            <div className="h-full w-32 bg-sidebar border rounded-lg"></div>
			<div
				onClick={(e) => {
					e.stopPropagation();
					setRightSidebarOpen((prev: any) => !prev);
				}}
				className="h-10 w-10 rounded-lg p-2 bg-background border-background border hover:border-border hover:bg-sidebar duration-200 text-accent flex items-center justify-center">
				<PanelRightOpen
					className=" h-full w-6 duration-200 stroke-1"
					style={{
						width: rightSidebarOpen ? "0rem" : "1.5rem",
					}}
				/>
				<PanelRightClose
					className=" h-full w-6 duration-200 stroke-1"
					style={{
						width: rightSidebarOpen ? "1.5rem" : "0rem",
					}}
				/>
			</div>
        </div>

     );
}

export default Navbar;