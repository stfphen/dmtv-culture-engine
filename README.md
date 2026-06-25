# DMTV Culture Engine

A content **intelligence and packaging** engine for DMTV — culture radar for Toronto nightlife, hip-hop, streetwear, and the creative scene. It watches approved sources, summarizes new items, scores them for DMTV fit, generates 3 branded content ideas + captions per item, renders a branded graphic preview, and routes everything to an approval dashboard for **manual** review and posting.

This is **not** an auto-posting bot and **not** a repost account. It produces original DMTV editorial packaging from culture signals.

> Runs out of the box in **mock mode** (no DB, no AI keys) so you can click through the whole flow immediately. Add Postgres + an AI key when you're ready for real output.

---

## Quick start (mock mode — zero setup)

```bash
npm install
npm run seed          # loads 11 example approved sources
npm run dev           # http://localhost:3000  -> redirects to /culture-engine
```

Then in the dashboard: **Overview → Run daily pull** (pulls live RSS) or **Culture Feed → Manual import** (paste any link). Drafts land in **Draft Queue** and **Approval Queue**.

In mock mode, data persists to `./data/store.json`. Summaries/scores/ideas/captions use deterministic heuristics so the UI is fully functional without spending on AI.

Run the offline pipeline test anytime:

```bash
npm test              # 12 checks: ingest, dedupe, scoring, 3 ideas, captions, SVG preview, approval
```

---

## Production setup (Next.js + self-hosted Postgres on your VPS)

1. **Start Postgres** (Docker compose included):

   ```bash
   docker compose up -d           # postgres:16 on :5432, user/pass/db = dmtv
   ```

2. **Configure env** — copy `.env.example` to `.env` and set at least `DATABASE_URL`:

   ```
   DATABASE_URL=postgres://dmtv:dmtv@localhost:5432/dmtv_culture
   ANTHROPIC_API_KEY=sk-ant-...        # or OPENAI_API_KEY (optional; omit for mock output)
   AI_PROVIDER=anthropic
   AI_MODEL=claude-sonnet-4-6
   CRON_SECRET=<a-long-random-string>  # protects /api/run in production
   ```

3. **Migrate + seed + build + start**:

   ```bash
   npm run migrate     # applies db/schema.sql (11 tables)
   npm run seed        # inserts example sources (skips any already present)
   npm run build
   npm start           # production server
   ```

The data layer auto-detects: `DATABASE_URL` set → Postgres; unset → in-memory/JSON. No code changes needed to switch.

---

## Daily pull (scheduling)

The pull is exposed three ways — use whichever fits your host:

- **HTTP**: `POST /api/run` with header `x-cron-secret: <CRON_SECRET>`
- **CLI on the box**: `npm run run:daily`
- **Dashboard button**: Overview → *Run daily pull*

Examples are in `deploy/cron.example` (VPS crontab) and `vercel.json` (Vercel Cron). The pull: loads active sources → fetches latest → normalizes URLs → dedupes (canonical URL + content hash) → summarizes → scores → generates draft packages for items scoring **65+** → logs the run (`culture_engine_runs`). Errors on one source never crash the run.

---

## How scoring works

Each item gets 0–10 subscores (culture fit, DMTV audience fit, Toronto relevance, hip-hop/music, streetwear/visual, nightlife/event, freshness, visual potential, conversation potential, originality, brand safety, rights safety). The weighted `final_score` (0–100) drives the recommendation:

| Score | Action |
|------|--------|
| 80–100 | `generate` — full draft package |
| 65–79 | `watchlist` — drafts on request |
| 50–64 | idea-only / low priority |
| < 50 | `archive` |
| Low brand/rights safety | **forced `needs_human_review`** (risk is gating, never auto-published) |

Weights live in `lib/culture-engine/score.js`.

---

## AI providers

`lib/culture-engine/ai.js` is provider-agnostic. With `ANTHROPIC_API_KEY` it calls Anthropic; with `OPENAI_API_KEY` it calls OpenAI; with neither it uses deterministic mock output. If a provider call fails or returns unparseable JSON, it falls back to mock so the pipeline never crashes. Six **separate** single-purpose prompts (summarize, score, ideas, captions, template copy, risk) live in `lib/culture-engine/prompts.js` — never one mega-prompt.

---

## Branding & graphics

