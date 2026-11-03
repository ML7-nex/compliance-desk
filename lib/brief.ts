import { entities, STATE_NAMES, type EntityRow } from "@/lib/entities";
import { PRICE_TABLE, changedFields, computeOptions, defaultInputs, isCustomised, priceRows, type PlantInputs } from "@/lib/simple";

const crore = (x: number) => (Math.abs(x) >= 1e8 ? Math.round((x / 1e7) * 10) / 10 : Math.round((x / 1e7) * 100) / 100);
const ktRound = (t: number) => Math.round(t / 100) / 10;

/** Every figure the AI may quote. The simple sums compute it; the model only phrases it. */
export function buildFacts(e: EntityRow, inputs: PlantInputs, price: number) {
  const def = defaultInputs(e);
  const r = computeOptions(inputs, e.t27, price);
  const [buy, abate, mix] = r.options;
  const peers = entities.filter((x) => x.sector === e.sector && x.sub === e.sub);
  const rank = peers.filter((p) => p.cutPct27 > e.cutPct27).length + 1;
  const rows = priceRows(inputs, e.t27, PRICE_TABLE);
  const best = r.options.find((o) => o.key === r.bestKey);
  const userMade = inputs.abatements.filter((a) => a.edited || a.custom).length;
  return {
    plant: e.name.split(",").slice(0, 2).join(",").trim(),
    registration: e.reg,
    state: STATE_NAMES[e.state] ?? e.state,
    baseline_intensity: e.base,
    target_fy26: e.t26,
    target_fy27: e.t27,
    required_cut_by_fy27_percent: Math.round(e.cutPct27 * 1000) / 10,
    peer_rank: rank,
    peer_count: peers.length,
    gap_to_cut_by_fy27_kt: ktRound(r.gapT),
    assumed_credit_price_rupees_per_tonne: price,
    buy_all_cost_crore: crore(buy.total as number),
    cut_it_all_with_abatements_possible: abate.possible,
    cut_it_all_with_abatements_cost_crore: abate.total == null ? null : crore(abate.total),
    abatements_that_cost_less_than_a_credit: mix.uses.map((u) => ({ name: u.name, can_cut_kt: ktRound(u.tonnes), cost_rupees_per_tonne: Math.round(u.costPerTonne) })),
    abatements_first_then_buy_cost_crore: crore(mix.total as number),
    credits_to_buy_in_that_option_kt: ktRound(mix.boughtT),
    cheapest_option: best ? best.name : "none (no gap)",
    cost_at_other_credit_prices: rows.map((x) => ({ credit_price_rupees: x.price, buy_all_crore: crore(x.buy), abatements_first_then_buy_crore: crore(x.mix) })),
    changed_by_user: changedFields(def, inputs),
    inputs_customised_by_user: isCustomised(def, inputs),
    abatements_with_figures_entered_by_user: userMade,
    caveats: [
      userMade > 0 ? "Some abatement figures were entered by the user and have not been independently checked" : "Abatement costs come from a 2023 CEEW study; how much each abatement can cut at this plant is a placeholder",
      "No carbon credit has traded yet; the credit price is the user's assumption",
    ],
  };
}

type Facts = ReturnType<typeof buildFacts>;

/** Human-readable fact sheet so the model phrases figures naturally instead of echoing field names. */
function factSheet(f: Facts) {
  const used = f.abatements_that_cost_less_than_a_credit;
  return [
    `Plant: ${f.plant}, ${f.state} (${f.registration}), cement`,
    `Emissions per tonne of cement in FY2023-24: ${f.baseline_intensity}. Legal limit for FY2025-26: ${f.target_fy26 == null ? "none listed" : f.target_fy26}; for FY2026-27: ${f.target_fy27}`,
    `Required cut by FY27: ${f.required_cut_by_fy27_percent} percent of emissions per tonne, a gap of ${f.gap_to_cut_by_fy27_kt} kt of CO2 a year`,
    `Peer rank for how hard the target is: ${f.peer_rank} of ${f.peer_count} similar plants (1 is the steepest)`,
    `Assumed credit price: Rs ${f.assumed_credit_price_rupees_per_tonne} per tonne`,
    `Option 1, buy all the credits: Rs ${f.buy_all_cost_crore} crore a year`,
    f.cut_it_all_with_abatements_possible ? `Option 2, cut the whole gap with abatements and buy no credits: Rs ${f.cut_it_all_with_abatements_cost_crore} crore a year` : "Option 2, cut the whole gap with abatements: not possible with the abatements listed",
    `Option 3, use abatements that cost less than a credit and buy credits for the rest: Rs ${f.abatements_first_then_buy_cost_crore} crore a year. ${used.length ? `Abatements used: ${used.map((u) => `${u.name} (${u.can_cut_kt} kt at Rs ${u.cost_rupees_per_tonne} per tonne)`).join("; ")}. ` : "No abatement is cheaper than a credit. "}Credits to buy: ${f.credits_to_buy_in_that_option_kt} kt`,
    `Cheapest option: ${f.cheapest_option}`,
    `At other credit prices (buy all / abatements first then buy): ${f.cost_at_other_credit_prices.map((x) => `Rs ${x.credit_price_rupees}: Rs ${x.buy_all_crore} crore / Rs ${x.abatements_first_then_buy_crore} crore`).join("; ")}`,
    f.changed_by_user.length ? `The user changed these from the atlas defaults: ${f.changed_by_user.join("; ")}` : "The user has not changed anything from the atlas defaults",
    `Caveats: ${f.caveats.join("; ")}`,
  ].join("\n");
}

export function buildPrompt(facts: Facts) {
  return [
    "You write a short briefing for the decision-maker at an Indian cement plant that has a legally binding limit on CO2 per tonne of cement.",
    "Rules: use ONLY the facts below. Never introduce a number, price, company or rule that is not listed. Copy figures exactly as written. Give no investment or legal advice.",
    "Style: 100 to 150 words, three short paragraphs of plain, fluent English with correct spelling and spacing. (1) the gap the plant has to close and how hard its target is compared with similar plants; (2) the three options with their costs, which is cheapest and why (an abatement is worth doing when it costs less per tonne than a credit), and what changes at other credit prices; (3) the caveats, repeating the abatement caveat as listed. Write EVERY number as digits exactly as given (for example 0.7914, 246.7 kt, 34 of 45, FY27) and never spell numbers out in words. Do not expand or invent abbreviations or institution names. Write money as 'Rs 2.5 crore'. Do not use markdown, bullets, headings, field names or underscores.",
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
  // FY26/FY27 year tokens and ordinals are not claims
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
