import { describe, expect, it } from "vitest";
import { entities } from "@/lib/entities";
import { computeOptions, defaultInputs } from "@/lib/simple";
import { simulate } from "@/lib/simulate";

const e = entities.find((x) => x.reg === "CMTOE084RJ")!;
const def = defaultInputs(e);

describe("price-volatility simulation", () => {
  it("is repeatable", () => {
    expect(simulate(def, e.t27, 800, 30)).toEqual(simulate(def, e.t27, 800, 30));
  });
  it("with zero volatility it equals the plain sums at the expected price", () => {
    const r = computeOptions(def, e.t27, 800);
    const s = simulate(def, e.t27, 800, 0, 200);
    expect(s.buy.mean).toBeCloseTo(r.options[0].total as number, 0);
    expect(s.mix.good).toBeCloseTo(r.options[2].total as number, 0);
    expect(s.mix.bad).toBeCloseTo(r.options[2].total as number, 0);
    expect(s.priceGood).toBeCloseTo(800, 5);
  });
  it("keeps the average price near the expected price, and good <= average <= bad", () => {
    const s = simulate(def, e.t27, 800, 30);
    expect(s.buy.mean / (s.gapT * 800)).toBeGreaterThan(0.98);
    expect(s.buy.mean / (s.gapT * 800)).toBeLessThan(1.02);
    expect(s.priceGood).toBeLessThan(800);
    expect(s.priceBad).toBeGreaterThan(800);
    for (const x of [s.buy, s.mix, s.abate!]) { expect(x.good).toBeLessThanOrEqual(x.mean + 1); expect(x.mean).toBeLessThanOrEqual(x.bad + 1); }
  });
  it("more volatility widens the buy-all spread; cutting with abatements ignores the price; abatements-first never costs more", () => {
    const calm = simulate(def, e.t27, 800, 10), wild = simulate(def, e.t27, 800, 60);
    expect(wild.buy.bad - wild.buy.good).toBeGreaterThan(calm.buy.bad - calm.buy.good);
    expect(wild.abate!.good).toBeCloseTo(wild.abate!.bad, 0);
    expect(wild.mix.mean).toBeLessThanOrEqual(wild.buy.mean + 1);
    expect(wild.mix.mean).toBeLessThanOrEqual(wild.abate!.mean + 1);
    expect(wild.mix.bad).toBeLessThanOrEqual(wild.buy.bad + 1);
  });
  it("reports not possible when the abatements are too small", () => {
    const tiny = { ...def, abatements: def.abatements.map((a) => ({ ...a, potentialKt: 0.1 })) };
    expect(simulate(tiny, e.t27, 800, 30, 50).abate).toBeNull();
  });
});
