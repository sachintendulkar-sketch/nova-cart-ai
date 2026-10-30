import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, SearchX, RotateCcw } from "lucide-react";
import ProductCard from "./ProductCard.jsx";
import Reveal from "./Reveal.jsx";

const PAGE = 9;
const SORTS = [["relevance", "Relevance"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["rating", "Rating"]];

export default function Explore({ products, categories, loading, error, onRetry, cardProps }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("relevance");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    let items = products.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (min !== "" && p.price < Number(min)) return false;
      if (max !== "" && p.price > Number(max)) return false;
      if (words.length) {
        const blob = [p.name, p.brand, p.category, p.description, ...Object.values(p.specifications || {}), ...(p.useCases || [])].join(" ").toLowerCase();
        if (!words.every((w) => blob.includes(w))) return false;
      }
      return true;
    });
    if (sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
    if (sort === "rating") items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return items;
  }, [products, q, cat, min, max, sort]);

  const clear = () => { setQ(""); setCat("All"); setMin(""); setMax(""); setSort("relevance"); setShown(PAGE); };
  const dirty = q || cat !== "All" || min !== "" || max !== "" || sort !== "relevance";
  const reset = (fn) => (e) => { fn(e.target.value); setShown(PAGE); };

  return (
    <section className="section" id="explore" aria-labelledby="explore-title">
      <div className="container">
        <Reveal className="section__head">
          <span className="eyebrow">Explore Products</span>
          <h2 id="explore-title">Browse the demo catalog</h2>
          <p>Filter by category and price, or search by name, brand or spec.</p>
        </Reveal>

        <div className="filters">
          <div className="filters__row">
            <div className="field" style={{ flex: "2 1 240px" }}>
              <label htmlFor="f-q">Search</label>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: 14, color: "#9ca3af" }} aria-hidden="true" />
                <input id="f-q" className="input" style={{ paddingLeft: 36 }} type="search" placeholder="Name, brand or spec" value={q} onChange={reset(setQ)} />
              </div>
            </div>
            <div className="field"><label htmlFor="f-min">Min price (₹)</label><input id="f-min" className="input" type="number" min="0" inputMode="numeric" value={min} onChange={reset(setMin)} placeholder="0" /></div>
            <div className="field"><label htmlFor="f-max">Max price (₹)</label><input id="f-max" className="input" type="number" min="0" inputMode="numeric" value={max} onChange={reset(setMax)} placeholder="Any" /></div>
            <div className="field">
              <label htmlFor="f-sort">Sort by</label>
              <select id="f-sort" className="select" value={sort} onChange={reset(setSort)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
          </div>
          <div className="cats" role="group" aria-label="Category">
            {["All", ...categories].map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => { setCat(c); setShown(PAGE); }}>{c}</button>
            ))}
          </div>
        </div>

        <div className="count-line" aria-live="polite">
          <span>{loading ? "Loading products" : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`}</span>
          {dirty && <button className="btn btn--ghost btn--sm" type="button" onClick={clear}><RotateCcw size={14} /> Clear filters</button>}
        </div>

        {error && <div className="error" role="alert"><span>{error}</span><button className="btn btn--sm" type="button" onClick={onRetry}>Retry</button></div>}
        {loading && <div className="grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty"><SearchX size={32} /><h3>No products match</h3><p>Try a wider price range or a different category.</p><button className="btn" type="button" onClick={clear}>Clear filters</button></div>
        )}
        {!loading && filtered.length > 0 && (
          <>
            <div className="grid">
              <AnimatePresence>
                {filtered.slice(0, shown).map((p, i) => <ProductCard key={p.id} product={p} index={i} {...cardProps(p)} />)}
              </AnimatePresence>
            </div>
            {shown < filtered.length && (
              <div style={{ display: "grid", placeItems: "center", marginTop: 24 }}>
                <button className="btn" type="button" onClick={() => setShown((s) => s + PAGE)}>Load more ({filtered.length - shown} left)</button>
              </div>
            )}
          </>
        )}
        <p className="notice" style={{ marginTop: 20 }}>Demo catalog: brands, prices and ratings are sample data for development, not live retailer data.</p>
      </div>
    </section>
  );
}
