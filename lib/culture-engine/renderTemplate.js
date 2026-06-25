// SVG DMTV graphic templates (1080x1080) with optional background imagery.
// Pass fields.bg_image as a data: URI (the pipeline fetches + embeds it) for image-backed cards.
import fs from "fs";
import path from "path";

export const TEMPLATES = [
  { key: "culture_radar", name: "Culture Radar", description: "Headline + short context over an on-brand image. News, drops, updates.",
    fields: ["headline", "category_label", "short_summary", "source_attribution", "date", "bg_image"] },
  { key: "dmtv_take", name: "DMTV Take", description: "Commentary/opinion. Bold hook + take. Trends, rollouts, moves.",
    fields: ["big_hook", "take", "source_attribution", "bg_image"] },
  { key: "scene_watch", name: "Event / Scene Watch", description: "Toronto nightlife & creative scene. Events, venues, promoters.",
    fields: ["headline", "when_where", "why_it_matters", "cta", "bg_image"] },
  { key: "aesthetic", name: "Aesthetic Breakdown", description: "Image-forward mood card. Fashion, streetwear, music video, campaign visuals.",
    fields: ["label", "headline", "note", "source_attribution", "bg_image"] },
];

const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// --- logo embedding (cached) ---
let _logoCache = {};
function logoDataUri(brand) {
  const rel = brand?.logo_url || "/brand/dmtv-logo.png";
  if (rel.startsWith("data:")) return rel;
  if (_logoCache[rel] !== undefined) return _logoCache[rel];
  try {
    const fp = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
    const buf = fs.readFileSync(fp);
    _logoCache[rel] = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { _logoCache[rel] = null; }
  return _logoCache[rel];
}

function wrap(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length >= maxLines) { let l = lines[maxLines - 1]; if (l.length > maxChars - 1) lines[maxLines - 1] = l.slice(0, maxChars - 1) + "…"; }
  return lines.slice(0, maxLines);
}
const tspans = (lines, x, y, lh) => lines.map((l, i) => `<tspan x="${x}" y="${y + i * lh}">${esc(l)}</tspan>`).join("");

function frame(brand, inner, { bg } = {}) {
  const bgc = brand.primary_color || "#0A0A0A";
  const fg = brand.secondary_color || "#F5F5F0";
  const acc = brand.accent_color || "#E8C24A";
  const head = brand.font_heading || "Helvetica Neue, Arial, sans-serif";
  const footer = brand.default_footer || "@dmtv";
  const logo = logoDataUri(brand);
  const logoText = brand.logo_text || "DMTV";

  const imageLayer = bg ? `
    <image href="${bg}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice"/>
    <rect width="1080" height="1080" fill="url(#scrim)"/>` : "";

  const logoMark = logo
    ? `<image href="${logo}" x="60" y="936" width="120" height="120"/>`
    : `<text x="64" y="1016" fill="${fg}" font-size="34" font-weight="800" letter-spacing="3" font-family="${esc(head)}">${esc(logoText)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" font-family="${esc(head)}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgc}" stop-opacity="0.30"/>
      <stop offset="55%" stop-color="${bgc}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${bgc}" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0"/></filter>
  </defs>
  <rect width="1080" height="1080" fill="${bgc}"/>
  ${imageLayer}
  <rect width="1080" height="1080" filter="url(#grain)"/>
  <rect x="0" y="0" width="12" height="1080" fill="${acc}"/>
  ${inner({ fg, acc, bgc, head })}
  ${logoMark}
  <text x="1020" y="1014" fill="${fg}" font-size="26" text-anchor="end" opacity="0.75" font-family="${esc(head)}">${esc(footer)}</text>
</svg>`;
}

