// Connectivity check: confirms the engine's Claude/AI + image providers are wired.
// Usage: npm run check:ai
import "./_env.js";
import { aiMode, modelName, runAI } from "../lib/culture-engine/ai.js";

const has = k => (process.env[k] ? "set" : "—");
console.log("\nDMTV Culture Engine — provider check\n");
console.log("  ANTHROPIC_API_KEY:", has("ANTHROPIC_API_KEY"));
console.log("  OPENAI_API_KEY:   ", has("OPENAI_API_KEY"));
console.log("  GEMINI_API_KEY:   ", has("GEMINI_API_KEY"), "(image gen — Nano Banana)");
console.log("  PEXELS_API_KEY:   ", has("PEXELS_API_KEY"));
console.log("  UNSPLASH_ACCESS_KEY:", has("UNSPLASH_ACCESS_KEY"));
console.log("\n  Text engine mode:", aiMode(), "· model:", modelName());

if (aiMode() === "mock") {
  console.log("\n  ⚠ Running in MOCK mode — copy is heuristic placeholder.");
  console.log("    Add ANTHROPIC_API_KEY to .env to run the culture desk on Claude.\n");
  process.exit(0);
}

console.log("\n  Testing a live call…");
const r = await runAI({
  system: "You are a terse assistant. Reply ONLY with JSON.",
  prompt: 'Return {"ok": true, "brand": "DMTV"} exactly.',
  expectJson: true,
  mockFn: () => ({ ok: false }),
});
if (r.mode.includes("mock")) {
  console.log("  ✗ Live call failed, fell back to mock:", r.error || "(unknown)");
  process.exit(1);
}
console.log(`  ✓ Live ${r.mode} call OK via ${r.model}. Parsed:`, JSON.stringify(r.data));
console.log("\n  The engine is running on real AI. You're out of mock mode.\n");
