// Unified data store. Uses Postgres when DATABASE_URL is set; otherwise an
// in-memory store persisted to ./data/store.json so the MVP runs with zero setup.
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { dbEnabled, query } from "./db.js";
import { DEFAULT_BRAND } from "./brand.js";
import { TEMPLATES } from "./culture-engine/renderTemplate.js";

const USE_PG = dbEnabled();

/* ---------------- in-memory backend ---------------- */
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function emptyDb() {
  return {
    content_sources: [], culture_items: [], culture_item_summaries: [],
    culture_item_scores: [], culture_content_ideas: [], culture_caption_drafts: [],
    culture_graphic_previews: [], culture_approval_items: [], culture_engine_runs: [], culture_media: [],
    culture_brand_settings: [{ id: randomUUID(), tenant_key: "dmtv", ...DEFAULT_BRAND, updated_at: now() }],
  };
}
let MEM = null;
function loadMem() {
  if (MEM) return MEM;
  try {
    if (fs.existsSync(DATA_FILE)) MEM = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    else MEM = emptyDb();
  } catch { MEM = emptyDb(); }
  return MEM;
}
function saveMem() {
  if (USE_PG) return;
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify(MEM, null, 2)); }
  catch (e) { console.warn("[store] persist failed:", e.message); }
}
function now() { return new Date().toISOString(); }

/* ---------------- helpers ---------------- */
function memInsert(table, row) { const db = loadMem(); const r = { id: randomUUID(), created_at: now(), updated_at: now(), ...row }; db[table].push(r); saveMem(); return r; }
function memUpdate(table, id, patch) { const db = loadMem(); const r = db[table].find(x => x.id === id); if (!r) return null; Object.assign(r, patch, { updated_at: now() }); saveMem(); return r; }
function memFind(table, pred) { return loadMem()[table].filter(pred); }

/* =================================================================
   SOURCES
================================================================= */
export async function listSources({ activeOnly = false } = {}) {
  if (USE_PG) {
    const { rows } = await query(
      `SELECT * FROM content_sources ${activeOnly ? "WHERE is_active = true" : ""} ORDER BY priority_score DESC, created_at DESC`);
    return rows;
  }
  let rows = memFind("content_sources", () => true);
  if (activeOnly) rows = rows.filter(r => r.is_active);
  return rows.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
}
export async function getSource(id) {
  if (USE_PG) return (await query(`SELECT * FROM content_sources WHERE id=$1`, [id])).rows[0] || null;
  return memFind("content_sources", r => r.id === id)[0] || null;
}
export async function createSource(d) {
  const row = {
    name: d.name, source_type: d.source_type, url: d.url || null, platform: d.platform || null,
    category_tags: d.category_tags || [], region_tags: d.region_tags || [],
    priority_score: d.priority_score ?? 5, reliability_score: d.reliability_score ?? 5,
    rights_risk_level: d.rights_risk_level || "low", default_attribution: d.default_attribution || null,
    notes: d.notes || null, is_active: d.is_active ?? true, last_checked_at: null, last_error: null,
  };
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO content_sources (name,source_type,url,platform,category_tags,region_tags,priority_score,reliability_score,rights_risk_level,default_attribution,notes,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [row.name, row.source_type, row.url, row.platform, JSON.stringify(row.category_tags), JSON.stringify(row.region_tags),
       row.priority_score, row.reliability_score, row.rights_risk_level, row.default_attribution, row.notes, row.is_active]);
    return rows[0];
  }
  return memInsert("content_sources", row);
}
export async function updateSource(id, patch) {
  if (USE_PG) {
    const keys = Object.keys(patch);
    if (!keys.length) return getSource(id);
    const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(", ");
    const vals = keys.map(k => (Array.isArray(patch[k]) ? JSON.stringify(patch[k]) : patch[k]));
    const { rows } = await query(`UPDATE content_sources SET ${sets}, updated_at=now() WHERE id=$1 RETURNING *`, [id, ...vals]);
    return rows[0] || null;
  }
  return memUpdate("content_sources", id, patch);
}
export async function deleteSource(id) {
  if (USE_PG) { await query(`DELETE FROM content_sources WHERE id=$1`, [id]); return true; }
  const db = loadMem(); db.content_sources = db.content_sources.filter(r => r.id !== id); saveMem(); return true;
}

