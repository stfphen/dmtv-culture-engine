import * as store from "@/lib/store.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET(_req, { params }) {
  const item = await store.getItem(params.id);
  if (!item) return json({ error: "not found" }, 404);
  const summary = await store.getSummary(params.id);
  const score = await store.getScore(params.id);
  const ideas = await store.listIdeasForItem(params.id);
  const enriched = [];
  for (const idea of ideas) {
    enriched.push({ ...idea, caption: await store.getCaption(idea.id), preview: await store.getPreview(idea.id) });
  }
  return json({ item, summary, score, ideas: enriched });
}
export async function PATCH(req, { params }) { return json({ item: await store.updateItem(params.id, await body(req)) }); }
