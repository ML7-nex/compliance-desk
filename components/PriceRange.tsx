"use client";
import { useMemo, useState } from "react";
import type { PlantInputs } from "@/lib/simple";
import { NAMES } from "@/lib/simple";
import { KEYS, RUNS, simulate, type Spread } from "@/lib/simulate";
import { money } from "@/lib/format";

const DOT: Record<string, string> = { buy: "#8b98aa", abate: "#E69F00", mix: "#3ddc97" };

export default function PriceRange({ inputs, target27, price }: { inputs: PlantInputs; target27: number; price: number }) {
  const [vol, setVol] = useState(30);
  const sim = useMemo(() => simulate(inputs, target27, price, vol), [inputs, target27, price, vol]);
  const rows = KEYS.map((k) => ({ key: k, s: (k === "buy" ? sim.buy : k === "abate" ? sim.abate : sim.mix) as Spread | null }));
  const top = Math.max(1, ...rows.map((r) => r.s?.bad ?? 0));
  const pos = (v: number) => `${(v / top) * 100}%`;
  const saveBad = sim.buy.bad - sim.mix.bad;

  return (
    <section className="card mt-3 p-5">
      <div className="eyebrow text-accent">What if nobody knows the price?</div>
      <p className="mt-1 text-sm text-muted">
        The price you expect (₹{price.toLocaleString("en-IN")}) is only an average. Set how much it can swing, and we try {RUNS.toLocaleString("en-IN")} prices around it and work out the three costs for every one.
      </p>
      <label className="no-print mt-3 block max-w-xl text-sm">
        <span className="flex justify-between"><span>Expected volatility: how much the price can swing in a year</span><span className="num font-semibold">{vol}%</span></span>
        <input type="range" min={0} max={80} step={5} value={vol} onChange={(e) => setVol(+e.target.value)} className="mt-2 w-full" />
        <span className="mt-1 block text-xs text-muted">At {vol}%, in a typical year the price lands between about ₹{Math.round(sim.priceGood).toLocaleString("en-IN")} and ₹{Math.round(sim.priceBad).toLocaleString("en-IN")} (the middle 9 in 10 prices). Nobody knows the real figure yet: this is your assumption.</span>
      </label>
      <div className="mt-4 overflow-x-auto">
        <table className="num w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="py-2">Option</th><th className="text-right">Average</th><th className="text-right">Good year</th><th className="text-right">Bad year</th><th className="w-[28%] pl-4">Range</th></tr>
          </thead>
          <tbody>
            {rows.map(({ key, s }) => (
              <tr key={key} className="border-t border-line">
                <th scope="row" className="py-2.5 text-left font-medium"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: DOT[key] }} />{NAMES[key]}</th>
                {s ? (
                  <>
                    <td className="text-right font-semibold">{money(s.mean)}</td>
                    <td className="text-right">{money(s.good)}</td>
                    <td className="text-right">{money(s.bad)}</td>
                    <td className="pl-4">
                      <div className="relative h-2 rounded bg-line">
                        <div className="absolute h-2 rounded" style={{ left: pos(s.good), width: `max(3px, calc(${pos(s.bad)} - ${pos(s.good)}))`, background: DOT[key] }} />
                      </div>
                    </td>
                  </>
                ) : <td colSpan={4} className="text-right text-muted">Not possible with the abatements listed</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm">
        <strong>Reading it:</strong> buying credits swings with the price, while cutting with abatements does not. In a bad year (the worst 1 in 20) &quot;abatements first, buy the rest&quot; costs {money(sim.mix.bad)} against {money(sim.buy.bad)} for buying everything{saveBad > 0 ? <>, which is {money(saveBad)} less</> : ""}.
      </p>
      <p className="mt-1 text-xs text-muted">
        Good year = the best 1 in 20 prices; bad year = the worst 1 in 20. The assumptions are the expected price and the volatility you set above; no credit has traded, so there is no price history to measure them from. The same inputs always give the same answer.
      </p>
    </section>
  );
}
