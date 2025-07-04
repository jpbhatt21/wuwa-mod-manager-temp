import { Loader, MessageSquare, Plus, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import Blur from "./Filter";
import { getTimeDifference, OnlineMod } from "@/utils/vars";
function CardOnline(data: OnlineMod & { now: number; onModClick: (data: OnlineMod) => void,selected?: boolean, position?: number , wwmm?:any}) {
	return (
		<div
			className={"w-56 h-72 overflow-hidden fade-in select-none cursor-pointer gap-0 bg-card rounded-lg border duration-200 scale-100 p-0 justify-end flex flex-col outline hover:outline-accent outline-offset-7 outline-accent/0 hover:scale-105 active:scale-95 " + (false && data.selected == data.position ? " activeCard" : " ")}
			key={data._sName}
			onMouseUp={(e) => {
				e.currentTarget.style.transform = "";
				if (e.target !== e.currentTarget) return;
				if (e.button == 0) {
					data.onModClick(data);
				}
			}}
			onContextMenu={(e) => {
				e.preventDefault();
			}}>
			<div className="flex flex-col items-center justify-center w-full h-full duration-200 bg-center bg-cover rounded-t-lg pointer-events-none" style={{ backgroundImage: `url(${data._aPreviewMedia && data._aPreviewMedia._aImages && data._aPreviewMedia._aImages[0] ? data._aPreviewMedia._aImages[0]._sBaseUrl + "/" + data._aPreviewMedia._aImages[0]._sFile : data.wwmm})` }}>
				<Blur blur={data._sInitialVisibility == "hide"} />
			</div>

			<div className=" w-fit bg-background/50 text-accent backdrop-blur -mt-72 flex flex-col items-center px-4 py-1 mb-48 rounded-br-lg pointer-events-none">{data._sModelName}</div>
			<div className="bg-background/50 backdrop-blur  flex flex-col items-center w-full px-4 py-1">
				<Input readOnly type="text" className="w-56 cursor-pointer select-none focus-within:select-auto overflow-hidden h-8 focus-visible:ring-[0px] border-0  text-ellipsis" style={{ backgroundColor: "#fff0" }} defaultValue={data._sName} />
				<div className="flex justify-between w-full h-6 text-xs">
					<label className="flex items-center justify-center">
						{" "}
						<Plus className="h-4" />
						{getTimeDifference(data.now, data._tsDateAdded||0)}
					</label>
					<label className="flex items-center justify-center">
						{" "}
						<Loader className="h-4" />
						{getTimeDifference(data.now, data._tsDateModified||0)}
					</label>
					<label className="flex items-center justify-center">
						{" "}
						<ThumbsUp className="h-4" />
						{data._nLikeCount || "0"}
					</label>
					<label className="flex items-center justify-center">
						{" "}
						<MessageSquare className="h-4" />
						{data._nPostCount || "0"}
					</label>
				</div>
			</div>
		</div>
	);
}

export default CardOnline;
