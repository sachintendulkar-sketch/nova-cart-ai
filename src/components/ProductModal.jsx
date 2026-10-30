import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Heart, Scale, Sparkles, Star } from "lucide-react";
import { api } from "../api.js";
import ProductImage from "./ProductImage.jsx";
import { formatINR, humanizeUseCase } from "../../shared/format.js";

export default function ProductModal({ product, onClose, inWishlist, inCompare, onToggleWish, onToggleCompare, onAsk, onOpen }) {
  const [similar, setSimilar] = useState([]);
  const closeRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && boxRef.current) { // keep focus inside the dialog
        const f = boxRef.current.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; previous?.focus?.(); };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    setSimilar([]);
    api.product(product.id).then((d) => { if (alive) setSimilar(d.similar || []); }).catch(() => {});
    return () => { alive = false; };
  }, [product.id]);

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div ref={boxRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ y: 30, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <button ref={closeRef} className="icon-btn modal__close" type="button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        <div className="modal__grid">
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <ProductImage product={product} large />
            <p className="notice">Demo catalog entry. The price and rating are sample data, not live retailer information. Last updated {product.lastUpdated}.</p>
          </div>
          <div style={{ display: "grid", gap: 14, alignContent: "start", minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><span className="badge">{product.category}</span><span className="badge badge--cyan">{product.brand}</span></div>
            <h2 id="modal-title" style={{ fontSize: "1.7rem", paddingRight: 48 }}>{product.name}</h2>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700 }}>{formatINR(product.price)}</span>
              {Number.isFinite(product.rating) ? <span className="rating"><Star size={15} fill="currentColor" /> {product.rating.toFixed(1)} <span>({product.ratingCount.toLocaleString("en-IN")} ratings)</span></span> : <span className="muted">Not rated</span>}
            </div>
            <p className="muted">{product.description}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className={`btn heart${inWishlist ? " is-on" : ""}`} type="button" aria-pressed={inWishlist} onClick={() => onToggleWish(product)}><Heart size={16} fill={inWishlist ? "currentColor" : "none"} /> {inWishlist ? "In wishlist" : "Add to wishlist"}</button>
              <button className={`btn cmp${inCompare ? " is-on" : ""}`} type="button" aria-pressed={inCompare} onClick={() => onToggleCompare(product)}><Scale size={16} /> {inCompare ? "In comparison" : "Add to comparison"}</button>
              <button className="btn btn--ai" type="button" onClick={() => onAsk(product)}><Sparkles size={16} /> Ask AI about this product</button>
            </div>
          </div>
        </div>

        <div className="modal__grid">
          <div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Key specifications</h3>
            <dl className="specs">
              {Object.entries(product.specifications).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </div>
          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <div className="proscons">
              <div className="pros"><h4>Advantages</h4><ul>{product.pros.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div className="cons"><h4>Limitations</h4><ul>{product.cons.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
            <div>
              <h4 style={{ marginBottom: 8 }}>Best for</h4>
              <div className="chips" style={{ marginTop: 0 }}>{product.useCases.map((u) => <span key={u} className="chip">{humanizeUseCase(u)}</span>)}</div>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: 10 }}>Similar products</h3>
            <div className="chips" style={{ marginTop: 0 }}>
              {similar.map((s) => <button key={s.id} className="chip" type="button" onClick={() => onOpen(s.id)}>{s.name} · {formatINR(s.price)}</button>)}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
