import { useAtomValue, useSetAtom } from "jotai";
import { inProgressAtom, plannedChangesAtom } from "@/variables";
import { ChevronRight, File, FileQuestion, Folder, FolderCogIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UNCATEGORIZED } from "@/init";
import { invoke } from "@tauri-apps/api/core";
import {motion} from "motion/react"
function Consent() {
    const plannedChanges = useAtomValue(plannedChangesAtom);
    const setProgress = useSetAtom(inProgressAtom)
	return (
		<motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        exit={{opacity:0}}
			className="fixed z-50 w-full  duration-200 h-full flex items-center justify-center bg-background/50"
			style={{
				backdropFilter: "blur(5px)"
			}}>
			<div className="w-180 h-150 bg-background/50 rounded-lg border-border border-2 p-4 gap-4 overflow-hidden flex flex-col items-center ">
				<div className="text-3xl my-6 min-h-fit text-accent">{plannedChanges.title}</div>
				<div className="flex  items-center w-full h-100 p-0">
					<div className="flex border flex-col w-1/2 h-full rounded-sm text-gray-300 overflow-x-hidden overflow-y-auto">
						{plannedChanges.from.map((item: any, index: number) => (
							<div className={"w-full h-10 border-b flex items-center px-2"} style={{ backgroundColor: index % 2 == 0 ? "#1b1b1b50" : "#31313150" }}>
								{item.isDir ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
								<Input type="text" readOnly className={"w-full pointer-events-none overflow-hidden rounded-none border-border/0  cursor-default text-ellipsis h-10 " + ((index % 2) + 1)} style={{ backgroundColor: "#fff0" }} value={item.name} />
							</div>
						))}
					</div>
					<ChevronRight className="w-8 text-accent h-8" />
					<div className="flex flex-col  border w-1/2 h-full rounded-sm text-gray-300 overflow-x-hidden overflow-y-auto">
						{plannedChanges.to.map((item: any, index: number) => (
							<div className={"w-full flex  flex-col"} style={{ backgroundColor: index % 2 == 0 ? "#1b1b1b50" : "#31313150", borderBottom: index == plannedChanges.to.length - 1 ? "" : "1px solid var(--border)" }}>
								<div className={"w-full border-b  h-10 flex items-center px-2"}>
									{
                                        item.icon?
                                        <img src={item.icon} className="h-6 w-6 rounded-full overflow-hidden -ml-1 -mr-1" alt="icon" />:
                                        item.name==UNCATEGORIZED?<FolderCogIcon className="h-5 w-5 pointer-events-none aspect-square -mr-1" />:
                                        <Folder className="h-4 w-4" />
                                    }
									<Input type="text" readOnly className={"w-full pointer-events-none overflow-hidden rounded-none border-border/0  cursor-default text-ellipsis h-10 " + ((index % 2) + 1)} style={{ backgroundColor: "#fff0" }} value={item.name} />
								</div>
								<div className="w-full flex flex-col  items-center pl-4">
									{item.children.map((child: any, index: number) => (
										<div className={"w-full h-10 border-l flex items-center px-2 "} style={{ backgroundColor: index % 2 == 0 ? "#1b1b1b50" : "#31313150", borderBottom: index == item.children.length - 1 ? "" : "1px dashed var(--border)" }}>
											{child.isDir ? <Folder className="h-4 w-4"/> : <File className="h-4 w-4"/>}
											<Input type="text" readOnly className={"w-full pointer-events-none overflow-hidden rounded-none border-border/0  cursor-default text-ellipsis h-10 " + ((index % 2) + 1)} style={{ backgroundColor: "#fff0" }} value={child.name} />
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="flex w-full mt-2 h-10 justify-between">
					<Button className="w-28 text-[#cf7171] hover:bg-[#cf7171] hover:text-background"
					onClick={()=>{
						// socket.emit("quit")
						// setTimeout(()=>{
							invoke("exit_app");
						// },500)
					}}
					>Quit</Button>
					<div className="w-full flex flex-col items-center justify-center">

					{/* <div className="flex items-center gap-2">
						<Checkbox id="checkbox" className=" checked:bg-accent" />
						<label className="text-accent/75 text-sm">Automatically restructure from next time. </label>
					</div> */}
					<div className="flex items-center gap-2">
						<Checkbox id="checkbox" className=" checked:bg-accent" />
						<label className="text-accent/75 text-sm">Create a restore point before applying changes</label>
					</div>
					
					</div>
					<Button
						className="w-28 "
						onClick={() => {
							let checked = document.getElementById("checkbox")?.getAttribute("aria-checked") == "true";
							// if (checked) socket.emit("create_restore_point");
							// else socket.emit("confirm_plan");
							// setProgress({
							// 	current: 0,
							// 	items: checked ? ["Creating Restore Point", "Applying Changes"] : ["Applying Changes"],
							// 	completed: false,
							// });
							// setConsent(defaultConsent);
							// setPage((prev) => {
							// 	if (prev != -1) return prev + 1;
							// 	else return prev;
							// });
						}}>
						Confirm
					</Button>
				</div>
			</div>
		</motion.div>
	);
}

export default Consent;
