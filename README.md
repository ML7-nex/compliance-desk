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

- `data/entities.json` is built from the gazette tables. Plant names from the October notification are still being
  checked against the PDF. TXTOE127MH has a misprinted baseline in the gazette and is excluded from cut maths.
- Cement lever costs and potentials are **uncited placeholders**. Every figure carries a source badge.
- No CCC has traded; prices are scenarios. Banking of FY26 surplus into FY27 is an assumption pending BEE confirmation.

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
