import { useEffect, useMemo, useState } from "react";
import { X, Sparkles, Loader2, Trash2, GitCompare } from "lucide-react";
import { api } from "../api.js";
import Reveal from "./Reveal.jsx";
import { buildCompareTable, COMPARE_MAX } from "../../shared/compareTable.js";

export default function ComparePanel({ items, onRemove, onClear }) {
  const rows = useMemo(() => (items.length >= 2 ? buildCompareTable(items) : []), [items]);
  const [useCase, setUseCase] = useState("");
  const [ai, setAi] = useState({ status: "idle", data: null, error: "" });
  const key = items.map((p) => p.id).join(",");

  useEffect(() => { setAi({ status: "idle", data: null, error: "" }); }, [key]);

  const summarize = async () => {
    setAi({ status: "loading", data: null, error: "" });
    try {
      const data = await api.compare(items.map((p) => p.id), useCase);
      setAi({ status: "done", data, error: "" });
    } catch (err) {
      setAi({ status: "error", data: null, error: err.message });
    }
  };

  const nameOf = (id) => items.find((p) => p.id === id)?.name || id;

  return (
    <section className="section" id="compare" aria-labelledby="compare-title">
      <div className="container">
        <Reveal className="section__head">
          <span className="eyebrow">Compare</span>
          <h2 id="compare-title">Side-by-side comparison</h2>
          <p>Select two to {COMPARE_MAX} products using the scale icon on any card. Differences are highlighted, and missing data is shown as "Not available".</p>
        </Reveal>

        {items.length === 0 && (
          <div className="empty"><GitCompare size={32} /><h3>Nothing to compare yet</h3><p>Tap the scale icon on at least two products.</p><a className="btn" href="#explore">Browse products</a></div>
        )}
        {items.length === 1 && (
          <div className="empty"><GitCompare size={32} /><h3>Add one more product</h3><p>{items[0].name} is selected. Choose another to start the comparison.</p><a className="btn" href="#explore">Browse products</a></div>
        )}

        {items.length > 0 && (
          <div className="tray" aria-label="Selected products">
            {items.map((p) => (
              <span key={p.id} className="tray__item">{p.name}<button type="button" onClick={() => onRemove(p)} aria-label={`Remove ${p.name} from comparison`}><X size={14} /></button></span>
            ))}
            <button className="btn btn--ghost btn--sm" type="button" onClick={onClear}><Trash2 size={14} /> Clear all</button>
          </div>
        )}

        {items.length >= 2 && (
          <>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Comparison table (scrolls sideways on small screens)">
              <table className="compare">
                <thead><tr><th scope="col">Feature</th>{items.map((p) => <th key={p.id} scope="col">{p.name}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className={r.differs ? "is-diff" : undefined}>
                      <th scope="row">{r.label}</th>
                      {r.values.map((v, i) => (
                        <td key={i} className={r.bestIndex === i ? "is-best" : undefined}>{v === null ? <span className="na">Not available</span> : v}{r.bestIndex === i ? " ✓" : ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="legend"><span><i style={{ background: "rgba(139,92,246,.35)" }} />Row where products differ</span><span><i style={{ background: "#34d399" }} />Best value in that row (price: lowest, rating: highest)</span></div>

            <div className="summary" aria-live="polite">
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Sparkles size={18} color="#22d3ee" /><h3 style={{ fontSize: "1.1rem" }}>AI comparison summary</h3></div>
              <div className="field"><label htmlFor="cmp-use">Your use case and budget (optional)</label><input id="cmp-use" className="input" maxLength={200} value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="e.g. coding and travel, under ₹65,000" /></div>
              <div><button className="btn btn--ai" type="button" onClick={summarize} disabled={ai.status === "loading"}>{ai.status === "loading" ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Generate summary</button></div>
              {ai.status === "error" && <div className="error" role="alert"><span>{ai.error}</span></div>}
              {ai.status === "done" && (
                <div style={{ display: "grid", gap: 10 }}>
                  <p>{ai.data.summary}</p>
                  {ai.data.bestFor?.length > 0 && <ul style={{ margin: 0, paddingLeft: 18 }}>{ai.data.bestFor.map((b, i) => <li key={i}><strong>{nameOf(b.productId)}</strong> for {b.useCase}. {b.why}</li>)}</ul>}
                  {ai.data.caveat && <p className="notice">{ai.data.caveat}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