function tplCultureRadar(b, f) {
  return frame(b, ({ fg, acc, head }) => `
    <text x="64" y="150" fill="${acc}" font-size="30" font-weight="800" letter-spacing="6">CULTURE RADAR</text>
    <text x="64" y="196" fill="${fg}" font-size="24" opacity="0.75">${esc(f.category_label || "")}${f.date ? "  ·  " + esc(f.date) : ""}</text>
    <text x="64" fill="${fg}" font-size="86" font-weight="800">${tspans(wrap(f.headline, 21, 4), 64, 470, 96)}</text>
    <text x="64" fill="${fg}" font-size="33" opacity="0.9" font-family="${esc(b.font_body || head)}">${tspans(wrap(f.short_summary, 48, 3), 64, 820, 46)}</text>
    <text x="210" y="1004" fill="${fg}" font-size="24" opacity="0.6">${esc(f.source_attribution || "")}</text>`,
    { bg: f.bg_image });
}
function tplDmtvTake(b, f) {
  return frame(b, ({ fg, acc, head }) => `
    <rect x="64" y="108" width="232" height="58" fill="${acc}"/>
    <text x="84" y="149" fill="#0A0A0A" font-size="32" font-weight="800" letter-spacing="4">DMTV TAKE</text>
    <text x="64" fill="${fg}" font-size="94" font-weight="800">${tspans(wrap(f.big_hook, 19, 4), 64, 380, 104)}</text>
    <text x="64" fill="${fg}" font-size="37" opacity="0.9" font-family="${esc(b.font_body || head)}">${tspans(wrap(f.take, 44, 4), 64, 800, 52)}</text>
    <text x="210" y="1004" fill="${fg}" font-size="24" opacity="0.6">${esc(f.source_attribution || "")}</text>`,
    { bg: f.bg_image });
}
function tplSceneWatch(b, f) {
  return frame(b, ({ fg, acc, head }) => `
    <text x="64" y="150" fill="${acc}" font-size="30" font-weight="800" letter-spacing="6">SCENE WATCH</text>
    <text x="64" fill="${fg}" font-size="82" font-weight="800">${tspans(wrap(f.headline, 21, 3), 64, 330, 92)}</text>
    <text x="64" y="640" fill="${acc}" font-size="42" font-weight="700">${tspans(wrap(f.when_where, 34, 2), 64, 620, 54)}</text>
    <text x="64" fill="${fg}" font-size="33" opacity="0.9" font-family="${esc(b.font_body || head)}">${tspans(wrap(f.why_it_matters, 48, 2), 64, 760, 46)}</text>
    <text x="64" y="892" fill="${fg}" font-size="34" font-weight="800">${esc(f.cta || b.default_cta || "More on DMTV")}</text>`,
    { bg: f.bg_image });
}
function tplAesthetic(b, f) {
  return frame(b, ({ fg, acc, head }) => `
    <text x="64" y="150" fill="${acc}" font-size="30" font-weight="800" letter-spacing="6">${esc((f.label || "AESTHETIC BREAKDOWN").toUpperCase())}</text>
    <text x="64" fill="${fg}" font-size="78" font-weight="800">${tspans(wrap(f.headline, 22, 4), 64, 770, 86)}</text>
    <text x="210" y="1004" fill="${fg}" font-size="24" opacity="0.6">${esc(f.source_attribution || "")}</text>`,
    { bg: f.bg_image });
}

const RENDERERS = { culture_radar: tplCultureRadar, dmtv_take: tplDmtvTake, scene_watch: tplSceneWatch, aesthetic: tplAesthetic };

export function templateForFormat(format) {
  const f = (format || "").toLowerCase();
  if (f.includes("take")) return "dmtv_take";
  if (f.includes("scene") || f.includes("weekend") || f.includes("event")) return "scene_watch";
  if (f.includes("aesthetic") || f.includes("swipe") || f.includes("fit")) return "aesthetic";
  return "culture_radar";
}

