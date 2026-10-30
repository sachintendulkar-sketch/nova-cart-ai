import { products, CATEGORIES } from "./data/products.js";

// ---------- Query parsing (rule based, works without any AI) ----------

const CATEGORY_WORDS = {
  Laptops: ["laptop", "laptops", "notebook", "macbook"],
  Smartphones: ["phone", "phones", "smartphone", "smartphones", "mobile"],
  Headphones: ["headphone", "headphones", "earbuds", "earphones", "earphone", "neckband", "headset"],
  Smartwatches: ["watch", "watches", "smartwatch", "smartwatches"],
  Monitors: ["monitor", "monitors", "display", "screen"],
  Accessories: ["keyboard", "mouse", "dock", "hub", "accessory", "accessories"]
};

const USE_CASE_WORDS = {
  programming: ["programming", "coding", "developer", "development", "code", "software"],
  "machine-learning": ["machine learning", "ml", "ai", "deep learning", "data science", "training models"],
  "video-editing": ["video editing", "video", "editing", "rendering"],
  gaming: ["gaming", "games", "game", "gamer"],
  student: ["student", "students", "college", "study", "school"],
  office: ["office", "documents", "spreadsheets"],
  "work-from-home": ["work from home", "wfh", "calls", "meetings"],
  travel: ["travel", "travelling", "traveling", "flight", "trip"],
  photography: ["photography", "photos", "camera", "photo"],
  fitness: ["fitness", "gym", "running", "workout", "sports", "exercise"],
  music: ["music", "listening", "songs"],
  commuting: ["commute", "commuting", "daily travel", "metro"],
  design: ["design", "designer", "graphic", "illustration", "colour", "color"],
  budget: ["cheap", "budget", "affordable", "low cost"]
};

const PREFERENCE_WORDS = {
  "noise cancellation": ["noise cancel", "anc", "noise-cancelling", "noise cancelling"],
  lightweight: ["light", "lightweight", "portable", "thin"],
  "long battery": ["battery", "long battery", "all day"],
  "dedicated gpu": ["gpu", "graphics card", "cuda"],
  wireless: ["wireless", "bluetooth"]
};

function hasWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

function parseBudget(text) {
  const t = text.toLowerCase().replace(/,/g, "");
  const num = "(\\d+(?:\\.\\d+)?)\\s*(k|thousand|lakh|lakhs|l)?";
  const toRupees = (value, unit) => {
    let n = parseFloat(value);
    if (unit === "k" || unit === "thousand") n *= 1000;
    else if (unit === "lakh" || unit === "lakhs" || unit === "l") n *= 100000;
    return Math.round(n);
  };
  let m = t.match(new RegExp(`(?:between|from)\\s*(?:₹|rs\\.?|inr)?\\s*${num}\\s*(?:to|and|-)\\s*(?:₹|rs\\.?|inr)?\\s*${num}`));
  if (m) return { min: toRupees(m[1], m[2]), max: toRupees(m[3], m[4]) };
  m = t.match(new RegExp(`(?:under|below|less than|within|upto|up to|max(?:imum)?|budget(?: of)?|around|about|<)\\s*(?:₹|rs\\.?|inr)?\\s*${num}`));
  if (m) return { min: null, max: toRupees(m[1], m[2]) };
  m = t.match(new RegExp(`(?:above|over|more than|at least|>)\\s*(?:₹|rs\\.?|inr)?\\s*${num}`));
  if (m) return { min: toRupees(m[1], m[2]), max: null };
  m = t.match(new RegExp(`(?:₹|rs\\.?|inr)\\s*${num}`));
  if (m) return { min: null, max: toRupees(m[1], m[2]) };
  return { min: null, max: null };
}

export function parseQuery(query) {
  const text = String(query || "").toLowerCase();
  const categories = Object.entries(CATEGORY_WORDS)
    .filter(([, words]) => words.some((w) => hasWord(text, w)))
    .map(([cat]) => cat);
  const useCases = Object.entries(USE_CASE_WORDS)
    .filter(([, words]) => words.some((w) => hasWord(text, w)))
    .map(([uc]) => uc);
  const preferences = Object.entries(PREFERENCE_WORDS)
    .filter(([, words]) => words.some((w) => hasWord(text, w)))
    .map(([pref]) => pref);
  const { min, max } = parseBudget(text);
  const wantsCompare = /\b(compare|versus|vs\.?|difference between)\b/.test(text);
  return { categories, useCases, preferences, budgetMin: min, budgetMax: max, wantsCompare };
}

