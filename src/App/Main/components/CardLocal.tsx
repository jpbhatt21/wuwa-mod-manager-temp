import { Input } from "@/components/ui/input";
import { renameMod } from "@/utils/fsutils";
import { previewUri } from "@/utils/vars";
import { File, Folder } from "lucide-react";
function CardLocal({ root, item, wwmm, selectedItem, setSelectedItem, index, lastUpdated, settings }: any) {
	return (
		<>
			<div
				className={"w-56 h-72 hover:outline-accent outline-offset-7 outline-accent/0 hover:scale-105 active:scale-95 select-none bg-card rounded-lg border duration-200 outline overflow-hidden " + (selectedItem == index && "selectedCard")}
				style={{
					borderColor: item.enabled ? "var(--accent)" : "",
					filter: item.enabled ? "brightness(1)" : "brightness(0.5) saturate(0.5)",
				}}
				onContextMenu={(e) => {
					e.preventDefault();
				}}
				onMouseUp={(e) => {
					if (e.button == settings.toggle) {
						renameMod(item.path, item.enabled ? "DISABLED_" + item.name : item.name.replaceAll("DISABLED_", ""));
						e.preventDefault();
					} else {
						setSelectedItem(index);
					}
				}}>
				<img
					className="object-cover w-full h-full pointer-events-none"
					src={previewUri + root + item.path + "?" + lastUpdated}
					onError={(e) => {
						e.currentTarget.style.opacity = "0";
						e.currentTarget.src = wwmm;
					}}></img>
				<img
					className="w-full h-[calc(100%-3.5rem)] -mt-71 duration-200  rounded-t-lg  pointer-events-none object-cover"
					src={previewUri + root + item.path + "?" + lastUpdated}
					onError={(e) => {
						e.currentTarget.src = wwmm;
					}}></img>
				<div className="bg-background/50 backdrop-blur  flex items-center w-full px-4 py-1">
					{item.isDir ? <Folder /> : <File />}
					<Input readOnly type="text" className="w-56 cursor-pointer select-none focus-within:select-auto overflow-hidden h-12 focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={item.name.replaceAll("DISABLED_", "")} />
				</div>
			</div>
		</>
	);
}

export default CardLocal;
