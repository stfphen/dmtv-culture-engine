import * as store from "@/lib/store.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const status = new URL(req.url).searchParams.get("status") || undefined;
  const approvals = await store.listApprovals({ status });
  const out = [];
  for (const a of approvals) {
    const idea = await store.getIdea(a.idea_id); if (!idea) continue;
    const item = await store.getItem(a.item_id);
    out.push({ approval: a, idea, item, caption: await store.getCaption(idea.id), preview: await store.getPreview(idea.id), score: item ? await store.getScore(item.id) : null });
  }
  return json({ approvals: out });
}
