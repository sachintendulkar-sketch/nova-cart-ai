import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config, ROOT } from "./config.js";
import { products, getProductById, CATEGORIES } from "./data/products.js";
import { listProducts } from "./search.js";
import { recommend, compareSummary } from "./ai.js";
import { aiConfigured, AiError } from "./gemini.js";
import { validateChat, validateRecommend, validateCompare } from "./validate.js";
import { buildCompareTable } from "../shared/compareTable.js";

export const app = express();
app.set("trust proxy", 1); // Render sits behind a proxy; needed for correct rate limiting
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    }
  })
);

const origins = config.allowedOrigin.split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : { origin: false })); // same-origin by default
app.use(express.json({ limit: "20kb" }));

const generalLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests. Please slow down." } });
const aiLimiter = rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: true, legacyHeaders: false, message: { error: "You are sending AI requests too quickly. Please wait a minute." } });
app.use("/api", generalLimiter);

const publicProduct = (p) => ({ ...p });

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiConfigured: aiConfigured(), model: aiConfigured() ? config.geminiModel : null, products: products.length });
});

app.get("/api/products", (req, res) => {
  const num = (v) => (v === undefined || v === "" ? NaN : Number(v));
  const items = listProducts({
    q: String(req.query.q || "").slice(0, 100),
    category: String(req.query.category || ""),
    minPrice: num(req.query.minPrice),
    maxPrice: num(req.query.maxPrice),
    sort: String(req.query.sort || "")
  });
  res.json({ count: items.length, categories: CATEGORIES, products: items.map(publicProduct) });
});

app.get("/api/products/:id", (req, res) => {
  const p = getProductById(req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found." });
  const similar = products.filter((x) => x.category === p.category && x.id !== p.id).sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 3);
  res.json({ product: publicProduct(p), similar: similar.map(publicProduct) });
});

app.post("/api/recommendations", aiLimiter, async (req, res) => {
  const v = validateRecommend(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const out = await recommend(v.value.query);
  res.json({ ...out, products: out.recommendations.map((r) => getProductById(r.productId)).filter(Boolean).map(publicProduct) });
});

app.post("/api/chat", aiLimiter, async (req, res) => {
  const v = validateChat(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const out = await recommend(v.value.message, v.value.history, v.value.productId);
  res.json({ ...out, products: out.recommendations.map((r) => getProductById(r.productId)).filter(Boolean).map(publicProduct) });
});

app.post("/api/compare", aiLimiter, async (req, res) => {
  const v = validateCompare(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const items = v.value.ids.map(getProductById);
  if (items.some((x) => !x)) return res.status(404).json({ error: "One of the selected products was not found." });
  const ai = await compareSummary(v.value.ids, v.value.useCase);
  res.json({ products: items.map(publicProduct), rows: buildCompareTable(items), ...ai });
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Unknown API route." }));

// Serve the built React app in production.
const dist = path.join(ROOT, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: "1h", index: false }));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
} else {
  app.get("/", (_req, res) => res.type("text").send("API is running. Run `npm run build` to create the website files, or use `npm run dev` for development."));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Request body must be valid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (err instanceof AiError) return res.status(err.status).json({ error: err.message });
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Something went wrong on the server." });
});

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`NovaCart AI listening on port ${config.port} (AI ${aiConfigured() ? "enabled, model " + config.geminiModel : "NOT configured"})`);
  });
}
