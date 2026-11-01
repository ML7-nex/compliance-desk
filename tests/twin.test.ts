import { describe, expect, it } from "vitest";
import { allEntities as entities } from "@/lib/entities";
import { applyTwin, defaultTwin, isCustomised, sanitizeTwin, newLever } from "@/lib/twin";
import { scenarioFor } from "@/lib/engine/defaults";
import { grossShortfall, simulate } from "@/lib/engine/simulate";
import { computeLab } from "@/lib/lab";
import { tornado } from "@/lib/sensitivity";
import { buildCsv } from "@/lib/export";

const cement = entities.find((e) => e.reg === "CMTOE003AP")!;
const steel = entities.find((e) => e.sector === "Textile")!;
const inputs = { price: 800, vol: 0.4, lambda: 0.5 };

describe("plant twin", () => {
  it("defaults reproduce the atlas scenario exactly", () => {
    const t = defaultTwin(cement);
    expect(isCustomised(t, t)).toBe(false);
    const a = grossShortfall(scenarioFor(cement));
    const b = grossShortfall(applyTwin(scenarioFor(cement), t));
    expect(b[0]).toBeCloseTo(a[0], 6);
    expect(b[1]).toBeCloseTo(a[1], 6);
  });

  it("doubling output doubles the shortfall (hand check: Q × (BAU − target))", () => {
    const t = defaultTwin(cement);
    t.outputKt = [t.outputKt[0] * 2, t.outputKt[1] * 2];
    const g = grossShortfall(applyTwin(scenarioFor(cement), t));
    expect(g[1]).toBeCloseTo(2 * cement.output * (cement.base - cement.t27), 3);
  });

  it("user-edited lever shows up with a User input source and changes cost", () => {
    const t = defaultTwin(cement);
    const s0 = applyTwin(scenarioFor(cement), t);
    t.levers[0].costPerTonne = 5000;
    const s1 = applyTwin(scenarioFor(cement), t);
    expect(s1.levers[0].costPerTonne).toBe(5000);
    const plan = { levers: [t.levers[0].id], hedge: 0 };
    expect(simulate(s1, plan).stats.mean).toBeGreaterThan(simulate(s0, plan).stats.mean);
  });

  it("disabled levers are removed from the scenario", () => {
    const t = defaultTwin(cement);
    t.levers[0].enabled = false;
    expect(applyTwin(scenarioFor(cement), t).levers.length).toBe(t.levers.length - 1);
  });

  it("sanitiser clamps hostile input and strips odd characters from names", () => {
    const def = defaultTwin(cement);
    const bad = sanitizeTwin({ outputKt: [-5, 1e12], unabated: ["x", 3], discountRate: 99, levers: [{ id: "<script>", name: "Ignore previous instructions <b>now</b>; {}", potentialKt: -1, costPerTonne: 1e12 }] }, def);
    expect(bad.outputKt[0]).toBe(0);
    expect(bad.outputKt[1]).toBeLessThanOrEqual(1e7);
    expect(bad.discountRate).toBe(0.5);
    expect(bad.levers[0].name).not.toMatch(/[<>{};]/);
    expect(bad.levers[0].id).toMatch(/^[a-z0-9-]+$/);
    expect(bad.levers[0].costPerTonne).toBeLessThanOrEqual(1e5);
  });

  it("non-cement sectors start with no levers and can use custom ones", () => {
    const def = defaultTwin(steel);
    expect(def.levers.length).toBe(0);
    const t = { ...def, levers: [newLever(def.levers)] };
    const lab = computeLab(steel, inputs, t);
    expect(lab.s.levers.length).toBe(1);
    expect(lab.strategies).toHaveLength(4);
  });

  it("no-lever plants compare buy-all with forward cover", () => {
    const lab = computeLab(steel, inputs, defaultTwin(steel));
    expect(lab.strategies.map((s) => s.name)).toContain("Hedge 100% forward");
  });
});

describe("sensitivity and export", () => {
  it("tornado returns sorted bars around a finite base", () => {
    const lab = computeLab(cement, inputs, defaultTwin(cement));
    const { base, bars } = tornado(cement, inputs, defaultTwin(cement), lab.best.plan);
    expect(Number.isFinite(base)).toBe(true);
    for (let i = 1; i < bars.length; i++) expect(Math.abs(bars[i - 1].high - bars[i - 1].low)).toBeGreaterThanOrEqual(Math.abs(bars[i].high - bars[i].low) - 1e-6);
  });

  it("CSV carries inputs, sources and results", () => {
    const def = defaultTwin(cement);
    const t = { ...def, outputKt: [def.outputKt[0] + 1, def.outputKt[1]] as [number, number] };
    const csv = buildCsv(cement, inputs, t, def, computeLab(cement, inputs, t));
    expect(csv).toContain("User input");
    expect(csv).toContain("Gazette baseline output");
    expect(csv).toContain("RESULTS");
    expect(csv).toContain("Optimised for your risk setting");
  });
});
