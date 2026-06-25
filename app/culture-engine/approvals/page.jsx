"use client";
import { useEffect, useState } from "react";
import { api, Pill, Score, useToast } from "../../_components/ui.jsx";
import IdeaCard from "../../_components/IdeaCard.jsx";

const STATUSES = ["needs_review", "approved", "rejected", "exported", "archived"];

export default function Approvals() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("needs_review");
  const { toast, node } = useToast();

  async function load() {
    const q = status ? `?status=${status}` : "";
    setRows((await api("/api/approvals" + q)).approvals || []);
  }
  useEffect(() => { load(); }, [status]);

  return (<div>
    {node}
    <h1>Approval Queue</h1><p className="sub">Human decision point. Manual posting only — copy captions, download the graphic, post from your tools.</p>
    <div className="row" style={{ marginBottom: 14 }}>
      {STATUSES.map(s => <button key={s} className={`btn ${status === s ? "primary" : "ghost"}`} onClick={() => setStatus(s)}>{s.replace("_", " ")}</button>)}
    </div>
    {!rows.length && <div className="card"><p className="muted">Nothing in “{status}”.</p></div>}
    <div className="grid">{rows.map(r => (
      <div key={r.approval.id}>
        <div className="small muted" style={{ marginBottom: 6 }}>
          {r.item?.title} · {r.item?.source_name} {r.score?.final_score != null && <>· <Score value={r.score.final_score} /></>}
        </div>
        <IdeaCard idea={r.idea} caption={r.caption} onChanged={load} onToast={toast} />
      </div>
    ))}</div>
  </div>);
}
