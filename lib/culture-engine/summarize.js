import { runAI } from "./ai.js";
import { SUMMARIZE_SYSTEM } from "./prompts.js";
import { excerpt } from "./normalize.js";

function mockSummary(item) {
  const title = item.title || "Untitled item";
  const text = excerpt(item.raw_text || item.raw_excerpt || "", 300) || "No body text was available from this source.";
  const tags = item.source_category_tags || [];
  return {
    short_summary: `${title}. ${text}`.slice(0, 280),
    key_points: [title, item.source_name ? `Surfaced via ${item.source_name}` : "Surfaced via DMTV source", tags.length ? `Tagged: ${tags.join(", ")}` : "Untagged"],
    why_it_matters: "Potential fit for DMTV's culture lane — review the original before packaging.",
    visual_notes: item.thumbnail_url ? "Thumbnail available from source; do not repost copyrighted media without rights." : "No source image; consider an original DMTV graphic.",
    quote_candidates: [],
    potential_angles: ["Culture Radar", "DMTV Take", "Aesthetic Breakdown"],
    risk_notes: "Auto-summary (mock mode). Verify facts and attribution before publishing.",
  };
}

export async function summarizeItem(item) {
  const prompt = `ITEM:\nTitle: ${item.title || ""}\nSource: ${item.source_name || ""} (${item.source_type || ""})\nURL: ${item.original_url || ""}\nPublished: ${item.published_at || "unknown"}\nCategories: ${(item.source_category_tags || []).join(", ")}\nExcerpt/Body:\n${excerpt(item.raw_text || item.raw_excerpt || "", 2500)}`;
  const { data, model, mode } = await runAI({ system: SUMMARIZE_SYSTEM, prompt, expectJson: true, mockFn: mockSummary, payload: item });
  const s = data || mockSummary(item);
  return { ...s, ai_model_used: `${model}${mode.includes("mock") ? " (mock)" : ""}` };
}
