import raw from "@/data/entities.json";
import { FOCUS_SECTOR } from "@/lib/brand";

export type Entity = {
  reg: string;
  name: string;
  sector: string;
  sub: string;
  unit: string;
  output: number;
  base: number;
  t26: number | null;
  t27: number;
  nrgf: number | null;
  source: string;
  flag: string;
  state: string;
};

export type EntityRow = Entity & {
  /** tCO2e = intensity × output (× NRGF for refineries) */
  scale: number;
  baseEmissions: number;
  cut26: number | null;
  cut27: number;
  cutPct27: number;
  cutPct26: number | null;
};

export const STATE_NAMES: Record<string, string> = {
  AP: "Andhra Pradesh", AS: "Assam", BR: "Bihar", CG: "Chhattisgarh", DN: "Dadra & Nagar Haveli and Daman & Diu",
  GJ: "Gujarat", HP: "Himachal Pradesh", HR: "Haryana", JH: "Jharkhand", JK: "Jammu & Kashmir", KA: "Karnataka",
  KL: "Kerala", MH: "Maharashtra", ML: "Meghalaya", MP: "Madhya Pradesh", OD: "Odisha", PB: "Punjab",
  RJ: "Rajasthan", TN: "Tamil Nadu", TG: "Telangana", TS: "Telangana", UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal",
};

function enrich(e: Entity): EntityRow {
  const scale = e.output * (e.nrgf ?? 1);
  return {
    ...e,
    scale,
    baseEmissions: e.base * scale,
    cut27: (e.base - e.t27) * scale,
    cutPct27: (e.base - e.t27) / e.base,
    cut26: e.t26 == null ? null : (e.base - e.t26) * scale,
    cutPct26: e.t26 == null ? null : (e.base - e.t26) / e.base,
  };
}

export const allEntities: EntityRow[] = (raw as Entity[]).map(enrich);
/** Entities for the focus sector (cement). Use allEntities for cross-sector work. */
export const entities: EntityRow[] = allEntities.filter((e) => e.sector === FOCUS_SECTOR);

// TXTOE127MH's baseline is misprinted in the gazette (.94244); exclude it from cut maths.
export const isUnreliable = (e: Entity) => e.reg === "TXTOE127MH";

export const SECTORS = Array.from(new Set(entities.map((e) => e.sector)));

export function sectorTotals() {
  return SECTORS.map((s) => {
    const rows = entities.filter((e) => e.sector === s && !isUnreliable(e));
    return {
      sector: s,
      n: rows.length,
      baseEmissions: rows.reduce((a, r) => a + r.baseEmissions, 0),
      cut27: rows.reduce((a, r) => a + r.cut27, 0),
    };
  });
}

export const kt = (t: number) => `${(t / 1000).toLocaleString("en-IN", { maximumFractionDigits: t >= 1e5 ? 0 : 1 })} kt`;
export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
export const num = (x: number, d = 4) => x.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
