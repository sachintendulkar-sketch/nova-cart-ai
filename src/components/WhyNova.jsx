import { motion } from "framer-motion";
import { UserRoundCheck, Wallet, Scale, MessageSquareText, ListChecks, Timer } from "lucide-react";
import Reveal from "./Reveal.jsx";

const ITEMS = [
  [UserRoundCheck, "Personalized recommendations", "Tell Nova your use case and preferences. Matches come from the catalog fields that fit them."],
  [Wallet, "Budget-aware discovery", "Say \"under ₹70,000\" in your own words. Products above your budget are filtered out on the server."],
  [Scale, "Specification comparison", "Line up to four products and see exactly where they differ. Missing data shows as \"Not available\"."],
  [MessageSquareText, "Conversational search", "Ask in plain language instead of juggling filters. Follow-up questions keep their context."],
  [ListChecks, "Explainable recommendations", "Every pick says why, and assumptions are labeled separately from catalog facts."],
  [Timer, "Time-saving research", "Skip tab-hopping. Shortlist, compare and decide in one place."]
];

export default function WhyNova() {
  return (
    <section className="section" id="why" aria-labelledby="why-title">
      <div className="container">
        <Reveal className="section__head">
          <span className="eyebrow">Why NovaCart?</span>
          <h2 id="why-title">Research that explains itself</h2>
          <p>Built to show its reasoning, stay inside the catalog and tell you when information is missing.</p>
        </Reveal>
        <div className="why-grid">
          {ITEMS.map(([Icon, title, text], i) => (
            <Reveal key={title} delay={i * 0.05}>
              <motion.div className="why" whileHover={{ y: -3 }}>
                <motion.div className="why__icon" whileHover={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5 }}><Icon size={22} /></motion.div>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
