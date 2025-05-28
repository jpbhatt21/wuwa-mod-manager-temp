import { useEffect, useState } from "react";
import "./App.css";
import { SidebarProvider } from "./components/ui/sidebar";
import LeftSidebar from "./major-components/sidebar/Left";
import RightSidebar from "./major-components/sidebar/Right";
import Main from "./major-components/Main";
import { useAtom, useAtomValue } from "jotai";
import { plannedChangesAtom, firstLoadAtom, onlineModeAtom, tutorialAtom } from "./variables";
import { main } from "./init";
import { AnimatePresence, motion } from "motion/react";
import Intro from "./major-components/Intro";
import Consent from "./major-components/Consent";
main();
function App() {
	const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
	const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
	const online = useAtomValue(onlineModeAtom);
	const [firstRender, setFirstRender] = useState(true);
	const firstLoad = useAtomValue(firstLoadAtom);
	const [tutorial, setTutorial] = useAtom(tutorialAtom);
	const plannedChanges = useAtomValue(plannedChangesAtom);
	useEffect(() => {
		if (firstRender) {
			setFirstRender(false);
		}
	}, [firstRender]);
	useEffect(() => {
		if (firstLoad) setTutorial(true);
	}, [firstLoad]);
	return (
		<div id="background" className="flex flex-row fixed justify-start items-start w-full h-full wuwa-ft">
			<SidebarProvider open={leftSidebarOpen}>
				<LeftSidebar open={leftSidebarOpen} firstRender={firstRender} />
			</SidebarProvider>
			<SidebarProvider open={rightSidebarOpen}>
				<RightSidebar firstRender={firstRender} />
			</SidebarProvider>

			<div className="w-full h-full fixed flex flex-row">
				<div
					className="h-full duration-200 ease-linear"
					style={{
						minWidth: leftSidebarOpen ? "20.95rem" : "3.95rem",
					}}
				/>
				<Main {...{ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen, online, firstRender }} />
				<div
					className="h-full duration-200 ease-linear"
					style={{
						minWidth: rightSidebarOpen ? "20.95rem" : "0rem",
					}}
				/>
			</div>
			<AnimatePresence>{tutorial && <Intro />}</AnimatePresence>
			<AnimatePresence>
				{
					plannedChanges.to.length>0 && plannedChanges.from.length>0 && (
						<Consent/>
					)
				}
			</AnimatePresence>
		</div>
	);
}

export default App;
