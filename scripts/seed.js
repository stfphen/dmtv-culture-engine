import "./_env.js";
const store = await import("../lib/store.js");
const { SEED_SOURCES } = await import("../lib/culture-engine/seedSources.js");
const existing = await store.listSources();
const have = new Set(existing.map(s => s.name));
let n = 0;
for (const s of SEED_SOURCES) { if (have.has(s.name)) continue; await store.createSource(s); n++; }
await store.getBrand();
console.log(`Seeded ${n} sources (skipped ${SEED_SOURCES.length - n}). Templates: ${store.listTemplates().map(t => t.key).join(", ")}`);
