# Compliance Desk

A free atlas of every obligated entity under India's Carbon Credit Trading Scheme (CCTS), plus a plant-level
Strategy Lab that prices abatement, spot buying and forward cover under an uncertain credit price.

## What is in it

- **CCTS Atlas** (`/`): 490 entities from the MoEFCC gazettes (G.S.R. 739(E), 8 Oct 2025; G.S.R. 25(E), 13 Jan 2026).
  Baseline, FY26 and FY27 targets, implied tonnes to cut, peer comparison.
- **Strategy Lab** (`/lab/<registration no.>`): a seeded Monte Carlo engine (`lib/engine`) with a rules config,
  an exhaustive optimiser (expected cost + λ·CVaR95), an editable plant twin, abatement cost curve, price ranges,
  sensitivity tornado, CSV export and print view.
- **AI brief** (`/api/brief`): Gemini phrases numbers the engine computed. A checker flags any figure it cannot trace.

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
npm test             # golden scenarios, reproducibility, plant twin, AI guardrail
```

For the AI brief set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in `.env.local` locally and in
Vercel project settings. See `.env.example`. Never commit keys.

## Engine notes

Same inputs and seed give the same result. Lever cost is paid on planned tonnes; abatement delivered is uncertain.
Hedge covers a share of expected net shortfall at a forward price. Penalty cap is `penaltyMultiple × mean price`.
