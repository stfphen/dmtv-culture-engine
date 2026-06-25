# Validation checklist

## Automated (`npm test` — offline, mock mode)
All 12 pass on this build:

- [x] Source can be created
- [x] URL canonicalized (tracking params stripped)
- [x] Item can be ingested
- [x] Duplicate URL/hash does **not** create a duplicate item
- [x] Final score is within 0–100
- [x] Toronto/hip-hop item scores well (≥60)
- [x] Exactly **3** ideas generated per item
- [x] Score is saved
- [x] Idea has a format recommendation
- [x] Captions generated (Instagram + hashtags present)
- [x] SVG branded preview generated
- [x] Approval status can be changed to `approved`

Run: `npm test` → expects `RESULT: 12 passed, 0 failed`. Also writes `sample-preview.svg` to eyeball a template.

## Build
- [x] `npm run build` compiles cleanly (22 routes: 8 static, 14 dynamic).

## Live API smoke test (verified on this build)
- [x] `GET /api/sources` returns seeded sources
- [x] `POST /api/manual-import` (generate=true) → item + 3 ideas
- [x] `GET /api/approvals?status=needs_review` → 3 drafts
- [x] `GET /api/render/[ideaId]` → `200 image/svg+xml`
- [x] `PATCH /api/ideas/[id] {status:"approved"}` → moves to approved queue
- [x] All 7 dashboard pages return HTTP 200

## Manual QA to run after deploy
- [ ] `npm run migrate` against your Postgres succeeds (check `\dt` shows 11 tables)
- [ ] `npm run seed` inserts sources; re-running skips existing (idempotent)
- [ ] `POST /api/run` with correct `x-cron-secret` returns a run summary; wrong/missing secret → 401 (when CRON_SECRET set)
- [ ] Add a real RSS source in **Sources**, hit **Check now**, confirm items appear in **Culture Feed**
- [ ] With an AI key set, confirm summaries/scores read naturally (not heuristic phrasing) and `ai_model_used` shows the model
- [ ] Edit brand colors in **Settings**, confirm **Brand Templates** previews update
