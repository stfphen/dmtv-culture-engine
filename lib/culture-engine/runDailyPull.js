import * as store from "../store.js";
import { canonicalizeUrl, contentHash } from "./normalize.js";
import { fetchRss } from "./sources/rss.js";
import { fetchYouTube } from "./sources/youtube.js";
import { fetchEvents } from "./sources/events.js";
import { summarizeAndScore, generateDraftsForItem } from "./pipeline.js";

const DRAFT_THRESHOLD = 65;

async function fetchForSource(source) {
  switch (source.source_type) {
    case "rss":
    case "podcast_rss":
    case "website":
    case "news_search":
      return fetchRss(source);
    case "youtube_channel":
    case "youtube_search":
      return fetchYouTube(source);
    case "event":
      return fetchEvents(source);
    default:
      return []; // manual / social_tracker / internal_upload are imported via dashboard
  }
}

export async function runDailyPull({ generateDrafts = true } = {}) {
  const run = await store.createRun();
  const errors = [];
  let found = 0, created = 0, summarized = 0, scored = 0, drafts = 0;

  const sources = await store.listSources({ activeOnly: true });
  for (const source of sources) {
    try {
      const raw = await fetchForSource(source);
      found += raw.length;
      for (const r of raw) {
        const canonical_url = canonicalizeUrl(r.original_url);
        const hash = contentHash({ title: r.title, canonical_url, raw_excerpt: r.raw_excerpt });
        const { item, duplicate } = await store.createItem({
          ...r, source_id: source.id, source_name: source.name, source_type: source.source_type,
          canonical_url, content_hash: hash, source_category_tags: source.category_tags,
          detected_region: (source.region_tags || [])[0] || null,
        });
        if (duplicate) continue;
        created++;
        try {
          const { score } = await summarizeAndScore(item);
          summarized++; scored++;
          if (generateDrafts && (score.final_score || 0) >= DRAFT_THRESHOLD && score.recommendation !== "needs_human_review") {
            await generateDraftsForItem(item.id);
            drafts++;
          }
        } catch (e) {
          errors.push({ stage: "process", item: item.id, source: source.name, error: e.message });
          await store.updateItem(item.id, { ingestion_status: "failed", error_message: e.message });
        }
      }
      await store.updateSource(source.id, { last_checked_at: new Date().toISOString(), last_error: null });
    } catch (e) {
      errors.push({ stage: "fetch", source: source.name, error: e.message });
      await store.updateSource(source.id, { last_checked_at: new Date().toISOString(), last_error: e.message });
    }
  }

  const result = {
    status: errors.length ? "partial" : "success", finished_at: new Date().toISOString(),
    sources_checked: sources.length, items_found: found, items_created: created,
    items_summarized: summarized, items_scored: scored, drafts_generated: drafts, errors,
  };
  await store.updateRun(run.id, result);
  return { run_id: run.id, ...result };
}

// Process one source on demand (dashboard "Check now" button).
export async function checkSource(sourceId, { generateDrafts = true } = {}) {
  const source = await store.getSource(sourceId);
  if (!source) throw new Error("source not found");
  let found = 0, created = 0, drafts = 0; const errors = [];
  try {
    const raw = await fetchForSource(source); found = raw.length;
    for (const r of raw) {
      const canonical_url = canonicalizeUrl(r.original_url);
      const hash = contentHash({ title: r.title, canonical_url, raw_excerpt: r.raw_excerpt });
      const { item, duplicate } = await store.createItem({
        ...r, source_id: source.id, source_name: source.name, source_type: source.source_type,
        canonical_url, content_hash: hash, source_category_tags: source.category_tags,
        detected_region: (source.region_tags || [])[0] || null });
      if (duplicate) continue; created++;
      const { score } = await summarizeAndScore(item);
      if (generateDrafts && (score.final_score || 0) >= DRAFT_THRESHOLD && score.recommendation !== "needs_human_review") {
        await generateDraftsForItem(item.id); drafts++;
      }
    }
    await store.updateSource(source.id, { last_checked_at: new Date().toISOString(), last_error: null });
  } catch (e) {
    errors.push(e.message);
    await store.updateSource(source.id, { last_checked_at: new Date().toISOString(), last_error: e.message });
  }
  return { source: source.name, items_found: found, items_created: created, drafts_generated: drafts, errors };
}
