import { excerpt } from "../normalize.js";

// YouTube Data API adapter. Graceful no-op when YOUTUBE_API_KEY is missing.
export async function fetchYouTube(source) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) { console.warn(`[youtube] no YOUTUBE_API_KEY — skipping "${source.name}". Add key or use RSS (https://www.youtube.com/feeds/videos.xml?channel_id=...).`); return []; }
  try {
    let url;
    if (source.source_type === "youtube_search") {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&order=date&q=${encodeURIComponent(source.url || source.name)}&key=${key}`;
    } else {
      // treat source.url as a channelId
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&order=date&channelId=${encodeURIComponent(source.url)}&key=${key}`;
    }
    const res = await fetch(url);
    if (!res.ok) { console.warn("[youtube] api error", res.status); return []; }
    const data = await res.json();
    return (data.items || []).map(it => ({
      original_url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
      title: it.snippet.title,
      author_or_channel: it.snippet.channelTitle,
      published_at: it.snippet.publishedAt,
      raw_excerpt: excerpt(it.snippet.description, 400),
      raw_text: excerpt(it.snippet.description, 2000),
      thumbnail_url: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url || null,
      media_url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
    })).filter(x => x.original_url.includes("watch?v=undefined") === false);
  } catch (e) { console.warn("[youtube] failed:", e.message); return []; }
}
