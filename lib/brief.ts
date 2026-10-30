import { entities, STATE_NAMES, pct, isUnreliable, type EntityRow } from "@/lib/entities";
import { computeLab, type LabInputs } from "@/lib/lab";

const crore = (x: number) => Math.round((x / 1e7) * 10) / 10;
const ktRound = (t: number) => Math.round(t / 100) / 10;

/** Every figure the AI may quote. It is computed by the engine; the model only phrases it. */
export function buildFacts(e: EntityRow, inputs: LabInputs) {
  const lab = computeLab(e, inputs);
  const peers = entities.filter((x) => x.sector === e.sector && x.sub === e.sub && !isUnreliable(x));
  const rank = peers.filter((p) => p.cutPct27 > e.cutPct27).length + 1;
  const [spot, , , opt] = lab.strategies;
  return {
    plant: e.name.split(",").slice(0, 2).join(",").trim(),
    registration: e.reg,
    sector: `${e.sector} / ${e.sub}`,
    state: STATE_NAMES[e.state] ?? e.state,
    baseline_intensity: e.base,
    target_fy26: e.t26,
    target_fy27: e.t27,
    required_cut_by_fy27_percent: Math.round(e.cutPct27 * 1000) / 10,
    gross_shortfall_fy26_kt: ktRound(lab.gross[0]),
    gross_shortfall_fy27_kt: ktRound(lab.gross[1]),
    peer_rank: rank,
    peer_count: peers.length,
    assumed_ccc_price_fy26_rupees_per_tonne: inputs.price,
    assumed_price_volatility_percent: Math.round(inputs.vol * 100),
    risk_aversion_lambda: inputs.lambda,
    buy_all_expected_cost_crore: crore(spot.e.stats.mean),
    buy_all_bad_year_p95_cost_crore: crore(spot.e.stats.p95),
    optimised_expected_cost_crore: crore(opt.e.stats.mean),
    optimised_bad_year_p95_cost_crore: crore(opt.e.stats.p95),
    optimised_p95_saving_crore: crore(spot.e.stats.p95 - opt.e.stats.p95),
    optimised_levers: opt.e.plan.levers,
    optimised_hedge_percent: Math.round(opt.e.plan.hedge * 100),
    paths_simulated: lab.s.paths,
    caveats: [
      "Lever costs and potentials are uncited placeholders",
      "No CCC has traded yet; price is a scenario assumption",
      "Banking of FY26 surplus into FY27 is assumed, pending BEE confirmation",
    ],
  };
}

export function buildPrompt(facts: ReturnType<typeof buildFacts>) {
  return [
    "You write a short briefing for the CFO of an Indian industrial plant that has a legally binding carbon-intensity target under India's Carbon Credit Trading Scheme.",
    "Use ONLY the facts in the JSON below. Do not introduce any number, price, company or rule that is not in the JSON. Do not give investment or legal advice.",
    "Write 110 to 150 words of plain prose in three short paragraphs: (1) how hard the target is and how it compares with peers, (2) what the simulation suggests and why, (3) the main caveats. Mention that lever costs are placeholders. Quote money in rupees crore. No markdown, no bullet points, no headings.",
    "FACTS:",
    JSON.stringify(facts),
  ].join("\n");
}

/** Numbers in the text that are not traceable to the facts (within rounding). Returned so the UI can flag them. */
export function untraceableNumbers(text: string, facts: object): string[] {
  const allowed: number[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "number") allowed.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
    else if (typeof v === "string") (v.match(/\d+(?:\.\d+)?/g) ?? []).forEach((m) => allowed.push(+m));
  };
  walk(facts);
  // fy26/fy27/FY2026 style year tokens and ordinals are not claims
  const found = (text.replace(/FY\s?\d{2,4}(?:-\d{2})?/gi, " ").replace(/\b(?:CVaR|P)\s?\d{1,2}\b/g, " ").replace(/\b\d{1,2}(?:st|nd|rd|th)\b/gi, " ").match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((m) => m.replace(/,/g, ""));
  const bad: string[] = [];
  for (const m of new Set(found)) {
    const n = +m;
    if ([1, 2, 3, 26, 27].includes(n)) continue;
    const ok = allowed.some((a) => Math.abs(a - n) <= Math.max(0.051, Math.abs(a) * 0.01) || Math.abs(a * 100 - n) < 0.051 || Math.abs(a / 10 - n) < 0.051);
    if (!ok) bad.push(m);
  }
  return bad;
}

export { pct };
