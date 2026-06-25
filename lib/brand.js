// DMTV brand config — matches the DMTV x DGTL deck system:
// black backgrounds, heavy white Helvetica-style caps, Poppins secondary, gold lightning accent.
// Editable via Settings tab / culture_brand_settings table.
export const DEFAULT_BRAND = {
  logo_url: "/brand/dmtv-logo.png",   // served from /public/brand — replace with your exact asset
  logo_text: "DMTV",
  primary_color: "#0A0A0A",           // near-black background
  secondary_color: "#F5F5F0",         // off-white text
  accent_color: "#E8C24A",            // gold (lightning)
  background_style: "dark_grain",
  font_heading: "Helvetica Neue, Helvetica, Arial, sans-serif",  // matches deck Helvetica-Bold
  font_body: "Poppins, Helvetica Neue, Arial, sans-serif",       // deck body font
  watermark_position: "bottom_left",
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
