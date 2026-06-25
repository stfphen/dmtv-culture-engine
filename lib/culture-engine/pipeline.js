// Per-item packaging: summarize -> score -> (if 65+) PACKAGE (post + quote + carousel + mood + clip brief) -> captions -> previews.
import { randomUUID } from "crypto";
import * as store from "../store.js";
import { summarizeItem } from "./summarize.js";
import { scoreItem } from "./score.js";
import { generatePackage } from "./generatePackage.js";
import { generateCaptions } from "./generateCaptions.js";
import { renderAsset } from "./renderTemplate.js";
import { selectVisual } from "./visual.js";
import { toDataUri } from "./imageEmbed.js";

export async function summarizeAndScore(item) {
  const summary = await summarizeItem(item);
  const savedSummary = await store.saveSummary(item.id, summary);
  await store.updateItem(item.id, { ingestion_status: "summarized" });
  const score = await scoreItem(item, summary);
  const savedScore = await store.saveScore(item.id, score);
  const status = score.recommendation === "needs_human_review" ? "needs_review" : "scored";
  await store.updateItem(item.id, { ingestion_status: status });
  return { summary: savedSummary, score: savedScore };
}

const CAPTIONED = new Set(["post", "quote_card", "carousel"]);

// Build a full DMTV asset package for one item.
export async function generateDraftsForItem(itemId) {
  const item = await store.getItem(itemId);
  if (!item) throw new Error("item not found");
  let summary = await store.getSummary(itemId);
  let score = await store.getScore(itemId);
  if (!summary || !score) { const r = await summarizeAndScore(item); summary = r.summary; score = r.score; }
  const brand = await store.getBrand();

  const { chosen, options } = await selectVisual(item);
  const reference = options.find(o => o.rights === "reference_only") || null;
  const bg = chosen ? await toDataUri(chosen.image_url) : null;
  const visualNote = chosen
    ? `Visual: ${chosen.provider} (${chosen.rights})${chosen.attribution ? " — " + chosen.attribution : ""}.`
    : "No publishable visual sourced — text-only. Add DMTV media or an image API key, or shoot original.";
  const refNote = reference ? " Source image kept as REFERENCE ONLY (not cleared to publish)." : "";

  const pkg = await generatePackage(item, summary);
  const packageId = randomUUID();
  const created = [];

  for (let i = 0; i < pkg.assets.length; i++) {
    const a = { ...pkg.assets[i], franchise_name: pkg.franchise_name };
    const idea = await store.createIdea(itemId, {
      idea_title: a.idea_title || `${a.asset_type} — ${item.title}`,
      editorial_angle: a.editorial_angle || pkg.hero_angle,
      format_recommendation: a.format_recommendation || a.asset_type,
      platform_recommendation: a.platform_recommendation || (a.asset_type === "clip_brief" ? "Reels/TikTok/Shorts" : "Instagram"),
      hook: a.hook || a.cover_hook || "", why_this_works: a.why_this_works || "",
      production_effort: a.production_effort || (a.asset_type === "carousel" ? "medium" : "low"),
      asset_type: a.asset_type, target_signal: a.target_signal || null,
      franchise: pkg.franchise, package_id: packageId, payload: a,
      rights_notes: `${visualNote}${refNote}`.trim(),
    }, i + 1);

    if (CAPTIONED.has(a.asset_type)) {
      const captions = await generateCaptions(item, { ...a, hook: a.hook || a.cover_hook, format_recommendation: a.format_recommendation || a.asset_type, editorial_angle: a.editorial_angle || pkg.hero_angle });
      await store.saveCaption(idea.id, captions);
    }

    const rendered = renderAsset(a, { brand, item, summary, idea: a, bg_image: bg, visual: chosen });
    await store.savePreview(idea.id, {
      template_key: rendered.template_key, svg: rendered.svg,
      fields: {
        asset_type: a.asset_type, target_signal: a.target_signal, franchise: pkg.franchise_name,
        slides: rendered.slides || null,
        visual: chosen ? { provider: chosen.provider, rights: chosen.rights, attribution: chosen.attribution, image_url: chosen.image_url } : null,
        reference: reference ? { image_url: reference.image_url, attribution: reference.attribution, rights: "reference_only", publishable: false } : null,
      },
    });
    await store.upsertApproval(idea.id, itemId, "needs_review");
    await store.updateIdea(idea.id, { status: "needs_review" });
    created.push(idea.id);
  }
  await store.updateItem(itemId, { ingestion_status: "draft_ready" });
  return { ideaIds: created, score, package_id: packageId, franchise: pkg.franchise_name, hero_angle: pkg.hero_angle, visual: chosen ? chosen.provider : null };
}
