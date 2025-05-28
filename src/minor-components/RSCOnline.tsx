import { AnimatePresence, motion } from "motion/react";

function RSCOnline({ online }: { online: boolean }) {
	return <AnimatePresence>{online && <motion.div initial={{ filter: "blur(6px)",opacity:1 }}
							animate={{ filter: "blur(0px)",opacity:1 }}
							exit={{ filter: "blur(6px)",opacity:1 }} layout transition={{ duration: 0.3 }} className="flex min-w-full bg-amber-300 h-full flex-col"></motion.div>}</AnimatePresence>;
}

export default RSCOnline;
