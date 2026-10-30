import { config } from "./config.js";

export class AiError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code; // "no_key" | "timeout" | "rate_limit" | "provider" | "bad_output"
    this.status = status;
  }
}

export function aiConfigured() {
  return Boolean(config.geminiApiKey);
}

/**
 * Call Gemini's generateContent REST endpoint from the server only.
 * The key is sent in a header, never put in a URL, a log line or a response.
 */
export async function generate({ system, contents, json = true, temperature = 0.3 }) {
  if (!aiConfigured()) {
    throw new AiError("no_key", "The AI service is not configured. Add GEMINI_API_KEY on the server.", 503);
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 1400,
      ...(json ? { responseMimeType: "application/json" } : {})
    }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": config.geminiApiKey },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") throw new AiError("timeout", "The AI service took too long to respond.", 504);
    throw new AiError("provider", "Could not reach the AI service.", 502);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) throw new AiError("rate_limit", "The AI service is busy right now. Please try again shortly.", 429);
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new AiError("provider", "The AI service rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL.", 502);
  }
  if (res.status === 404) {
    throw new AiError("provider", `The model "${config.geminiModel}" was not found. Set GEMINI_MODEL to a current model name.`, 502);
  }
  if (!res.ok) throw new AiError("provider", "The AI service returned an error.", 502);

  let data;
  try { data = await res.json(); } catch { throw new AiError("bad_output", "The AI service returned an unreadable response.", 502); }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  if (!text.trim()) throw new AiError("bad_output", "The AI service returned an empty answer.", 502);
  if (!json) return text;
  try {
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
  } catch {
    throw new AiError("bad_output", "The AI answer was not in the expected format.", 502);
  }
}
