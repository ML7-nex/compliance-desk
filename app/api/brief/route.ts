import { entities, isUnreliable } from "@/lib/entities";
import { buildFacts, buildPrompt, untraceableNumbers } from "@/lib/brief";

export const maxDuration = 30;

// Crude per-instance rate limit so a public link cannot burn the API quota.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 6;
}

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "AI brief is not configured on this deployment." }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });

  let body: { reg?: string; price?: number; vol?: number; lambda?: number };
  try { body = await request.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }

  const e = entities.find((x) => x.reg === body.reg);
  if (!e || e.sector !== "Cement" || isUnreliable(e)) return Response.json({ error: "Unknown or unsupported plant." }, { status: 400 });

  // Facts are recomputed here from the engine; the client cannot supply numbers for the model to repeat.
  const facts = buildFacts(e, { price: clamp(body.price, 200, 2500, 800), vol: clamp(body.vol, 0.1, 0.9, 0.4), lambda: clamp(body.lambda, 0, 3, 0.5) });
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(facts) }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", res.status, detail.slice(0, 300));
    return Response.json({ error: `The AI service returned ${res.status}.` }, { status: 502 });
  }
  const data = await res.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
  if (!text) return Response.json({ error: "The AI service returned no text." }, { status: 502 });

  return Response.json({ text, untraceable: untraceableNumbers(text, facts), model });
}