/* =================================================================
   ITEMS  (+ dedupe)
================================================================= */
export async function findDuplicate({ canonical_url, content_hash }) {
  if (USE_PG) {
    const { rows } = await query(`SELECT * FROM culture_items WHERE canonical_url=$1 OR content_hash=$2 LIMIT 1`, [canonical_url, content_hash]);
    return rows[0] || null;
  }
  return memFind("culture_items", r => r.canonical_url === canonical_url || (content_hash && r.content_hash === content_hash))[0] || null;
}
export async function createItem(d) {
  const dup = await findDuplicate({ canonical_url: d.canonical_url, content_hash: d.content_hash });
  if (dup) return { item: dup, duplicate: true };
  const row = {
    source_id: d.source_id || null, source_name: d.source_name || null, source_type: d.source_type || null,
    original_url: d.original_url || null, canonical_url: d.canonical_url || null, title: d.title || null,
    author_or_channel: d.author_or_channel || null, published_at: d.published_at || null, discovered_at: now(),
    raw_excerpt: d.raw_excerpt || null, raw_text: d.raw_text || null, thumbnail_url: d.thumbnail_url || null,
    media_url: d.media_url || null, detected_topics: d.detected_topics || [], detected_entities: d.detected_entities || [],
    detected_region: d.detected_region || null, source_category_tags: d.source_category_tags || [],
    content_hash: d.content_hash || null, duplicate_of_id: null, ingestion_status: "fetched", error_message: null,
  };
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_items (source_id,source_name,source_type,original_url,canonical_url,title,author_or_channel,published_at,raw_excerpt,raw_text,thumbnail_url,media_url,detected_topics,detected_entities,detected_region,source_category_tags,content_hash,ingestion_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [row.source_id, row.source_name, row.source_type, row.original_url, row.canonical_url, row.title, row.author_or_channel,
       row.published_at, row.raw_excerpt, row.raw_text, row.thumbnail_url, row.media_url, JSON.stringify(row.detected_topics),
       JSON.stringify(row.detected_entities), row.detected_region, JSON.stringify(row.source_category_tags), row.content_hash, row.ingestion_status]);
    return { item: rows[0], duplicate: false };
  }
  return { item: memInsert("culture_items", row), duplicate: false };
}
export async function updateItem(id, patch) {
  if (USE_PG) {
    const keys = Object.keys(patch);
    const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(", ");
    const vals = keys.map(k => (Array.isArray(patch[k]) ? JSON.stringify(patch[k]) : patch[k]));
    const { rows } = await query(`UPDATE culture_items SET ${sets}, updated_at=now() WHERE id=$1 RETURNING *`, [id, ...vals]);
    return rows[0] || null;
  }
  return memUpdate("culture_items", id, patch);
}
export async function getItem(id) {
  if (USE_PG) return (await query(`SELECT * FROM culture_items WHERE id=$1`, [id])).rows[0] || null;
  return memFind("culture_items", r => r.id === id)[0] || null;
}
export async function listItems({ status, minScore, category, sourceId, limit = 200 } = {}) {
  let items;
  if (USE_PG) { items = (await query(`SELECT * FROM culture_items ORDER BY discovered_at DESC LIMIT $1`, [limit])).rows; }
  else { items = memFind("culture_items", () => true).sort((a, b) => (b.discovered_at || "").localeCompare(a.discovered_at || "")).slice(0, limit); }
  // attach latest score
  const out = [];
  for (const it of items) {
    if (status && it.ingestion_status !== status) continue;
    if (sourceId && it.source_id !== sourceId) continue;
    if (category && !(it.source_category_tags || []).includes(category)) continue;
    const score = await getScore(it.id);
    if (minScore != null && (!score || (score.final_score || 0) < minScore)) continue;
    out.push({ ...it, score: score || null });
  }
  return out;
}

/* =================================================================
   SUMMARIES / SCORES
================================================================= */
export async function getSummary(itemId) {
  if (USE_PG) return (await query(`SELECT * FROM culture_item_summaries WHERE item_id=$1 ORDER BY created_at DESC LIMIT 1`, [itemId])).rows[0] || null;
  return memFind("culture_item_summaries", r => r.item_id === itemId).slice(-1)[0] || null;
}
export async function saveSummary(itemId, s) {
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_item_summaries (item_id,short_summary,key_points,why_it_matters,visual_notes,quote_candidates,potential_angles,risk_notes,ai_model_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [itemId, s.short_summary, JSON.stringify(s.key_points || []), s.why_it_matters, s.visual_notes,
       JSON.stringify(s.quote_candidates || []), JSON.stringify(s.potential_angles || []), s.risk_notes, s.ai_model_used]);
    return rows[0];
  }
  return memInsert("culture_item_summaries", { item_id: itemId, ...s });
}
export async function getScore(itemId) {
  if (USE_PG) return (await query(`SELECT * FROM culture_item_scores WHERE item_id=$1 ORDER BY created_at DESC LIMIT 1`, [itemId])).rows[0] || null;
  return memFind("culture_item_scores", r => r.item_id === itemId).slice(-1)[0] || null;
}
export async function saveScore(itemId, s) {
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_item_scores (item_id,culture_fit_score,dmtv_audience_fit_score,toronto_or_local_relevance_score,hiphop_music_relevance_score,streetwear_visual_relevance_score,nightlife_event_relevance_score,freshness_score,visual_potential_score,conversation_potential_score,originality_opportunity_score,brand_safety_score,rights_safety_score,final_score,recommendation,scoring_explanation,ai_model_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [itemId, s.culture_fit_score, s.dmtv_audience_fit_score, s.toronto_or_local_relevance_score, s.hiphop_music_relevance_score,
       s.streetwear_visual_relevance_score, s.nightlife_event_relevance_score, s.freshness_score, s.visual_potential_score,
       s.conversation_potential_score, s.originality_opportunity_score, s.brand_safety_score, s.rights_safety_score,
       s.final_score, s.recommendation, s.scoring_explanation, s.ai_model_used]);
    return rows[0];
  }
  return memInsert("culture_item_scores", { item_id: itemId, ...s });
}

