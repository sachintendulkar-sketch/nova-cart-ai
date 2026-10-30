import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Mic, Sparkles, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { api } from "../api.js";
import ProductCard from "./ProductCard.jsx";
import ProductImage from "./ProductImage.jsx";
import { formatINR } from "../../shared/format.js";

const PROMPTS = [
  "Best laptop for AI development",
  "Find headphones under ₹3,000",
  "Compare gaming monitors",
  "Smartwatch with GPS for running",
  "Phone with the best camera under ₹50,000"
];

export default function Hero({ health, cardProps, floaters }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle", data: null, error: "", asked: "" });
  const [showSuggest, setShowSuggest] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [listening, setListening] = useState(false);
  const heroRef = useRef(null);
  const SpeechRec = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  // Cursor-responsive glow, only for fine pointers (mouse), never for touch.
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
        document.documentElement.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);

  const run = async (text) => {
    const q = text.trim();
    if (!q) return;
    setShowSuggest(false);
    setState({ status: "loading", data: null, error: "", asked: q });
    try {
      const data = await api.recommend(q);
      setState({ status: "done", data, error: "", asked: q });
    } catch (err) {
      setState({ status: "error", data: null, error: err.message, asked: q });
    }
  };

  const onSubmit = (e) => { e.preventDefault(); run(cursor >= 0 ? PROMPTS[cursor] : query); };
  const onKeyDown = (e) => {
    if (!showSuggest) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % PROMPTS.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c <= 0 ? PROMPTS.length - 1 : c - 1)); }
    else if (e.key === "Escape") { setShowSuggest(false); setCursor(-1); }
  };

  const startVoice = () => {
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (ev) => { const t = ev.results[0][0].transcript; setQuery(t); run(t); };
    try { rec.start(); } catch { setListening(false); }
  };

  const aiState = !health ? "checking" : health.aiConfigured ? "on" : "off";

  return (
    <section className="hero" id="home" ref={heroRef} aria-labelledby="hero-title">
      <div className="container">
        <div className="hero__grid">
          <div>
            <span className="status" role="status">
              <span className={`dot ${aiState === "on" ? "dot--ok" : aiState === "off" ? "dot--off" : ""}`} />
              {aiState === "on" ? "Nova AI online" : aiState === "off" ? "AI key not set • catalog search only" : "Checking AI status"}
            </span>
            <h1 id="hero-title">Your Next Favorite <span className="grad">Product</span> Starts Here.</h1>
            <p className="hero__lead">Discover smarter recommendations, compare products instantly, and shop with AI that understands what matters to you.</p>

            <div className="searchbar">
              <form onSubmit={onSubmit} role="search" aria-label="Ask for product recommendations">
                <Search size={20} color="#9ca3af" aria-hidden="true" />
                <label className="sr" htmlFor="hero-q">Describe what you need</label>
                <input
                  id="hero-q" type="text" value={query} maxLength={600} autoComplete="off"
                  placeholder="Describe what you need"
                  role="combobox" aria-expanded={showSuggest} aria-controls="hero-suggest" aria-autocomplete="list"
                  aria-activedescendant={cursor >= 0 ? `sug-${cursor}` : undefined}
                  onChange={(e) => { setQuery(e.target.value); setCursor(-1); }}
                  onFocus={() => setShowSuggest(true)} onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                  onKeyDown={onKeyDown}
                />
                <button type="button" className="icon-btn" onClick={startVoice} disabled={!SpeechRec} aria-label={SpeechRec ? (listening ? "Listening" : "Search by voice") : "Voice input is not supported in this browser"} title={SpeechRec ? "Search by voice" : "Voice input is not supported in this browser"} style={listening ? { borderColor: "#22d3ee", color: "#22d3ee" } : undefined}>
                  <Mic size={18} />
                </button>
                <button type="submit" className="btn btn--primary" disabled={state.status === "loading"}>
                  {state.status === "loading" ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />} Ask
                </button>
              </form>
              {showSuggest && (
                <ul className="suggest" id="hero-suggest" role="listbox" aria-label="Example searches">
                  {PROMPTS.map((s, i) => (
                    <li key={s} id={`sug-${i}`} role="option" aria-selected={cursor === i} onMouseDown={(e) => { e.preventDefault(); setQuery(s); run(s); }}>
                      <Search size={14} color="#9ca3af" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="chips" aria-label="Example prompts">
              {PROMPTS.slice(0, 3).map((s) => (
                <button key={s} type="button" className="chip" onClick={() => { setQuery(s); run(s); }}>{s}</button>
              ))}
            </div>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#explore">Explore Products <ArrowRight size={18} /></a>
              <a className="btn btn--ai" href="#assistant"><Sparkles size={18} /> Ask Nova AI</a>
            </div>
          </div>

          <div className="floaters" aria-hidden="true">
            {floaters.map((p, i) => (
              <motion.div key={p.id} className="floater" animate={{ y: [0, i % 2 ? 10 : -10, 0] }} transition={{ repeat: Infinity, duration: 6 + i, ease: "easeInOut" }}>
                <ProductImage product={p} />
                <div className="floater__name">{p.name}</div>
                <div className="floater__meta"><span>{p.category}</span><span>{formatINR(p.price)}</span></div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="hero-results" aria-live="polite">
          {state.status === "loading" && (
            <div className="result-box"><span className="eyebrow"><Loader2 size={14} className="spin" style={{ verticalAlign: -2 }} /> Nova is searching the catalog</span>
              <div className="grid"><div className="skeleton" /><div className="skeleton" /></div></div>
          )}
          {state.status === "error" && (
            <div className="error" role="alert"><span>{state.error}</span><button className="btn btn--sm" type="button" onClick={() => run(state.asked)}><RotateCcw size={14} /> Retry</button></div>
          )}
          {state.status === "done" && state.data && (
            <div className="result-box">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="eyebrow">Results for "{state.asked}"</span>
                <span className={`badge ${state.data.mode === "ai" ? "badge--cyan" : ""}`}>{state.data.mode === "ai" ? "AI recommendation" : "Catalog search"}</span>
              </div>
              {state.data.summary && <p>{state.data.summary}</p>}
              {state.data.clarifyingQuestion && <p className="assume">Nova asks: {state.data.clarifyingQuestion}</p>}
              {state.data.missingInfo && <p className="notice">{state.data.missingInfo}</p>}
              <div className="grid">
                {state.data.products.map((p, i) => {
                  const rec = state.data.recommendations.find((r) => r.productId === p.id);
                  return (
                    <div key={p.id} style={{ display: "grid", gap: 8, alignContent: "start", minWidth: 0 }}>
                      <ProductCard product={p} index={i} aiLabel={state.data.mode === "ai" ? "Nova pick" : "Top match"} {...cardProps(p)} />
                      {rec && <p className="rec__why">{rec.reason}{rec.assumption && <span className="assume"> Assumption: {rec.assumption}</span>}</p>}
                    </div>
                  );
                })}
              </div>
              <p className="notice">Demo catalog: prices and ratings are sample data, not live retailer information.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
