import { checkSource } from "@/lib/culture-engine/runDailyPull.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(_req, { params }) {
  try { return json(await checkSource(params.id)); }
  catch (e) { return json({ error: e.message }, 500); }
}
