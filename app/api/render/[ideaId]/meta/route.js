import * as store from "@/lib/store.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET(_req, { params }) {
  const p = await store.getPreview(params.ideaId);
  if (!p) return json({ error: "not found" }, 404);
  const slides = Array.isArray(p.fields?.slides) ? p.fields.slides.length : 0;
  return json({ template_key: p.template_key, slides, asset_type: p.fields?.asset_type || "post" });
}
