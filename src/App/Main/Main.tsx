import { useAtomValue, useSetAtom } from "jotai";
import Catbar from "./components/Catbar";
import Navbar from "./components/Navbar";
import { localModListAtom, localCategoryNameAtom, localFilterNameAtom, localFilteredModListAtom, onlinePathAtom, apiRoutes, onlineDataAtom, genericCategories, LocalMod } from "@/utils/vars";
import { MouseEvent, UIEvent, useEffect } from "react";
import MainOffline from "./MainLocal";
import MainOnline from "./MainOnline";
let pathPageCount = { home: 1 } as { [category: string]: number };
let loading = false;
let max = 0;
function Main({ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen, online }: { leftSidebarOpen: boolean; setLeftSidebarOpen: (open: boolean) => void; rightSidebarOpen: boolean; setRightSidebarOpen: (open: boolean) => void; online: boolean }) {
	const localItems = useAtomValue(localModListAtom);
	const localFilter = useAtomValue(localFilterNameAtom);
	const localSelectedCategory = useAtomValue(localCategoryNameAtom);
	const onlinePath = useAtomValue(onlinePathAtom);
	const setOnlineData = useSetAtom(onlineDataAtom);
	const setLocalFilteredItems = useSetAtom(localFilteredModListAtom);
	function loadMore(e:  MouseEvent<HTMLDivElement, MouseEvent> | UIEvent<HTMLDivElement>) {
		let lastChild = e.currentTarget.lastElementChild;
		let self = e.currentTarget;
		if (lastChild && !loading && online) {
			let selfRect = self.getBoundingClientRect();
			let lastChildRect = lastChild.getBoundingClientRect();
			if (lastChildRect.top < selfRect.bottom) {
				loading = true;
				pathPageCount[onlinePath]++;
				try {
					if (onlinePath == "home")
						fetch(apiRoutes.home("default", pathPageCount[onlinePath]))
							.then((res) => res.json())
							.then((data) => {
								setOnlineData((prev) => {
									return {
										...prev,
										home: [...prev.home, ...data._aRecords],
									};
								});
								loading = false;
							});
					else if (onlinePath.startsWith("Skins") || onlinePath.startsWith("Other") || onlinePath.startsWith("UI"))
						fetch(apiRoutes.category(onlinePath, "", pathPageCount[onlinePath]))
							.then((res) => res.json())
							.then((data) => {
								setOnlineData((prev) => {
									prev[onlinePath] = [...prev[onlinePath], ...data._aRecords];
									return {
										...prev,
									};
								});
								loading = false;
							});
				} catch (e) {
					loading = false;
				}
			}
		}
	}
	useEffect(() => {
		setLocalFilteredItems(localItems.filter((item) => (localSelectedCategory == "All" ? true : item.path.startsWith("\\" + localSelectedCategory)) && (localFilter == "All" || (localFilter == "Enabled" && item.enabled) || (localFilter == "Disabled" && !item.enabled))));
	}, [localFilter, localSelectedCategory, localItems]);
	useEffect(() => {
		if (online) {
			if (onlinePath == "home" && pathPageCount[onlinePath] == 1) {
				loading = true;
				fetch(apiRoutes.banner())
					.then((res) => res.json())
					.then((data) => {
						console.log("banner", data);
						setOnlineData((prev) => {
							return {
								...prev,
								banner: data,
							};
						});
					});
				fetch(apiRoutes.home())
					.then((res) => res.json())
					.then((data) => {
						console.log("home", data);
						max = data._aMetadata._nRecordCount / 15;
						setOnlineData((prev) => {
							return {
								...prev,
								home: data._aRecords,
							};
						});
						loading = false;
					});
			} else if (onlinePath.startsWith("Skins") || onlinePath.startsWith("Other") || onlinePath.startsWith("UI")) {
				pathPageCount[onlinePath] = 1;
				loading = true;
				fetch(apiRoutes.category(onlinePath))
					.then((res) => res.json())
					.then((data) => {
						max = data._aMetadata._nRecordCount / 15;
						setOnlineData((prev) => {
							prev[onlinePath] = data._aRecords;
							return {
								...prev,
							};
						});
						loading = false;
					});
			}
		}
	}, [online, onlinePath]);
	return (
		<div className="border-border  flex flex-col w-full h-full overflow-hidden duration-200 border">
			<Navbar {...{ leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen }} />

			<div className="flex w-full h-full px-2 overflow-hidden">
				<MainOffline {...{ online, localFilter, localSelectedCategory }} />
				<MainOnline {...{ max, count: pathPageCount[onlinePath], online, loadMore }} />
			</div>
			<Catbar {...{ online, items: localItems }} />
		</div>
	);
}

export default Main;
