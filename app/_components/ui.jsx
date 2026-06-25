"use client";
import { useState, useCallback } from "react";

export function useToast() {
  const [msg, setMsg] = useState(null);
  const toast = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(null), 2200); }, []);
  const node = msg ? <div className="toast">{msg}</div> : null;
  return { toast, node };
}

export function Copy({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  return <button className="btn ghost copybtn" onClick={async () => {
    try { await navigator.clipboard.writeText(text || ""); } catch {}
    setDone(true); setTimeout(() => setDone(false), 1200);
  }}>{done ? "Copied" : label}</button>;
}

export function Score({ value }) {
  const v = value ?? 0;
  const cls = v >= 80 ? "hi" : v >= 65 ? "mid" : "lo";
  return <span className={`score ${cls}`}>{value == null ? "—" : v}</span>;
}

export function Pill({ children }) {
  const k = String(children || "").toLowerCase().replace(/\s+/g, "_");
  return <span className={`pill ${k}`}>{children}</span>;
}

export async function api(url, opts) {
  const res = await fetch(url, { headers: { "content-type": "application/json" }, ...opts });
  return res.json();
}
