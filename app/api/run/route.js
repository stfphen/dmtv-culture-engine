import { runDailyPull } from "@/lib/culture-engine/runDailyPull.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(req) {
  // In production require the CRON_SECRET header. In dev (no secret set) allow.
  const secret = process.env.CRON_SECRET;
  if (secret && secret !== "change-me") {
    const got = req.headers.get("x-cron-secret");
    if (got !== secret) return json({ error: "unauthorized" }, 401);
  }
  try { return json(await runDailyPull()); }
  catch (e) { return json({ error: e.message }, 500); }
}
export const GET = POST; // allow Vercel/VPS cron GET trigger with header
