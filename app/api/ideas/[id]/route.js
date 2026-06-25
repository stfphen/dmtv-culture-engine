import * as store from "@/lib/store.js";
import { generateCaptions } from "@/lib/culture-engine/generateCaptions.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function PATCH(req, { params }) {
  const d = await body(req);
  const idea = await store.updateIdea(params.id, d);
  if (d.status) await store.upsertApproval(params.id, idea.item_id, d.status);
  return json({ idea });
}
// POST = regenerate captions for this idea
export async function POST(_req, { params }) {
  const idea = await store.getIdea(params.id);
  if (!idea) return json({ error: "not found" }, 404);
  const item = await store.getItem(idea.item_id);
  const captions = await generateCaptions(item, idea);
  await store.saveCaption(params.id, captions);
  return json({ caption: captions });
}
