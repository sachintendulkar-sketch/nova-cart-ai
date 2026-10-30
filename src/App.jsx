import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { api } from "./api.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { useActiveSection } from "./hooks/useActiveSection.js";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Explore from "./components/Explore.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import ComparePanel from "./components/ComparePanel.jsx";
import Wishlist from "./components/Wishlist.jsx";
import WhyNova from "./components/WhyNova.jsx";
import ProductModal from "./components/ProductModal.jsx";
import Toasts from "./components/Toasts.jsx";
import Logo from "./components/Logo.jsx";
import { COMPARE_MAX } from "../shared/compareTable.js";

const SECTIONS = ["home", "explore", "assistant", "compare", "wishlist"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [wishIds, setWishIds] = useLocalStorage("novacart.wishlist", []);
  const [compareIds, setCompareIds] = useLocalStorage("novacart.compare", []);
  const [settings, setSettings] = useLocalStorage("novacart.settings", { reduceMotion: false, largeText: false });
  const [openId, setOpenId] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [toasts, setToasts] = useState([]);
  const active = useActiveSection(SECTIONS);

  const load = useCallback(() => {
    setLoading(true); setError("");
    api.products()
      .then((d) => { setProducts(d.products); setCategories(d.categories); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); api.health().then(setHealth).catch(() => setHealth({ aiConfigured: false })); }, [load]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", !!settings.reduceMotion);
    document.documentElement.classList.toggle("large-text", !!settings.largeText);
  }, [settings]);

  const notify = useCallback((text, type = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  // Drop saved ids that are no longer in the catalog.
  const wishItems = useMemo(() => wishIds.map((id) => byId.get(id)).filter(Boolean), [wishIds, byId]);
  const compareItems = useMemo(() => compareIds.map((id) => byId.get(id)).filter(Boolean), [compareIds, byId]);

  const toggleWish = useCallback((p) => {
    setWishIds((ids) => {
      const has = ids.includes(p.id);
      notify(has ? `Removed ${p.name} from wishlist` : `Saved ${p.name} to wishlist`, has ? "info" : "ok");
      return has ? ids.filter((x) => x !== p.id) : [...ids, p.id];
    });
  }, [setWishIds, notify]);

  const toggleCompare = useCallback((p) => {
    setCompareIds((ids) => {
      if (ids.includes(p.id)) { notify(`Removed ${p.name} from comparison`, "info"); return ids.filter((x) => x !== p.id); }
      if (ids.length >= COMPARE_MAX) { notify(`You can compare up to ${COMPARE_MAX} products`, "info"); return ids; }
      notify(`Added ${p.name} to comparison`);
      return [...ids, p.id];
    });
  }, [setCompareIds, notify]);

  const cardProps = useCallback((p) => ({
    inWishlist: wishIds.includes(p.id),
    inCompare: compareIds.includes(p.id),
    onToggleWish: toggleWish, onToggleCompare: toggleCompare, onOpen: setOpenId
  }), [wishIds, compareIds, toggleWish, toggleCompare]);

  const openProduct = openId ? byId.get(openId) : null;
  const askAbout = (p) => {
    setOpenId(null);
    setPrefill({ nonce: Date.now(), productId: p.id, text: `Tell me about the ${p.name}. Who is it best for, and what are its limitations?` });
    setTimeout(() => document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const floaters = useMemo(() => ["lap-002", "hp-002", "sw-002"].map((id) => byId.get(id)).filter(Boolean), [byId]);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="ambient" aria-hidden="true" />
      <Navbar active={active} wishCount={wishItems.length} compareCount={compareItems.length} settings={settings} setSettings={setSettings} />
      <main id="main">
        <Hero health={health} cardProps={cardProps} floaters={floaters} />
        <Explore products={products} categories={categories} loading={loading} error={error} onRetry={load} cardProps={cardProps} />
        <ChatPanel health={health} prefill={prefill} onOpenProduct={setOpenId} notify={notify} />
        <ComparePanel items={compareItems} onRemove={toggleCompare} onClear={() => setCompareIds([])} />
        <Wishlist items={wishItems} cardProps={cardProps} onClear={() => setWishIds([])} />
        <WhyNova />
      </main>
      <footer className="footer">
        <div className="container footer__inner">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Logo size={20} /> NovaCart AI</span>
          <span>Demo catalog with sample prices. Not connected to any retailer.</span>
        </div>
      </footer>
      <AnimatePresence>
        {openProduct && (
          <ProductModal
            key={openProduct.id} product={openProduct} onClose={() => setOpenId(null)}
            inWishlist={wishIds.includes(openProduct.id)} inCompare={compareIds.includes(openProduct.id)}
            onToggleWish={toggleWish} onToggleCompare={toggleCompare} onAsk={askAbout} onOpen={setOpenId}
          />
        )}
      </AnimatePresence>
      <Toasts toasts={toasts} />
    </MotionConfig>
  );
}
