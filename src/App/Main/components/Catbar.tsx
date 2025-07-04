import { Button } from "@/components/ui/button";
import { onlinePathAtom, localCategoryNameAtom, categoryListAtom, onlineDataAtom, LocalMod, Category } from "@/utils/vars";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FileQuestion, Group } from "lucide-react";

function Catbar({ online, items }: {
	online: boolean;
	items: LocalMod[]
}) {
	const [selectedCategory, setSelectedCategory] = useAtom(localCategoryNameAtom);
	const [onlinePath, setOnlinePath] = useAtom(onlinePathAtom);
	const categories = useAtomValue(categoryListAtom);
	let localCat = categories.filter((category) => items.filter((item) => item.parent == "\\" + category._sName).length > 0);

	return (
		<>
			<div className="w-full h-20 min-h-20  flex items-center justify-center p-2">
				<div className="w-full h-full bg-sidebar flex gap-1 text-accent items-center justify-center border rounded-lg p-2">
					<label className="w-20">Category</label>
					<div
						onWheel={(e) => {
							if (e.deltaX != 0) return;
							let target = e.currentTarget as HTMLDivElement;
							target.scrollTo({
								left: target.scrollLeft + e.deltaY,
								behavior: "smooth",
							});
						}}
						className=" p-2 mr-1 my-1 flex overflow-x-auto h-15 overflow-y-hidden gap-2 items-top justify-start w-full thin text-white ">
						<Button
							onClick={() => {
								setSelectedCategory("All");
							}}
							className={"w-24 " + ("All" == selectedCategory && " bg-accent text-background")}
							style={{ scale: online ? "0" : "1", marginRight: online ? "-6.5rem" : "0rem", padding: online ? "0rem" : "" }}>
							<Group className="h-full pointer-events-none aspect-square" />
							All
						</Button>
						<Button
							onClick={() => {
								setSelectedCategory("Uncategorized");
							}}
							className={"min-w-34 " + ("Uncategorized" == selectedCategory && " bg-accent text-background")}
							style={{ scale: online ? "0" : "1", marginRight: online ? "-9.5rem" : "0rem", padding: online ? "0rem" : "" }}>
							<FileQuestion className="h-full pointer-events-none aspect-square" />
							Uncategorized
						</Button>
						{(online ? categories : localCat).map((category) => (
							<Button
								onClick={() => {
									if (online) {
										if (category._special) {
											return;
										}
										if (onlinePath == "Skins/" + category._sName) {
											setOnlinePath("home");
											return;
										}
										setOnlinePath("Skins/" + category._sName);
										
									} else {
										setSelectedCategory(category._sName);
									}
								}}
								style={{ scale: online&&category._special ? "0" : "1", marginRight: online&&category._special ? "-9.5rem" : "0rem", padding: online&&category._special ? "0rem" : "" }}
								className={(online ? onlinePath : selectedCategory) == (online ? "Skins/" : "") + category._sName ? " bg-accent text-background" : ""}>
								<img className="h-full rounded-full aspect-square pointer-events-none" src={category._sIconUrl} />
								{category._sName}
							</Button>
						))}
					</div>
				</div>
			</div>
		</>
	);
}

export default Catbar;
