import { excerpt } from "../normalize.js";

// Manual URL import. Optionally attempts a light metadata fetch (title/og:image).
// Never scrapes behind logins. User can also paste excerpt/text directly.
export async function fetchManual({ url, title, excerpt: ex, raw_text, author }) {
  let meta = { title: title || null, thumbnail_url: null, raw_text: raw_text || null, author: author || null };
  if (url && !title) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "DMTV-Culture-Engine/0.1" }, redirect: "follow" });
      const html = await res.text();
      const og = (p) => (html.match(new RegExp(`<meta[^>]+property=["']${p}["'][^>]+content=["']([^"']+)`, "i")) || [])[1];
      meta.title = og("og:title") || (html.match(/<title[^>]*>([^<]+)/i) || [])[1] || url;
      meta.thumbnail_url = og("og:image") || null;
      meta.author = meta.author || og("og:site_name") || null;
      if (!meta.raw_text) meta.raw_text = og("og:description") || null;
    } catch (e) { meta.title = title || url; }
  }
  return [{
    original_url: url,
    title: meta.title || title || url,
    author_or_channel: meta.author || author || null,
    published_at: new Date().toISOString(),
    raw_excerpt: excerpt(ex || meta.raw_text || "", 400),
    raw_text: excerpt(raw_text || meta.raw_text || ex || "", 4000),
    thumbnail_url: meta.thumbnail_url,
    media_url: null,
  }];
}
