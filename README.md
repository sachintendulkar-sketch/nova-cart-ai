# NovaCart AI

An AI-assisted shopping website. Describe what you need ("a laptop for programming and machine learning under ₹70,000") and Nova recommends products from the catalog, explains why, and compares them side by side.

**Important:** the 24 products are a **demo catalog** with invented brands, prices and ratings. Nothing here is live retailer data.

## What is inside

| Part | Technology |
| --- | --- |
| Website | React 18 + Vite, Framer Motion, Lucide icons, plain CSS |
| Server | Node.js + Express (also serves the built website) |
| AI | Google Gemini, called **only from the server** |
| Storage | Wishlist and settings in the browser (localStorage) |

```
novacart-ai/
├── package.json        scripts and dependencies
├── vite.config.js      build settings
├── index.html          page shell
├── render.yaml         optional Render blueprint
├── .env.example        names of the settings you can configure
├── shared/             code used by both server and website
├── server/             Express API, catalog, ranking, Gemini client
│   └── data/products.js   <- the demo catalog (edit or replace this)
└── src/                React website (components, styles, hooks)
```

## Features and how they behave

- **Search and filters:** text search, category chips, price range, sort, load more, clear filters.
- **AI assistant and hero search:** the server reads budget, category and use case from your sentence, ranks catalog products by real fields, sends only the top matches to Gemini, then checks the answer. Product ids that are not in the catalog and products above your budget are removed.
- **No AI key? Still works.** Without `GEMINI_API_KEY`, or if Gemini fails, you get a clearly labeled catalog-based answer instead of an error screen.
- **Compare:** 2 to 4 products, built from catalog fields. Missing values show "Not available". The AI summary is optional.
- **Wishlist:** saved in your browser and kept after refresh. It does **not** sync between devices (there are no accounts).
- **Responses are not streamed;** the full reply appears when ready.

## Run it on your computer (optional)

1. Install Node.js 20 or newer from nodejs.org.
2. In the project folder run:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file named `.env` and paste your Gemini key after `GEMINI_API_KEY=` (get one at https://aistudio.google.com/apikey). Skip this to try catalog-only mode.
4. Start two terminals:
   ```
   npm run dev:server     # API on http://localhost:8787
   npm run dev            # website on http://localhost:5173
   ```
   Open http://localhost:5173.

To test the production version: `npm run build` then `npm start`, and open http://localhost:8787.

## Put it on GitHub (no Git needed)

1. Unzip the project. Open the folder until you can see `package.json`, `server`, `src`, `shared`.
2. On github.com click **+ → New repository**, name it, choose **Public**, leave the checkboxes empty, **Create repository**.
3. Click **uploading an existing file** and drag in everything **inside** the folder (not the zip, not the outer folder). Use Chrome or Edge.
4. **Check before you commit.** The file list must show `server`, `src`, `shared`, `package.json`, `package-lock.json`, `vite.config.js`, `index.html`. If a folder is missing, upload it again with **Add file → Upload files**.
5. Click **Commit changes**.

Never upload a file named `.env`. It holds your secret key. (`.gitignore` blocks it when you use Git, but the website uploader does not read it.)

## Deploy on Render

1. On render.com choose **New + → Web Service** and connect the GitHub repo.
2. Settings:
   - **Language:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. Under **Environment Variables** add:
   - `GEMINI_API_KEY` = your key (paste it here, never in code)
   - `NODE_VERSION` = `20.18.0`
   - `GEMINI_MODEL` = optional; defaults to `gemini-3.8-flash`
4. Under **Advanced**, set **Health Check Path** to `/api/health`.
5. Click **Create Web Service**. When it says **Live**, open the link.
6. Check `https://YOUR-SITE.onrender.com/api/health`. It should show `"aiConfigured": true`.

The free tier sleeps when idle, so the first visit after a pause can take about a minute.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Build fails with "Cannot find module" or a missing folder | A folder did not upload to GitHub. Compare your repo with the structure above and upload the missing one. |
| Site says "AI key not set" | Add `GEMINI_API_KEY` in Render → Environment, then redeploy. |
| AI says the model was not found or rejected the request | Google retires model names. Open https://ai.google.dev/models, pick a current text model, set `GEMINI_MODEL`. Also confirm the key is valid. |
| "The AI service is busy" | Gemini rate limit. Wait a minute. Nova falls back to catalog search meanwhile. |
| Page is blank after deploy | Open the Render logs. The build must finish with `built in …s`. Make sure the Build Command is exactly `npm install && npm run build`. |
| Wishlist is empty on another device | Expected. It is stored per browser. |
| Port errors | Do not set `PORT` on Render. The server reads it automatically. |

## Security notes

- The Gemini key is read only in `server/config.js` and sent in a request header from the server. It is not in the website bundle.
- Requests are limited: 120 per minute for the API and 12 per minute for AI calls per visitor, messages up to 600 characters, request bodies up to 20 KB.
- Helmet adds security headers and a content security policy. CORS is closed unless you set `ALLOWED_ORIGIN`.
- User text is sent to the model as quoted data and is never rendered as HTML.

## Using real products later

Replace `server/data/products.js` with a loader that reads an authorized retailer feed or API and returns objects with the same fields (`id`, `name`, `brand`, `category`, `price`, `currency`, `image`, `description`, `specifications`, `rating`, `ratingCount`, `source`, `productUrl`, `lastUpdated`, plus `useCases`, `pros`, `cons`). Do not scrape retailer sites without permission.
