import { runAI } from "./ai.js";
import { SCORE_SYSTEM } from "./prompts.js";

// Scoring weights (sum = 100).
const WEIGHTS = {
  culture_fit_score: 15, dmtv_audience_fit_score: 15, freshness_score: 10, visual_potential_score: 10,
  conversation_potential_score: 10, originality_opportunity_score: 10, toronto_or_local_relevance_score: 10,
  category_fit: 10, brand_safety_score: 5, rights_safety_score: 5,
};

const LEX = {
  hip_hop: ["rap","hip-hop","hip hop","mixtape","verse","bars","freestyle","drill","producer","beat"],
  toronto: ["toronto","the 6","the six","ovo","drake","6ix","ontario","scarborough","416","tdot"],
  nightlife: ["club","nightlife","party","dj","venue","rave","afterparty","promoter","door","guestlist"],
  streetwear: ["streetwear","sneaker","drop","collab","fashion","fit","outfit","capsule","grail","hypebeast"],
  music: ["album","single","ep","release","rollout","video","tour","feature","label","stream"],
  event: ["event","show","concert","festival","tonight","weekend","tickets","lineup","date"],
  risk: ["arrest","shooting","died","death","lawsuit","allegation","leaked","rumor","beef","diss","explicit"],
};
function hits(text, words) { let n = 0; for (const w of words) if (text.includes(w)) n++; return n; }

// Deterministic baseline (also the mock). Returns 0-10 subscores.
export function heuristicSubscores(item, summary) {
  const text = `${item.title || ""} ${item.raw_excerpt || ""} ${item.raw_text || ""} ${(item.source_category_tags || []).join(" ")} ${summary?.short_summary || ""}`.toLowerCase();
  const clamp = n => Math.max(0, Math.min(10, Math.round(n)));
  const cat = item.source_category_tags || [];
  const catBoost = c => (cat.includes(c) ? 3 : 0);
  const hip = hits(text, LEX.hip_hop), tor = hits(text, LEX.toronto), night = hits(text, LEX.nightlife);
  const street = hits(text, LEX.streetwear), mus = hits(text, LEX.music), ev = hits(text, LEX.event);
  const riskHits = hits(text, LEX.risk);

  // freshness from published_at
  let freshness = 5;
  if (item.published_at) {
    const days = (Date.now() - new Date(item.published_at).getTime()) / 86400000;
    freshness = days <= 2 ? 10 : days <= 7 ? 8 : days <= 14 ? 6 : days <= 30 ? 4 : 2;
  }
  const culture = clamp(4 + hip + street + mus * 0.5 + catBoost("hip_hop"));
  return {
    culture_fit_score: culture,
    dmtv_audience_fit_score: clamp(4 + hip + night + street * 0.5),
    toronto_or_local_relevance_score: clamp(2 + tor * 2 + catBoost("toronto")),
    hiphop_music_relevance_score: clamp(3 + hip + mus + catBoost("rap_news")),
    streetwear_visual_relevance_score: clamp(3 + street * 2 + catBoost("streetwear")),
    nightlife_event_relevance_score: clamp(2 + night + ev + catBoost("nightlife") + catBoost("events")),
    freshness_score: clamp(freshness),
    visual_potential_score: clamp((item.thumbnail_url ? 5 : 3) + street + catBoost("aesthetic_reference")),
    conversation_potential_score: clamp(4 + hip + night + (riskHits ? 1 : 0)),
    originality_opportunity_score: clamp(5 + (street || hip ? 2 : 0)),
    brand_safety_score: clamp(10 - riskHits * 2),
    rights_safety_score: clamp(item.source_type === "social_tracker" ? 5 : item.thumbnail_url ? 7 : 9),
  };
}

export function computeFinal(sub) {
  const categoryFit = Math.max(sub.hiphop_music_relevance_score, sub.nightlife_event_relevance_score, sub.streetwear_visual_relevance_score);
  const parts = {
    culture_fit_score: sub.culture_fit_score, dmtv_audience_fit_score: sub.dmtv_audience_fit_score,
    freshness_score: sub.freshness_score, visual_potential_score: sub.visual_potential_score,
    conversation_potential_score: sub.conversation_potential_score, originality_opportunity_score: sub.originality_opportunity_score,
    toronto_or_local_relevance_score: sub.toronto_or_local_relevance_score, category_fit: categoryFit,
    brand_safety_score: sub.brand_safety_score, rights_safety_score: sub.rights_safety_score,
  };
  let final = 0;
  for (const k of Object.keys(WEIGHTS)) final += ((parts[k] || 0) / 10) * WEIGHTS[k];
  final = Math.round(final);

  // Risk is subtractive / gating.
  const lowSafety = sub.brand_safety_score <= 4 || sub.rights_safety_score <= 4;
  let recommendation;
  if (lowSafety) recommendation = "needs_human_review";
  else if (final >= 80) recommendation = "generate";
  else if (final >= 65) recommendation = "watchlist";
  else if (final >= 50) recommendation = "watchlist";
  else recommendation = "archive";
  return { final_score: final, recommendation, low_safety: lowSafety };
}

function mockScore(payload) {
  const sub = heuristicSubscores(payload.item, payload.summary);
  return { ...sub, scoring_explanation: "Heuristic score (mock mode): keyword-based fit across hip-hop, Toronto, nightlife, streetwear, freshness and safety signals." };
}

export async function scoreItem(item, summary) {
  const prompt = `Score this item for DMTV.\nTitle: ${item.title || ""}\nSource: ${item.source_name || ""}\nCategories: ${(item.source_category_tags || []).join(", ")}\nSummary: ${summary?.short_summary || ""}\nWhy it matters: ${summary?.why_it_matters || ""}\nRisk notes: ${summary?.risk_notes || ""}`;
  const { data, model, mode } = await runAI({ system: SCORE_SYSTEM, prompt, expectJson: true, mockFn: mockScore, payload: { item, summary } });
  let sub = data || mockScore({ item, summary });
  // Guard: ensure all subscores exist; fall back to heuristic for any missing.
  const base = heuristicSubscores(item, summary);
  for (const k of Object.keys(base)) if (typeof sub[k] !== "number") sub[k] = base[k];
  const { final_score, recommendation } = computeFinal(sub);
  return {
    ...sub, final_score, recommendation,
    scoring_explanation: sub.scoring_explanation || "Scored from subscores with DMTV weighting.",
    ai_model_used: `${model}${mode.includes("mock") ? " (mock)" : ""}`,
  };
}
