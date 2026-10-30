// Small helpers shared by the server and the React app.

export function formatINR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "Not available";
  return "₹" + n.toLocaleString("en-IN");
}

const USE_CASE_LABELS = {
  "video-editing": "video editing",
  "machine-learning": "machine learning",
  "work-from-home": "working from home",
  programming: "programming",
  gaming: "gaming",
  student: "students",
  travel: "travel",
  office: "office work",
  photography: "photography",
  fitness: "fitness",
  music: "music",
  commuting: "commuting",
  design: "design",
  budget: "budget buyers",
  work: "work"
};

export function humanizeUseCase(slug) {
  return USE_CASE_LABELS[slug] || String(slug).replace(/-/g, " ");
}