/* =================================================================
   IDEAS / CAPTIONS / PREVIEWS
================================================================= */
export async function createIdea(itemId, idea, idx) {
  const row = { item_id: itemId, idx, idea_title: idea.idea_title, editorial_angle: idea.editorial_angle,
    format_recommendation: idea.format_recommendation, platform_recommendation: idea.platform_recommendation,
    hook: idea.hook, why_this_works: idea.why_this_works, required_assets: idea.required_assets || [],
    risk_level: idea.risk_level || "low", production_effort: idea.production_effort || "low",
    status: "draft", rights_notes: idea.rights_notes || null };
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_content_ideas (item_id,idx,idea_title,editorial_angle,format_recommendation,platform_recommendation,hook,why_this_works,required_assets,risk_level,production_effort,status,rights_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [itemId, idx, row.idea_title, row.editorial_angle, row.format_recommendation, row.platform_recommendation, row.hook,
       row.why_this_works, JSON.stringify(row.required_assets), row.risk_level, row.production_effort, row.status, row.rights_notes]);
    return rows[0];
  }
  return memInsert("culture_content_ideas", row);
}
export async function listIdeasForItem(itemId) {
  if (USE_PG) return (await query(`SELECT * FROM culture_content_ideas WHERE item_id=$1 ORDER BY idx`, [itemId])).rows;
  return memFind("culture_content_ideas", r => r.item_id === itemId).sort((a, b) => (a.idx || 0) - (b.idx || 0));
}
export async function getIdea(id) {
  if (USE_PG) return (await query(`SELECT * FROM culture_content_ideas WHERE id=$1`, [id])).rows[0] || null;
  return memFind("culture_content_ideas", r => r.id === id)[0] || null;
}
export async function updateIdea(id, patch) {
  if (USE_PG) {
    const keys = Object.keys(patch);
    const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(", ");
    const vals = keys.map(k => (Array.isArray(patch[k]) ? JSON.stringify(patch[k]) : patch[k]));
    const { rows } = await query(`UPDATE culture_content_ideas SET ${sets}, updated_at=now() WHERE id=$1 RETURNING *`, [id, ...vals]);
    return rows[0] || null;
  }
  return memUpdate("culture_content_ideas", id, patch);
}
export async function getCaption(ideaId) {
  if (USE_PG) return (await query(`SELECT * FROM culture_caption_drafts WHERE idea_id=$1 ORDER BY created_at DESC LIMIT 1`, [ideaId])).rows[0] || null;
  return memFind("culture_caption_drafts", r => r.idea_id === ideaId).slice(-1)[0] || null;
}
export async function saveCaption(ideaId, c) {
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_caption_drafts (idea_id,instagram,tiktok,youtube_shorts,x_threads,story_text,hashtags,ai_model_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [ideaId, c.instagram, c.tiktok, c.youtube_shorts, c.x_threads, c.story_text, JSON.stringify(c.hashtags || []), c.ai_model_used]);
    return rows[0];
  }
  return memInsert("culture_caption_drafts", { idea_id: ideaId, ...c });
}
export async function getPreview(ideaId) {
  if (USE_PG) return (await query(`SELECT * FROM culture_graphic_previews WHERE idea_id=$1 ORDER BY created_at DESC LIMIT 1`, [ideaId])).rows[0] || null;
  return memFind("culture_graphic_previews", r => r.idea_id === ideaId).slice(-1)[0] || null;
}
export async function savePreview(ideaId, p) {
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_graphic_previews (idea_id,template_key,svg,preview_path,fields) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ideaId, p.template_key, p.svg, p.preview_path || null, JSON.stringify(p.fields || {})]);
    return rows[0];
  }
  return memInsert("culture_graphic_previews", { idea_id: ideaId, ...p });
}

