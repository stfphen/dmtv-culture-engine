"use client";
import { useEffect, useState } from "react";
import { api } from "../../_components/ui.jsx";
export default function Templates() {
  const [templates, setTemplates] = useState([]);
  useEffect(() => { (async () => setTemplates((await api("/api/templates")).templates || []))(); }, []);
  return (<div>
    <h1>Brand Templates</h1><p className="sub">DMTV graphic packs — black / white / gold, your logo, with an on-brand image layer when imagery is available. Previews use live brand settings.</p>
    <div className="cols2">{templates.map(t => (
      <div className="card" key={t.key}>
        <h2>{t.name}</h2><p className="small muted">{t.description}</p>
        <img className="preview" src={`/api/templates/preview/${t.key}`} alt={t.name} loading="lazy" />
        <p className="small muted" style={{ marginTop: 8 }}>Fields: {(t.fields || []).join(", ")}</p>
      </div>
    ))}</div>
  </div>);
}
