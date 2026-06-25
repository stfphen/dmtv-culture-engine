-- DMTV Culture Engine schema (self-hosted Postgres)
-- Safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. content_sources
CREATE TABLE IF NOT EXISTS content_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  source_type   TEXT NOT NULL,            -- rss|youtube_channel|youtube_search|podcast_rss|website|event|manual|social_tracker|news_search|internal_upload
  url           TEXT,
  platform      TEXT,
  category_tags JSONB NOT NULL DEFAULT '[]',
  region_tags   JSONB NOT NULL DEFAULT '[]',
  priority_score    INT NOT NULL DEFAULT 5,
  reliability_score INT NOT NULL DEFAULT 5,
  rights_risk_level TEXT NOT NULL DEFAULT 'low', -- low|medium|high
  default_attribution TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  last_error    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. culture_items
CREATE TABLE IF NOT EXISTS culture_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     UUID REFERENCES content_sources(id) ON DELETE SET NULL,
  source_name   TEXT,
  source_type   TEXT,
  original_url  TEXT,
  canonical_url TEXT,
  title         TEXT,
  author_or_channel TEXT,
  published_at  TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_excerpt   TEXT,
  raw_text      TEXT,
  thumbnail_url TEXT,
  media_url     TEXT,
  detected_topics    JSONB DEFAULT '[]',
  detected_entities  JSONB DEFAULT '[]',
  detected_region    TEXT,
  source_category_tags JSONB DEFAULT '[]',
  content_hash  TEXT,
  duplicate_of_id UUID REFERENCES culture_items(id) ON DELETE SET NULL,
  ingestion_status TEXT NOT NULL DEFAULT 'new', -- new|fetched|summarized|scored|draft_ready|needs_review|approved|rejected|exported|failed|archived
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_url),
  UNIQUE (content_hash)
);
CREATE INDEX IF NOT EXISTS idx_items_status ON culture_items(ingestion_status);
CREATE INDEX IF NOT EXISTS idx_items_source ON culture_items(source_id);

-- 3. culture_item_summaries
CREATE TABLE IF NOT EXISTS culture_item_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES culture_items(id) ON DELETE CASCADE,
  short_summary   TEXT,
  key_points      JSONB DEFAULT '[]',
  why_it_matters  TEXT,
  visual_notes    TEXT,
  quote_candidates JSONB DEFAULT '[]',
  potential_angles JSONB DEFAULT '[]',
  risk_notes      TEXT,
  ai_model_used   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_summaries_item ON culture_item_summaries(item_id);

-- 4. culture_item_scores
CREATE TABLE IF NOT EXISTS culture_item_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES culture_items(id) ON DELETE CASCADE,
  culture_fit_score INT,
  dmtv_audience_fit_score INT,
  toronto_or_local_relevance_score INT,
  hiphop_music_relevance_score INT,
  streetwear_visual_relevance_score INT,
  nightlife_event_relevance_score INT,
  freshness_score INT,
  visual_potential_score INT,
  conversation_potential_score INT,
  originality_opportunity_score INT,
  brand_safety_score INT,
  rights_safety_score INT,
  final_score INT,
  recommendation TEXT,  -- generate|watchlist|archive|needs_human_review
  scoring_explanation TEXT,
  ai_model_used TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scores_item ON culture_item_scores(item_id);

-- 5. culture_content_ideas
CREATE TABLE IF NOT EXISTS culture_content_ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES culture_items(id) ON DELETE CASCADE,
  idx         INT,
  idea_title  TEXT,
  editorial_angle TEXT,
  format_recommendation TEXT,
  platform_recommendation TEXT,
  hook        TEXT,
  why_this_works TEXT,
  required_assets JSONB DEFAULT '[]',
  risk_level  TEXT,
  production_effort TEXT, -- low|medium|high
  status      TEXT NOT NULL DEFAULT 'draft', -- draft|needs_review|approved|rejected|exported|archived
  rights_notes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ideas_item ON culture_content_ideas(item_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON culture_content_ideas(status);

-- 6. culture_caption_drafts
CREATE TABLE IF NOT EXISTS culture_caption_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID NOT NULL REFERENCES culture_content_ideas(id) ON DELETE CASCADE,
  instagram   TEXT,
  tiktok      TEXT,
  youtube_shorts TEXT,
  x_threads   TEXT,
  story_text  TEXT,
  hashtags    JSONB DEFAULT '[]',
  ai_model_used TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_captions_idea ON culture_caption_drafts(idea_id);

-- 7. culture_graphic_templates
CREATE TABLE IF NOT EXISTS culture_graphic_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,   -- culture_radar|dmtv_take|scene_watch
  name        TEXT NOT NULL,
  description TEXT,
  fields      JSONB DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. culture_graphic_previews
CREATE TABLE IF NOT EXISTS culture_graphic_previews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID NOT NULL REFERENCES culture_content_ideas(id) ON DELETE CASCADE,
  template_key TEXT,
  svg         TEXT,            -- rendered SVG markup (string)
  preview_path TEXT,          -- optional file path / URL if exported
  fields      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_previews_idea ON culture_graphic_previews(idea_id);

-- 9. culture_approval_items
CREATE TABLE IF NOT EXISTS culture_approval_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID NOT NULL REFERENCES culture_content_ideas(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES culture_items(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'needs_review', -- draft|needs_review|approved|rejected|archived|exported
  decided_by  TEXT,
  decided_at  TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_status ON culture_approval_items(status);

-- 10. culture_engine_runs
CREATE TABLE IF NOT EXISTS culture_engine_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'running', -- running|success|partial|failed
  sources_checked  INT DEFAULT 0,
  items_found      INT DEFAULT 0,
  items_created    INT DEFAULT 0,
  items_summarized INT DEFAULT 0,
  items_scored     INT DEFAULT 0,
  drafts_generated INT DEFAULT 0,
  errors      JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. culture_brand_settings  (single-row config; tenant_key for future multi-brand)
CREATE TABLE IF NOT EXISTS culture_brand_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key    TEXT UNIQUE NOT NULL DEFAULT 'dmtv',
  logo_url      TEXT,
  logo_text     TEXT DEFAULT 'DMTV',
  primary_color TEXT DEFAULT '#0A0A0A',
  secondary_color TEXT DEFAULT '#F5F5F0',
  accent_color  TEXT DEFAULT '#E11D2A',
  background_style TEXT DEFAULT 'dark_grain',
  font_heading  TEXT DEFAULT 'Helvetica Neue, Arial, sans-serif',
  font_body     TEXT DEFAULT 'Helvetica Neue, Arial, sans-serif',
  watermark_position TEXT DEFAULT 'bottom_right',
  default_cta   TEXT DEFAULT 'More on DMTV',
  default_footer TEXT DEFAULT '@dmtv',
  template_pack TEXT DEFAULT 'dmtv_core',
  config        JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
