import { Input } from "@/components/ui/input";
import { renameItem } from "@/utils/fs";
import { previewUri } from "@/variables";
import { File, Folder } from "lucide-react";
import { motion } from "motion/react";
function CardLocal({ root, item, wwmm, selectedItem, setSelectedItem, index, lastUpdated, settings }: any) {
	return (
		<>
			<motion.div
				className={"w-56 h-72 select-none bg-card rounded-lg border duration-200 outline overflow-hidden " + (selectedItem == index && "selectedCard")}
				style={{
					borderColor: item.enabled ? "var(--accent)" : "",
					filter: item.enabled ? "brightness(1)" : "brightness(0.5) saturate(0.5)",
				}}
				whileHover={{
					scale: 1.05,
				}}
				whileTap={{
					scale: 0.95,
				}}
				onContextMenu={(e:any)=>{
					e.preventDefault();
				}}
				onMouseUp={(e:any)=>{
					if (e.button == settings.toggle) {
						renameItem(root,item.path,item.enabled ? "DISABLED_" + item.name:item.name.replaceAll("DISABLED_", "") )
						e.preventDefault();
					} else {
						setSelectedItem(index);
					}
				}}
				>
				<img
					className="w-full h-full  pointer-events-none object-cover"
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
				<div className="w-full bg-background/50 backdrop-blur flex items-center px-4 py-1 ">
					{item.isDir  ? <Folder /> : <File />}
					<Input readOnly type="text" className="w-56 cursor-pointer select-none focus-within:select-auto overflow-hidden h-12 focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={item.name.replaceAll("DISABLED_", "")} />
				</div>
			</motion.div>
		</>
	);
}

export default CardLocal;
