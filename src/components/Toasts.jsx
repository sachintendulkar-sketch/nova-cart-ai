import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";

export default function Toasts({ toasts }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className="toast" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            {t.type === "info" ? <Info size={18} color="#22d3ee" /> : <CheckCircle2 size={18} color="#34d399" />}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
