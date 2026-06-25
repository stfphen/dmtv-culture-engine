import "./_env.js";
const { runDailyPull } = await import("../lib/culture-engine/runDailyPull.js");
const r = await runDailyPull();
console.log(JSON.stringify(r, null, 2));
