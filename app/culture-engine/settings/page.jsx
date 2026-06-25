"use client";
import { useEffect, useState } from "react";
import { api, useToast } from "../../_components/ui.jsx";

const FIELDS = [
  ["logo_text", "Logo text (fallback)"], ["logo_url", "Logo URL (optional)"],
  ["primary_color", "Background color"], ["secondary_color", "Text color"], ["accent_color", "Accent color"],
  ["default_cta", "Default CTA"], ["default_footer", "Footer handle"],
];

export default function Settings() {
  const [brand, setBrand] = useState(null);
  const { toast, node } = useToast();
  useEffect(() => { (async () => setBrand((await api("/api/brand")).brand))(); }, []);
  async function save() { const r = await api("/api/brand", { method: "PATCH", body: JSON.stringify(brand) }); setBrand(r.brand); toast("Brand saved"); }
  if (!brand) return <p className="muted">Loading…</p>;
  const isColor = k => k.includes("color");
  return (<div>
    {node}
    <h1>Settings</h1><p className="sub">DMTV brand config used by all generated graphics. Replace the logo by setting a Logo URL or dropping an asset and pointing to it.</p>
    <div className="card" style={{ maxWidth: 640 }}>
      {FIELDS.map(([k, label]) => (
        <div className="field" key={k}><label>{label}</label>
          <div className="row">
            <input value={brand[k] || ""} onChange={e => setBrand({ ...brand, [k]: e.target.value })} />
            {isColor(k) && <input type="color" style={{ width: 46, padding: 2 }} value={brand[k] || "#000000"} onChange={e => setBrand({ ...brand, [k]: e.target.value })} />}
          </div></div>
      ))}
      <button className="btn primary" onClick={save}>Save</button>
    </div>
    <p className="small muted" style={{ marginTop: 14 }}>AI provider &amp; keys are set via environment variables (see README). No keys = mock mode.</p>
  </div>);
}
