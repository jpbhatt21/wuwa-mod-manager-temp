import { MessageSquare, ThumbsUp } from "lucide-react";
import { Carousel as CarouselCN, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Blur from "@/App/Main/components/Filter";
import { Input } from "@/components/ui/input";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { OnlineMod } from "@/utils/vars";
let dict = {
	today: "the Day",
	yesterday: "Yesterday",
	week: "the Week",
	month: "the Month",
	"3month": "the Quarter",
	"6month": "the Year",
	year: "the Year",
	alltime: "All Time",
};
function Carousel({ data, onModClick }: { data?: OnlineMod[]; buttons?: boolean; onModClick?: (data: OnlineMod) => void }) {
	const [current, setCurrent] = useState(0);
	const [api, setApi] = useState(null as any);
	useEffect(() => {
		if (!api) return;
		const onSelect = () => {
			setCurrent(api.selectedScrollSnap());
		};
		api.on("select", onSelect);
		return () => api.off("select", onSelect);
	}, [api]);
	return (
		<>
			<CarouselCN setApi={setApi} opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]} className="max-w-3xl aspect-video ">
				<CarouselContent>
					{data?.map((item, index) => (
						<CarouselItem key={index}>
							<div
								onClick={(e) => {
									if (e.target != e.currentTarget) return;
									if (onModClick) {
										onModClick(item);
									} else {
										
									}
								}}
								className=" aspect-video flex flex-col items-center justify-between overflow-hidden rounded-lg"
								style={{
									backgroundImage: `url(${item._sImageUrl})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}>
								<div className="text-accent w-full -mb-18 z-10  h-16 pointer-events-none flex justify-between">
									<label className="text-lg bg-background/50 py-2 px-4 rounded-br-lg backdrop-blur-md h-fit brightness-100 font-bold">Best of {dict[item._sPeriod||"alltime"]} </label>
									<label className="bg-background/50 py-2.5 px-4 rounded-bl-lg backdrop-blur-md h-fit brightness-100 ">by {item._aSubmitter._sName}</label>
								</div>
								<Blur blur={item._sInitialVisibility == "hide"} />
								<div className="w-full h-14 bg-background/50 backdrop-blur-md -mt-14 pointer-events-none flex items-center px-2 justify-between">
									<Input className="w-full text-accent  border-0 rounded-none select-none focus-within:select-auto overflow-hidden max-h-14 focus-visible:ring-[0px] focus-within:border-0   text-ellipsis" value={item._sName} style={{ backgroundColor: "#fff0", fontSize: "1.5rem" }} />

									<div className="w-32 h-10 flex text-accent items-center justify-between">
										<div className="w-1/2 h-10 text-sm flex gap-1 items-center justify-center">
											<ThumbsUp />
											{item._nLikeCount}
										</div>
										<div className="w-1/2 h-10 text-sm flex gap-1 items-center justify-center">
											<MessageSquare />
											{item._nPostCount}
										</div>
									</div>
								</div>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
				<div className="w-full h-8 items-center justify-center gap-1  rounded-lg flex">
					{data?.map((_, index) => (
						<div
							className={"h-1/3 aspect-square rounded-full border duration-200 " + (index == current ? "bg-accent border-accent" : " hover:bg-border")}
							onClick={() => {
								if (api) {
									api.scrollTo(index);
								}
							}}></div>
					))}
				</div>
			</CarouselCN>
		</>
	);
}

export default Carousel;
