import { motion } from "framer-motion";

export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="nc-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#22d3ee" /></linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="none" stroke="url(#nc-g)" strokeWidth="2" />
      <circle cx="16" cy="16" r="5" fill="url(#nc-g)" />
      <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 9, ease: "linear" }} style={{ originX: "16px", originY: "16px" }}>
        <circle cx="16" cy="3" r="2.3" fill="#f8fafc" />
      </motion.g>
    </svg>
  );
}
