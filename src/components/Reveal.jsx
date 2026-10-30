import { motion } from "framer-motion";

// Scroll-triggered fade-up. Content is visible without JS animation if motion is reduced.
export default function Reveal({ children, delay = 0, as = "div", ...rest }) {
  const Tag = motion[as];
  return (
    <Tag initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay }} {...rest}>
      {children}
    </Tag>
  );
}
