import { Laptop, Smartphone, Headphones, Watch, Monitor, Keyboard, Package } from "lucide-react";

const ICONS = { Laptops: Laptop, Smartphones: Smartphone, Headphones, Smartwatches: Watch, Monitors: Monitor, Accessories: Keyboard };
const TINTS = {
  Laptops: "rgba(139,92,246,.55)", Smartphones: "rgba(34,211,238,.4)", Headphones: "rgba(244,114,182,.4)",
  Smartwatches: "rgba(52,211,153,.4)", Monitors: "rgba(96,165,250,.45)", Accessories: "rgba(251,191,36,.35)"
};

/** Real image if the catalog supplies one, otherwise a category placeholder (never a broken link). */
export default function ProductImage({ product, large = false }) {
  const Icon = ICONS[product.category] || Package;
  return (
    <div className={`pimg${large ? " pimg--lg" : ""}`} style={{ "--tint": TINTS[product.category] }}>
      {product.image ? (
        <img src={product.image} alt={product.name} loading="lazy" style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Icon aria-hidden="true" strokeWidth={1.4} />
      )}
      {!product.image && <span className="pimg__tag">demo image</span>}
    </div>
  );
}
