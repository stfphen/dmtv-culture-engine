// SVG -> PNG. Uses @resvg/resvg-js if installed; returns null if unavailable (caller falls back to SVG).
let _resvg; let _tried = false;
export async function svgToPng(svg, { width = 1080 } = {}) {
  if (!_resvg && !_tried) {
    _tried = true;
    try { _resvg = await import("@resvg/resvg-js"); }
    catch { _resvg = null; console.warn("[raster] @resvg/resvg-js not installed — PNG export disabled, serving SVG. Run: npm i @resvg/resvg-js"); }
  }
  if (!_resvg) return null;
  try {
    const r = new _resvg.Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: true } });
    return r.render().asPng();
  } catch (e) { console.warn("[raster] render failed:", e.message); return null; }
}