// ---------- Ranking over real catalog fields ----------

const STOP = new Set(["the", "a", "an", "for", "and", "or", "to", "of", "in", "on", "with", "i", "need", "want", "best", "find", "me", "my", "is", "are", "under", "below", "good", "buy", "show", "some", "that", "can", "please", "which", "what", "do", "have", "get"]);

function keywords(text) {
  return String(text || "").toLowerCase().split(/[^a-z0-9₹]+/).filter((w) => w.length > 1 && !STOP.has(w) && !/^\d+k?$/.test(w));
}

function productText(p) {
  return [p.name, p.brand, p.category, p.description, ...Object.entries(p.specifications || {}).flat(), ...(p.useCases || [])].join(" ").toLowerCase();
}

/** Score a product 0..100 and list the catalog-based reasons. Nothing is invented. */
export function scoreProduct(p, intent, rawQuery) {
  let score = 0;
  const reasons = [];

  if (intent.categories.length) {
    if (intent.categories.includes(p.category)) { score += 30; reasons.push(`It is in the ${p.category} category.`); }
    else score -= 40;
  }

  if (intent.useCases.length) {
    const matched = (p.useCases || []).filter((u) => intent.useCases.includes(u));
    if (matched.length) {
      score += 12 + 12 * Math.min(matched.length, 3);
      reasons.push(`Listed use cases match: ${matched.join(", ")}.`);
    }
  }

  if (intent.budgetMax != null) {
    if (p.price <= intent.budgetMax) {
      score += 10;
      reasons.push(`Priced at ₹${p.price.toLocaleString("en-IN")}, within your budget.`);
      score += 8 * (p.price / intent.budgetMax); // use the budget sensibly
    } else score -= 100;
  }
  if (intent.budgetMin != null && p.price < intent.budgetMin) score -= 30;

  const specBlob = JSON.stringify(p.specifications || {}).toLowerCase();
  for (const pref of intent.preferences) {
    if (pref === "noise cancellation" && /active|anc/.test(specBlob)) { score += 14; reasons.push("It has active noise cancellation."); }
    if (pref === "lightweight" && Number.parseFloat((p.specifications.Weight || "").replace(/[^0-9.]/g, "")) <= 1.5) { score += 8; reasons.push("It is a lightweight model."); }
    if (pref === "dedicated gpu" && /dedicated/.test(specBlob)) { score += 14; reasons.push("It has a dedicated GPU."); }
    if (pref === "wireless" && /wireless|bluetooth/.test(specBlob)) score += 4;
    if (pref === "long battery") score += 3;
  }

  const kws = keywords(rawQuery);
  const blob = productText(p);
  const hits = kws.filter((k) => blob.includes(k)).length;
  score += Math.min(hits, 4) * 3;

  if (Number.isFinite(p.rating)) score += (p.rating - 3) * 3;

  return { score, reasons };
}

export function rankProducts(query, { limit = 6, intent: given } = {}) {
  const intent = given || parseQuery(query);
  const ranked = products
    .map((p) => ({ product: p, ...scoreProduct(p, intent, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return { intent, results: ranked };
}

export function listProducts({ q, category, minPrice, maxPrice, sort } = {}) {
  let items = products.slice();
  if (category && CATEGORIES.includes(category)) items = items.filter((p) => p.category === category);
  if (Number.isFinite(minPrice)) items = items.filter((p) => p.price >= minPrice);
  if (Number.isFinite(maxPrice)) items = items.filter((p) => p.price <= maxPrice);
  if (q) {
    const kws = keywords(q);
    if (kws.length) items = items.filter((p) => kws.some((k) => productText(p).includes(k)));
  }
  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  else if (sort === "rating") items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return items;
}
