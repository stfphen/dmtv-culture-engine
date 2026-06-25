import { runAI } from "./ai.js";
import { IDEAS_SYSTEM } from "./prompts.js";

function pick(cats, def) { return cats[0] || def; }

function mockIdeas(payload) {
  const { item, summary } = payload;
  const title = item.title || "this drop";
  const cats = item.source_category_tags || [];
  const isEvent = cats.includes("events") || cats.includes("nightlife");
  const base = {
    required_assets: ["original DMTV graphic", "source attribution"],
    risk_level: "low", production_effort: "low",
    rights_notes: "Use DMTV original packaging; attribute source; do not repost copyrighted media without permission.",
  };
  return {
    ideas: [
      { ...base, idea_title: `Culture Radar: ${title}`,
        editorial_angle: "Fast, factual heads-up on what just happened and why it lands.",
        format_recommendation: isEvent ? "Scene Watch" : "Culture Radar Card",
        platform_recommendation: "Instagram", hook: `New: ${title}`,
        why_this_works: "Low-effort, high-clarity post that keeps DMTV first on the update." },
      { ...base, idea_title: `DMTV Take: ${title}`,
        editorial_angle: "Short opinion on what the move signals for the scene.",
        format_recommendation: "DMTV Take", platform_recommendation: "Instagram / X",
        hook: summary?.why_it_matters || "Here's why this actually matters.",
        why_this_works: "Adds original commentary — the part that makes DMTV a voice, not a repost page.", production_effort: "medium" },
      { ...base, idea_title: `Aesthetic Breakdown: ${title}`,
        editorial_angle: "Read the visual language — type, palette, styling, mood.",
        format_recommendation: "Aesthetic Breakdown", platform_recommendation: "Instagram carousel",
        hook: "The visual language behind the moment.",
        why_this_works: "Plays to DMTV's streetwear/visual strength and is highly shareable.", production_effort: "medium",
        required_assets: ["3-5 reference visuals (or original)", "DMTV grid layout"] },
    ],
  };
}

export async function generateIdeas(item, summary) {
  const prompt = `Generate 3 DMTV ideas.\nTitle: ${item.title || ""}\nSource: ${item.source_name || ""}\nCategories: ${(item.source_category_tags || []).join(", ")}\nSummary: ${summary?.short_summary || ""}\nAngles: ${(summary?.potential_angles || []).join(", ")}\nVisual notes: ${summary?.visual_notes || ""}`;
  const { data, model, mode } = await runAI({ system: IDEAS_SYSTEM, prompt, expectJson: true, mockFn: mockIdeas, payload: { item, summary } });
  let ideas = (data && Array.isArray(data.ideas) ? data.ideas : mockIdeas({ item, summary }).ideas).slice(0, 3);
  while (ideas.length < 3) ideas.push(mockIdeas({ item, summary }).ideas[ideas.length]);
  return { ideas, ai_model_used: `${model}${mode.includes("mock") ? " (mock)" : ""}` };
}
