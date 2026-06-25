import * as store from "@/lib/store.js";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
  const preview = await store.getPreview(params.ideaId);
  if (!preview) return new Response("no preview", { status: 404 });
  const download = new URL(req.url).searchParams.get("download");
  const headers = { "content-type": "image/svg+xml" };
  if (download) headers["content-disposition"] = `attachment; filename="dmtv-${params.ideaId}.svg"`;
  return new Response(preview.svg, { headers });
}
