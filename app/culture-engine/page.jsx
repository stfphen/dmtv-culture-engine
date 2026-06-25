"use client";
import { useEffect, useState } from "react";
import { api, Pill, useToast } from "../_components/ui.jsx";

export default function Overview() {
  const [runs, setRuns] = useState([]);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const { toast, node } = useToast();

  async function load() {
    const [r, i] = await Promise.all([api("/api/runs"), api("/api/items")]);
    setRuns(r.runs || []); setItems(i.items || []);
  }
  useEffect(() => { load(); }, []);

  async function runNow() {
    setBusy(true); toast("Running daily pull…");
    const r = await api("/api/run", { method: "POST", body: "{}" });
    setBusy(false); toast(r.error ? "Error: " + r.error : `Done — ${r.items_created || 0} new, ${r.drafts_generated || 0} drafts`);
    load();
  }

  const drafts = items.filter(i => i.ingestion_status === "draft_ready").length;
  const review = items.filter(i => i.ingestion_status === "needs_review").length;
  const last = runs[0];

  return (<div>
    {node}
    <div className="spread">
      <div><h1>Overview</h1><p className="sub">Surface 10–20 strong DMTV-branded drafts a week. Quality over volume.</p></div>
      <button className="btn primary" onClick={runNow} disabled={busy}>{busy ? "Running…" : "Run daily pull"}</button>
    </div>

    <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 22 }}>
      {[["Items ingested", items.length], ["Draft-ready", drafts], ["Needs review", review], ["Runs logged", runs.length]].map(([k, v]) => (
        <div className="card" key={k}><div className="muted small">{k}</div><div style={{ fontSize: 30, fontWeight: 800 }}>{v}</div></div>
      ))}
    </div>

    <div className="cols2">
      <div className="card">
        <h2>Last run</h2>
        {!last ? <p className="muted">No runs yet — hit “Run daily pull”.</p> : (
          <table><tbody>
            <tr><th>Status</th><td><Pill>{last.status}</Pill></td></tr>
            <tr><th>Sources checked</th><td>{last.sources_checked}</td></tr>
            <tr><th>Items found / created</th><td>{last.items_found} / {last.items_created}</td></tr>
            <tr><th>Summarized / scored</th><td>{last.items_summarized} / {last.items_scored}</td></tr>
            <tr><th>Drafts generated</th><td>{last.drafts_generated}</td></tr>
            <tr><th>Errors</th><td>{(last.errors || []).length}</td></tr>
          </tbody></table>
        )}
      </div>
      <div className="card">
        <h2>Run history</h2>
        {!runs.length ? <p className="muted">—</p> : (
          <table><thead><tr><th>Started</th><th>Status</th><th>New</th><th>Drafts</th></tr></thead>
          <tbody>{runs.map(r => (
            <tr key={r.id}><td className="small">{new Date(r.started_at).toLocaleString()}</td>
            <td><Pill>{r.status}</Pill></td><td>{r.items_created}</td><td>{r.drafts_generated}</td></tr>
          ))}</tbody></table>
        )}
      </div>
    </div>
  </div>);
}
