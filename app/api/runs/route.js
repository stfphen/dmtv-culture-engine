import * as store from "@/lib/store.js";
import { json } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET() { return json({ runs: await store.listRuns() }); }
