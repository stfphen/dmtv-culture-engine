"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const TABS = [
  ["Overview", "/culture-engine"],
  ["Sources", "/culture-engine/sources"],
  ["Culture Feed", "/culture-engine/feed"],
  ["Draft Queue", "/culture-engine/drafts"],
  ["Approval Queue", "/culture-engine/approvals"],
  ["Media Library", "/culture-engine/media"],
  ["Brand Templates", "/culture-engine/templates"],
  ["Settings", "/culture-engine/settings"],
];
export default function Nav() {
  const path = usePathname();
  return (
    <div className="topbar">
      <div className="wrap">
        <div className="brandrow">
          <span className="logo">DMTV<span className="dot">.</span></span>
          <span className="tagline">Culture Engine — radar for nightlife, music, streetwear &amp; the creative scene</span>
        </div>
        <nav className="tabs">
          {TABS.map(([label, href]) => (
            <Link key={href} href={href} className={`tab ${path === href ? "active" : ""}`}>{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
