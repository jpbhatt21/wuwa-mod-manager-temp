import { Button } from "@/components/ui/button";
import { SaveAll } from "lucide-react";

function Restore({ open }: { open: boolean }) {
	return (
		<Button className="w-38  overflow-hidden text-ellipsis h-12" style={{ width: open ? "" : "3rem" }}>
			<SaveAll />
			{open && "Restore"}
		</Button>
	);
}

export default Restore;
