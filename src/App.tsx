import { useEffect, useState } from "react";
import "./App.css";
import { SidebarProvider } from "./components/ui/sidebar";
import LeftSidebar from "./App/LeftSideBar/Left";
import RightSidebar from "./App/RightSideBar/Right";
import Main from "./App/Main/Main";
import { useAtom, useAtomValue } from "jotai";
import { consentOverlayDataAtom, firstLoadAtom, onlineModeAtom, tutorialOpenAtom, progressOverlayDataAtom, leftSidebarOpenAtom, rightSidebarOpenAtom } from "./utils/vars";
import { main } from "./utils/init";
import { AnimatePresence } from "motion/react";
import Intro from "./App/Intro/Intro";
import Consent from "./App/Consent/Consent";
import Progress from "./App/Progress/Progress";
main();
function App() {
	const online = useAtomValue(onlineModeAtom);
	const firstLoad = useAtomValue(firstLoadAtom);
	const restoreInfo = useAtomValue(progressOverlayDataAtom);
	const plannedChanges = useAtomValue(consentOverlayDataAtom);
	const [tutorial, setTutorial] = useAtom(tutorialOpenAtom);
	const [leftSidebarOpen, setLeftSidebarOpen] = useAtom(leftSidebarOpenAtom)
	const [rightSidebarOpen, setRightSidebarOpen] = useAtom(rightSidebarOpenAtom)
	useEffect(() => {
		if (firstLoad) setTutorial(true);
	}, [firstLoad]);
	return (
		<div id="background" className="flex flex-row fixed justify-start items-start w-full h-full wuwa-ft">
			<SidebarProvider open={leftSidebarOpen}>
				<LeftSidebar />
			</SidebarProvider>
			<SidebarProvider open={rightSidebarOpen}>
				<RightSidebar  />
			</SidebarProvider>
			<div className="w-full h-full fixed flex flex-row">
				<div
					className="h-full duration-200 ease-linear"
					style={{
						minWidth: leftSidebarOpen ? "20.95rem" : "3.95rem",
					}}
				/>
				<Main {...{ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen, online }} />
				<div
					className="h-full duration-200 ease-linear"
					style={{
						minWidth: rightSidebarOpen ? "20.95rem" : "0rem",
					}}
				/>
			</div>
			<AnimatePresence>{tutorial && <Intro />}</AnimatePresence>
			<AnimatePresence>{plannedChanges.title && <Consent />}</AnimatePresence>
			<AnimatePresence>{restoreInfo.open && <Progress />}</AnimatePresence>
		</div>
	);
}

export default App;
