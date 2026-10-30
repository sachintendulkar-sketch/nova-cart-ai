import { formatINR, humanizeUseCase } from "./format.js";

export const COMPARE_MAX = 4;

function numericBest(values, mode) {
  const nums = values.map((v) => (typeof v === "number" ? v : null));
  const present = nums.filter((v) => v !== null);
  if (present.length < 2) return null;
  const target = mode === "min" ? Math.min(...present) : Math.max(...present);
  if (present.every((v) => v === target)) return null;
  return nums.indexOf(target);
}

function differs(values) {
  const set = new Set(values.map((v) => (v === null || v === undefined ? "__none__" : String(v))));
  return set.size > 1;
}

/**
 * Build comparison rows straight from catalog fields.
 * A value of null means the catalog has no data for that cell (the UI shows
 * "Not available"; nothing is ever guessed).
 */
export function buildCompareTable(products) {
  const rows = [];

  const prices = products.map((p) => (Number.isFinite(p.price) ? p.price : null));
  rows.push({
    key: "price",
    label: "Price (demo catalog)",
    kind: "base",
    values: prices.map((v) => (v === null ? null : formatINR(v))),
    differs: differs(prices),
    bestIndex: numericBest(prices, "min")
  });

  const ratings = products.map((p) => (Number.isFinite(p.rating) ? p.rating : null));
  rows.push({
    key: "rating",
    label: "Rating",
    kind: "base",
    values: products.map((p) =>
      Number.isFinite(p.rating)
        ? `${p.rating.toFixed(1)} / 5${p.ratingCount ? ` (${p.ratingCount.toLocaleString("en-IN")} ratings)` : ""}`
        : null
    ),
    differs: differs(ratings),
    bestIndex: numericBest(ratings, "max")
  });

  for (const [key, label, get] of [
    ["brand", "Brand", (p) => p.brand || null],
    ["category", "Category", (p) => p.category || null],
    [
      "useCases",
      "Best for",
      (p) => (p.useCases && p.useCases.length ? p.useCases.map(humanizeUseCase).join(", ") : null)
    ]
  ]) {
    const values = products.map(get);
    rows.push({ key, label, kind: "base", values, differs: differs(values), bestIndex: null });
  }

  const specKeys = [];
  for (const p of products) {
    for (const k of Object.keys(p.specifications || {})) {
      if (!specKeys.includes(k)) specKeys.push(k);
    }
  }
  for (const k of specKeys) {
    const values = products.map((p) => {
      const v = p.specifications ? p.specifications[k] : undefined;
      return v === undefined || v === null || v === "" ? null : String(v);
    });
    rows.push({ key: `spec:${k}`, label: k, kind: "spec", values, differs: differs(values), bestIndex: null });
  }

  return rows;
}
