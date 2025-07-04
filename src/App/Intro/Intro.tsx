import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDirResructurePlan } from "@/utils/fsutils";
import { selectRootDir } from "@/utils/fsutils";
import { modRootDirAtom, TimeoutOrNull, tutorialPageAtom } from "@/utils/vars";
import { motion } from "motion/react";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
let clicktimeout: TimeoutOrNull = null;
function Intro() {
	const [page, setPage] = useAtom(tutorialPageAtom);
	const [user, setUser] = useState("Rover");
	const dir = useAtomValue(modRootDirAtom);
	useEffect(() => {
		async function getUsername() {
			setUser(await invoke("get_username"));
		}
		getUsername();
		clicktimeout = setTimeout(() => {
			setPage(1);
			clicktimeout = null;
		}, 1500);
	}, []);
	return (
		<>
			<motion.div
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="text-accent bg-background/80 backdrop-blur-md fixed z-20 flex flex-col items-center justify-center w-full h-full"
				onClick={(e) => {
					if (e.target !== e.currentTarget) return;
					if (clicktimeout || page == 2) return;
					clicktimeout = setTimeout(() => {
						clicktimeout = null;
					}, 500);
					setPage((prev) => prev + 1);
				}}
				style={{
					opacity: page < 3 ? 1 : 0,
					pointerEvents: page < 3 ? "auto" : "none",
				}}>
				<div className="flex transform-[scale(0)] overflow-hidden h-0 flex-col items-center justify-center intro opacity-0">
					<div className="text-8xl flex">
						{"WuWa".split("").map((char, index) => (
							<span style={{ animation: "pre-intro " + (index * 0.1 + 0.2) + "s , wave-sine 1s  " + (index * 0.1 + 0.2) + "s cubic-bezier(.445, .05, .55, .95)" }} key={index}>
								{char}
							</span>
						))}
					</div>
					<div className=" flex text-4xl">
						{"Mod Manager".split("").map((char, index) => (
							<span className="min-w-2" style={{ animation: "pre-intro " + (index * 0.05 + 0.5) + "s , wave-sine 0.5s  " + (index * 0.05 + 0.5) + "s cubic-bezier(.445, .05, .55, .95)" }} key={index}>
								{char}
							</span>
						))}
					</div>
				</div>
				<div className="flex flex-col items-center justify-center gap-4 mt-8 pointer-events-none">
					<div
						className="fixed z-20 flex flex-col items-center justify-center w-full h-full duration-200 opacity-0"
						style={{
							opacity: page == 1 ? 1 : 0,
							pointerEvents: page == 2 ? "auto" : "none",
						}}>
						<div className="text-accent text-5xl">
							Hello, <label id="user">{user}</label>
						</div>
						<div className="text-accent/75 my-2 text-2xl">Let's configure some basic settings</div>

						<div className=" mt-5 opacity-50">Click Anywhere To Continue</div>
					</div>
					<div
						className="fixed z-20 flex flex-col items-center justify-center w-full duration-200 opacity-0 pointer-events-auto"
						style={{
							opacity: page == 2 ? 1 : 0,
							pointerEvents: page == 2 ? "auto" : "none",
						}}>
						{dir == "" ? (
							<div className=" text-accent/75 flex flex-col items-center gap-5 my-2 text-2xl pointer-events-auto">
								We couldn't find your Mod Directory
								<Button
									className="w-1/2 mt-2"
									onClick={() => {
										selectRootDir();
									}}>
									Browse
								</Button>
							</div>
						) : (
							<div className="text-accent flex flex-col items-center gap-5 my-2 text-2xl">
								Confirm Your Mod Directory
								<Input type="text" className="w-80 border-border/0 bg-input/50 text-accent/75 text-ellipsis h-10 overflow-hidden text-center cursor-default" value={dir?.replace("/", "\\") ?? "-"} />
								<div className=" w-80 flex justify-between">
									<Button
										className="w-32 mt-2"
										onClick={() => {
											selectRootDir();
										}}>
										Browse
									</Button>
									<Button
										className={"w-32 mt-2"}
										onClick={() => {
											getDirResructurePlan();
										}}>
										Confirm
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</>
	);
}

export default Intro;
