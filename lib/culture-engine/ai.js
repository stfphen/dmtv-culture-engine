// Provider-agnostic AI call. Falls back to MOCK when no key is configured.
// Returns parsed JSON when expectJson=true.
const ANTHROPIC_KEY = () => process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = () => process.env.OPENAI_API_KEY;

export function aiMode() {
  const pref = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (pref === "anthropic" && ANTHROPIC_KEY()) return "anthropic";
  if (pref === "openai" && OPENAI_KEY()) return "openai";
  if (ANTHROPIC_KEY()) return "anthropic";
  if (OPENAI_KEY()) return "openai";
  return "mock";
}

export function modelName() {
  return process.env.AI_MODEL || (aiMode() === "openai" ? "gpt-4o-mini" : aiMode() === "anthropic" ? "claude-sonnet-4-6" : "mock-v1");
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(body.slice(start, end + 1)); } catch { return null; }
}

async function callAnthropic({ system, prompt }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY(), "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: modelName(), max_tokens: 2000, system, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.map(c => c.text).join("") || "";
}

async function callOpenAI({ system, prompt }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${OPENAI_KEY()}` },
    body: JSON.stringify({ model: modelName(), messages: [{ role: "system", content: system }, { role: "user", content: prompt }], temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// mockFn(payload) -> object, used when in mock mode or on provider failure.
export async function runAI({ system, prompt, expectJson = true, mockFn, payload }) {
  const mode = aiMode();
  if (mode === "mock") return { mode: "mock", model: "mock-v1", data: mockFn ? mockFn(payload) : null };
  try {
    const text = mode === "anthropic" ? await callAnthropic({ system, prompt }) : await callOpenAI({ system, prompt });
    if (!expectJson) return { mode, model: modelName(), data: text };
    const parsed = extractJson(text);
    if (!parsed) throw new Error("could not parse JSON from model output");
    return { mode, model: modelName(), data: parsed };
  } catch (e) {
    console.warn("[ai] provider failed, using mock:", e.message);
    return { mode: "mock_fallback", model: "mock-v1", data: mockFn ? mockFn(payload) : null, error: e.message };
  }
}
