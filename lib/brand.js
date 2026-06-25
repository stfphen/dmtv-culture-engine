// Default DMTV brand config. Editable via Settings tab / culture_brand_settings table.
// Replace logo_url with your real asset (see README "Replace the logo").
export const DEFAULT_BRAND = {
  logo_url: null,
  logo_text: "DMTV",
  primary_color: "#0A0A0A",     // near-black background
  secondary_color: "#F5F5F0",   // off-white text
  accent_color: "#E11D2A",      // electric red
  background_style: "dark_grain",
  font_heading: "Helvetica Neue, Arial, sans-serif",
  font_body: "Helvetica Neue, Arial, sans-serif",
  watermark_position: "bottom_right",
  default_cta: "More on DMTV",
  default_footer: "@dmtv",
  template_pack: "dmtv_core",
};

export const DMTV_LANE = [
  "hip-hop culture", "rap & underground music", "Toronto nightlife", "streetwear",
  "fashion drops", "creative scene culture", "artist rollouts", "events",
  "podcasts/interviews", "internet culture", "aesthetic mood boards", "visual culture",
  "local creative business",
];

export const CATEGORIES = [
  "hip_hop","rap_news","underground_music","toronto","nightlife","streetwear","fashion",
  "sneakers","art_design","internet_culture","entertainment","creator_culture",
  "podcast_interviews","events","music_videos","brand_drops","local_business","aesthetic_reference",
];

export const SOURCE_TYPES = [
  "rss","youtube_channel","youtube_search","podcast_rss","website","event",
  "manual","social_tracker","news_search","internal_upload",
];
