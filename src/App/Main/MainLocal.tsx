import { modRootDirAtom, localSelectedModAtom, localFilteredModListAtom, refreshAppIdAtom, settingsDataAtom } from "@/utils/vars";
import CardLocal from "@/App/Main/components/CardLocal";
import { AnimatePresence, motion } from "motion/react";
import { useAtom, useAtomValue } from "jotai";
import wwmm from "@/wwmm.png";

function MainLocal({ online }: { online: boolean }) {
	const [selectedItem, setSelectedItem] = useAtom(localSelectedModAtom);

	const localFilteredItems = useAtomValue(localFilteredModListAtom);
	const lastUpdated = useAtomValue(refreshAppIdAtom);
	const settings = useAtomValue(settingsDataAtom);
	const root = useAtomValue(modRootDirAtom);
	return (
		<div
			className="flex flex-col items-center h-full min-w-full overflow-y-auto duration-300"
			style={{
				opacity: online || localFilteredItems.length == 0 ? 0 : 1,
				transitionDelay: online ? "0s" : "0.3s",
			}}>
			<AnimatePresence>
				{!online && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="grid justify-center w-full h-full py-4"
						style={{
							gridTemplateColumns: "repeat(auto-fill, minmax(256px, 256px))",
							gridAutoRows: "288px",
							columnGap: "0px",
							rowGap: "32px",
							justifyItems: "center",
						}}>
						{localFilteredItems.map((item, index) => (
							<CardLocal key={item.truePath} {...{ item, root, wwmm, selectedItem, setSelectedItem, index, lastUpdated, settings }} />
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default MainLocal;
