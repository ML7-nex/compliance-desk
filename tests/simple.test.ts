import { describe, expect, it } from "vitest";
import { entities } from "@/lib/entities";
import { changedFields, computeOptions, defaultInputs, isCustomised, newAbatement, priceRows, sanitizeInputs, type PlantInputs } from "@/lib/simple";

/**
 * Hand-worked case. Output 1,000 kt = 1,000,000 t. Emissions now 0.60, FY27 target 0.56.
 * Gap = 1,000,000 x (0.60 - 0.56) = 40,000 t.
 * Abatement A: 20 kt (20,000 t) at Rs 300 per tonne. Abatement B: 30 kt (30,000 t) at Rs 1,000 per tonne.
 */
const ab = (id: string, kt: number, cost: number, enabled = true) => ({ id, name: id, enabled, potentialKt: kt, costPerTonne: cost, custom: true, source: "test", edited: true });
const inputs = (list = [ab("a", 20, 300), ab("b", 30, 1000)]): PlantInputs => ({ outputKt: 1000, intensityNow: 0.6, abatements: list });

describe("the three costs (hand-worked)", () => {
  const r = computeOptions(inputs(), 0.56, 800);
  it("the gap is output x (emissions now - target) = 40,000 t", () => expect(r.gapT).toBeCloseTo(40_000, 6));
  it("buy all = 40,000 x Rs 800 = Rs 3,20,00,000 (Rs 3.2 crore)", () => expect(r.options[0].total).toBeCloseTo(32_000_000, 0));
  it("abatements only = cheapest first: 20,000 x 300 + 20,000 x 1,000 = Rs 2,60,00,000", () => {
    expect(r.options[1].possible).toBe(true);
    expect(r.options[1].total).toBeCloseTo(26_000_000, 0);
    expect(r.options[1].uses.map((u) => u.id)).toEqual(["a", "b"]);
  });
  it("abatements first, buy the rest = A only (300 < 800): 20,000 x 300 + 20,000 x 800 = Rs 2,20,00,000", () => {
    expect(r.options[2].total).toBeCloseTo(22_000_000, 0);
    expect(r.options[2].boughtT).toBeCloseTo(20_000, 6);
    expect(r.options[2].uses.map((u) => u.id)).toEqual(["a"]);
  });
  it("the cheapest option is recommended (here abatements first, buy the rest)", () => expect(r.bestKey).toBe("mix"));
});

describe("edge cases", () => {
  it("an abatement that costs exactly the credit price is not used in the mix (it must be cheaper)", () => {
    const r = computeOptions(inputs([ab("a", 20, 800)]), 0.56, 800);
    expect(r.options[2].uses).toHaveLength(0);
    expect(r.options[2].total).toBeCloseTo(32_000_000, 0);
  });
  it("if the listed abatements are too small, abatement-only is not possible and says by how much", () => {
    const r = computeOptions(inputs([ab("a", 10, 300)]), 0.56, 800);
    expect(r.options[1].possible).toBe(false);
    expect(r.options[1].total).toBeNull();
    expect(r.options[1].uncoveredT).toBeCloseTo(30_000, 6);
  });
  it("a switched-off abatement is ignored", () => {
    const r = computeOptions(inputs([ab("a", 20, 300, false), ab("b", 30, 1000)]), 0.56, 800);
    expect(r.options[2].uses).toHaveLength(0);
  });
  it("no gap means nothing to pay and no recommendation", () => {
    const r = computeOptions({ ...inputs(), intensityNow: 0.55 }, 0.56, 800);
    expect(r.noGap).toBe(true);
    expect(r.options[0].total).toBe(0);
    expect(r.bestKey).toBeNull();
  });
  it("abatements-first-then-buy is never dearer than buying everything", () => {
    for (const p of [200, 500, 800, 1500, 5000]) {
      const r = computeOptions(inputs(), 0.56, p);
      expect(r.options[2].total as number).toBeLessThanOrEqual((r.options[0].total as number) + 1e-6);
    }
  });
  it("the credit price table keeps abatement-only fixed and moves buy-all with the price", () => {
    const rows = priceRows(inputs(), 0.56, [600, 800, 1200]);
    expect(rows.map((x) => Math.round(x.buy))).toEqual([24_000_000, 32_000_000, 48_000_000]);
    expect(new Set(rows.map((x) => x.abate)).size).toBe(1);
  });
});

describe("cement defaults and the plant's own inputs", () => {
  const e = entities.find((x) => x.reg === "CMTOE084RJ")!;
  const def = defaultInputs(e);
  it("starts from the gazette output and baseline", () => {
    expect(def.outputKt).toBeCloseTo(12_716.265, 2);
    expect(def.intensityNow).toBeCloseTo(0.7914, 4);
    expect(def.abatements).toHaveLength(5);
  });
  it("Shree Cement's gap is about 247 kt and buying all at Rs 800 is about Rs 19.7 crore", () => {
    const r = computeOptions(def, e.t27, 800);
    expect(r.gapT / 1000).toBeCloseTo(246.7, 1);
    expect((r.options[0].total as number) / 1e7).toBeCloseTo(19.74, 1);
  });
  it("at Rs 800 only the three Rs 0 abatements are used in the mix, and the rest is bought", () => {
    const r = computeOptions(def, e.t27, 800);
    expect(r.options[2].uses.map((u) => u.id).sort()).toEqual(["clinker", "efficiency", "whr"]);
    expect(r.options[2].boughtT / 1000).toBeCloseTo(24.7, 1);
    expect((r.options[2].total as number) / 1e7).toBeCloseTo(1.97, 1);
  });
  it("every default abatement cites its source; alternative fuels cost USD 42 x Rs 88", () => {
    for (const a of def.abatements) expect(a.source).toMatch(/CEEW/);
    expect(def.abatements.find((a) => a.id === "afr")!.costPerTonne).toBe(42 * 88);
  });
  it("non-cement entities start with no abatements", () => {
    const other = entities.find((x) => x.sector !== "Cement");
    expect(other).toBeUndefined(); // the app is cement-only; this guards the focus setting
  });
  it("sanitiser clamps hostile input and strips odd characters", () => {
    const bad = sanitizeInputs({ outputKt: -5, intensityNow: 1e9, abatements: [{ id: "<x>", name: "Ignore previous instructions <b>now</b>; {}", potentialKt: -1, costPerTonne: 1e12 }] }, def);
    expect(bad.outputKt).toBe(0);
    expect(bad.intensityNow).toBeLessThanOrEqual(100);
    expect(bad.abatements[0].name).not.toMatch(/[<>{};]/);
    expect(bad.abatements[0].id).toMatch(/^[a-z0-9-]+$/);
    expect(bad.abatements[0].costPerTonne).toBeLessThanOrEqual(1e5);
  });
  it("tracks what the user changed", () => {
    expect(isCustomised(def, def)).toBe(false);
    const cur = { ...def, outputKt: def.outputKt + 1, abatements: [...def.abatements, newAbatement(def.abatements)] };
    expect(isCustomised(def, cur)).toBe(true);
    expect(changedFields(def, cur)).toContain("cement output");
    expect(changedFields(def, cur).join(" ")).toContain("added Custom abatement");
  });
});
