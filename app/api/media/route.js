import * as store from "@/lib/store.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET() { return json({ media: await store.listMedia() }); }
export async function POST(req) {
  const d = await body(req);
  if (!d.image_url) return json({ error: "image_url required" }, 400);
  return json({ media: await store.addMedia(d) }, 201);
}
