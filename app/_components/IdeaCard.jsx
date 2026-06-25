"use client";
import { useState } from "react";
import { api, Pill, Copy } from "./ui.jsx";

const SIGNAL_LABEL = { sends: "→ sends/shares", saves: "→ saves", comments: "→ comments" };

function CaptionRow({ label, text }) {
  if (!text) return null;
  return <div className="field" style={{ marginBottom: 8 }}>
    <div className="spread"><label style={{ margin: 0 }}>{label}</label><Copy text={text} /></div>
    <div className="small" style={{ whiteSpace: "pre-wrap", background: "var(--panel2)", padding: 8, borderRadius: 6, marginTop: 4 }}>{text}</div>
  </div>;
}

export default function IdeaCard({ idea, caption, preview, onChanged, onToast }) {
  const [busy, setBusy] = useState(false);
  const [c, setC] = useState(caption);
  const [slide, setSlide] = useState(0);
  const fields = preview?.fields || {};
  const visual = fields.visual || null;
  const reference = fields.reference || null;
  const assetType = idea.asset_type || fields.asset_type || "post";
  const payload = idea.payload || {};
  const slideCount = Array.isArray(fields.slides) ? fields.slides.length : 0;
  const isCarousel = assetType === "carousel" && slideCount > 0;

  const base = `/api/render/${idea.id}`;
  const previewUrl = isCarousel ? `${base}?slide=${slide}` : base;

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
        <span className="pill" style={{ background: "var(--accent)", color: "#0a0a0a" }}>{assetType.replace("_", " ")}</span>
        {idea.target_signal && <span className="pill">{SIGNAL_LABEL[idea.target_signal] || idea.target_signal}</span>}
        {idea.franchise && <span className="small muted">{idea.franchise}</span>}
        <span className="small muted">effort: {idea.production_effort}</span><Pill>{idea.status}</Pill></div></div>
    </div>

    <div className="cols2" style={{ marginTop: 12 }}>
      <div>
        {idea.hook && <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Hook:</strong> {idea.hook}</p>}
        {idea.editorial_angle && <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Angle:</strong> {idea.editorial_angle}</p>}
        {idea.why_this_works && <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Why it works:</strong> {idea.why_this_works}</p>}

        {assetType === "carousel" && Array.isArray(payload.slides) && (
          <div className="small muted" style={{ margin: "0 0 8px" }}><strong>Slides:</strong>
            <ol style={{ margin: "4px 0 0", paddingLeft: 18 }}>{payload.slides.map((s, i) => <li key={i}>{s.heading}{s.body ? ` — ${s.body}` : ""}</li>)}</ol>
          </div>
        )}
        {assetType === "clip_brief" && Array.isArray(payload.cuts) && (
          <div className="small muted" style={{ margin: "0 0 8px" }}><strong>Vertical cuts to pull:</strong>
            <ol style={{ margin: "4px 0 0", paddingLeft: 18 }}>{payload.cuts.map((cut, i) => <li key={i}>{cut.label}: {cut.suggested_moment}</li>)}</ol>
          </div>
        )}
        {assetType === "quote_card" && payload.quote && <p className="small" style={{ margin: "0 0 8px" }}><strong>Quote:</strong> "{payload.quote}" — {payload.attribution}</p>}

        {idea.rights_notes && <p className="small" style={{ color: "var(--warn)" }}><strong>Rights:</strong> {idea.rights_notes}</p>}

        {(c?.instagram || c?.tiktok) && <><div className="divider" />
          <CaptionRow label="Instagram" text={c?.instagram} />
          <CaptionRow label="TikTok" text={c?.tiktok} />
          <CaptionRow label="YouTube Shorts" text={c?.youtube_shorts} />
          <CaptionRow label="X / Threads" text={c?.x_threads} />
          <CaptionRow label="Story" text={c?.story_text} />
          {hashtags && <div className="spread"><span className="small muted">{hashtags}</span><Copy text={hashtags} label="Copy tags" /></div>}
        </>}
      </div>

      <div>
        <img className="preview" src={previewUrl} alt="DMTV preview" />
        {isCarousel && <div className="row" style={{ marginTop: 6, justifyContent: "space-between" }}>
          <button className="btn ghost copybtn" onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}>← prev</button>
          <span className="small muted">slide {slide + 1} / {slideCount}</span>
          <button className="btn ghost copybtn" onClick={() => setSlide(s => Math.min(slideCount - 1, s + 1))} disabled={slide === slideCount - 1}>next →</button>
        </div>}
        {visual && <p className="small muted" style={{ margin: "6px 0 0" }}>Visual: <strong>{visual.provider}</strong> ({visual.rights}){visual.attribution ? ` — ${visual.attribution}` : ""}</p>}
        {reference && <p className="small" style={{ margin: "4px 0 0", color: "var(--warn)" }}>⚠ Source image is <a href={reference.image_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>reference</a> only — not cleared to publish.</p>}
        <div className="row" style={{ marginTop: 8 }}>
          <a className="btn ghost copybtn" href={`${previewUrl}${isCarousel ? "&" : "?"}format=png&download=1`} download>Download PNG</a>
          <a className="btn ghost copybtn" href={`${previewUrl}${isCarousel ? "&" : "?"}download=1`} download>SVG</a>
          {(c?.instagram) && <button className="btn ghost copybtn" onClick={regenerate} disabled={busy}>Regen captions</button>}
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
