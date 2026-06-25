import * as store from "@/lib/store.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET() { return json({ sources: await store.listSources() }); }
export async function POST(req) {
  const d = await body(req);
  if (!d.name || !d.source_type) return json({ error: "name and source_type required" }, 400);
  return json({ source: await store.createSource(d) }, 201);
}
