import { motion } from "framer-motion";
import { Heart, Scale, Star, Sparkles } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import { formatINR } from "../../shared/format.js";

function summarySpecs(p) {
  return Object.entries(p.specifications || {}).slice(0, 3).map(([k, v]) => `${v}`).join(" • ");
}

export default function ProductCard({ product, index = 0, aiLabel, inWishlist, inCompare, onToggleWish, onToggleCompare, onOpen }) {
  return (
    <motion.article
      className="pcard"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      layout
    >
      {aiLabel && <span className="badge badge--cyan ai-label"><Sparkles size={11} style={{ verticalAlign: -1 }} /> {aiLabel}</span>}
      <ProductImage product={product} />
      <div className="pcard__top">
        <span className="badge">{product.category}</span>
        {Number.isFinite(product.rating) ? (
          <span className="rating" aria-label={`Rated ${product.rating} out of 5`}><Star size={14} fill="currentColor" /> {product.rating.toFixed(1)} <span>({product.ratingCount.toLocaleString("en-IN")})</span></span>
        ) : <span className="muted" style={{ fontSize: ".8rem" }}>Not rated</span>}
      </div>
      <div>
        <h3>{product.name}</h3>
        <p className="pcard__brand">{product.brand}</p>
      </div>
      <p className="pcard__summary">{summarySpecs(product)}</p>
      <div className="pcard__price">{formatINR(product.price)} <span className="muted" style={{ fontSize: ".72rem", fontWeight: 500 }}>demo price</span></div>
      <div className="pcard__actions">
        <button className="btn btn--primary btn--sm" type="button" onClick={() => onOpen(product.id)}>View Details</button>
        <button
          type="button"
          className={`icon-btn heart${inWishlist ? " is-on" : ""}`}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={() => onToggleWish(product)}
        >
          <motion.span animate={{ scale: inWishlist ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.3 }} style={{ display: "grid" }}>
            <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
          </motion.span>
        </button>
        <button
          type="button"
          className={`icon-btn cmp${inCompare ? " is-on" : ""}`}
          aria-pressed={inCompare}
          aria-label={inCompare ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
          onClick={() => onToggleCompare(product)}
        >
          <Scale size={18} />
        </button>
      </div>
    </motion.article>
  );
}
