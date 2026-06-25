import * as store from "@/lib/store.js";
import { svgToPng } from "@/lib/culture-engine/raster.js";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const preview = await store.getPreview(params.ideaId);
  if (!preview) return new Response("no preview", { status: 404 });
  const u = new URL(req.url);
  const slideIdx = u.searchParams.get("slide");
  const format = u.searchParams.get("format");
  const download = u.searchParams.get("download");

  // pick svg (carousel slide if requested)
  let svg = preview.svg;
  const slides = preview.fields?.slides;
  if (slideIdx != null && Array.isArray(slides) && slides[Number(slideIdx)]) svg = slides[Number(slideIdx)];

  if (format === "png") {
    const png = await svgToPng(svg, { width: 1080 });
    if (png) {
      const headers = { "content-type": "image/png" };
      if (download) headers["content-disposition"] = `attachment; filename="dmtv-${params.ideaId}${slideIdx != null ? "-" + slideIdx : ""}.png"`;
      return new Response(png, { headers });
    }
    // fall through to SVG if rasterizer unavailable
  }
  const headers = { "content-type": "image/svg+xml" };
  if (download) headers["content-disposition"] = `attachment; filename="dmtv-${params.ideaId}.svg"`;
  return new Response(svg, { headers });
}
