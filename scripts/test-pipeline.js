// Offline smoke test of the engine (mock AI mode, no DATABASE_URL).
// Run: npm test
async function main() {
  delete process.env.DATABASE_URL; // force mock store
  delete process.env.ANTHROPIC_API_KEY; delete process.env.OPENAI_API_KEY; // force mock AI
  const store = await import("../lib/store.js");
  const { canonicalizeUrl, contentHash } = await import("../lib/culture-engine/normalize.js");
  const { generateDraftsForItem } = await import("../lib/culture-engine/pipeline.js");
  const { computeFinal, heuristicSubscores } = await import("../lib/culture-engine/score.js");

  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) { pass++; console.log("  PASS", name); } else { fail++; console.log("  FAIL", name); } };

  // 1. source
  const src = await store.createSource({ name: "Test Source", source_type: "manual", category_tags: ["hip_hop","streetwear","toronto"] });
  ok("source created", !!src.id);

  // 2. ingest item
  const url = "https://example.com/artist-x-rollout?utm_source=ig#top";
  const canonical = canonicalizeUrl(url);
  ok("url canonicalized (tracking stripped)", canonical === "https://example.com/artist-x-rollout");
  const hash = contentHash({ title: "Artist X announces new project", canonical_url: canonical, raw_excerpt: "visual campaign" });
  const { item, duplicate } = await store.createItem({
    source_id: src.id, source_name: src.name, source_type: "manual",
    original_url: url, canonical_url: canonical, content_hash: hash,
    title: "Artist X announces new project with visual campaign",
    raw_excerpt: "Toronto rap artist X rolls out a streetwear-heavy visual campaign with teaser clips.",
    raw_text: "Toronto rap artist X is rolling out a new project with a strong visual identity, teaser clips, and streetwear promo. Nightlife event announced.",
    published_at: new Date().toISOString(), thumbnail_url: "https://example.com/x.jpg",
    source_category_tags: ["hip_hop","streetwear","toronto","nightlife"],
  });
  ok("item created", !!item.id && !duplicate);

  // 3. dedupe
  const dup = await store.createItem({ source_id: src.id, original_url: url, canonical_url: canonical, content_hash: hash, title: "dupe" });
  ok("duplicate URL/hash blocked", dup.duplicate === true);

  // 4. scoring math sanity
  const sub = heuristicSubscores(item, null);
  const fin = computeFinal(sub);
  ok("final score 0-100", fin.final_score >= 0 && fin.final_score <= 100);
  ok("Toronto/hip-hop item scores well (>=60)", fin.final_score >= 60);

  // 5. full asset package
  const { ideaIds, score, franchise } = await generateDraftsForItem(item.id);
  ok("package generated (>=4 assets)", ideaIds.length >= 4);
  ok("franchise routed", !!franchise);
  ok("score saved", !!score && typeof score.final_score === "number");

  const ideas = await store.listIdeasForItem(item.id);
  const types = ideas.map(i => i.asset_type);
  ok("package has a carousel", types.includes("carousel"));
  ok("package has a quote_card", types.includes("quote_card"));
  ok("assets carry target_signal", ideas.some(i => !!i.target_signal));

  const idea0 = ideas[0];
  const cap = await store.getCaption(idea0.id);
  ok("captions generated (IG + hashtags)", !!cap.instagram && Array.isArray(cap.hashtags) && cap.hashtags.length > 0);
  const prev = await store.getPreview(idea0.id);
  ok("svg preview generated", !!prev.svg && prev.svg.includes("<svg"));

  const carousel = ideas.find(i => i.asset_type === "carousel");
  const cprev = await store.getPreview(carousel.id);
  ok("carousel has multiple slides", Array.isArray(cprev.fields.slides) && cprev.fields.slides.length >= 3);

  // 6. approval status change
  await store.updateIdea(idea0.id, { status: "approved" });
  await store.upsertApproval(idea0.id, item.id, "approved");
  const appr = (await store.listApprovals({ status: "approved" })).find(a => a.idea_id === idea0.id);
  ok("approval status updates to approved", !!appr);

  // write a sample SVG so you can eyeball the template
  const fs = await import("fs");
  fs.writeFileSync("sample-preview.svg", prev.svg);
  console.log(`\n  Sample preview written to sample-preview.svg (template: ${prev.template_key})`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
