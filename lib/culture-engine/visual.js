// Rights-safe visual sourcing. Picks an on-brand background image for a content item
// from owned media, AI originals, licensed stock, or (reference-only) the source's og:image.
import * as store from "../store.js";

// Map DMTV categories -> visual search seeds (used for stock/AI queries).
const SEEDS = {
  hip_hop: "hip hop concert stage lights", rap_news: "rapper performing live",
  underground_music: "rapper recording studio night", toronto: "toronto skyline night city",
  nightlife: "nightclub crowd neon lights", streetwear: "streetwear fashion portrait urban",
  fashion: "fashion editorial dark studio", sneakers: "sneakers close up detail",
  art_design: "contemporary art installation", events: "concert crowd hands up",
  music_videos: "music video film set lighting", brand_drops: "product flat lay studio",
  aesthetic_reference: "moody portrait night flash photography", creator_culture: "creator filming content",
  podcast_interviews: "podcast microphone studio", entertainment: "stage spotlight performance",
  internet_culture: "smartphone social media glow", local_business: "toronto storefront street",
};

export function buildQuery(item) {
  const cats = item.source_category_tags || [];
  const seed = cats.map(c => SEEDS[c]).find(Boolean) || "hip hop culture night";
  const local = cats.includes("toronto") || (item.detected_region || "").toLowerCase().includes("toronto");
  return (local && !seed.includes("toronto")) ? `${seed} toronto` : seed;
}

async function fromLibrary(item) {
  const cats = item.source_category_tags || [];
  const media = await store.listMedia({ publishableOnly: true });
  // best tag overlap
  let best = null, bestScore = -1;
  for (const m of media) {
    const overlap = (m.tags || []).filter(t => cats.includes(t)).length;
    if (overlap > bestScore) { bestScore = overlap; best = m; }
  }
  if (!best) return null;
  return { provider: "dmtv_library", image_url: best.image_url, attribution: best.attribution || "DMTV", rights: "owned", publishable: true, query: null };
}

async function fromPexels(query) {
  const key = process.env.PEXELS_API_KEY; if (!key) return null;
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?per_page=1&orientation=square&query=${encodeURIComponent(query)}`, { headers: { Authorization: key } });
    if (!r.ok) return null;
    const d = await r.json(); const p = d.photos?.[0]; if (!p) return null;
    return { provider: "pexels", image_url: p.src?.large || p.src?.original, attribution: `Photo: ${p.photographer} / Pexels`, rights: "licensed", publishable: true, query, license_url: p.url };
  } catch { return null; }
}

async function fromUnsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY; if (!key) return null;
  try {
    const r = await fetch(`https://api.unsplash.com/search/photos?per_page=1&orientation=squarish&query=${encodeURIComponent(query)}&client_id=${key}`);
    if (!r.ok) return null;
    const d = await r.json(); const p = d.results?.[0]; if (!p) return null;
    return { provider: "unsplash", image_url: p.urls?.regular, attribution: `Photo: ${p.user?.name} / Unsplash`, rights: "licensed", publishable: true, query, license_url: p.links?.html };
  } catch { return null; }
}

async function fromAI(query) {
  const key = process.env.OPENAI_API_KEY; if (!key) return null; // image gen needs an image model
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.IMAGE_MODEL || "dall-e-3", prompt: `Cinematic, moody, on-brand culture editorial image: ${query}. Dark, high-contrast, flash-photography nightlife aesthetic, no text, no logos.`, size: "1024x1024", n: 1 }),
    });
    if (!r.ok) return null;
    const d = await r.json(); const url = d.data?.[0]?.url; if (!url) return null;
    return { provider: "ai", image_url: url, attribution: "AI-generated (DMTV)", rights: "original_ai", publishable: true, query };
  } catch { return null; }
}

function referenceOnly(item) {
  if (!item.thumbnail_url) return null;
  return { provider: "source_reference", image_url: item.thumbnail_url, attribution: `Reference: ${item.source_name || "source"}`, rights: "reference_only", publishable: false, query: null };
}

// Returns { chosen, options[] }. `chosen` is publishable when possible; reference-only never used in published graphic.
export async function selectVisual(item, { preferred } = {}) {
  const query = buildQuery(item);
  const lib = await fromLibrary(item);
  const [pex, uns] = await Promise.all([fromPexels(query), fromUnsplash(query)]);
  const ai = await fromAI(query);
  const ref = referenceOnly(item);
  const options = [lib, ai, pex, uns, ref].filter(Boolean);

  let chosen = null;
  if (preferred) chosen = options.find(o => o.provider === preferred) || null;
  // preference order for publishing: owned -> ai -> licensed -> none (reference is NOT auto-used)
  if (!chosen) chosen = options.find(o => o.publishable) || null;
  return { chosen, options, query };
}
