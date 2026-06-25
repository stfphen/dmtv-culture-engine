import * as store from "@/lib/store.js";
import { json, body } from "@/lib/http.js";
export const dynamic = "force-dynamic";
export async function GET() { return json({ brand: await store.getBrand() }); }
export async function PATCH(req) { return json({ brand: await store.updateBrand(await body(req)) }); }
