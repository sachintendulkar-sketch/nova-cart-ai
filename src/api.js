// All network calls live here. The browser never sees an AI key.
async function request(path, options) {
  let res;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status}).`);
  return data;
}

export const api = {
  health: () => request("/api/health"),
  products: () => request("/api/products"),
  product: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  recommend: (query) => request("/api/recommendations", { method: "POST", body: JSON.stringify({ query }) }),
  chat: (message, history, productId) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message, history, productId }) }),
  compare: (productIds, useCase) =>
    request("/api/compare", { method: "POST", body: JSON.stringify({ productIds, useCase }) })
};
