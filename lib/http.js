export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
export async function body(req) { try { return await req.json(); } catch { return {}; } }
