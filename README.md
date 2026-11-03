# Cut or Buy

A free atlas of every cement plant with a legal carbon limit in India, plus a plant-level
Strategy Lab that prices abatement, spot buying and forward cover under an uncertain credit price.

## What is in it

- **Cement Atlas** (`/`): 186 cement entities from the MoEFCC gazette (G.S.R. 739(E), 8 Oct 2025). The data file also holds the other 304 notified plants (G.S.R. 25(E) and other sectors); the app is scoped to cement by `FOCUS_SECTOR` in `lib/brand.ts`.
  Baseline, FY26 and FY27 targets, implied tonnes to cut, peer comparison.
- **Strategy Lab** (`/lab/<registration no.>`): plain sums, no simulation. Shows the gap, then what it costs to (1) buy all the credits, (2) cut the whole gap with abatements, (3) use abatements that cost less than a credit and buy credits for the rest, at a credit price the user chooses (plus a table at Rs 600, 800 and 1,200). Plants can enter their own numbers; CSV export and print view.
- **AI brief** (`/api/brief`): Gemini phrases numbers the page's sums computed. A checker flags any figure it cannot trace.

## Data and honesty

- `data/entities.json` is built from the gazette tables. Plant names and addresses were extracted with two
  independent parsers and reconciled (54 page-break splits repaired, 3 fixed by hand from the raw text order); they are not yet proofread
  line by line, and October sub-sector labels are unchecked. TXTOE127MH has a misprinted baseline in the gazette and is excluded from cut maths.
- Cement lever **costs** come from the CEEW marginal abatement cost curve (Nitturu et al., Oct 2023): efficiency, blended-cement
  and waste-heat measures have negative cost (modelled at 0), renewable power about USD 20/t (read off a chart, approximate),
  alternative fuels about USD 42/t; converted at an assumed Rs 88/USD. Lever **potentials are illustrative**: only the plant knows
  its remaining headroom, so the Lab asks for it. Every figure carries a source badge.
- No CCC has traded; prices are scenarios. Public analyst commentary (unnamed analysts: IMPRI 28 Jul 2026, Reclimatize 7 Apr 2026)
  expects Rs 600-1,200/t early on. No official floor or ceiling exists.
- Rules modelled: penalty = 2x the average CCC price (BEE procedure); banking allowed, borrowing from future years not
  (secondary source, confirm against the CERC regulations).
- Independent check: ACEEE (2026) reports 186 cement entities (131 integrated, 55 grinding) with a 7.179 Mt/yr cut by FY2026-27; the atlas
  gives 186 entities and 7.18 Mt.

## Run

```
npm install
npm run dev          # http://localhost:3000
npm test             # hand-worked cost cases, plant inputs, AI guardrail
```

For the AI brief set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in `.env.local` locally and in
Vercel project settings. See `.env.example`. Never commit keys.

## How the sums work

- Gap = output x (CO2 per tonne now minus the FY27 target).
- Buy all = gap x credit price.
- Cut it all with abatements = use abatements cheapest first until the gap is covered (no credits).
- Abatements first, buy the rest = use only abatements that cost less per tonne than a credit, then buy credits for what is left.
- No randomness, discounting, banking or advance purchase. The earlier Monte Carlo version (10,000 simulated prices, lock-in, caution settings) is in git history at commit 1ebed53 and earlier.
