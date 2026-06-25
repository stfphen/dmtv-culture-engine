"use client";
import { useEffect, useState } from "react";
import { api } from "../../_components/ui.jsx";

// Static sample fields so each template previews live via the same SVG renderer
// path used for drafts (rendered server-side for real ideas).
const SAMPLES = {
  culture_radar: { headline: "Artist X announces new project with visual campaign", category_label: "HIP HOP", short_summary: "A streetwear-heavy rollout with teaser clips and a strong cover direction.", source_attribution: "Source: Our Generation Music", date: "2026-06-24" },
  dmtv_take: { big_hook: "The visuals are doing as much work as the music.", take: "Chrome type, night shots, oversized silhouettes — the rollout is a mood, not just a drop.", source_attribution: "Source: Complex" },
  scene_watch: { headline: "Underground rap night takes over a King St. warehouse", when_where: "Toronto · Fri 11PM", why_it_matters: "New promoter crew building a real room for the city’s next wave.", cta: "Would you go?" },
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [brand, setBrand] = useState(null);
  const [svgs, setSvgs] = useState({});

  useEffect(() => { (async () => {
    const [t, b] = await Promise.all([api("/api/templates"), api("/api/brand")]);
    setTemplates(t.templates || []); setBrand(b.brand);
  })(); }, []);

  useEffect(() => { (async () => {
    if (!brand) return;
    const { renderTemplate } = await import("../../../lib/culture-engine/renderTemplate.js");
    const next = {};
    for (const t of templates) next[t.key] = renderTemplate(t.key, brand, SAMPLES[t.key] || {});
    setSvgs(next);
  })(); }, [templates, brand]);

  return (<div>
    <h1>Brand Templates</h1><p className="sub">DMTV graphic packs. Previews use your current brand colors (edit in Settings).</p>
    <div className="cols2">{templates.map(t => (
      <div className="card" key={t.key}>
        <h2>{t.name}</h2><p className="small muted">{t.description}</p>
        {svgs[t.key] && <img className="preview" src={`data:image/svg+xml;utf8,${encodeURIComponent(svgs[t.key])}`} alt={t.name} />}
        <p className="small muted" style={{ marginTop: 8 }}>Fields: {(t.fields || []).join(", ")}</p>
      </div>
    ))}</div>
  </div>);
}
