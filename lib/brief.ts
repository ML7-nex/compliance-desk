import { entities, STATE_NAMES, pct, isUnreliable, type EntityRow } from "@/lib/entities";
import { computeLab, type LabInputs } from "@/lib/lab";
import { defaultTwin, isCustomised, type TwinState } from "@/lib/twin";

const crore = (x: number) => (Math.abs(x) >= 1e7 ? Math.round((x / 1e7) * 10) / 10 : Math.round((x / 1e7) * 100) / 100);
const ktRound = (t: number) => Math.round(t / 100) / 10;

/** Every figure the AI may quote. It is computed by the engine; the model only phrases it. */
export function buildFacts(e: EntityRow, inputs: LabInputs, twin?: TwinState) {
  const lab = computeLab(e, inputs, twin);
  const customised = twin ? isCustomised(defaultTwin(e), twin) : false;
  const placeholders = lab.s.levers.filter((l) => l.source !== "User input").length;
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
    optimised_levers: opt.e.plan.levers.map((id) => lab.s.levers.find((l) => l.id === id)?.name ?? id),
    optimised_hedge_percent: Math.round(opt.e.plan.hedge * 100),
    paths_simulated: lab.s.paths,
    inputs_customised_by_user: customised,
    lever_count: lab.s.levers.length,
    levers_with_placeholder_figures: placeholders,
    caveats: [
      lab.s.levers.length === 0
        ? "No abatement levers are modelled, so the comparison is between buying on the market and forward cover"
        : placeholders > 0
          ? "Some lever costs and potentials are uncited placeholders"
          : "All lever figures were supplied by the user and have not been independently verified",
      "No CCC has traded yet; price is a scenario assumption",
      "Banking of FY26 surplus into FY27 is " + (twin && !twin.banking ? "switched off" : "assumed, pending BEE confirmation"),
    ],
  };
}

type Facts = ReturnType<typeof buildFacts>;

/** Human-readable fact sheet so the model phrases figures naturally instead of echoing field names. */
function factSheet(f: Facts) {
  const fy26 = f.target_fy26 == null ? "none listed" : f.target_fy26;
  return [
    `Plant: ${f.plant}, ${f.state} (${f.registration}), sector ${f.sector}`,
    `Baseline intensity FY2023-24: ${f.baseline_intensity} tCO2e per tonne`,
    `Target FY2025-26: ${fy26}; target FY2026-27: ${f.target_fy27}`,
    `Required cut by FY27: ${f.required_cut_by_fy27_percent} percent`,
    `Shortfall before any action: ${f.gross_shortfall_fy26_kt} kt in FY26 and ${f.gross_shortfall_fy27_kt} kt in FY27`,
    `Peer rank for required cut: ${f.peer_rank} of ${f.peer_count} (1 is steepest)`,
    `Assumed credit price: Rs ${f.assumed_ccc_price_fy26_rupees_per_tonne} per tonne, volatility ${f.assumed_price_volatility_percent} percent, risk aversion ${f.risk_aversion_lambda}`,
    `Simulated ${f.paths_simulated} price paths`,
    `Buying everything on the market: expected cost Rs ${f.buy_all_expected_cost_crore} crore, bad-year cost Rs ${f.buy_all_bad_year_p95_cost_crore} crore`,
    `Optimised plan: expected cost Rs ${f.optimised_expected_cost_crore} crore, bad-year cost Rs ${f.optimised_bad_year_p95_cost_crore} crore, so the bad-year cost falls by Rs ${f.optimised_p95_saving_crore} crore`,
    `Optimised plan switches on: ${f.optimised_levers.length ? f.optimised_levers.join(", ") : "no abatement levers"}; forward cover ${f.optimised_hedge_percent} percent of the remaining shortfall`,
    f.inputs_customised_by_user ? "The plant's own inputs (output, intensity and/or lever figures) were entered by the user" : "Inputs are the atlas defaults from the gazette baseline",
    `Caveats: ${f.caveats.join("; ")}`,
  ].join("\n");
}

export function buildPrompt(facts: Facts) {
  return [
    "You write a short briefing for the CFO of an Indian industrial plant that has a legally binding carbon-intensity target under India's Carbon Credit Trading Scheme (CCTS).",
    "Rules: use ONLY the facts below. Never introduce a number, price, company or rule that is not listed. Copy figures exactly as written. Give no investment or legal advice.",
    "Style: 110 to 150 words, three short paragraphs of natural, fluent business English with correct spelling and spacing. (1) how hard the target is and how it compares with peers; (2) what the simulation suggests and why; (3) the main caveats, repeating the lever-figure caveat exactly as listed. Write EVERY number as digits exactly as given (for example 0.5173, 24.1 kt, 73 of 75, FY26, FY27) and never spell numbers out in words. Do not expand or invent abbreviations or institution names; use only names that appear in the facts. Write money as 'Rs 2.5 crore'. Say 'bad-year cost' rather than percentile jargon. Do not use markdown, bullets, headings, field names or underscores.",
    "FACTS:",
    factSheet(facts),
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
  const found = (text.replace(/FY\s?\d{2,4}(?:-\d{2})?/gi, " ").replace(/\b(?:CVaR|P)\s?\d{1,2}\b/gi, " ").replace(/\b\d{1,2}(?:st|nd|rd|th)\b/gi, " ").match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((m) => m.replace(/,/g, ""));
  const bad: string[] = [];
  for (const m of new Set(found)) {
    const n = +m;
    if ([1, 2, 3, 26, 27].includes(n)) continue;
    const ok = allowed.some((a) => Math.abs(a - n) <= Math.max(0.051, Math.abs(a) * 0.01) || Math.abs(a * 100 - n) < 0.051 || Math.abs(a / 10 - n) < 0.051);
    if (!ok) bad.push(m);
  }
  // Numbers spelled out in words cannot be checked against the facts, so surface them instead of passing silently.
  if (/\b(?:zero|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten) point\b/i.test(text)) bad.push("numbers written in words");
  return bad;
}

export { pct };
