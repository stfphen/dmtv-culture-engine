import * as store from "@/lib/store.js";
import { json } from "@/lib/http.js";
export async function GET() { return json({ templates: store.listTemplates() }); }
