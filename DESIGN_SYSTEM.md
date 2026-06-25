# DMTV Design System — spec for Claude Design

*Feed this file (plus `public/brand/dmtv-logo.png`, the DMTV×DGTL deck, and this repo) into **Claude Design** so it locks the DMTV system and produces handoff bundles Claude Code can drop straight into `lib/culture-engine/renderTemplate.js` and the dashboard. This is the source of truth for tokens, components, and what to design next.*

---

## Brand foundations

DMTV is the culture/distribution arm of DGTL (Toronto). Voice: confident, concise, culture-aware, never corny. Visual register from the deck: **black, heavy Helvetica-grade caps, Poppins secondary, a gold lightning accent.** Premium = restraint + insider authority (think Highsnobiety/SSENSE), not loud-repost energy. Reference `DMTV_CONTENT_STRATEGY.md` for the editorial logic.

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--dmtv-black` | `#0A0A0A` | primary background |
| `--dmtv-paper` | `#F5F5F0` | primary text (off-white, not pure white) |
| `--dmtv-gold` | `#E8C24A` | accent — a *spark*, not a fill (labels, rules, "swipe", CTAs) |
| `--dmtv-panel` | `#141414` | dashboard surfaces |
| `--dmtv-panel-2` | `#1D1D1D` | inputs, secondary surfaces |
| `--dmtv-line` | `#2A2A2A` | borders/dividers |
| Heading font | Helvetica Neue / Helvetica / Arial **Bold–Black**, UPPERCASE, tight tracking | hooks, labels, headlines |
| Body font | **Poppins** (fallback Helvetica/Arial) | summaries, slide bodies, captions |

> Note for Claude Design: the **graphics** use the gold accent (`#E8C24A`); the **dashboard CSS** (`app/globals.css`) currently uses a red accent (`#e11d2a`). Unifying the dashboard to gold is a desirable cleanup — flag it in the handoff.

## Logo

`public/brand/dmtv-logo.png` — the "DM" + gold lightning mark. Placement: bottom-left, ~120px on a 1080 canvas, small and consistent (mark of authenticity, not a billboard). Replace the file for a 1:1 production asset. Define how the wordmark behaves **in motion** over footage (the system should extend to Reels, not just static).

## Component inventory (current SVG templates → redesign targets)

All 1080×1080 unless noted. Each is a function in `lib/culture-engine/renderTemplate.js`; Claude Design should produce improved layouts for these exact slots so the handoff maps 1:1.

1. **Culture Radar Card** — fields: `headline, category_label, short_summary, source_attribution, date, bg_image`. Signal: sends. News/drops/updates.
2. **DMTV Take** — `big_hook, take, source_attribution, bg_image` + a gold "DMTV TAKE" tab. Signal: comments. Commentary.
3. **Scene Watch** — `headline, when_where, why_it_matters, cta, bg_image`. Signal: saves. Nightlife/events.
4. **Aesthetic / Mood** — `label, headline, source_attribution, bg_image`. Image-forward. Signal: saves.
5. **Quote Card** — `quote, attribution, bg_image` + oversized gold quotation mark. Signal: sends.
6. **Carousel** — multi-slide: **cover** (`label, cover_hook, "Swipe →"`) → **value slides** (`NN index, heading, body`) → **outro** (`cta, footer`). 4–8 slides. Signal: saves. *Consider a 1080×1350 portrait variant for feed.*

Shared chrome: left gold accent bar (12px), dark gradient scrim over any background image for legibility, logo bottom-left, `@dmtv` footer bottom-right, optional film-grain overlay.

## Dashboard surfaces (Next.js App Router, `app/culture-engine/*`)

Tabs to (re)design: **Overview, Sources, Culture Feed, Draft Queue, Approval Queue, Media Library, Brand Templates, Settings**, plus the reusable **IdeaCard** (asset-type badge, signal pill, carousel slide viewer, caption rows with copy, PNG/SVG download, approve/reject). Current theme is dark; align accent to gold. A future **Franchise Calendar** tab is planned — design it speculatively.

## What to design next (priorities for Claude Design)

1. **Premium template refresh** of the 6 components above — stronger type hierarchy, better image treatment, a portrait carousel variant. Output → handoff into `renderTemplate.js`.
2. **A motion spec** for the wordmark + lower-thirds over vertical video (Reels/TikTok/Shorts).
3. **Dashboard polish** — unify to gold, tighten IdeaCard, design the Franchise Calendar.
4. **Quote-card + mood-grid families** with 2–3 layout variants each so the feed reads intentional, not templated.

## Handoff target

Claude Design's bundle should map to: SVG/HTML template functions in `lib/culture-engine/renderTemplate.js` (server-rendered, exported to PNG via `@resvg/resvg-js`) and React components in `app/`. Keep everything single-file and dependency-light to match the existing build.
