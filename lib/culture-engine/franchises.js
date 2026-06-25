// DMTV recurring franchise slate. Each maps to a target engagement signal + default format.
export const FRANCHISES = [
  { key: "culture_radar", name: "Culture Radar", signal: "sends", cadence: "daily", cats: ["rap_news","brand_drops","entertainment","music_videos"], blurb: "Fast, factual, DMTV-first on the update." },
  { key: "dmtv_take", name: "DMTV Take", signal: "comments", cadence: "3x/week", cats: ["hip_hop","rap_news","streetwear","entertainment"], blurb: "Original commentary on a move." },
  { key: "before_it_pops", name: "Before It Pops", signal: "saves", cadence: "weekly", cats: ["underground_music","creator_culture","local_business"], blurb: "Emerging Toronto artist/brand/event discovery." },
  { key: "fit_check", name: "Rate This Fit", signal: "comments", cadence: "weekly", cats: ["streetwear","fashion","sneakers"], blurb: "Streetwear / event styling spotlight." },
  { key: "who_ran_the_city", name: "Who Ran The City", signal: "saves", cadence: "weekly", cats: ["nightlife","events","toronto"], blurb: "Weekend nightlife/event recap." },
  { key: "weekend_map", name: "Weekend Map", signal: "saves", cadence: "weekly", cats: ["events","nightlife","toronto"], blurb: "Upcoming events guide." },
  { key: "best_bars", name: "Best Toronto Bars", signal: "comments", cadence: "weekly", cats: ["hip_hop","toronto","music_videos"], blurb: "Local rap spotlight (permission-first)." },
  { key: "aesthetic", name: "Aesthetic Breakdown", signal: "saves", cadence: "weekly", cats: ["aesthetic_reference","streetwear","art_design","music_videos"], blurb: "The visual language behind a drop/video/campaign." },
];

export function routeFranchise(item) {
  const cats = item.source_category_tags || [];
  let best = FRANCHISES[0], bestScore = -1;
  for (const f of FRANCHISES) {
    const overlap = f.cats.filter(c => cats.includes(c)).length;
    if (overlap > bestScore) { bestScore = overlap; best = f; }
  }
  return best;
}
