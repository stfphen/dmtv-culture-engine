"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Pill, Score, useToast } from "../../_components/ui.jsx";

const CATS = ["hip_hop","rap_news","underground_music","toronto","nightlife","streetwear","fashion","sneakers","events","music_videos","brand_drops","aesthetic_reference"];

export default function Feed() {
  const [items, setItems] = useState([]);
  const [minScore, setMinScore] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [imp, setImp] = useState({ open: false, url: "", category_tags: [], generate: true });
  const { toast, node } = useToast();

  async function load() {
    const q = new URLSearchParams();
    if (minScore) q.set("minScore", minScore);
    if (status) q.set("status", status);
    setItems((await api("/api/items?" + q)).items || []);
  }
  useEffect(() => { load(); }, [minScore, status]);

  async function gen(it) {
    setBusyId(it.id); toast("Generating 3 drafts…");
    const r = await api(`/api/items/${it.id}/generate`, { method: "POST", body: "{}" });
    setBusyId(null); toast(r.error ? r.error : "Drafts ready — see Draft Queue"); load();
  }
  async function archive(it) { await api(`/api/items/${it.id}`, { method: "PATCH", body: JSON.stringify({ ingestion_status: "archived" }) }); load(); }
  async function runImport() {
    if (!imp.url) return toast("Paste a URL");
    toast("Importing…");
    const r = await api("/api/manual-import", { method: "POST", body: JSON.stringify(imp) });
    toast(r.duplicate ? "Already imported" : r.error ? r.error : "Imported" + (imp.generate ? " + drafts" : ""));
    setImp({ ...imp, url: "" }); load();
  }

  return (<div>
    {node}
    <div className="spread"><div><h1>Culture Feed</h1><p className="sub">Ingested items, scored for DMTV fit. Generate drafts on the strong ones.</p></div>
      <button className="btn primary" onClick={() => setImp({ ...imp, open: !imp.open })}>{imp.open ? "Close" : "+ Manual import"}</button></div>

    {imp.open && <div className="card" style={{ marginBottom: 16 }}>
      <p className="small muted">For API-restricted platforms (IG/TikTok) paste a public link. Commentary drafts only — don’t repost copyrighted media without rights.</p>
      <div className="field"><label>URL</label><input value={imp.url} onChange={e => setImp({ ...imp, url: e.target.value })} placeholder="https://…" /></div>
      <div className="field"><label>Categories</label><div className="row">{CATS.map(c => <span key={c} className="pill" style={{ cursor: "pointer", background: imp.category_tags.includes(c) ? "var(--accent)" : "", color: imp.category_tags.includes(c) ? "#fff" : "" }} onClick={() => setImp(s => ({ ...s, category_tags: s.category_tags.includes(c) ? s.category_tags.filter(x => x !== c) : [...s.category_tags, c] }))}>{c}</span>)}</div></div>
      <div className="row"><label className="row" style={{ textTransform: "none", margin: 0 }}><input type="checkbox" style={{ width: "auto" }} checked={imp.generate} onChange={e => setImp({ ...imp, generate: e.target.checked })} /> &nbsp;generate drafts now</label>
        <button className="btn primary" onClick={runImport}>Import</button></div>
    </div>}

    <div className="row" style={{ marginBottom: 14 }}>
      <div><label>Min score</label><select value={minScore} onChange={e => setMinScore(e.target.value)}><option value="">Any</option><option value="80">80+</option><option value="65">65+</option><option value="50">50+</option></select></div>
      <div><label>Status</label><select value={status} onChange={e => setStatus(e.target.value)}><option value="">All</option><option value="scored">scored</option><option value="draft_ready">draft_ready</option><option value="needs_review">needs_review</option><option value="archived">archived</option></select></div>
    </div>

    <div className="card" style={{ padding: 0 }}>
      <table><thead><tr><th>Item</th><th>Source</th><th>Score</th><th>Rec</th><th>Status</th><th></th></tr></thead>
      <tbody>{items.map(it => (
        <tr key={it.id}>
          <td style={{ maxWidth: 380 }}><strong>{it.title || "(untitled)"}</strong>
            <div className="small muted">{(it.source_category_tags || []).slice(0, 4).join(" · ")}{it.published_at ? "  ·  " + new Date(it.published_at).toLocaleDateString() : ""}</div>
            {it.original_url && <a className="small mono" style={{ color: "var(--accent2)" }} href={it.original_url} target="_blank" rel="noreferrer">open original ↗</a>}</td>
          <td className="small">{it.source_name}</td>
          <td><Score value={it.score?.final_score} /></td>
          <td>{it.score?.recommendation && <Pill>{it.score.recommendation}</Pill>}</td>
          <td><Pill>{it.ingestion_status}</Pill></td>
          <td><div className="row">
            {it.ingestion_status === "draft_ready"
              ? <Link className="btn" href="/culture-engine/drafts">View drafts</Link>
              : <button className="btn primary" disabled={busyId === it.id} onClick={() => gen(it)}>{busyId === it.id ? "…" : "Generate drafts"}</button>}
            <button className="btn ghost" onClick={() => archive(it)}>Archive</button>
          </div></td>
        </tr>
      ))}</tbody></table>
      {!items.length && <p className="muted" style={{ padding: 16 }}>No items. Run the daily pull (Overview) or use Manual import.</p>}
    </div>
  </div>);
}
