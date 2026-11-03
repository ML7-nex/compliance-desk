# Project notes for Claude Code

Read `HANDOFF.md` first: it has the product scope, decisions, verified numbers, sources, data caveats and how to run, test and deploy. Also read `AGENTS.md` (this Next.js version has breaking changes).

Rules for this project:
- Be honest about limits: lever potentials are placeholders, the credit price is a scenario, plant names are reconciled but not proofread. Do not overclaim (say "186 notified cement plants", not "every plant").
- Keep the AI brief grounded: the simulation computes every number and Gemini only phrases it.
- Never commit API keys. Never push without asking.
- Avoid the words "CFO", "compliance" and the scheme's full name in the UI, deck and prompt, except in citations.
