// SVG-based DMTV graphic templates (1080x1080). No external render deps.
// Returns an SVG string; served as image/svg+xml or downloaded by the dashboard.

export const TEMPLATES = [
  { key: "culture_radar", name: "Culture Radar", description: "Fast headline + short context. News, drops, event updates.",
    fields: ["headline", "category_label", "short_summary", "source_attribution", "date"] },
  { key: "dmtv_take", name: "DMTV Take", description: "Commentary/opinion style. Trends, rollouts, industry moves.",
    fields: ["big_hook", "take", "source_attribution"] },
  { key: "scene_watch", name: "Event / Scene Watch", description: "Toronto/local nightlife & creative scene. Events, venues, promoters.",
    fields: ["headline", "when_where", "why_it_matters", "cta"] },
];

const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// crude char-based word wrap -> array of lines
function wrap(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length >= maxLines) { let last = lines[maxLines - 1]; if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1) + "…"; lines[maxLines - 1] = last; }
  return lines.slice(0, maxLines);
}
function tspans(lines, x, y, lh) { return lines.map((l, i) => `<tspan x="${x}" y="${y + i * lh}">${esc(l)}</tspan>`).join(""); }

function frame(brand, inner) {
  const bg = brand.primary_color || "#0A0A0A";
  const fg = brand.secondary_color || "#F5F5F0";
  const acc = brand.accent_color || "#E11D2A";
  const logo = brand.logo_text || "DMTV";
  const footer = brand.default_footer || "@dmtv";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" font-family="${esc(brand.font_heading || "Arial, sans-serif")}">
  <defs>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="1080" height="1080" fill="${bg}"/>
  <rect width="1080" height="1080" filter="url(#grain)"/>
  <rect x="0" y="0" width="14" height="1080" fill="${acc}"/>
  ${inner({ fg, acc, bg })}
  <text x="72" y="1012" fill="${fg}" font-size="34" font-weight="700" letter-spacing="3">${esc(logo)}</text>
  <text x="1008" y="1012" fill="${fg}" font-size="26" text-anchor="end" opacity="0.7">${esc(footer)}</text>
</svg>`;
}

function tplCultureRadar(brand, f) {
  return frame(brand, ({ fg, acc }) => `
    <text x="72" y="150" fill="${acc}" font-size="30" font-weight="800" letter-spacing="6">CULTURE RADAR</text>
    <text x="72" y="200" fill="${fg}" font-size="24" opacity="0.7">${esc(f.category_label || "")}${f.date ? "  ·  " + esc(f.date) : ""}</text>
    <text x="72" fill="${fg}" font-size="84" font-weight="800" line-height="1">${tspans(wrap(f.headline, 22, 4), 72, 360, 96)}</text>
    <text x="72" fill="${fg}" font-size="34" opacity="0.85">${tspans(wrap(f.short_summary, 46, 4), 72, 800, 48)}</text>
    <text x="72" y="940" fill="${fg}" font-size="26" opacity="0.6">${esc(f.source_attribution || "")}</text>`);
}
function tplDmtvTake(brand, f) {
  return frame(brand, ({ fg, acc }) => `
    <rect x="72" y="110" width="220" height="56" fill="${acc}"/>
    <text x="92" y="150" fill="#FFFFFF" font-size="32" font-weight="800" letter-spacing="4">DMTV TAKE</text>
    <text x="72" fill="${fg}" font-size="92" font-weight="800">${tspans(wrap(f.big_hook, 20, 4), 72, 360, 104)}</text>
    <text x="72" fill="${fg}" font-size="38" opacity="0.85">${tspans(wrap(f.take, 42, 5), 72, 770, 54)}</text>
    <text x="72" y="945" fill="${fg}" font-size="26" opacity="0.6">${esc(f.source_attribution || "")}</text>`);
}
function tplSceneWatch(brand, f) {
  return frame(brand, ({ fg, acc }) => `
    <text x="72" y="150" fill="${acc}" font-size="30" font-weight="800" letter-spacing="6">SCENE WATCH</text>
    <text x="72" fill="${fg}" font-size="80" font-weight="800">${tspans(wrap(f.headline, 22, 3), 72, 320, 92)}</text>
    <text x="72" y="620" fill="${acc}" font-size="40" font-weight="700">${tspans(wrap(f.when_where, 36, 2), 72, 600, 52)}</text>
    <text x="72" fill="${fg}" font-size="34" opacity="0.85">${tspans(wrap(f.why_it_matters, 46, 3), 72, 740, 48)}</text>
    <text x="72" y="930" fill="${fg}" font-size="34" font-weight="700">${esc(f.cta || brand.default_cta || "More on DMTV")}</text>`);
}

const RENDERERS = { culture_radar: tplCultureRadar, dmtv_take: tplDmtvTake, scene_watch: tplSceneWatch };

// Map an idea's format_recommendation -> template key.
export function templateForFormat(format) {
  const f = (format || "").toLowerCase();
  if (f.includes("take")) return "dmtv_take";
  if (f.includes("scene") || f.includes("weekend") || f.includes("event")) return "scene_watch";
  return "culture_radar";
}

// Build template fields from an item/summary/idea, then render.
export function buildFields(templateKey, { item, summary, idea }) {
  const cat = (item.source_category_tags || [])[0] || "culture";
  const date = item.published_at ? new Date(item.published_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const attribution = item.source_name ? `Source: ${item.source_name}` : "Source: DMTV";
  if (templateKey === "dmtv_take") return { big_hook: idea.hook || item.title, take: idea.editorial_angle || summary?.why_it_matters || "", source_attribution: attribution };
  if (templateKey === "scene_watch") return { headline: idea.idea_title || item.title, when_where: summary?.key_points?.find(k => /\d/.test(k)) || "Toronto · TBA", why_it_matters: summary?.why_it_matters || idea.why_this_works || "", cta: "Would you go?" };
  return { headline: item.title || idea.idea_title, category_label: cat.replace(/_/g, " ").toUpperCase(), short_summary: summary?.short_summary || idea.editorial_angle || "", source_attribution: attribution, date };
}

export function renderTemplate(templateKey, brand, fields) {
  const r = RENDERERS[templateKey] || RENDERERS.culture_radar;
  return r(brand, fields || {});
}
