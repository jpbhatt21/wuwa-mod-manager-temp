import { onlineDataAtom, OnlineMod, onlinePathAtom, onlineSelectedItemAtom } from "@/utils/vars";
import CardOnline from "@/App/Main/components/CardOnline";
import { AnimatePresence, motion } from "motion/react";
import { useAtomValue, useSetAtom } from "jotai";
import Carousel from "./components/Carousel";
import { MouseEvent, UIEvent } from "react";
import { Loader } from "lucide-react";
import wwmm from "@/wwmm.png";

function MainOnline({ max, count, online, loadMore }: { max: number; count: number; online: boolean; loadMore: (e: MouseEvent<HTMLDivElement, MouseEvent> | UIEvent<HTMLDivElement>) => void }) {
	const setOnlineSelectedItem = useSetAtom(onlineSelectedItemAtom);

	const onlinePath = useAtomValue(onlinePathAtom);
	const onlineData = useAtomValue(onlineDataAtom);

	let now = Math.round(Date.now() / 1000);

	function onModClick(data: OnlineMod) {
		setOnlineSelectedItem(data._sModelName + "/" + data._idRow);
	}

	return (
		<>
			<div
				className="flex flex-col items-center h-full min-w-full overflow-y-auto duration-300"
				style={{
					opacity: online ? 1 : 0,
					transitionDelay: online ? "0.3s" : "0s",
					pointerEvents: online ? "auto" : "none",
					marginLeft: "-100%",
				}}
				onMouseMove={loadMore}
				onScroll={loadMore}>
				<div className="h-fit w-full max-w-3xl">
					<div
						className="aspect-video w-full max-w-3xl duration-500"
						style={{
							opacity: onlinePath == "home" && onlineData.banner.length > 0 ? 1 : 0,
							marginBottom: onlinePath == "home" && onlineData.banner.length > 0 ? "1rem" : "-100%",
						}}>
						<Carousel data={onlineData.banner} onModClick={onModClick} />
					</div>
				</div>
				<AnimatePresence>
					{online && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							id="online-items"
							transition={{ duration: 0.3 }}
							className="min-h-fit grid justify-center w-full py-4"
							style={{
								gridTemplateColumns: "repeat(auto-fill, minmax(256px, 256px))",
								gridAutoRows: "288px",
								columnGap: "0px",
								rowGap: "32px",
								justifyItems: "center",
							}}>
							{onlineData[onlinePath] && onlineData[onlinePath].map((item, index) => <CardOnline {...{ index, wwmm, now, onModClick, ...item }} />)}
						</motion.div>
					)}
				</AnimatePresence>
				{count < max && <Loader className="min-w-8 min-h-8 animate-spin text-accent" />}
			</div>
		</>
	);
}

export default MainOnline;
