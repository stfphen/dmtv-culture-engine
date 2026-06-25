import * as store from "@/lib/store.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function PATCH(req, { params }) { return json({ source: await store.updateSource(params.id, await body(req)) }); }
export async function DELETE(_req, { params }) { await store.deleteSource(params.id); return json({ ok: true }); }
