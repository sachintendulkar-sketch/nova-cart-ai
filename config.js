import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..");

// Tiny .env reader so local development needs no extra package.
// Values already set in the real environment (for example on Render) win.
function loadEnvFile() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

loadEnvFile();

export const config = {
  port: Number(process.env.PORT) || 8787,
  geminiApiKey: (process.env.GEMINI_API_KEY || "").trim(),
  geminiModel: (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim(),
  allowedOrigin: (process.env.ALLOWED_ORIGIN || "").trim(),
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 20000
};
