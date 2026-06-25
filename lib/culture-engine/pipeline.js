// Per-item packaging: summarize -> score -> (if 65+) ideas -> captions -> preview.
import * as store from "../store.js";
import { summarizeItem } from "./summarize.js";
import { scoreItem } from "./score.js";
import { generateIdeas } from "./generateIdeas.js";
import { generateCaptions } from "./generateCaptions.js";
import { renderTemplate, templateForFormat, buildFields } from "./renderTemplate.js";

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

// Generate the full draft package for one item (used by daily pull + "Generate drafts" button).
export async function generateDraftsForItem(itemId) {
  const item = await store.getItem(itemId);
  if (!item) throw new Error("item not found");
  let summary = await store.getSummary(itemId);
  let score = await store.getScore(itemId);
  if (!summary || !score) {
    const r = await summarizeAndScore(item);
    summary = r.summary; score = r.score;
  }
  const brand = await store.getBrand();
  const { ideas } = await generateIdeas(item, summary);

  const created = [];
  for (let i = 0; i < ideas.length; i++) {
    const idea = await store.createIdea(itemId, ideas[i], i + 1);
    const captions = await generateCaptions(item, ideas[i]);
    await store.saveCaption(idea.id, captions);

    const tplKey = templateForFormat(ideas[i].format_recommendation);
    const fields = buildFields(tplKey, { item, summary, idea: ideas[i] });
    const svg = renderTemplate(tplKey, brand, fields);
    await store.savePreview(idea.id, { template_key: tplKey, svg, fields });

    // Drafts go to the approval queue for human review.
    await store.upsertApproval(idea.id, itemId, "needs_review");
    await store.updateIdea(idea.id, { status: "needs_review" });
    created.push(idea.id);
  }
  await store.updateItem(itemId, { ingestion_status: "draft_ready" });
  return { ideaIds: created, score };
}
