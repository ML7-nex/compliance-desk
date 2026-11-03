import type { EntityRow } from "@/lib/entities";
import { DEFAULT_ABATEMENTS } from "@/lib/abatements";

/**
 * The whole model, in plain sums.
 *   gap            = output x (emissions per tonne now - FY27 target)
 *   buy all        = gap x credit price
 *   abate only     = cut the whole gap with abatements, cheapest first (no credits)
 *   abate + buy    = use abatements that cost less per tonne than a credit, buy credits for the rest
 * No randomness, no discounting, no banking, no lock-in.
 */

export type Abatement = {
  id: string;
  name: string;
  enabled: boolean;
  /** How many thousand tonnes of CO2 a year it can remove. */
  potentialKt: number;
  /** Rupees per tonne of CO2 removed. */
  costPerTonne: number;
  custom: boolean;
  source: string;
  edited: boolean;
};

export type PlantInputs = {
  /** Cement the plant will make, thousand tonnes a year. */
  outputKt: number;
  /** CO2 per tonne of cement if the plant does nothing. Default: the 2023-24 baseline. */
  intensityNow: number;
  abatements: Abatement[];
};

export const MAX_ABATEMENTS = 8;
export const PRICE_TABLE = [600, 800, 1200];

export function defaultInputs(e: EntityRow): PlantInputs {
  const gapT = Math.max((e.base - e.t27) * e.scale, 0.01 * e.baseEmissions);
  return {
    outputKt: e.scale / 1000,
    intensityNow: e.base,
    abatements:
      e.sector !== "Cement"
        ? []
        : DEFAULT_ABATEMENTS.map((a) => ({ id: a.id, name: a.name, enabled: true, potentialKt: (a.shareOfGap * gapT) / 1000, costPerTonne: a.costPerTonne, custom: false, source: a.source, edited: false })),
  };
}

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};

/** Clamp and clean anything that came from outside (browser storage or the API). */
export function sanitizeInputs(raw: unknown, fallback: PlantInputs): PlantInputs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<PlantInputs>;
  const list = (Array.isArray(r.abatements) ? r.abatements : fallback.abatements).slice(0, MAX_ABATEMENTS);
  const abatements = list.map((a, i) => {
    const x = (a && typeof a === "object" ? a : {}) as Partial<Abatement>;
    const base = fallback.abatements.find((b) => b.id === x.id);
    return {
      id: typeof x.id === "string" && /^[a-z0-9-]{1,24}$/.test(x.id) ? x.id : `custom-${i}`,
      name: String(x.name ?? base?.name ?? "Custom abatement").replace(/[^A-Za-z0-9 ()/&.,-]/g, "").slice(0, 36) || "Custom abatement",
      enabled: x.enabled !== false,
      potentialKt: clamp(x.potentialKt, 0, 1e6, base?.potentialKt ?? 0),
      costPerTonne: clamp(x.costPerTonne, 0, 1e5, base?.costPerTonne ?? 0),
      custom: base ? !!x.custom : true,
      source: base?.source ?? "User input",
      edited: base ? x.edited === true : true,
    };
  });
  const seen = new Set<string>();
  for (const a of abatements) { let id = a.id, n = 1; while (seen.has(id)) id = `${a.id}-${n++}`; a.id = id; seen.add(id); }
  return { outputKt: clamp(r.outputKt, 0, 1e7, fallback.outputKt), intensityNow: clamp(r.intensityNow, 0, 100, fallback.intensityNow), abatements };
}

export function newAbatement(existing: Abatement[]): Abatement {
  let n = 1;
  while (existing.some((a) => a.id === `custom-${n}`)) n++;
  return { id: `custom-${n}`, name: `Custom abatement ${n}`, enabled: true, potentialKt: 10, costPerTonne: 600, custom: true, source: "User input", edited: true };
}

export const isCustomised = (def: PlantInputs, cur: PlantInputs) => JSON.stringify(def) !== JSON.stringify(cur);

