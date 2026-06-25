import { runAI } from "./ai.js";
import { CAPTIONS_SYSTEM } from "./prompts.js";

function tags(item) {
  const cats = item.source_category_tags || [];
  const map = { hip_hop: "#hiphop", rap_news: "#rap", toronto: "#toronto #the6ix", nightlife: "#nightlife",
    streetwear: "#streetwear", fashion: "#fashion", sneakers: "#sneakers", events: "#torontoevents",
    music_videos: "#musicvideo", underground_music: "#underground" };
  const base = ["#DMTV", "#culture"];
  return Array.from(new Set([...base, ...cats.map(c => map[c]).filter(Boolean)]));
}

function mockCaptions(payload) {
  const { item, idea } = payload;
  const title = item.title || "this one";
  const attribution = item.source_name ? ` (via ${item.source_name})` : "";
  const cta = "More on DMTV.";
  return {
    instagram: `${idea.hook || title}${attribution}. ${idea.editorial_angle || ""} DMTV is watching this one. ${cta}`.trim(),
    tiktok: `${idea.hook || title} — quick breakdown. ${cta}`,
    youtube_shorts: `${title} | DMTV Culture Radar`,
    x_threads: `${idea.hook || title}${attribution}. ${cta}`.slice(0, 240),
    story_text: `${idea.hook || title}\nTap in → DMTV`,
    hashtags: tags(item),
  };
}

export async function generateCaptions(item, idea) {
  const prompt = `Write captions for this DMTV idea.\nIdea: ${idea.idea_title}\nFormat: ${idea.format_recommendation}\nHook: ${idea.hook}\nAngle: ${idea.editorial_angle}\nItem title: ${item.title || ""}\nSource (for attribution): ${item.source_name || ""}\nSuggested hashtags base: ${tags(item).join(" ")}`;
  const { data, model, mode } = await runAI({ system: CAPTIONS_SYSTEM, prompt, expectJson: true, mockFn: mockCaptions, payload: { item, idea } });
  const c = data || mockCaptions({ item, idea });
  if (!Array.isArray(c.hashtags) || !c.hashtags.length) c.hashtags = tags(item);
  return { ...c, ai_model_used: `${model}${mode.includes("mock") ? " (mock)" : ""}` };
}
