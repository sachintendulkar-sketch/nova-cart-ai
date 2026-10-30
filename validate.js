// Small hand-written validators (no extra dependencies). Each returns
// { ok: true, value } or { ok: false, error }.

export const LIMITS = { message: 600, historyItems: 10, historyText: 800, productIds: 4 };

const fail = (error) => ({ ok: false, error });

export function cleanText(input, max) {
  return String(input ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function validateChat(body) {
  if (!body || typeof body !== "object") return fail("Request body must be JSON.");
  const message = cleanText(body.message, LIMITS.message + 1);
  if (!message) return fail("Please type a message.");
  if (message.length > LIMITS.message) return fail(`Messages can be at most ${LIMITS.message} characters.`);
  let history = [];
  if (body.history !== undefined) {
    if (!Array.isArray(body.history)) return fail("history must be a list.");
    history = body.history
      .slice(-LIMITS.historyItems)
      .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.text === "string")
      .map((h) => ({ role: h.role, text: cleanText(h.text, LIMITS.historyText) }))
      .filter((h) => h.text);
  }
  const productId = typeof body.productId === "string" && /^[a-z]{2,4}-\d{3}$/.test(body.productId) ? body.productId : null;
  return { ok: true, value: { message, history, productId } };
}

export function validateRecommend(body) {
  if (!body || typeof body !== "object") return fail("Request body must be JSON.");
  const query = cleanText(body.query, LIMITS.message + 1);
  if (!query) return fail("Please enter what you are looking for.");
  if (query.length > LIMITS.message) return fail(`Queries can be at most ${LIMITS.message} characters.`);
  return { ok: true, value: { query } };
}

export function validateCompare(body) {
  if (!body || typeof body !== "object") return fail("Request body must be JSON.");
  if (!Array.isArray(body.productIds)) return fail("productIds must be a list.");
  const ids = [...new Set(body.productIds.filter((x) => typeof x === "string" && /^[a-z]{2,4}-\d{3}$/.test(x)))];
  if (ids.length < 2) return fail("Choose at least two products to compare.");
  if (ids.length > LIMITS.productIds) return fail(`You can compare up to ${LIMITS.productIds} products.`);
  const useCase = cleanText(body.useCase, 200);
  return { ok: true, value: { ids, useCase } };
}

/** Validate what Gemini returned. Only ids that exist in the catalog are kept. */
export function validateAiRecommendations(data, knownIds) {
  if (!data || typeof data !== "object") return null;
  const summary = typeof data.summary === "string" ? cleanText(data.summary, 900) : "";
  const recs = Array.isArray(data.recommendations) ? data.recommendations : [];
  const clean = recs
    .filter((r) => r && typeof r.productId === "string" && knownIds.has(r.productId))
    .slice(0, 5)
    .map((r) => ({
      productId: r.productId,
      reason: cleanText(r.reason, 400),
      assumption: r.assumption ? cleanText(r.assumption, 250) : null
    }))
    .filter((r) => r.reason);
  const needsClarification = typeof data.clarifyingQuestion === "string" && data.clarifyingQuestion.trim()
    ? cleanText(data.clarifyingQuestion, 250)
    : null;
  if (!summary && !clean.length && !needsClarification) return null;
  const missing = typeof data.missingInfo === "string" && data.missingInfo.trim() ? cleanText(data.missingInfo, 300) : null;
  return { summary, recommendations: clean, clarifyingQuestion: needsClarification, missingInfo: missing };
}

export function validateAiCompare(data) {
  if (!data || typeof data !== "object") return null;
  const summary = typeof data.summary === "string" ? cleanText(data.summary, 1200) : "";
  const bestFor = Array.isArray(data.bestFor)
    ? data.bestFor
        .filter((b) => b && typeof b.productId === "string" && typeof b.useCase === "string")
        .slice(0, 6)
        .map((b) => ({ productId: b.productId, useCase: cleanText(b.useCase, 120), why: cleanText(b.why, 300) }))
    : [];
  if (!summary) return null;
  const caveat = typeof data.caveat === "string" ? cleanText(data.caveat, 300) : null;
  return { summary, bestFor, caveat };
}
