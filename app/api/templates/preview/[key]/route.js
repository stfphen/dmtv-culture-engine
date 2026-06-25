import * as store from "@/lib/store.js";
import { renderTemplate } from "@/lib/culture-engine/renderTemplate.js";
import { toDataUri } from "@/lib/culture-engine/imageEmbed.js";
import { selectVisual } from "@/lib/culture-engine/visual.js";
export const dynamic = "force-dynamic";

const SAMPLES = {
  culture_radar: { headline: "Artist X announces new project with a full visual campaign", category_label: "HIP HOP", short_summary: "A streetwear-heavy rollout with teaser clips and strong cover direction.", source_attribution: "Source: Our Generation Music", date: new Date().toISOString().slice(0,10) },
  dmtv_take: { big_hook: "The visuals are doing as much work as the music.", take: "Chrome type, night shots, oversized silhouettes — the rollout is a mood, not just a drop.", source_attribution: "Source: Complex" },
  scene_watch: { headline: "Underground rap night takes over a King St. warehouse", when_where: "Toronto · Fri 11PM", why_it_matters: "A new promoter crew building a real room for the city's next wave.", cta: "Would you go?" },
  aesthetic: { label: "Aesthetic Breakdown", headline: "Chrome type, night shots, oversized silhouettes", source_attribution: "Source: Highsnobiety" },
};
const SAMPLE_CATS = { culture_radar: ["hip_hop"], dmtv_take: ["rap_news"], scene_watch: ["toronto","nightlife"], aesthetic: ["streetwear","aesthetic_reference"] };

export async function GET(req, { params }) {
  const key = params.key;
  const brand = await store.getBrand();
  const fields = { ...(SAMPLES[key] || SAMPLES.culture_radar) };
  // try to pull a sample on-brand image (owned/licensed) so the preview shows the image layer
  try {
    const { chosen } = await selectVisual({ source_category_tags: SAMPLE_CATS[key] || [], title: fields.headline || "" });
    if (chosen) fields.bg_image = await toDataUri(chosen.image_url);
  } catch {}
  const svg = renderTemplate(key, brand, fields);
  return new Response(svg, { headers: { "content-type": "image/svg+xml" } });
}
