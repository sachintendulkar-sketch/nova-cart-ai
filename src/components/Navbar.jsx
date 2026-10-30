import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings, User, Heart, Scale } from "lucide-react";
import Logo from "./Logo.jsx";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Explore Products" },
  { id: "assistant", label: "AI Assistant" },
  { id: "compare", label: "Compare" },
  { id: "wishlist", label: "Wishlist" }
];

function Switch({ id, label, checked, onChange }) {
  return (
    <div className="switch-row">
      <label htmlFor={id}>{label}</label>
      <button id={id} type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)} />
    </div>
  );
}

export default function Navbar({ active, wishCount, compareCount, settings, setSettings }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(null); // "settings" | "profile" | null
  const toolsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!panel) return undefined;
    const onDown = (e) => { if (toolsRef.current && !toolsRef.current.contains(e.target)) setPanel(null); };
    const onKey = (e) => { if (e.key === "Escape") setPanel(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [panel]);

  const badge = (id) => (id === "wishlist" && wishCount > 0 ? <span className="count">{wishCount}</span> : id === "compare" && compareCount > 0 ? <span className="count">{compareCount}</span> : null);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="container">
        <div className="nav__inner">
          <a href="#home" className="logo" aria-label="NovaCart AI home"><Logo /> <span>NovaCart <b>AI</b></span></a>
          <nav className="nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <a key={l.id} href={`#${l.id}`} className={`nav__link${active === l.id ? " is-active" : ""}`} aria-current={active === l.id ? "true" : undefined}>
                {l.label} {badge(l.id)}
                {active === l.id && <motion.span layoutId="nav-ind" className="nav__indicator" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              </a>
            ))}
          </nav>
          <div className="nav__tools" ref={toolsRef}>
            <button className="icon-btn" type="button" aria-label="Accessibility settings" aria-expanded={panel === "settings"} onClick={() => setPanel(panel === "settings" ? null : "settings")}><Settings size={18} /></button>
            <button className="icon-btn" type="button" aria-label="Demo account menu" aria-expanded={panel === "profile"} onClick={() => setPanel(panel === "profile" ? null : "profile")}><User size={18} /></button>
            <button className="icon-btn menu-btn" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={open ? "x" : "m"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: "grid" }}>
                  {open ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <AnimatePresence>
              {panel === "settings" && (
                <motion.div className="popover" role="dialog" aria-label="Accessibility settings" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <h3>Display settings</h3>
                  <Switch id="set-motion" label="Reduce motion" checked={settings.reduceMotion} onChange={(v) => setSettings({ ...settings, reduceMotion: v })} />
                  <Switch id="set-text" label="Larger text" checked={settings.largeText} onChange={(v) => setSettings({ ...settings, largeText: v })} />
                  <p className="notice">Your device's reduced-motion setting is always respected.</p>
                </motion.div>
              )}
              {panel === "profile" && (
                <motion.div className="popover" role="dialog" aria-label="Demo account" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <h3>Guest (demo)</h3>
                  <p className="muted" style={{ fontSize: ".9rem" }}>Sign-in is not part of this version. Your wishlist is saved only in this browser and does not sync between devices.</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a className="chip" href="#wishlist" onClick={() => setPanel(null)}><Heart size={14} /> {wishCount} saved</a>
                    <a className="chip" href="#compare" onClick={() => setPanel(null)}><Scale size={14} /> {compareCount} to compare</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav className="drawer" aria-label="Mobile" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              {LINKS.map((l) => (
                <a key={l.id} href={`#${l.id}`} className={`nav__link${active === l.id ? " is-active" : ""}`} onClick={() => setOpen(false)}>{l.label} {badge(l.id)}</a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
