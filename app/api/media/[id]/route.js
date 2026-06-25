import * as store from "@/lib/store.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function DELETE(_req, { params }) { await store.deleteMedia(params.id); return json({ ok: true }); }
