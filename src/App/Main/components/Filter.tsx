import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function Blur({blur}: { blur: boolean }) {
	return (
		<div
			className="w-full h-full  object-cover pointer-events-none bg-center flex items-center justify-center duration-200"
			style={{
				background: blur ? "#0008" : "#0000",
				backdropFilter: blur ? "blur(12px)" : "blur(0px)",
			}}>
			{blur && (
				<Button
					className="bg-background/50 duration-200 pointer-events-auto"
					onClick={(e) => {
						e.currentTarget.style.opacity = "0";
						e.currentTarget.style.pointerEvents = "none";
						let parent = e.currentTarget.parentElement;
						if (parent) {
							parent.style.background = "#0000";
							parent.style.backdropFilter = "blur(0px)";
						}
					}}>
					<EyeOff /> Show
				</Button>
			)}
		</div>
	);
}

export default Blur;
