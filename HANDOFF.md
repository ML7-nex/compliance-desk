# Handoff: Cut or Buy (cement carbon-limit decision tool)

Read this first when resuming. Last updated 3 Nov 2026, at commit `197dffb`.

## What this is

**Cut or Buy** helps a cement plant with a legal carbon limit decide between cutting emissions, buying carbon credits, or locking in a price early, under an unknown credit price. Approved topic title: *"Cut or Buy: A Decision Tool for Cement Plants Facing Legal Carbon Limits"*.

- Live: https://compliance-desk-lovat.vercel.app (the web address still says `compliance-desk` because that is the Vercel project name)
- Code: https://github.com/ML7-nex/compliance-desk (branch `main`; Vercel redeploys on every push)
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4, Vitest. No database: all data is a static JSON file; user inputs stay in the browser.

## Scope decisions (and why)

- **Cement only.** `FOCUS_SECTOR` in `lib/brand.ts`. Cement is 43% of required cuts (7.18 of 16.7 Mt), the only sector with published abatement costs (CEEW 2023), and our totals match an independent report. All 490 notified plants stay in `data/entities.json`; `allEntities` has all, `entities` is cement only.
- **"Notified" plants, not every plant.** The law covers 186 notified cement entities (131 integrated `CMT…`, 55 grinding units `CGU…`). Never say "every Indian cement plant".
- **Vocabulary:** no "CFO", "compliance" or the scheme's full name in the UI, deck or AI prompt. The scheme name appears only in citations. Brand name lives in `lib/brand.ts` (`BRAND`).
- **AI explains, the simulation decides.** Gemini only phrases numbers computed by the engine; a checker (`untraceableNumbers` in `lib/brief.ts`) flags any figure it cannot trace, including numbers written as words.
- **Honesty over polish:** every lever figure carries a source badge; placeholders are labelled; "not advice" is on every page.

## Pages

| Route | What |
| --- | --- |
| `/` | Atlas: KPIs, top states, biggest plants, searchable table |
| `/entity/[reg]` | One plant: target, intensity path, peer beeswarm, link to Lab |
| `/lab` and `/lab/[reg]` | Strategy Lab (3 steps, options, optional deep-dive panels, CSV, print) |
| `/impact` | Problem sizing, independent check, headroom worked example, commercial hypothesis |
| `/api/brief` | POST: Gemini plain-English brief (rate-limited, inputs sanitised) |

## Key verified numbers

- 186 cement entities (131 + 55); required cut by FY27 **7.18 Mt/yr** (ACEEE 2026 reports 7.179 Mt and 186 entities). Cement baseline 264.1 Mt.
- Upper-bound credit bill if nothing is cut: ₹431 / ₹574 / ₹862 crore a year at ₹600 / 800 / 1,200 per tonne. Median plant cut 28 kt, about ₹2.2 crore at ₹800.
- Worked example Shree Cement (`CMTOE084RJ`, 247 kt gap, price ₹800, vol 40%): buy-all expected ₹23 cr, bad year ₹40 cr; best plan ₹3.4 cr expected, ₹7 cr bad year. Saving vs buy-all: 85% / 41% / 18% / 0% when 100% / 50% / 25% / 0% of the modelled cheap headroom remains. **Illustrative: depends on lever potentials, which are placeholders.**
- Pricing hypothesis (untested): ₹2–5 lakh per plant per year, about ₹4–9 crore a year across 186 plants.

## Sources (what each supports)

- **Targets and the legal duty:** MoEFCC G.S.R. 739(E), 8 Oct 2025, rules 3(2) and 4 (read in full from the PDF; made under sections 3, 6, 25 of the Environment (Protection) Act 1986). https://egazette.gov.in/WriteReadData/2025/266804.pdf
- **Independent count and tonnes:** ACEEE, *Decarbonisation in the Indian Cement Industry* (2026). https://aeee.in/wp-content/uploads/2026/07/decarbonisation-in-cement-industry.pdf
- **Abatement costs:** CEEW, *Evaluating Net-zero for the Indian Cement Industry* (Oct 2023), read from the PDF: 13 negative-cost measures (modelled at ₹0), alternative fuels about USD 42/tCO2, CCS USD 90. Renewable power about USD 20 is **read off a chart (approximate)**. Converted at an **assumed ₹88/USD**.
- **Price range ₹600–1,200/t:** IMPRI (28 Jul 2026) and Reclimatize (7 Apr 2026), unnamed analysts, not official. No CCC had traded and no floor or ceiling existed when checked.
- **Banking allowed, borrowing not:** Reclimatize (secondary). **Penalty = 2× average CCC price:** BEE detailed procedure per secondary sources, not in the rules text I read. Confirm both in the CERC regulations / BEE procedure.

