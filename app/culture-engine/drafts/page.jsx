"use client";
import { useEffect, useState } from "react";
import { api, Pill, Score, useToast } from "../../_components/ui.jsx";
import IdeaCard from "../../_components/IdeaCard.jsx";

export default function Drafts() {
  const [groups, setGroups] = useState([]);
  const { toast, node } = useToast();

  async function load() {
    const { items } = await api("/api/items");
    const withDrafts = items.filter(i => ["draft_ready", "needs_review"].includes(i.ingestion_status));
    const details = await Promise.all(withDrafts.map(i => api(`/api/items/${i.id}`)));
    setGroups(details.filter(d => d.ideas && d.ideas.length));
  }
  useEffect(() => { load(); }, []);

  return (<div>
    {node}
    <h1>Draft Queue</h1><p className="sub">Each item packaged into 3 DMTV ideas with captions + a branded preview. Review, edit, approve.</p>
    {!groups.length && <div className="card"><p className="muted">No drafts yet. Generate drafts from the Culture Feed.</p></div>}
    {groups.map(g => (
      <div key={g.item.id} style={{ marginBottom: 26 }}>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="spread">
            <div><h2 style={{ marginBottom: 4 }}>{g.item.title}</h2>
              <div className="row"><span className="small muted">{g.item.source_name}</span>
                {g.item.original_url && <a className="small" style={{ color: "var(--accent2)" }} href={g.item.original_url} target="_blank" rel="noreferrer">original ↗</a>}
                {g.score?.recommendation && <Pill>{g.score.recommendation}</Pill>}</div></div>
            <div style={{ textAlign: "right" }}><Score value={g.score?.final_score} /><div className="small muted">DMTV score</div></div>
          </div>
          {g.summary && <><div className="divider" /><p className="small muted" style={{ margin: 0 }}><strong>Why it fits:</strong> {g.summary.why_it_matters}</p>
            {g.summary.risk_notes && <p className="small" style={{ color: "var(--warn)", margin: "6px 0 0" }}><strong>Risk:</strong> {g.summary.risk_notes}</p>}</>}
        </div>
        <div className="grid">{g.ideas.map(idea => (
          <IdeaCard key={idea.id} idea={idea} caption={idea.caption} onChanged={load} onToast={toast} />
        ))}</div>
      </div>
    ))}
  </div>);
}
