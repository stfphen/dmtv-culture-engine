import crypto from "crypto";

// Strip tracking params, fragments, trailing slashes -> canonical URL for dedupe.
const TRACKING = /^(utm_|fbclid|gclid|mc_|igshid|ref|ref_src|si|feature)/i;
export function canonicalizeUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    const keep = [];
    for (const [k, v] of u.searchParams.entries()) if (!TRACKING.test(k)) keep.push([k, v]);
    u.search = "";
    keep.sort(([a], [b]) => a.localeCompare(b)).forEach(([k, v]) => u.searchParams.append(k, v));
    let s = u.toString();
    if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
    return s.toLowerCase();
  } catch { return raw.trim(); }
}

export function contentHash({ title, canonical_url, raw_excerpt }) {
  const basis = `${(title || "").trim().toLowerCase()}|${canonical_url || ""}|${(raw_excerpt || "").trim().slice(0, 200).toLowerCase()}`;
  return crypto.createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

export function excerpt(text, n = 400) {
  const t = stripHtml(text || "");
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
}
