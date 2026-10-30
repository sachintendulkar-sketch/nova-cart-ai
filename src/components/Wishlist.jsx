import { Heart, Trash2 } from "lucide-react";
import ProductCard from "./ProductCard.jsx";
import Reveal from "./Reveal.jsx";
import { formatINR } from "../../shared/format.js";

export default function Wishlist({ items, cardProps, onClear }) {
  const total = items.reduce((s, p) => s + p.price, 0);
  return (
    <section className="section" id="wishlist" aria-labelledby="wish-title">
      <div className="container">
        <Reveal className="section__head">
          <span className="eyebrow">Wishlist</span>
          <h2 id="wish-title">Saved for later {items.length > 0 && <span className="count" style={{ verticalAlign: "middle" }}>{items.length}</span>}</h2>
          <p>Saved in this browser only. It stays after you refresh, but it does not sync between devices.</p>
        </Reveal>
        {items.length === 0 ? (
          <div className="empty"><Heart size={32} /><h3>Your wishlist is empty</h3><p>Tap the heart on any product to save it here.</p><a className="btn btn--primary" href="#explore">Discover products</a></div>
        ) : (
          <>
            <div className="count-line"><span>Total of saved demo prices: <strong style={{ color: "#f8fafc" }}>{formatINR(total)}</strong></span><button className="btn btn--ghost btn--sm" type="button" onClick={onClear}><Trash2 size={14} /> Clear wishlist</button></div>
            <div className="grid">{items.map((p, i) => <ProductCard key={p.id} product={p} index={i} {...cardProps(p)} />)}</div>
          </>
        )}
      </div>
    </section>
  );
}
