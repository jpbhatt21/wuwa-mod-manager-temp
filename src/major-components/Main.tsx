import { useAtom, useAtomValue } from "jotai";
import Catbar from "./Catbar";
import Navbar from "./Navbar";
import { localItemsAtom, rootPathAtom, localSelectedCategoryAtom, localSelectedItemAtom, localFilterAtom, localFilteredItemsAtom, lastUpdatedAtom, settingsAtom } from "@/variables";
import CardLocal from "@/minor-components/CardLocal";
import wwmm from "@/wwmm.png";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
function Main({ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen, online, firstRender }: any) {
	const root = useAtomValue(rootPathAtom);
	const localItems = useAtomValue(localItemsAtom);
	const localFilter = useAtomValue(localFilterAtom);
	const localSelectedCategory = useAtomValue(localSelectedCategoryAtom);
	const [selectedItem, setSelectedItem] = useAtom(localSelectedItemAtom);
	const [localFilteredItems, setLocalFilteredItems] = useAtom(localFilteredItemsAtom);
	const lastUpdated = useAtomValue(lastUpdatedAtom);
	const settings = useAtomValue(settingsAtom);
	useEffect(() => {
		setLocalFilteredItems(localItems.filter((x: any) => (localSelectedCategory == "All" ? true : x.path.startsWith("\\" + localSelectedCategory)) && (localFilter == "All" || (localFilter == "Enabled" && x.enabled) || (localFilter == "Disabled" && !x.enabled))));
	}, [localFilter, localSelectedCategory, localItems]);
	console.log(localItems)
	return (
		<div className="flex flex-col duration-200 border w-full overflow-hidden h-full border-border ">
			<Navbar {...{ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen }} />
			
			<div className="flex w-full h-full overflow-hidden px-2">
				<AnimatePresence>
					{!online && (
						<motion.div
							initial={firstRender ? false : { opacity: 1, marginLeft: "-100%", filter: "blur(6px)" }}
							animate={{ opacity: 1, marginLeft: "0rem", filter: "blur(0px)" }}
							exit={{ opacity: 1, marginLeft: "-100%", filter: "blur(6px)" }}
							layout
							transition={{ duration: 0.3 }}
							className="min-w-full py-4 h-full grid justify-center"
							style={{
								gridTemplateColumns: "repeat(auto-fill, minmax(256px, 256px))",
								gridAutoRows: "288px",
								columnGap: "0px",
								rowGap: "32px",
								overflowY: "scroll",
								justifyItems: "center",
							}}>
							{localFilteredItems.map((item: any, index: number) => (
								<CardLocal key={index} {...{ item, root, wwmm, selectedItem, setSelectedItem, index, lastUpdated,settings }} />
							))}
						</motion.div>
					)}
				</AnimatePresence>
				<AnimatePresence>
					{online && (
						<motion.div
							initial={{ filter: "blur(6px)" }}
							animate={{ filter: "blur(0px)" }}
							exit={{ filter: "blur(6px)" }}
							layout
							transition={{ duration: 0.3 }}
							className="min-w-full h-full grid justify-center"
							style={{
								gridTemplateColumns: "repeat(auto-fill, minmax(256px, 1fr))",
								gridAutoRows: "1fr",
								gap: "32px",
								padding: "10px",
								overflowY: "auto",
								justifyItems: "center",
							}}>
							{localFilteredItems.map((item: any, index: number) => (
								<CardLocal key={index} {...{ item, root, wwmm, selectedItem, setSelectedItem, index, lastUpdated }} />
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			<Catbar {...{ online, items: localItems }} />
		</div>
	);
}

export default Main;