/** Plain-language list of what the user changed from the atlas defaults. */
export function changedFields(def: PlantInputs, cur: PlantInputs): string[] {
  const out: string[] = [];
  if (cur.outputKt !== def.outputKt) out.push("cement output");
  if (cur.intensityNow !== def.intensityNow) out.push("CO2 per tonne without action");
  for (const a of cur.abatements) {
    const b = def.abatements.find((x) => x.id === a.id);
    if (!b) { out.push(`added ${a.name}`); continue; }
    if (a.enabled !== b.enabled) out.push(`${a.name} switched ${a.enabled ? "on" : "off"}`);
    if (a.potentialKt !== b.potentialKt) out.push(`${a.name} size`);
    if (a.costPerTonne !== b.costPerTonne) out.push(`${a.name} cost`);
  }
  for (const b of def.abatements) if (!cur.abatements.some((a) => a.id === b.id)) out.push(`removed ${b.name}`);
  return out;
}

export type Use = { id: string; name: string; tonnes: number; costPerTonne: number; cost: number };
export type OptionKey = "buy" | "abate" | "mix";
export type Option = {
  key: OptionKey;
  name: string;
  /** False when the listed abatements cannot cover the whole gap on their own. */
  possible: boolean;
  /** Total cost in rupees, or null when not possible. */
  total: number | null;
  uses: Use[];
  boughtT: number;
  /** Tonnes the listed abatements cannot cover (only for abate-only). */
  uncoveredT: number;
};
export type Result = { gapT: number; options: Option[]; bestKey: OptionKey | null; noGap: boolean };

function fill(list: Abatement[], gapT: number) {
  let left = gapT;
  const uses: Use[] = [];
  for (const a of [...list].sort((x, y) => x.costPerTonne - y.costPerTonne)) {
    if (left <= 0) break;
    const t = Math.min(a.potentialKt * 1000, left);
    if (t <= 0) continue;
    uses.push({ id: a.id, name: a.name, tonnes: t, costPerTonne: a.costPerTonne, cost: t * a.costPerTonne });
    left -= t;
  }
  return { uses, left: Math.max(0, left) };
}

export const NAMES: Record<OptionKey, string> = {
  buy: "Buy all the credits",
  abate: "Cut it all with abatements",
  mix: "Abatements first, buy credits for the rest",
};

export function computeOptions(inputs: PlantInputs, target27: number, price: number): Result {
  const gapT = Math.max(0, inputs.outputKt * 1000 * (inputs.intensityNow - target27));
  const active = inputs.abatements.filter((a) => a.enabled && a.potentialKt > 0);
  const sum = (u: Use[]) => u.reduce((t, x) => t + x.cost, 0);

  const buy: Option = { key: "buy", name: NAMES.buy, possible: true, total: gapT * price, uses: [], boughtT: gapT, uncoveredT: 0 };
  const all = fill(active, gapT);
  const abate: Option = { key: "abate", name: NAMES.abate, possible: all.left < 0.5, total: all.left < 0.5 ? sum(all.uses) : null, uses: all.uses, boughtT: 0, uncoveredT: all.left };
  const cheap = fill(active.filter((a) => a.costPerTonne < price), gapT);
  const mix: Option = { key: "mix", name: NAMES.mix, possible: true, total: sum(cheap.uses) + cheap.left * price, uses: cheap.uses, boughtT: cheap.left, uncoveredT: 0 };

  const options = [buy, abate, mix];
  const ranked = options.filter((o) => o.possible && o.total != null).sort((a, b) => (a.total as number) - (b.total as number));
  // On a tie prefer the option that uses abatements (it also cuts emissions at the plant).
  const order: OptionKey[] = ["mix", "abate", "buy"];
  const bestTotal = ranked.length ? (ranked[0].total as number) : null;
  const bestKey = bestTotal == null || gapT === 0 ? null : order.find((k) => { const o = options.find((x) => x.key === k)!; return o.possible && o.total != null && Math.abs((o.total as number) - bestTotal) < 1; }) ?? null;
  return { gapT, options, bestKey, noGap: gapT === 0 };
}

/** The same three costs at several credit prices, so the page can show what happens if the price turns out different. */
export function priceRows(inputs: PlantInputs, target27: number, prices: number[]) {
  return prices.map((p) => {
    const r = computeOptions(inputs, target27, p);
    return { price: p, buy: r.options[0].total as number, abate: r.options[1].total, mix: r.options[2].total as number };
  });
}