Brand config lives in `culture_brand_settings` (editable in **Settings**) with a default in `lib/brand.js`. Three SVG templates render server-side (`lib/culture-engine/renderTemplate.js`): **Culture Radar**, **DMTV Take**, **Event / Scene Watch** — black background, electric-red accent, nightlife-flyer energy, DMTV watermark. Previews are stored per idea and served at `/api/render/[ideaId]` (add `?download=1` to download the SVG).

**Replace the logo:** set `logo_url` in Settings (or `lib/brand.js`). With it blank, the `logo_text` ("DMTV") wordmark is used.

---

## Rights & safety (built in)

Store links + attribution; prefer original commentary over copied text; never store full copyrighted articles unless the feed provides them and usage allows; never download/repost creator media without permission; never strip watermarks; distinguish fact from speculation; flag risky items for human review. Every idea carries a `rights_notes` field. Social/manual-tracker sources produce commentary + link references only.

---

## v0.2 — Visual engine, media library, expanded sources

**Real DMTV brand.** Templates now match the deck system: black background, white Helvetica-style caps, **Poppins** secondary, **gold** lightning accent, and your DM logo embedded from `public/brand/dmtv-logo.png`. Replace that file with your exact logo (same path) for a 1:1 mark. Brand colors/logo are editable in **Settings**.

**Rights-safe visual sourcing** (`lib/culture-engine/visual.js`). For each item the engine picks one on-brand background image, preferring publishable sources in this order:

1. **DMTV Media Library** — your owned uploads (add in the **Media Library** tab; drop files in `public/media/` and reference `/media/name.jpg`). Zero rights risk. Matched to items by tag.
2. **AI-generated originals** — only if `OPENAI_API_KEY` is set (uses `IMAGE_MODEL`). Unique, no licensing.
3. **Licensed stock** — Pexels / Unsplash via free API keys (`PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`), keyed to the item's topic. Attribution stored automatically.
4. **Source image** — the article's own og:image is kept as **reference only**, flagged and **never** baked into a published graphic.

The chosen image is composited under a dark gradient scrim with the headline + logo. Each draft shows the visual's provider, rights, and attribution; reference-only images are marked "not cleared to publish." Instagram/TikTok stay manual-import + commentary/reference only — the engine never scrapes or recreates copyrighted social posts.

**Expanded sources** — ~28 seeds across RSS (Pitchfork, Stereogum, FADER, XXL, HipHopDX, Hypebeast, Highsnobiety, Complex, Dazed, Sneaker News…), Reddit (r/hiphopheads, r/streetwear, r/toronto…), Toronto/local (BlogTO, NOW, Exclaim!, RA Toronto), plus YouTube-as-RSS, podcast, and social-tracker placeholders you fill in.

**New env keys:** `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`, `IMAGE_MODEL` (see `.env.example`). All optional — the engine degrades to text-only cards without them. A 12th table, `culture_media`, backs the library.

---

## Project map

```
db/schema.sql                 11 tables (sources, items, summaries, scores, ideas, captions,
                              templates, previews, approvals, runs, brand settings)
lib/db.js                     Postgres pool (lazy)
lib/store.js                  Unified data layer — Postgres OR in-memory/JSON
lib/brand.js                  Default brand config, categories, source types
lib/culture-engine/
  normalize.js                URL canonicalization + content hashing (dedupe)
  ai.js, prompts.js           Provider abstraction + 6 single-purpose prompts
  summarize.js  score.js      Summary + 0–100 scoring (AI or heuristic)
  generateIdeas.js            Exactly 3 ideas (safe / DMTV take / aesthetic)
  generateCaptions.js         IG, TikTok, Shorts, X, Story, hashtags
  renderTemplate.js           3 SVG templates + format→template mapping
  pipeline.js                 Per-item: summarize→score→ideas→captions→preview→approval
  runDailyPull.js             Orchestrator + single-source check
  sources/{rss,youtube,manual,events}.js   Ingestion adapters
app/culture-engine/*          Dashboard: Overview, Sources, Feed, Drafts, Approvals, Templates, Settings
app/api/*                     Route handlers
scripts/{migrate,seed,run-daily,test-pipeline}.js
```

See `VALIDATION.md` for the test checklist and `LIMITATIONS.md` for known gaps + next build steps.