export function buildFields(templateKey, { item, summary, idea, bg_image, visual }) {
  const cat = (item.source_category_tags || [])[0] || "culture";
  const date = item.published_at ? new Date(item.published_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const credit = visual && visual.attribution ? visual.attribution : null;
  const attribution = [item.source_name ? `Source: ${item.source_name}` : "Source: DMTV", credit].filter(Boolean).join("  ·  ");
  const common = { bg_image: bg_image || null };
  if (templateKey === "dmtv_take") return { ...common, big_hook: idea.hook || item.title, take: idea.editorial_angle || summary?.why_it_matters || "", source_attribution: attribution };
  if (templateKey === "scene_watch") return { ...common, headline: idea.idea_title || item.title, when_where: (summary?.key_points || []).find(k => /\d/.test(k)) || "Toronto · TBA", why_it_matters: summary?.why_it_matters || idea.why_this_works || "", cta: "Would you go?" };
  if (templateKey === "aesthetic") return { ...common, label: "Aesthetic Breakdown", headline: idea.hook || item.title, note: idea.editorial_angle || "", source_attribution: attribution };
  return { ...common, headline: item.title || idea.idea_title, category_label: String(cat).replace(/_/g, " ").toUpperCase(), short_summary: summary?.short_summary || idea.editorial_angle || "", source_attribution: attribution, date };
}

export function renderTemplate(templateKey, brand, fields) {
  const r = RENDERERS[templateKey] || RENDERERS.culture_radar;
  return r(brand, fields || {});
}

// ---------- quote card (target: sends) ----------
export function renderQuoteCard(brand, f) {
  return frame(brand, ({ fg, acc, head }) => `
    <text x="64" y="150" fill="${acc}" font-size="30" font-weight="800" letter-spacing="6">DMTV</text>
    <text x="60" y="430" fill="${acc}" font-size="220" font-weight="800" opacity="0.9">&#8220;</text>
    <text x="64" fill="${fg}" font-size="72" font-weight="800">${tspans(wrap(f.quote, 24, 6), 64, 480, 84)}</text>
    <text x="64" y="900" fill="${acc}" font-size="30" font-weight="700">${esc(f.attribution || "")}</text>`,
    { bg: f.bg_image });
}

// ---------- carousel (target: saves) -> returns ARRAY of SVG slides ----------
export function renderCarousel(brand, f) {
  const acc = brand.accent_color || "#E8C24A";
  const slides = [];
  // cover
  slides.push(frame(brand, ({ fg }) => `
    <text x="64" y="150" fill="${acc}" font-size="28" font-weight="800" letter-spacing="6">${esc((f.label || "DMTV").toUpperCase())}</text>
    <text x="64" fill="${fg}" font-size="96" font-weight="800">${tspans(wrap(f.cover_hook || f.idea_title, 18, 5), 64, 430, 106)}</text>
    <text x="64" y="900" fill="${acc}" font-size="30" font-weight="700">Swipe &#8594;</text>`,
    { bg: f.bg_image }));
  // value slides
  (f.slides || []).forEach((s, i) => {
    slides.push(frame(brand, ({ fg }) => `
      <text x="64" y="150" fill="${acc}" font-size="40" font-weight="800">${String(i + 1).padStart(2, "0")}</text>
      <text x="64" fill="${fg}" font-size="64" font-weight="800">${tspans(wrap(s.heading, 22, 3), 64, 330, 76)}</text>
      <text x="64" fill="${fg}" font-size="40" opacity="0.9" font-family="${esc(brand.font_body || "Arial")}">${tspans(wrap(s.body, 38, 7), 64, 580, 56)}</text>`));
  });
  // outro / CTA
  slides.push(frame(brand, ({ fg }) => `
    <text x="64" fill="${fg}" font-size="80" font-weight="800">${tspans(wrap(f.cta || brand.default_cta || "More on DMTV", 18, 3), 64, 460, 92)}</text>
    <text x="64" y="700" fill="${acc}" font-size="34" font-weight="700">${esc(brand.default_footer || "@dmtv")}</text>`));
  return slides;
}

// ---------- asset dispatcher ----------
// Returns { template_key, svg, slides? } for a package asset.
export function renderAsset(asset, { brand, item, summary, idea, bg_image, visual }) {
  const credit = visual && visual.attribution ? visual.attribution : null;
  const attribution = [item.source_name ? `Source: ${item.source_name}` : "Source: DMTV", credit].filter(Boolean).join("  ·  ");
  if (asset.asset_type === "quote_card") {
    return { template_key: "quote_card", svg: renderQuoteCard(brand, { quote: asset.quote || asset.hook || item.title, attribution: asset.attribution || attribution, bg_image }) };
  }
  if (asset.asset_type === "carousel") {
    const slides = renderCarousel(brand, { label: asset.franchise_name || "DMTV", cover_hook: asset.cover_hook || asset.idea_title, slides: asset.slides || [], cta: asset.cta, bg_image });
    return { template_key: "carousel", svg: slides[0], slides };
  }
  if (asset.asset_type === "mood_image") {
    return { template_key: "aesthetic", svg: renderTemplate("aesthetic", brand, { label: "Aesthetic", headline: asset.overlay_text || item.title, source_attribution: attribution, bg_image }) };
  }
  if (asset.asset_type === "clip_brief") {
    // simple text card listing the cut points
    const lines = (asset.cuts || []).map((c, i) => `${i + 1}. ${c.label}: ${c.suggested_moment}`);
    return { template_key: "clip_brief", svg: renderTemplate("culture_radar", brand, { headline: "Clip brief", category_label: "VERTICAL CUTS", short_summary: lines.join("  ·  "), source_attribution: attribution, bg_image: null }) };
  }
  // default: post
  const tplKey = templateForFormat(asset.format_recommendation);
  const fields = buildFields(tplKey, { item, summary, idea: { ...asset, hook: asset.hook, idea_title: asset.idea_title, editorial_angle: asset.editorial_angle, why_this_works: asset.why_this_works }, bg_image, visual });
  return { template_key: tplKey, svg: renderTemplate(tplKey, brand, fields) };
}