/* =================================================================
   APPROVALS
================================================================= */
export async function upsertApproval(ideaId, itemId, status = "needs_review") {
  if (USE_PG) {
    const ex = (await query(`SELECT * FROM culture_approval_items WHERE idea_id=$1 LIMIT 1`, [ideaId])).rows[0];
    if (ex) return (await query(`UPDATE culture_approval_items SET status=$2, updated_at=now() WHERE id=$1 RETURNING *`, [ex.id, status])).rows[0];
    return (await query(`INSERT INTO culture_approval_items (idea_id,item_id,status) VALUES ($1,$2,$3) RETURNING *`, [ideaId, itemId, status])).rows[0];
  }
  const ex = memFind("culture_approval_items", r => r.idea_id === ideaId)[0];
  if (ex) return memUpdate("culture_approval_items", ex.id, { status });
  return memInsert("culture_approval_items", { idea_id: ideaId, item_id: itemId, status });
}
export async function listApprovals({ status } = {}) {
  let rows;
  if (USE_PG) rows = (await query(`SELECT * FROM culture_approval_items ORDER BY created_at DESC`)).rows;
  else rows = memFind("culture_approval_items", () => true).reverse();
  if (status) rows = rows.filter(r => r.status === status);
  return rows;
}

/* =================================================================
   RUNS
================================================================= */
export async function createRun() {
  if (USE_PG) return (await query(`INSERT INTO culture_engine_runs (status) VALUES ('running') RETURNING *`)).rows[0];
  return memInsert("culture_engine_runs", { started_at: now(), status: "running", sources_checked: 0, items_found: 0, items_created: 0, items_summarized: 0, items_scored: 0, drafts_generated: 0, errors: [] });
}
export async function updateRun(id, patch) {
  if (USE_PG) {
    const keys = Object.keys(patch);
    const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(", ");
    const vals = keys.map(k => (Array.isArray(patch[k]) || typeof patch[k] === "object" ? JSON.stringify(patch[k]) : patch[k]));
    return (await query(`UPDATE culture_engine_runs SET ${sets} WHERE id=$1 RETURNING *`, [id, ...vals])).rows[0];
  }
  return memUpdate("culture_engine_runs", id, patch);
}
export async function listRuns(limit = 20) {
  if (USE_PG) return (await query(`SELECT * FROM culture_engine_runs ORDER BY started_at DESC LIMIT $1`, [limit])).rows;
  return memFind("culture_engine_runs", () => true).reverse().slice(0, limit);
}

/* =================================================================
   BRAND + TEMPLATES
================================================================= */
export async function getBrand() {
  if (USE_PG) {
    const r = (await query(`SELECT * FROM culture_brand_settings WHERE tenant_key='dmtv' LIMIT 1`)).rows[0];
    if (r) return r;
    return (await query(`INSERT INTO culture_brand_settings (tenant_key) VALUES ('dmtv') RETURNING *`)).rows[0];
  }
  return loadMem().culture_brand_settings[0];
}
export async function updateBrand(patch) {
  if (USE_PG) {
    const keys = Object.keys(patch);
    const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(", ");
    const vals = keys.map(k => patch[k]);
    const b = await getBrand();
    return (await query(`UPDATE culture_brand_settings SET ${sets}, updated_at=now() WHERE id=$1 RETURNING *`, [b.id, ...vals])).rows[0];
  }
  const b = loadMem().culture_brand_settings[0];
  Object.assign(b, patch, { updated_at: now() }); saveMem(); return b;
}
export function listTemplates() {
  return TEMPLATES.map(({ key, name, description, fields }) => ({ key, name, description, fields }));
}


/* =================================================================
   MEDIA LIBRARY
================================================================= */
export async function listMedia({ publishableOnly = false } = {}) {
  let rows;
  if (USE_PG) rows = (await query(`SELECT * FROM culture_media ORDER BY created_at DESC`)).rows;
  else rows = memFind("culture_media", () => true).reverse();
  if (publishableOnly) rows = rows.filter(r => r.publishable);
  return rows;
}
export async function addMedia(d) {
  const row = { title: d.title || null, image_url: d.image_url, local_path: d.local_path || null,
    provider: d.provider || "upload", tags: d.tags || [], rights: d.rights || "owned",
    attribution: d.attribution || "DMTV", publishable: d.publishable ?? (d.rights !== "reference_only"), notes: d.notes || null };
  if (USE_PG) {
    const { rows } = await query(
      `INSERT INTO culture_media (title,image_url,local_path,provider,tags,rights,attribution,publishable,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [row.title, row.image_url, row.local_path, row.provider, JSON.stringify(row.tags), row.rights, row.attribution, row.publishable, row.notes]);
    return rows[0];
  }
  return memInsert("culture_media", row);
}
export async function deleteMedia(id) {
  if (USE_PG) { await query(`DELETE FROM culture_media WHERE id=$1`, [id]); return true; }
  const db = loadMem(); db.culture_media = db.culture_media.filter(r => r.id !== id); saveMem(); return true;
}

