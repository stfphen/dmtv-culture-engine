"use client";
import { useEffect, useState } from "react";
import { api, Pill, useToast } from "../../_components/ui.jsx";
const CATS = ["hip_hop","rap_news","toronto","nightlife","streetwear","fashion","sneakers","events","music_videos","aesthetic_reference"];

export default function Media() {
  const [media, setMedia] = useState([]);
  const [form, setForm] = useState({ image_url: "", title: "", tags: [], rights: "owned", attribution: "DMTV" });
  const { toast, node } = useToast();
  async function load() { setMedia((await api("/api/media")).media || []); }
  useEffect(() => { load(); }, []);
  async function add() {
    if (!form.image_url) return toast("Image URL required");
    const r = await api("/api/media", { method: "POST", body: JSON.stringify({ ...form, provider: "upload" }) });
    if (r.error) return toast(r.error);
    setForm({ ...form, image_url: "", title: "", tags: [] }); toast("Added to library"); load();
  }
  async function del(m) { await api(`/api/media/${m.id}`, { method: "DELETE" }); load(); }
  function toggleTag(c) { setForm(f => ({ ...f, tags: f.tags.includes(c) ? f.tags.filter(x => x !== c) : [...f.tags, c] })); }

  return (<div>
    {node}
    <h1>Media Library</h1><p className="sub">DMTV-owned imagery the engine can composite into graphics (fully rights-safe). Drop files in <span className="mono">public/media/</span> and reference them as <span className="mono">/media/name.jpg</span>, or paste a hosted URL.</p>
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="cols2">
        <div className="field"><label>Image URL or /media/ path</label><input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="/media/tour-still-01.jpg" /></div>
        <div className="field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Tour still — Toronto" /></div>
      </div>
      <div className="field"><label>Tags (match to item categories)</label><div className="row">{CATS.map(c => <span key={c} className="pill" style={{ cursor: "pointer", background: form.tags.includes(c) ? "var(--accent)" : "", color: form.tags.includes(c) ? "#0a0a0a" : "" }} onClick={() => toggleTag(c)}>{c}</span>)}</div></div>
      <div className="cols2">
        <div className="field"><label>Rights</label><select value={form.rights} onChange={e => setForm({ ...form, rights: e.target.value })}><option value="owned">owned (DMTV)</option><option value="licensed">licensed</option><option value="original_ai">AI original</option></select></div>
        <div className="field"><label>Attribution</label><input value={form.attribution} onChange={e => setForm({ ...form, attribution: e.target.value })} /></div>
      </div>
      <button className="btn primary" onClick={add}>Add to library</button>
    </div>
    <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>{media.map(m => (
      <div className="card" key={m.id}>
        <img className="preview" src={m.image_url} alt={m.title || ""} style={{ aspectRatio: "1/1", objectFit: "cover" }} onError={e => { e.target.style.opacity = .3; }} />
        <div className="spread" style={{ marginTop: 8 }}><strong className="small">{m.title || "(untitled)"}</strong><Pill>{m.rights}</Pill></div>
        <div className="small muted">{(m.tags || []).join(", ")}</div>
        <button className="btn ghost copybtn" style={{ marginTop: 8 }} onClick={() => del(m)}>Remove</button>
      </div>
    ))}</div>
    {!media.length && <p className="muted">Library is empty. Add DMTV stills/photos above — they'll be matched to relevant items by tag and composited into graphics.</p>}
  </div>);
}
