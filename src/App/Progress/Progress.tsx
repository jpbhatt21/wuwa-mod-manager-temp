import { Button } from "@/components/ui/button";
import { cancelRestore, getDirResructurePlan } from "@/utils/fsutils";
import { consentOverlayDataAtom, progressOverlayDataAtom } from "@/utils/vars";
import { useAtom, useSetAtom } from "jotai";
import { motion } from "motion/react";
import { useEffect } from "react";

function Progress() {
	const [restoreInfo, setRestoreInfo] = useAtom(progressOverlayDataAtom);
	const setPlannedChanges = useSetAtom(consentOverlayDataAtom);
	useEffect(() => {
		if (restoreInfo.open && restoreInfo.finished && restoreInfo.title == "Restore Point Created") {
			setPlannedChanges({ title: "test", from: [], to: [],next:true });
			
		}
	}, [restoreInfo]);
	return (
		<motion.div
			initial={{ opacity: 0, filter: "blur(6px)" }}
			animate={{ opacity: 1, filter: "blur(0px)" }}
			exit={{ opacity: 0, filter: "blur(6px)" }}
			className="fixed z-50 w-full  duration-200 h-full flex flex-col text-accent items-center pointer-eve nts-none justify-center bg-background/50"
			style={{
				backdropFilter: "blur(5px)",
			}}>
			<div className="text-3xl my-6 min-h-fit text-accent">{restoreInfo.title}</div>
			<div className="w-120 h-8 bg-background/50 overflow-hidden rounded-lg border ">
				<div id="restore-progress" className="h-8 bg-muted rounded-lg w-0 duration-100" />
			</div>
			<div className="w-120 flex items-center justify-between text-sm gap-2 text-accent/75 mt-2">
				<label className="w-full whitespace-nowrap overflow-hidden text-ellipsis">
					<span id="restore-progress-message"></span>
				</label>
				<label id="restore-progress-percentage">0%</label>
			</div>

			<Button
				className={"w-32 my-6 " + (!restoreInfo.finished && "hover:bg-[#cf7171] hover:text-background text-[#cf7171]")}
				onClick={async () => {
					setRestoreInfo((prev) => ({ ...prev, finished: true }));
					if (!restoreInfo.finished) {
						// Cancel the restore point creation process
						cancelRestore();
					} else {
						// Close the progress dialog
						if (restoreInfo.title == "Restoration Completed") getDirResructurePlan();

						setRestoreInfo((prev) => ({ ...prev, open: false }));
					}
				}}>
				{restoreInfo.finished ? "Close" : "Cancel"}
			</Button>
		</motion.div>
	);
}

export default Progress;
