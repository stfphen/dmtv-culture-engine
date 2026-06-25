# Limitations & next build steps

## What's built (MVP — Priority 1 + most of Priority 2)
Source CRUD + manual import, RSS ingestion, URL normalization + dedupe, summary + 0–100 scoring, 3 ideas + multi-platform captions per item, 3 branded SVG templates with per-idea previews, full approval dashboard (Sources, Culture Feed, Draft Queue, Approval Queue, Brand Templates, Settings), daily-pull script + API route + dashboard button, run logs, filters, brand settings, 11-table Postgres schema with a zero-setup in-memory fallback, seed data, and an offline test suite.

## Known limitations
- **Graphics are SVG**, not raster. They render in the browser and download as `.svg`. Most schedulers want PNG/JPG — see next steps for adding a rasterizer.
- **YouTube adapter** needs `YOUTUBE_API_KEY`. Without it, YouTube sources are skipped gracefully (tip: many channels expose an RSS feed at `youtube.com/feeds/videos.xml?channel_id=...` — add that as an `rss` source instead).
- **Event auto-fetch** (Resident Advisor, Eventbrite) is not implemented; the data model + manual import support events today. RA/Eventbrite often lack open feeds.
- **Instagram / TikTok** have no API ingestion (platform-restricted). Use **Manual import** — by design these create commentary drafts + link references only.
- **Seed source URLs are starting points.** Verify each feed is live and that usage complies with the source's terms before relying on it. Some feed paths (e.g. Complex section feeds) change.
- **No auth** on the dashboard. Put it behind your VPS reverse-proxy auth / VPN, or add middleware before exposing publicly.
- **Mock scoring is keyword-based.** Good for demo + a sensible baseline, but real taste-level scoring needs an AI key.
- **No automated tests for the React UI** — coverage is at the engine + API layer.
- **In-memory mode is single-process** (JSON file). Fine for one box / demo; use Postgres for concurrency.

## Suggested next steps (Priority 2/3)
1. **Rasterize previews** — add `@resvg/resvg-js` or `sharp` + `satori` to emit PNG at `/api/render/[ideaId].png` for direct upload to schedulers.
2. **YouTube via RSS** — auto-convert `youtube_channel` sources to the channel RSS feed so they work without an API key.
3. **Event adapters** — Eventbrite API + RA scraping-with-care for Toronto nightlife.
4. **Auth + roles** — editor vs admin, audit trail on approvals (`decided_by` is already in the schema).
5. **Inline caption editing** — persist hand-edited captions before export (UI hook exists; add a save endpoint).
6. **More templates** — Rollout Breakdown, Aesthetic Breakdown, Quote Pull, Weekend Map (renderer is pluggable via `RENDERERS`).
7. **Source performance scoring** — feed approve/reject outcomes back into `priority_score` to learn which sources surface keepers.
8. **Export integrations** — push approved packages to a scheduler (Later, Metricool) or a Notion/Sheet board.
9. **Dedupe v2** — near-duplicate detection (title similarity / embeddings) beyond exact canonical-URL + hash.
10. **Client/campaign layer** — tie strong drafts to DGTL client outreach and campaign opportunities.
