import * as store from "@/lib/store.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const u = new URL(req.url);
  const items = await store.listItems({
    status: u.searchParams.get("status") || undefined,
    category: u.searchParams.get("category") || undefined,
    sourceId: u.searchParams.get("sourceId") || undefined,
    minScore: u.searchParams.get("minScore") ? Number(u.searchParams.get("minScore")) : undefined,
  });
  return json({ items });
}
