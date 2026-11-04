import { describe, expect, it } from "vitest";
import { entities } from "@/lib/entities";
import { buildFacts, buildPrompt, untraceableNumbers } from "@/lib/brief";
import { defaultInputs } from "@/lib/simple";

const plant = entities.find((e) => e.reg === "CMTOE084RJ")!;

describe("AI brief: facts come from the page's own sums", () => {
  const f = buildFacts(plant, defaultInputs(plant), 800);
  it("reproduces the page numbers for Shree Cement at Rs 800", () => {
    expect(f.gap_to_cut_by_fy27_kt).toBeCloseTo(246.7, 1);
    expect(f.buy_all_cost_crore).toBeCloseTo(19.7, 1);
    expect(f.abatements_first_then_buy_cost_crore).toBeCloseTo(13.8, 1);
    expect(f.credits_to_buy_in_that_option_kt).toBeCloseTo(61.7, 1);
    expect(f.cheapest_option).toMatch(/Abatements first/);
    expect(f.cost_at_other_credit_prices).toHaveLength(3);
  });
  it("is reproducible", () => expect(buildFacts(plant, defaultInputs(plant), 800)).toEqual(f));
  it("says nothing was changed for the defaults, and lists changes when the user edits", () => {
    expect(f.changed_by_user).toEqual([]);
    const edited = { ...defaultInputs(plant), outputKt: 9000 };
    expect(buildFacts(plant, edited, 800).changed_by_user).toContain("cement output");
  });
  it("the prompt contains no word about lock-in, caution or bad years", () => {
    expect(buildPrompt(f)).not.toMatch(/lock|caution|bad year|hedge|volatil/i);
  });
});

describe("AI brief guardrail", () => {
  const f = buildFacts(plant, defaultInputs(plant), 800);
  it("accepts text whose numbers all come from the facts", () => {
    const text = `The plant must cut ${f.gap_to_cut_by_fy27_kt} kt a year, ranking ${f.peer_rank} of ${f.peer_count}. Buying everything costs Rs ${f.buy_all_cost_crore} crore at Rs ${f.assumed_credit_price_rupees_per_tonne} a tonne, against Rs ${f.abatements_first_then_buy_cost_crore} crore using abatements first.`;
    expect(untraceableNumbers(text, f)).toEqual([]);
  });
  it("flags a number the model invented", () => {
    const bad = untraceableNumbers("The plant faces a penalty of Rs 4200 crore and a 5817 kt cut.", f);
    expect(bad).toContain("4200");
    expect(bad).toContain("5817");
  });
  it("surfaces numbers written out in words instead of passing them silently", () => {
    expect(untraceableNumbers("The cut is one point five percent, ranking seventy third.", f)).toContain("numbers written in words");
  });
});
