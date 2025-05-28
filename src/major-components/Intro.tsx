import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitPlan } from "@/utils/config";
import { saveRootPath } from "@/utils/fs";
import { rootPathAtom, tutorialProgressAtom } from "@/variables";
import { motion } from "motion/react";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

let clicktimeout: any = null;
function Intro({ user }: any) {
	const [page, setPage] = useAtom(tutorialProgressAtom);
	const dir = useAtomValue(rootPathAtom);
	useEffect(() => {
		clicktimeout = setTimeout(() => {
			setPage(1);
			clicktimeout = null;
		}, 1500);
	}, []);
	return (
		<>
			<motion.div
             animate={{ opacity: 1}} exit={{ opacity: 0}}
				className="fixed flex  flex-col text-accent items-center justify-center w-full h-full z-20 bg-background/80 backdrop-blur-md"
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
				<div className=" flex  transform-[scale(0)] overflow-hidden h-0 flex-col items-center justify-center intro opacity-0">
					<div className="text-8xl flex  ">
						{"WuWa".split("").map((x, i) => (
							<span style={{ animation: "pre-intro " + (i * 0.1 + 0.2) + "s , wave-sine 1s  " + (i * 0.1 + 0.2) + "s cubic-bezier(.445, .05, .55, .95)" }} key={i}>
								{x}
							</span>
						))}
					</div>
					<div className="text-4xl flex ">
						{"Mod Manager".split("").map((x, i) => (
							<span className="min-w-2" style={{ animation: "pre-intro " + (i * 0.05 + 0.5) + "s , wave-sine 0.5s  " + (i * 0.05 + 0.5) + "s cubic-bezier(.445, .05, .55, .95)" }} key={i}>
								{x}
							</span>
						))}
					</div>
				</div>
				<div className="flex flex-col pointer-events-none items-center justify-center gap-4 mt-8">
					<div
						className="duration-200 flex flex-col items-center justify-center opacity-0 w-full h-full fixed z-20"
						style={{
							opacity: page == 1 ? 1 : 0,
						}}>
						<div className="text-5xl text-accent">
							Hello, <label id="user">{user}</label>
						</div>
						<div className="text-2xl my-2 text-accent/75">Let's configure some basic settings</div>

						<div className=" mt-5 opacity-50">Click Anywhere To Continue</div>
					</div>
					<div
						className="duration-200 flex flex-col items-center justify-center opacity-0 w-full pointer-events-auto fixed z-20"
						style={{
							opacity: page == 2 ? 1 : 0,
						}}>
						{dir == "" ? (
							<div className=" pointer-events-auto flex gap-5 flex-col text-2xl items-center my-2 text-accent/75">
								We couldn't find your Mod Directory
								<Button
									className="w-1/2 mt-2"
									onClick={() => {
										saveRootPath();
									}}>
									Browse
								</Button>
							</div>
						) : (
							<div className="text-2xl flex flex-col items-center gap-5 my-2 text-accent">
								Confirm Your Mod Directory
								<Input type="text" className="w-80 text-center overflow-hidden border-border/0 bg-input/50 text-accent/75 cursor-default text-ellipsis h-10" value={dir?.replace("/", "\\") ?? "-"} />
								<div className=" flex justify-between w-80">
									<Button
										className="w-32 mt-2"
										onClick={() => {
											saveRootPath();
										}}>
										Browse
									</Button>
									<Button
										className="w-32 mt-2"
										onClick={() => {
											getInitPlan(dir)
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
