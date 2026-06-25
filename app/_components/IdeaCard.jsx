"use client";
import { useState } from "react";
import { api, Pill, Copy } from "./ui.jsx";

function CaptionRow({ label, text }) {
  if (!text) return null;
  return <div className="field" style={{ marginBottom: 8 }}>
    <div className="spread"><label style={{ margin: 0 }}>{label}</label><Copy text={text} /></div>
    <div className="small" style={{ whiteSpace: "pre-wrap", background: "var(--panel2)", padding: 8, borderRadius: 6, marginTop: 4 }}>{text}</div>
  </div>;
}

export default function IdeaCard({ idea, caption, preview, onChanged, onToast }) {
  const visual = preview?.fields?.visual || null;
  const reference = preview?.fields?.reference || null;
  const [busy, setBusy] = useState(false);
  const [c, setC] = useState(caption);
  const previewUrl = `/api/render/${idea.id}`;

  async function setStatus(status) {
    setBusy(true);
    await api(`/api/ideas/${idea.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setBusy(false); onToast && onToast(`Marked ${status}`); onChanged && onChanged();
  }
  async function regenerate() {
    setBusy(true); onToast && onToast("Regenerating captions…");
    const r = await api(`/api/ideas/${idea.id}`, { method: "POST", body: "{}" });
    setC(r.caption); setBusy(false); onToast && onToast("Captions regenerated");
  }
  const hashtags = (c?.hashtags || []).join(" ");

  return (<div className="card">
    <div className="spread">
      <div><strong>{idea.idea_title}</strong><div className="row" style={{ marginTop: 5 }}>
        <Pill>{idea.format_recommendation}</Pill><span className="small muted">{idea.platform_recommendation}</span>
        <span className="small muted">effort: {idea.production_effort}</span><Pill>{idea.status}</Pill></div></div>
    </div>
    <div className="cols2" style={{ marginTop: 12 }}>
      <div>
        <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Hook:</strong> {idea.hook}</p>
        <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Angle:</strong> {idea.editorial_angle}</p>
        <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Why it works:</strong> {idea.why_this_works}</p>
        {idea.rights_notes && <p className="small" style={{ color: "var(--warn)" }}><strong>Rights:</strong> {idea.rights_notes}</p>}
        <div className="divider" />
        <CaptionRow label="Instagram" text={c?.instagram} />
        <CaptionRow label="TikTok" text={c?.tiktok} />
        <CaptionRow label="YouTube Shorts" text={c?.youtube_shorts} />
        <CaptionRow label="X / Threads" text={c?.x_threads} />
        <CaptionRow label="Story" text={c?.story_text} />
        {hashtags && <div className="spread"><span className="small muted">{hashtags}</span><Copy text={hashtags} label="Copy tags" /></div>}
      </div>
      <div>
        <img className="preview" src={previewUrl} alt="DMTV preview" />
        {visual && <p className="small muted" style={{ margin: "6px 0 0" }}>Visual: <strong>{visual.provider}</strong> ({visual.rights}){visual.attribution ? ` — ${visual.attribution}` : ""}</p>}
        {reference && <p className="small" style={{ margin: "4px 0 0", color: "var(--warn)" }}>⚠ Source image kept as <a href={reference.image_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>reference</a> only — not cleared to publish.</p>}
        <div className="row" style={{ marginTop: 8 }}>
          <a className="btn ghost copybtn" href={`${previewUrl}?download=1`} download>Download SVG</a>
          <button className="btn ghost copybtn" onClick={regenerate} disabled={busy}>Regenerate</button>
        </div>
      </div>
    </div>
    <div className="divider" />
    <div className="row">
      <button className="btn good" disabled={busy} onClick={() => setStatus("approved")}>Approve</button>
      <button className="btn" disabled={busy} onClick={() => setStatus("rejected")}>Reject</button>
      <button className="btn ghost" disabled={busy} onClick={() => setStatus("exported")}>Mark exported</button>
      <button className="btn ghost" disabled={busy} onClick={() => setStatus("archived")}>Archive</button>
    </div>
  </div>);
}
