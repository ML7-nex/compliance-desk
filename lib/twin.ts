import type { EntityRow } from "@/lib/entities";
import { scenarioFor } from "@/lib/engine/defaults";
import type { Scenario } from "@/lib/engine/types";

/**
 * Plant Twin: everything a plant can override. Units are chosen for people (kt, ₹/t, %),
 * and converted to engine units in applyTwin.
 */
export type TwinLever = {
  id: string;
  name: string;
  enabled: boolean;
  potentialKt: number;
  costPerTonne: number;
  ramp: [number, number];
  deliveryMean: number;
  deliverySd: number;
  custom: boolean;
};

export type TwinState = {
  /** Equivalent product output per year, thousand tonnes (MBBLS×NRGF for refineries). */
  outputKt: [number, number];
  /** Unabated (business-as-usual) intensity per year. */
  unabated: [number, number];
  discountRate: number;
  banking: boolean;
  levers: TwinLever[];
};

export const MAX_LEVERS = 8;

export function defaultTwin(e: EntityRow): TwinState {
  const s = scenarioFor(e);
  return {
    outputKt: [s.plant.output[0] / 1000, s.plant.output[1] / 1000],
    unabated: [s.plant.unabatedIntensity[0], s.plant.unabatedIntensity[1]],
    discountRate: s.discountRate,
    banking: s.rules.bankSurplusToNextYear,
    levers: s.levers.map((l) => ({
      id: l.id, name: l.name, enabled: true, potentialKt: l.potential / 1000, costPerTonne: l.costPerTonne,
      ramp: [l.ramp[0], l.ramp[1]], deliveryMean: l.deliveryMean, deliverySd: l.deliverySd, custom: false,
    })),
  };
}

export function applyTwin(s: Scenario, t: TwinState): Scenario {
  return {
    ...s,
    plant: { ...s.plant, output: [t.outputKt[0] * 1000, t.outputKt[1] * 1000], unabatedIntensity: [t.unabated[0], t.unabated[1]] },
    discountRate: t.discountRate,
    rules: { ...s.rules, bankSurplusToNextYear: t.banking },
    levers: t.levers.filter((l) => l.enabled).map((l) => ({
      id: l.id, name: l.name, potential: l.potentialKt * 1000, costPerTonne: l.costPerTonne, ramp: l.ramp,
      deliveryMean: l.deliveryMean, deliverySd: l.deliverySd,
      source: l.custom ? "User input" : "Assumption (placeholder, uncited)",
    })),
  };
}

const num = (v: unknown, lo: number, hi: number, d: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};

/** Clamp and clean anything that came from outside (browser storage or the API). */
export function sanitizeTwin(raw: unknown, fallback: TwinState): TwinState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<TwinState>;
  const pair = (v: unknown, lo: number, hi: number, d: [number, number]): [number, number] =>
    Array.isArray(v) ? [num(v[0], lo, hi, d[0]), num(v[1], lo, hi, d[1])] : d;
  const levers = (Array.isArray(r.levers) ? r.levers : fallback.levers).slice(0, MAX_LEVERS).map((l, i) => {
    const x = (l && typeof l === "object" ? l : {}) as Partial<TwinLever>;
    const base = fallback.levers.find((b) => b.id === x.id);
    return {
      id: typeof x.id === "string" && /^[a-z0-9-]{1,24}$/.test(x.id) ? x.id : `custom-${i}`,
      name: String(x.name ?? base?.name ?? "Custom lever").replace(/[^A-Za-z0-9 ()/&.,-]/g, "").slice(0, 32) || "Custom lever",
      enabled: x.enabled !== false,
      potentialKt: num(x.potentialKt, 0, 1e6, base?.potentialKt ?? 0),
      costPerTonne: num(x.costPerTonne, 0, 1e5, base?.costPerTonne ?? 0),
      ramp: pair(x.ramp, 0, 1, base?.ramp ?? [0.5, 1]),
      deliveryMean: num(x.deliveryMean, 0, 1.2, base?.deliveryMean ?? 0.9),
      deliverySd: num(x.deliverySd, 0, 1, base?.deliverySd ?? 0.1),
      custom: base ? !!x.custom : true,
    };
  });
  // De-duplicate ids so plans refer to exactly one lever each.
  const seen = new Set<string>();
  for (const l of levers) { let id = l.id, n = 1; while (seen.has(id)) id = `${l.id}-${n++}`; l.id = id; seen.add(id); }
  return {
    outputKt: pair(r.outputKt, 0, 1e7, fallback.outputKt),
    unabated: pair(r.unabated, 0, 100, fallback.unabated),
    discountRate: num(r.discountRate, 0, 0.5, fallback.discountRate),
    banking: typeof r.banking === "boolean" ? r.banking : fallback.banking,
    levers,
  };
}

/** True when the user has changed anything from the atlas defaults. */
export function isCustomised(def: TwinState, t: TwinState) {
  return JSON.stringify(def) !== JSON.stringify(t);
}

/** Which fields differ from default, for "edited" badges. */
export function leverChanged(def: TwinState, l: TwinLever, field: keyof TwinLever) {
  const b = def.levers.find((x) => x.id === l.id);
  if (!b) return true;
  return JSON.stringify(b[field]) !== JSON.stringify(l[field]);
}

export function newLever(existing: TwinState["levers"]): TwinLever {
  let n = 1;
  while (existing.some((l) => l.id === `custom-${n}`)) n++;
  return { id: `custom-${n}`, name: `Custom lever ${n}`, enabled: true, potentialKt: 10, costPerTonne: 600, ramp: [0.5, 1], deliveryMean: 0.9, deliverySd: 0.1, custom: true };
}
