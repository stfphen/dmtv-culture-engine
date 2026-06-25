// Turns one source item into a multi-asset DMTV package (the "culture desk" output):
// post, quote card, carousel, mood image, and (if video) a clip brief.
import { runAI } from "./ai.js";
import { routeFranchise } from "./franchises.js";
import { DMTV_LANE } from "../brand.js";

const PACKAGE_SYSTEM = `You are DMTV's culture desk (Toronto hip-hop / nightlife / streetwear / creative scene). Lane: ${DMTV_LANE.join(", ")}.
Turn ONE item into a package of distinct, native social assets in DMTV's voice: confident, concise, culture-aware, NOT corny, no fake slang, no overclaiming, never state rumors as facts, never fabricate quotes.
Choose each asset's target_signal to match its job: "sends" (quote cards, hot takes — shareable identity), "saves" (carousels, lists, mood grids — reference value), "comments" (debates, rankings — good-faith, never outrage-bait).
CTAs are invitations, not commands (e.g. "Who should we watch next?", "Step inside", "Read the story") — never "tag a friend / like if you agree".
Return ONLY JSON:
{
 "hero_angle": "the editorial thesis in one line",
 "assets": [
   {"asset_type":"post","format_recommendation":"Culture Radar Card|DMTV Take|Scene Watch","target_signal":"sends","idea_title":"","hook":"","editorial_angle":"","why_this_works":"","production_effort":"low|medium|high"},
   {"asset_type":"quote_card","target_signal":"sends","idea_title":"","quote":"a strong line (paraphrase if not a real quote; never fabricate a direct quote)","attribution":"who/what","hook":"","why_this_works":""},
   {"asset_type":"carousel","target_signal":"saves","idea_title":"","cover_hook":"<=10 word cover line","slides":[{"heading":"","body":""}],"cta":"","why_this_works":""},
   {"asset_type":"mood_image","target_signal":"saves","idea_title":"","overlay_text":"short on-image line","visual_concept":"what the image should depict","why_this_works":""},
   {"asset_type":"clip_brief","target_signal":"sends","idea_title":"","cuts":[{"label":"","suggested_moment":"","why":""}],"why_this_works":"","note":"only meaningful if the source has video"}
 ]
}
Carousel must have 4-8 slides. Keep everything tight and specific to THIS item.`;

function mockPackage(item, summary) {
  const title = item.title || "this drop";
  const cats = item.source_category_tags || [];
  const isEvent = cats.includes("events") || cats.includes("nightlife");
  return {
    hero_angle: summary?.why_it_matters || `${title} is a DMTV-lane moment worth packaging.`,
    assets: [
      { asset_type: "post", format_recommendation: isEvent ? "Scene Watch" : "Culture Radar Card", target_signal: "sends",
        idea_title: `Culture Radar: ${title}`, hook: `New: ${title}`, editorial_angle: "Fast, factual heads-up on what just happened.",
        why_this_works: "Low-effort, high-clarity — keeps DMTV first on the update.", production_effort: "low" },
      { asset_type: "quote_card", target_signal: "sends", idea_title: `Quote: ${title}`,
        quote: summary?.short_summary?.slice(0, 120) || title, attribution: item.source_name || "DMTV",
        hook: "One line that says it all.", why_this_works: "Identity-signaling, easy to DM/share." },
      { asset_type: "carousel", target_signal: "saves", idea_title: `Breakdown: ${title}`,
        cover_hook: `Inside ${title}`.slice(0, 40),
        slides: [
          { heading: "What happened", body: summary?.short_summary || title },
          { heading: "Why it matters", body: summary?.why_it_matters || "It fits DMTV's lane." },
          { heading: "The visual", body: summary?.visual_notes || "Strong aesthetic potential." },
          { heading: "Watch next", body: "Who should DMTV cover next?" },
        ], cta: "Save this · More on DMTV", why_this_works: "Reference value drives saves; swipe-through lifts reach." },
      { asset_type: "mood_image", target_signal: "saves", idea_title: `Mood: ${title}`,
        overlay_text: title, visual_concept: "moody, flash-photography nightlife/streetwear scene on brand",
        why_this_works: "Aesthetic grid material; pure save fuel." },
      { asset_type: "clip_brief", target_signal: "sends", idea_title: `Clip brief: ${title}`,
        cuts: [{ label: "Hook moment", suggested_moment: "strongest 1-2s opener", why: "stops the scroll" },
               { label: "Payoff", suggested_moment: "the quotable / reveal", why: "drives the send" }],
        why_this_works: "If video exists, fragment it into native verticals.", note: "Only meaningful if the source has video." },
    ],
  };
}

export async function generatePackage(item, summary) {
  const franchise = routeFranchise(item);
  const prompt = `ITEM\nTitle: ${item.title || ""}\nSource: ${item.source_name || ""}\nCategories: ${(item.source_category_tags || []).join(", ")}\nSuggested franchise: ${franchise.name} (target ${franchise.signal})\nSummary: ${summary?.short_summary || ""}\nWhy it matters: ${summary?.why_it_matters || ""}\nVisual notes: ${summary?.visual_notes || ""}\nQuote candidates: ${(summary?.quote_candidates || []).join(" | ")}`;
  const { data, model, mode } = await runAI({ system: PACKAGE_SYSTEM, prompt, expectJson: true, mockFn: () => mockPackage(item, summary), payload: { item, summary } });
  let pkg = data && Array.isArray(data.assets) ? data : mockPackage(item, summary);
  // guardrails
  pkg.assets = (pkg.assets || []).filter(a => a && a.asset_type).slice(0, 6);
  if (!pkg.assets.length) pkg = mockPackage(item, summary);
  return { ...pkg, franchise: franchise.key, franchise_name: franchise.name, ai_model_used: `${model}${mode.includes("mock") ? " (mock)" : ""}` };
}