## Data caveats

- Plant names/addresses were extracted with two independent parsers and reconciled (54 page-break splits fixed, 3 hand-fixed from raw text order: CNAOE023PB, PNPOE003UK, TXTOE089MH). **Not proofread line by line.** October sub-sector labels are unverified (flagged in `entities.csv`).
- Gazette typos handled: registration numbers `PNOE001AP` and `PNPOE0041OD` (corrected); `TXTOE127MH` baseline printed `.94244` (textile, excluded).
- Many cement plants have no FY26 target (printed "-"); treated as no FY26 obligation.
- Extraction scripts: `tools/parse_oct_gazette.py`, `tools/parse_jan_gazette.py`, `tools/reparse_names.py`. They were run from the parent `cc_demo/data` folder (inputs `raw/raw.txt`, `raw/jan_raw.txt` made with `pdftotext -raw`; copies in `data/source/raw/`). Original PDFs are in `cc_demo/data/raw/` outside this repo. Run Python scripts with `python -I`.

## Model assumptions (all in `lib/engine`)

Shortfall = output × (unabated intensity − target) − abatement. Price is log-normal with mean = slider, FY27 mean = 1.125 × FY26, vol FY26 = 0.9 × slider, correlation 0.8. Lever cost paid on planned tonnes; delivery random (truncated normal). Hedge = share of expected net shortfall at forward price (+3%). Penalty cap = 2 × mean price. FY26 surplus banked into FY27 (or sold at a 10% haircut). 10% discount. 10,000 paths (4,000 if more than 5 levers). Optimiser: exhaustive search over lever subsets × hedge {0, .25, .5, .75, 1} minimising E[cost] + λ·CVaR95 (λ = 0, 0.5, 2 for the caution buttons). Fixed seed 2026, so results reproduce.
**Not modelled:** price linked to market balance, continuous lever sizing, banking limits, official floor/ceiling.
**Lever potentials are placeholders** (share of the plant's FY27 gap; `lib/engine/defaults.ts`). The plant must supply real headroom: this is the biggest sensitivity.

## Run, test, deploy

```
npm install
npm run dev            # http://localhost:3000
npx vitest run         # 38 tests (golden rupee cases, twin, sources, brief guardrail)
npx tsc --noEmit && npx eslint .
npm run build
```

- AI brief needs `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-flash-lite-latest`) in `.env.local` locally and in Vercel → Settings → Environment Variables (then redeploy). **Never commit a key.** `.env.example` has blanks.
- Vercel region is `bom1` (`vercel.json`). Env vars only reach new deployments.

## Gotchas learned

- Next 16: `params` is a Promise; do not call `new Date()` in a client component render (breaks prerender); read `node_modules/next/dist/docs/` before relying on old patterns.
- `vitest` needs `@types/node` 24+; plain `npm install` must succeed or Vercel fails.
- OneDrive locks `.next`: kill running servers and `rm -rf .next` before rebuilding.
- Simulation loads client-side only (`components/LabLoader.tsx`), which keeps the build near 30 s.
- Edge headless can screenshot pages (`msedge --headless --screenshot`); PowerPoint COM can render the deck (LibreOffice and pdftoppm are not installed).

## Deck

`pitch/build.js` builds `../../Cut or Buy Pitch Deck.pptx` (13 slides with speaker notes and timings). Needs `pptxgenjs react react-dom react-icons sharp` installed beside it (`npm install` in a scratch folder, then `NODE_PATH=<that>/node_modules node build.js`). It also requires the pptx skill's `apply_theme.js`; if that is unavailable, delete the `applyTheme` call (colours then use Office defaults). Screenshots are in `pitch/images/` and will go stale if the UI changes.

## Open items

1. Replace placeholder lever potentials with one real plant's figures (pilot), or one public cement company's disclosed figures.
2. Proofread plant names against the PDF (at least the top 30 by tonnes).
3. Confirm banking and penalty rules in the CERC regulations / BEE procedure.
4. Get a practitioner to review the method; test the pricing hypothesis.
5. Optional: rename the Vercel project so the web address drops "compliance-desk"; add a "my plant isn't listed" mode; other sectors need sourced lever costs first.
6. **Rotate the Gemini key**: it was pasted into a chat. Create a new one, update `.env.local` and Vercel, redeploy, delete the old one.
