// Per-item packaging: summarize -> score -> (if 65+) ideas -> captions -> visual -> preview.
import * as store from "../store.js";
import { summarizeItem } from "./summarize.js";
import { scoreItem } from "./score.js";
import { generateIdeas } from "./generateIdeas.js";
import { generateCaptions } from "./generateCaptions.js";
import { renderTemplate, templateForFormat, buildFields } from "./renderTemplate.js";
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

export async function generateDraftsForItem(itemId) {
  const item = await store.getItem(itemId);
  if (!item) throw new Error("item not found");
  let summary = await store.getSummary(itemId);
  let score = await store.getScore(itemId);
  if (!summary || !score) { const r = await summarizeAndScore(item); summary = r.summary; score = r.score; }
  const brand = await store.getBrand();

  // Pick ONE on-brand visual for the item; embed it if publishable (owned/licensed/AI).
  const { chosen, options } = await selectVisual(item);
  const reference = options.find(o => o.rights === "reference_only") || null;
  const bg = chosen ? await toDataUri(chosen.image_url) : null;
  const visualNote = chosen
    ? `Visual: ${chosen.provider} (${chosen.rights})${chosen.attribution ? " — " + chosen.attribution : ""}.`
    : "No publishable visual sourced — text-only card. Add DMTV media or an image API key.";
  const refNote = reference ? ` Source image kept as REFERENCE ONLY (not cleared to publish).` : "";

  const { ideas } = await generateIdeas(item, summary);
  const created = [];
  for (let i = 0; i < ideas.length; i++) {
    const ideaData = ideas[i];
    ideaData.rights_notes = `${ideaData.rights_notes || ""} ${visualNote}${refNote}`.trim();
    const idea = await store.createIdea(itemId, ideaData, i + 1);
    const captions = await generateCaptions(item, ideaData);
    await store.saveCaption(idea.id, captions);

    const tplKey = templateForFormat(ideaData.format_recommendation);
    const fields = buildFields(tplKey, { item, summary, idea: ideaData, bg_image: bg, visual: chosen });
    const svg = renderTemplate(tplKey, brand, fields);
    await store.savePreview(idea.id, {
      template_key: tplKey, svg,
      fields: { ...fields, bg_image: bg ? "(embedded)" : null,
        visual: chosen ? { provider: chosen.provider, rights: chosen.rights, attribution: chosen.attribution, image_url: chosen.image_url } : null,
        reference: reference ? { image_url: reference.image_url, attribution: reference.attribution, rights: "reference_only", publishable: false } : null },
    });
    await store.upsertApproval(idea.id, itemId, "needs_review");
    await store.updateIdea(idea.id, { status: "needs_review" });
    created.push(idea.id);
  }
  await store.updateItem(itemId, { ingestion_status: "draft_ready" });
  return { ideaIds: created, score, visual: chosen ? chosen.provider : null };
}
