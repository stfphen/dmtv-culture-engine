// Fetch a remote image and return a data: URI so it embeds in SVG (renders + downloads cleanly).
export async function toDataUri(url, { timeoutMs = 10000, maxBytes = 4_500_000 } = {}) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "DMTV-Culture-Engine/0.2" } });
    clearTimeout(t);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch { return null; }
}
