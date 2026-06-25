import * as store from "@/lib/store.js";
import { fetchManual } from "@/lib/culture-engine/sources/manual.js";
import { canonicalizeUrl, contentHash } from "@/lib/culture-engine/normalize.js";
import { summarizeAndScore, generateDraftsForItem } from "@/lib/culture-engine/pipeline.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req) {
  const d = await body(req);
  if (!d.url && !d.title) return json({ error: "url or title required" }, 400);
  const sources = await store.listSources();
  const manualSrc = sources.find(s => s.id === d.source_id) || sources.find(s => s.source_type === "manual") || { id: null, name: "Manual", category_tags: d.category_tags || [] };
  const [raw] = await fetchManual(d);
  const canonical_url = canonicalizeUrl(raw.original_url || `manual:${Date.now()}`);
  const hash = contentHash({ title: raw.title, canonical_url, raw_excerpt: raw.raw_excerpt });
  const { item, duplicate } = await store.createItem({
    ...raw, source_id: manualSrc.id, source_name: manualSrc.name, source_type: "manual",
    canonical_url, content_hash: hash, source_category_tags: d.category_tags || manualSrc.category_tags || [] });
  if (duplicate) return json({ item, duplicate: true });
  const { score } = await summarizeAndScore(item);
  if (d.generate) await generateDraftsForItem(item.id);
  return json({ item, score, generated: !!d.generate });
}
