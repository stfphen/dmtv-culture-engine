"use client";
import { useEffect, useState } from "react";
import { api, Pill, useToast } from "../../_components/ui.jsx";

const SOURCE_TYPES = ["rss","youtube_channel","youtube_search","podcast_rss","website","event","manual","social_tracker","news_search","internal_upload"];
const CATS = ["hip_hop","rap_news","underground_music","toronto","nightlife","streetwear","fashion","sneakers","art_design","internet_culture","entertainment","creator_culture","podcast_interviews","events","music_videos","brand_drops","local_business","aesthetic_reference"];

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [show, setShow] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({ name: "", source_type: "rss", url: "", category_tags: [], region_tags: ["toronto"], priority_score: 6, rights_risk_level: "low" });
  const { toast, node } = useToast();

  async function load() { setSources((await api("/api/sources")).sources || []); }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name) return toast("Name required");
    const r = await api("/api/sources", { method: "POST", body: JSON.stringify(form) });
    if (r.error) return toast(r.error);
    setShow(false); setForm({ ...form, name: "", url: "", category_tags: [] }); toast("Source added"); load();
  }
  async function toggle(s) { await api(`/api/sources/${s.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !s.is_active }) }); load(); }
  async function del(s) { if (!confirm(`Delete "${s.name}"?`)) return; await api(`/api/sources/${s.id}`, { method: "DELETE" }); load(); }
  async function check(s) {
    setBusyId(s.id); toast(`Checking ${s.name}…`);
    const r = await api(`/api/sources/${s.id}/check`, { method: "POST", body: "{}" });
    setBusyId(null); toast(r.error ? r.error : `${s.name}: ${r.items_created || 0} new, ${r.drafts_generated || 0} drafts`); load();
  }
  function toggleCat(c) { setForm(f => ({ ...f, category_tags: f.category_tags.includes(c) ? f.category_tags.filter(x => x !== c) : [...f.category_tags, c] })); }

  return (<div>
    {node}
    <div className="spread"><div><h1>Source Library</h1><p className="sub">Approved culture signals. Prefer RSS / official feeds / manual import over scraping.</p></div>
      <button className="btn primary" onClick={() => setShow(!show)}>{show ? "Close" : "+ Add source"}</button></div>

    {show && <div className="card" style={{ marginBottom: 18 }}>
      <div className="cols2">
        <div className="field"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hypebeast" /></div>
        <div className="field"><label>Type</label><select value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value })}>{SOURCE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
      </div>
      <div className="field"><label>URL / feed / channelId / query</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://… (leave blank for manual/internal)" /></div>
      <div className="field"><label>Categories</label><div className="row">{CATS.map(c => <span key={c} className="pill" style={{ cursor: "pointer", background: form.category_tags.includes(c) ? "var(--accent)" : "", color: form.category_tags.includes(c) ? "#fff" : "" }} onClick={() => toggleCat(c)}>{c}</span>)}</div></div>
      <div className="cols2">
        <div className="field"><label>Priority (0-10)</label><input type="number" min="0" max="10" value={form.priority_score} onChange={e => setForm({ ...form, priority_score: +e.target.value })} /></div>
        <div className="field"><label>Rights risk</label><select value={form.rights_risk_level} onChange={e => setForm({ ...form, rights_risk_level: e.target.value })}><option>low</option><option>medium</option><option>high</option></select></div>
      </div>
      <button className="btn primary" onClick={create}>Save source</button>
    </div>}

    <div className="card" style={{ padding: 0 }}>
      <table><thead><tr><th>Source</th><th>Type</th><th>Categories</th><th>Rights</th><th>Last checked</th><th>Status</th><th></th></tr></thead>
      <tbody>{sources.map(s => (
        <tr key={s.id}>
          <td><strong>{s.name}</strong>{s.last_error && <div className="small" style={{ color: "#ff6b76" }}>⚠ {s.last_error.slice(0, 60)}</div>}{s.url && <div className="small muted mono">{s.url.slice(0, 42)}</div>}</td>
          <td className="small">{s.source_type}</td>
          <td className="small">{(s.category_tags || []).slice(0, 3).join(", ")}{(s.category_tags || []).length > 3 ? "…" : ""}</td>
          <td><Pill>{s.rights_risk_level}</Pill></td>
          <td className="small muted">{s.last_checked_at ? new Date(s.last_checked_at).toLocaleString() : "never"}</td>
          <td><Pill>{s.is_active ? "active" : "disabled"}</Pill></td>
          <td><div className="row">
            <button className="btn" disabled={busyId === s.id} onClick={() => check(s)}>{busyId === s.id ? "…" : "Check now"}</button>
            <button className="btn ghost" onClick={() => toggle(s)}>{s.is_active ? "Disable" : "Enable"}</button>
            <button className="btn ghost" onClick={() => del(s)}>✕</button>
          </div></td>
        </tr>
      ))}</tbody></table>
      {!sources.length && <p className="muted" style={{ padding: 16 }}>No sources yet. Run <span className="mono">npm run seed</span> or add one above.</p>}
    </div>
  </div>);
}
