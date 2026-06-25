import Parser from "rss-parser";
import { excerpt } from "../normalize.js";

const parser = new Parser({ timeout: 15000, headers: { "User-Agent": "DMTV-Culture-Engine/0.1 (+https://dmtv.example)" } });

// Returns array of raw item drafts from an RSS/Atom feed.
export async function fetchRss(source) {
  if (!source.url) return [];
  const feed = await parser.parseURL(source.url);
  return (feed.items || []).slice(0, 25).map(it => {
    const img = it.enclosure?.url || it["media:content"]?.$?.url || it["media:thumbnail"]?.$?.url || null;
    return {
      original_url: it.link || it.guid,
      title: it.title || "(untitled)",
      author_or_channel: it.creator || it.author || feed.title || source.name,
      published_at: it.isoDate || it.pubDate || null,
      raw_excerpt: excerpt(it.contentSnippet || it.content || it.summary, 400),
      raw_text: excerpt(it["content:encoded"] || it.content || it.contentSnippet || it.summary, 4000),
      thumbnail_url: img,
      media_url: null,
    };
  }).filter(x => x.original_url);
}
