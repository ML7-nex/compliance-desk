const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");
const { applyTheme } = require("C:/Users/niraj/.claude/skills/synced/fb4d6a6f-bc72-4979-a5c6-a3ce7b479b9e_8b2aecaa-660e-419d-8509-e657cf37da5e/pptx/scripts/apply_theme.js");

const OUT = path.join(__dirname, "..", "..", "Cut or Buy Pitch Deck.pptx"); // written next to the compliance-desk folder
const IMG = (f) => path.join(__dirname, "images", f);

const THEME = {
  name: "Cut or Buy",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "111827", lt1: "FFFFFF", dk2: "0B1220", lt2: "F5F7FA",
    accent1: "0E9F6E", accent2: "1F6FCB", accent3: "E69F00", accent4: "CC79A7", accent5: "009E73", accent6: "D55E00",
    hlink: "1F6FCB", folHlink: "6B7280",
  },
};
const GREEN = "0E9F6E", MINT = "3DDC97", NAVY = "0B1220", INK = "111827", MUTED = "5B6776", LINE = "E3E8EF", PALE = "B6C2D4", AMBER = "E69F00";

async function icon(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { color: "#" + color, size: String(size) }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
async function imgSize(f) { const m = await sharp(IMG(f)).metadata(); return m.width / m.height; }

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = "Cut or Buy: pitch deck";
  pres.author = "Niraj";
  const C = pres.SchemeColor;

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: "DARK",
    background: { color: NAVY },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.25, w: 8.8, h: 1.7, fontSize: 40, bold: true, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.05, w: 8.2, h: 1.2, fontSize: 18, color: C.background2, align: "left", valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: "F7F9FB" },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9.0, h: 0.95, fontSize: 28, bold: true, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
      { text: { text: "Cut or Buy  ·  carbon-limit decision support", options: { x: 0.5, y: 5.25, w: 6, h: 0.25, fontSize: 10, color: "8A94A6", margin: 0 } } },
    ],
    slideNumber: { x: 9.0, y: 5.25, w: 0.5, h: 0.25, fontSize: 10, color: "8A94A6", align: "right" },
  });

  pres.defineSlideMaster({
    title: "CLOSE",
    background: { color: NAVY },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.55, w: 8.8, h: 1.3, fontSize: 34, bold: true, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
    ],
  });

  const card = (s, x, y, w, h, fill = C.background1) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: LINE, width: 0.75 }, shadow: { type: "outer", color: "000000", opacity: 0.06, blur: 6, offset: 2, angle: 90 } });
  const circle = async (s, x, y, d, Icon, bg, fg = "FFFFFF") => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
    s.addImage({ data: await icon(Icon, fg), x: x + d * 0.26, y: y + d * 0.26, w: d * 0.48, h: d * 0.48 });
  };
  const badge = (s, n, x, y) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: 0.36, h: 0.36, fill: { color: C.accent1 }, line: { color: GREEN, width: 0 } });
    s.addText(String(n), { x, y, w: 0.36, h: 0.36, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  };
  const shot = async (s, file, x, y, w) => {
    const r = await imgSize(file);
    s.addImage({ path: IMG(file), x, y, w, h: w / r, shadow: { type: "outer", color: "000000", opacity: 0.25, blur: 8, offset: 3, angle: 90 } });
    return w / r;
  };
  const tx = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, ...o });

  // =========== 1. TITLE ===========
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Opening" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.5, w: 0.5, h: 0.5, rectRadius: 0.1, fill: { color: MINT }, line: { color: MINT, width: 0 } });
  s.addImage({ data: await icon(fa.FaChartLine, NAVY), x: 0.69, y: 0.59, w: 0.32, h: 0.32 });
  tx(s, "CUT OR BUY", { x: 1.25, y: 0.55, w: 5, h: 0.4, fontSize: 14, bold: true, color: MINT, charSpacing: 3, valign: "middle" });
  s.addText("Your carbon-credit position, priced and de-risked", { placeholder: "title" });
  s.addText("India's carbon rules give 186 notified cement plants a legal emissions limit and an unknown credit price. We show a cement plant's finance head the options, what each costs, and the best plan, in an afternoon instead of a six-week study.", { placeholder: "body" });
  tx(s, "Decision-support tool for India's legal carbon limits  ·  Niraj", { x: 0.6, y: 4.95, w: 8.8, h: 0.3, fontSize: 12, color: PALE });
  s.addNotes("TIMING 0:30. Say: 'Every one of 186 notified cement plants now has a legal limit (Gazette G.S.R. 739(E), 8 Oct 2025) on its emissions. If it misses, it must buy carbon credits, and nobody knows the price yet. Our tool shows a plant's finance head their options and what each would cost.' Then move straight on. Do not explain the tool yet; the next slide sets up the problem.");

  // =========== 2. PROBLEM ===========
  pres.addSection({ title: "Problem" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problem" });
  s.addText("186 notified cement plants have a legal carbon limit and no way to price their options", { placeholder: "title" });
  const stats = [
    ["186", "cement plants (131 integrated, 55 grinding) with binding targets for FY26 and FY27"],
    ["7.2 Mt", "of CO₂ a year they must cut by FY27"],
    ["₹574 cr", "a year if every tonne were bought at ₹800 (upper bound; range ₹431–862 cr)"],
    ["0", "credits traded so far, and no official floor or ceiling price"],
  ];
  stats.forEach(([n, l], i) => {
    const x = 0.5 + i * 2.3;
    card(s, x, 1.5, 2.1, 2.0);
    tx(s, n, { x: x + 0.15, y: 1.65, w: 1.8, h: 0.8, fontSize: i === 2 ? 28 : 34, bold: true, color: C.accent1, fontFace: "Cambria", valign: "middle" });
    tx(s, l, { x: x + 0.15, y: 2.5, w: 1.8, h: 0.9, fontSize: 12, color: MUTED, valign: "top" });
  });
  card(s, 0.5, 3.75, 9.0, 1.25);
  s.addText([
    { text: "The targets exist only as gazette PDF tables.", options: { bullet: true, breakLine: true } },
    { text: "A plant that misses its limit pays twice the average credit price, so a wrong guess is costly.", options: { bullet: true, breakLine: true } },
    { text: "Today the choice is a six-week consulting study or a spreadsheet that cannot handle an unknown price.", options: { bullet: true } },
  ], { x: 0.75, y: 3.85, w: 8.5, h: 1.05, fontSize: 14, color: INK, valign: "middle", paraSpaceAfter: 4, isTextBox: true, margin: 0 });
  tx(s, "Sources: MoEFCC gazette G.S.R. 739(E), 8 Oct 2025, rules 3–4. Upper bound = tonnes × price; analyst range ₹600–1,200/t is not official.", { x: 0.5, y: 5.02, w: 9, h: 0.22, fontSize: 10, color: "8A94A6" });
  s.addNotes("TIMING 1:15. This answers brief point 2: a real, high-priority problem. Walk the four numbers left to right. Stress that ₹574 crore is an UPPER BOUND (nobody would buy everything), and that the price is a scenario because nothing has traded. Close with: 'So the finance head has to choose under uncertainty, and has no good tool.'");

  // =========== 3. THE DECISION ===========
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problem" });
  s.addText("A plant must choose between three routes, under a price nobody knows", { placeholder: "title" });
  const routes = [
    [fa.FaShoppingCart, "1  Buy all the credits", "Simple, but fully exposed to whatever the price turns out to be.", "8A94A6"],
    [fa.FaTools, "2  Fix first, buy the rest", "Do the cheap efficiency and blending fixes; buy credits only for what is left.", "1F6FCB"],
    [fa.FaLock, "3  Lock in a price early", "Agree a price now for part of the gap, so a price spike cannot hurt as much.", AMBER],
  ];
  for (let i = 0; i < 3; i++) {
    const [Ic, h, t, col] = routes[i];
    const x = 0.5 + i * 3.1;
    card(s, x, 1.45, 2.8, 2.05);
    await circle(s, x + 0.2, 1.62, 0.6, Ic, col);
    tx(s, h, { x: x + 0.2, y: 2.32, w: 2.45, h: 0.35, fontSize: 16, bold: true, color: INK });
    tx(s, t, { x: x + 0.2, y: 2.7, w: 2.45, h: 0.75, fontSize: 12.5, color: MUTED, valign: "top" });
  }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.75, w: 9.0, h: 1.3, rectRadius: 0.08, fill: { color: C.text2 }, line: { color: NAVY, width: 0 } });
  tx(s, "WHAT CUT OR BUY DOES", { x: 0.75, y: 3.85, w: 8.5, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 2 });
  tx(s, "It puts the three routes side by side, with the average cost and the cost in a bad year (1 in 20), then recommends one. Like a map app that shows each route's time and traffic risk.", { x: 0.75, y: 4.18, w: 8.5, h: 0.8, fontSize: 15, color: "FFFFFF", valign: "top" });
  s.addNotes("TIMING 1:15. Use the map-app analogy: 'The destination is the legal limit. There are three routes. We show each route's cost and its risk.' Explain a 'bad year' in one sentence: the cost that is exceeded only one year in twenty. Avoid the words CVaR and P95.");

  // =========== 4. WHAT WE BUILT ===========
  pres.addSection({ title: "Product" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Product" });
  s.addText("A working product, live on the web, in three parts", { placeholder: "title" });
  const parts = [
    [fa.FaDatabase, "The Atlas", "All 186 cement plants with their legal targets, built from the gazette PDF. Search, filter, compare with peers."],
    [fa.FaBalanceScale, "The Strategy Lab", "Pick a plant, set two choices, get the recommended plan. Plants can enter their own numbers."],
    [fa.FaRobot, "The AI brief", "Gemini explains the result in plain English; a checker flags any number it cannot trace."],
  ];
  for (let i = 0; i < 3; i++) {
    const [Ic, h, t] = parts[i];
    const y = 1.5 + i * 1.12;
    await circle(s, 0.5, y + 0.05, 0.6, Ic, i === 2 ? "1F6FCB" : GREEN);
    tx(s, h, { x: 1.3, y, w: 3.2, h: 0.3, fontSize: 16, bold: true, color: INK });
    tx(s, t, { x: 1.3, y: y + 0.32, w: 3.3, h: 0.7, fontSize: 12.5, color: MUTED, valign: "top" });
  }
  const hh = await shot(s, "home_hero.png", 4.95, 1.5, 4.55);
  tx(s, "Live now. 38 automated tests. Works for all 186 cement plants, with a sourced lever library.", { x: 4.95, y: 1.5 + hh + 0.2, w: 4.55, h: 0.6, fontSize: 12.5, color: MUTED, valign: "top" });
  s.addNotes("TIMING 0:45. This answers brief point 1: build something real. Say the three parts, then say 'let me show you', and switch to the live site. Slides 5 to 7 are your backup screenshots in case the internet fails. If the live demo works, skip them.");

  // =========== 5-7. DEMO SLIDES ===========
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Product" });
  s.addText("Demo 1: find your plant, and its legal target is already loaded", { placeholder: "title" });
  const h1 = await shot(s, "plant_top.png", 0.5, 1.4, 5.2);
  await shot(s, "plant_peers.png", 0.5, 1.4 + h1 + 0.12, 5.2);
  const d1 = [
    ["Every plant is listed", "Choosing your plant loads its baseline and both targets from the gazette. No typing needed."],
    ["See how hard the target is", "2.5% cut, 247 kt a year, ranked 34th of 45 cement peers."],
    ["One click into the Strategy Lab", "The green button opens the lab for this plant."],
  ];
  d1.forEach(([h, t], i) => {
    const y = 1.45 + i * 1.2;
    badge(s, i + 1, 6.0, y);
    tx(s, h, { x: 6.5, y, w: 3.0, h: 0.4, fontSize: 14, bold: true, color: INK, valign: "middle" });
    tx(s, t, { x: 6.5, y: y + 0.42, w: 3.0, h: 0.7, fontSize: 12, color: MUTED, valign: "top" });
  });
  s.addNotes("LIVE DEMO 1 (about 1 minute). Open the site, search 'Shree Cement', click the plant. Say: 'This is public data from the government. Its target and baseline are already loaded. This is not my plant; I am using it as an example. A real user would open their own.'");

  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Product" });
  s.addText("Demo 2: from legal gap to a recommended plan in three steps", { placeholder: "title" });
  await shot(s, "lab_steps.png", 0.5, 1.4, 6.0);
  const d2 = [
    ["Your gap", "The tonnes the plant must cut by FY27."],
    ["Two choices", "What credits will cost, and how cautious to be."],
    ["What to do", "Which fixes first, how much to lock in, and the cost."],
  ];
  d2.forEach(([h, t], i) => {
    const y = 1.45 + i * 1.2;
    badge(s, i + 1, 6.8, y);
    tx(s, h, { x: 7.3, y, w: 2.2, h: 0.4, fontSize: 14, bold: true, color: INK, valign: "middle" });
    tx(s, t, { x: 7.3, y: y + 0.42, w: 2.2, h: 0.7, fontSize: 12, color: MUTED, valign: "top" });
  });
  tx(s, "Illustrative: assumes the plant still has cheap fixes available.", { x: 6.8, y: 5.0, w: 2.7, h: 0.22, fontSize: 10, color: AMBER, bold: true });
  s.addNotes("LIVE DEMO 2 (about 1.5 minutes). Click 'Model this plant in Strategy Lab'. Read step 1 aloud. Move the price slider from 800 to 1,500 and show step 3 change. Then click 'Play it safe' and show the plan become more cautious. Say clearly: 'The fix costs come from a published cement study; how much each fix can still deliver at THIS plant is a placeholder, and the plant would enter the real figure.'");

  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Product" });
  s.addText("Demo 3: compare the options, and see why one is recommended", { placeholder: "title" });
  const h3 = await shot(s, "lab_compare.png", 0.5, 1.4, 6.0);
  const d3 = [
    ["Same plant, four options", "Buying everything: ₹23 cr expected. Recommended plan: ₹3.4 cr."],
    ["It explains itself", "If the recommended plan is not the cheapest on average, the page says why."],
    ["Go deeper only if you want", "Cost curve, what-if chart, your own plant numbers and sources are one click away."],
  ];
  d3.forEach(([h, t], i) => {
    const y = 1.45 + i * 1.25;
    badge(s, i + 1, 6.8, y);
    tx(s, h, { x: 7.3, y, w: 2.2, h: 0.4, fontSize: 13.5, bold: true, color: INK, valign: "middle" });
    tx(s, t, { x: 7.3, y: y + 0.42, w: 2.2, h: 0.8, fontSize: 11.5, color: MUTED, valign: "top" });
  });
  tx(s, "Example: Shree Cement, CMTOE084RJ, price ₹800/t (illustrative).", { x: 0.5, y: 1.4 + h3 + 0.12, w: 6.0, h: 0.25, fontSize: 10, color: "8A94A6" });
  s.addNotes("LIVE DEMO 3 (about 1 minute). Scroll to 'Compare your options'. Say: 'Buying everything is the grey bar, the recommended plan is green.' Then click 'Generate plain-English brief' to show the plain-English summary and the green tick that every figure traces to the simulation. Then open 'Assumptions and sources' to show where each number comes from.");

  // =========== 8. PROOF ===========
  pres.addSection({ title: "Proof" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Proof" });
  s.addText("It checks out: an independent report reproduces our cement total", { placeholder: "title" });
  card(s, 0.5, 1.5, 4.2, 1.45);
  tx(s, "INDEPENDENT REPORT (ACEEE, 2026)", { x: 0.7, y: 1.62, w: 3.8, h: 0.25, fontSize: 10.5, bold: true, color: MUTED, charSpacing: 1 });
  tx(s, "186 entities · 7.179 Mt/yr", { x: 0.7, y: 1.95, w: 3.8, h: 0.5, fontSize: 22, bold: true, color: INK, fontFace: "Cambria" });
  tx(s, "131 integrated plants and 55 grinding units", { x: 0.7, y: 2.5, w: 3.8, h: 0.3, fontSize: 12, color: MUTED });
  card(s, 0.5, 3.15, 4.2, 1.45, C.text2);
  tx(s, "OUR ATLAS, BUILT ONLY FROM THE GAZETTES", { x: 0.7, y: 3.27, w: 3.8, h: 0.25, fontSize: 10.5, bold: true, color: MINT, charSpacing: 1 });
  tx(s, "186 entities · 7.18 Mt/yr", { x: 0.7, y: 3.6, w: 3.8, h: 0.5, fontSize: 22, bold: true, color: "FFFFFF", fontFace: "Cambria" });
  tx(s, "We did not tune anything to match", { x: 0.7, y: 4.15, w: 3.8, h: 0.3, fontSize: 12, color: PALE });
  const proofs = [
    ["38 automated tests", "including hand-worked rupee cases that must match exactly"],
    ["Same inputs, same answer", "every run is reproducible from a stored seed"],
    ["Sourced costs", "fix costs cite a published cement study (CEEW, 2023); rules follow the BEE procedure"],
    ["We found our own errors", "a second parser caught 54 plant names cut at page breaks, now fixed"],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.5 + i * 0.85;
    await circle(s, 5.0, y + 0.03, 0.42, fa.FaCheck, GREEN);
    tx(s, proofs[i][0], { x: 5.6, y, w: 3.9, h: 0.3, fontSize: 14, bold: true, color: INK });
    tx(s, proofs[i][1], { x: 5.6, y: y + 0.3, w: 3.9, h: 0.5, fontSize: 12, color: MUTED, valign: "top" });
  }
  s.addNotes("TIMING 1:15. Brief point 2 again: validated with data. The strongest line: 'An independent report says 186 cement entities and 7.179 million tonnes. Our atlas, built only from the gazette PDFs, gives 186 and 7.18.' Then mention you found and fixed your own errors; judges trust teams that say so. Be honest that names are reconciled by two parsers, not proofread by a person.");

  // =========== 9. AI-NATIVE ===========
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Proof" });
  s.addText("AI-native two ways: it built the product, and it explains the results", { placeholder: "title" });
  const lane = (y, label, color, steps) => {
    tx(s, label, { x: 0.5, y, w: 9, h: 0.3, fontSize: 12, bold: true, color, charSpacing: 2 });
    const w = 1.95, gap = 0.4;
    steps.forEach((t, i) => {
      const x = 0.5 + i * (w + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 0.38, w, h: 1.2, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: LINE, width: 0.75 }, shadow: { type: "outer", color: "000000", opacity: 0.06, blur: 6, offset: 2, angle: 90 } });
      tx(s, t[0], { x: x + 0.12, y: y + 0.45, w: w - 0.24, h: 0.32, fontSize: 13, bold: true, color: INK });
      tx(s, t[1], { x: x + 0.12, y: y + 0.78, w: w - 0.24, h: 0.78, fontSize: 11, color: MUTED, valign: "top" });
      if (i < steps.length - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + w + 0.07, y: y + 0.86, w: 0.26, h: 0.22, fill: { color: color }, line: { color: color, width: 0 } });
    });
  };
  lane(1.4, "BUILT WITH AI (CLAUDE CODE)", GREEN, [
    ["Read the PDFs", "Pulled the plant rows out of gazette PDF tables"],
    ["Wrote the engine", "Price simulation and plan optimiser"],
    ["Tested it", "38 tests; found and fixed its own errors"],
    ["Shipped it", "Live on the web, one push at a time"],
  ]);
  lane(3.2, "AI INSIDE THE PRODUCT (GEMINI)", "1F6FCB", [
    ["Simulation computes", "Every number comes from the engine"],
    ["Gemini writes", "Turns the result into a plain-English brief"],
    ["Checker verifies", "Flags any number it cannot trace"],
    ["Plant reads", "Stale briefs are greyed out after edits"],
  ]);
  tx(s, "Rule: the AI explains, the simulation decides.", { x: 0.5, y: 5.0, w: 9, h: 0.25, fontSize: 12.5, bold: true, color: INK });
  s.addNotes("TIMING 1:15. Brief point 3. Two clear uses of AI. First, you used Claude Code to build the data extraction, engine and tests. Second, the product uses Gemini to explain results, but with a guardrail: a checker that flags numbers the AI invented or wrote out in words. Say: 'The AI explains. The simulation decides.' That sentence shows you understand AI limits.");

  // =========== 10. COMMERCIAL ===========
  pres.addSection({ title: "Business" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Business" });
  s.addText("Who pays: cement plants first, then the consultants and banks that serve them", { placeholder: "title" });
  const buyers = [
    [fa.FaIndustry, "Obligated plants", "186 cement plants (131 integrated, 55 grinding). The finance or sustainability head buys."],
    [fa.FaHandshake, "ESG consultancies", "Use the engine white-labelled to serve more clients per analyst."],
    [fa.FaUniversity, "Banks and lenders", "See a borrower's carbon exposure from the public atlas, before asking for data."],
  ];
  for (let i = 0; i < 3; i++) {
    const [Ic, h, t] = buyers[i];
    const y = 1.42 + i * 1.0;
    await circle(s, 0.5, y + 0.05, 0.55, Ic, i === 0 ? GREEN : i === 1 ? "1F6FCB" : "6B7280");
    tx(s, h, { x: 1.25, y, w: 3.5, h: 0.3, fontSize: 14.5, bold: true, color: INK });
    tx(s, t, { x: 1.25, y: y + 0.3, w: 3.5, h: 0.62, fontSize: 12, color: MUTED, valign: "top" });
  }
  card(s, 5.1, 1.42, 4.4, 2.0, C.text2);
  tx(s, "PRICING HYPOTHESIS (UNTESTED)", { x: 5.3, y: 1.55, w: 4.0, h: 0.25, fontSize: 10.5, bold: true, color: MINT, charSpacing: 1 });
  tx(s, "₹4–9 cr", { x: 5.3, y: 1.85, w: 4.0, h: 0.7, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Cambria", valign: "middle" });
  tx(s, "a year across 186 cement plants at ₹2–5 lakh each. A ₹5 lakh fee is about 2% of a median cement plant's upper-bound credit bill (₹2.2 cr).", { x: 5.3, y: 2.6, w: 4.0, h: 0.75, fontSize: 12, color: PALE, valign: "top" });
  tx(s, "HOW IT GROWS", { x: 0.5, y: 4.4, w: 4, h: 0.25, fontSize: 10.5, bold: true, color: MUTED, charSpacing: 1 });
  const gtm = ["Free atlas page for their own plant", "Free 4-week pilot under NDA", "Annual per-plant licence"];
  gtm.forEach((t, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.68, w: 2.8, h: 0.45, rectRadius: 0.06, fill: { color: i === 2 ? C.accent1 : C.background1 }, line: { color: i === 2 ? GREEN : LINE, width: 0.75 } });
    tx(s, `${i + 1}  ${t}`, { x: x + 0.1, y: 4.68, w: 2.6, h: 0.45, fontSize: 11.5, bold: true, color: i === 2 ? "FFFFFF" : INK, valign: "middle", align: "center" });
    if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.85, y: 4.8, w: 0.2, h: 0.2, fill: { color: "8A94A6" }, line: { color: "8A94A6", width: 0 } });
  });
  tx(s, "Other sectors are the next market, once their abatement costs are sourced.", { x: 5.1, y: 3.55, w: 4.4, h: 0.4, fontSize: 10, color: "8A94A6", valign: "top" });
  s.addNotes("TIMING 1:30. Brief point 4: commercial potential. Be careful: the fee is a HYPOTHESIS. Say: 'We have not tested willingness to pay. A free pilot under NDA is how we find out.' The strength of the argument is the free atlas: it gets in front of every plant at zero cost, which is the entry point. If asked about a market number, say about ₹4 to 9 crore a year across all 186 cement plants before consultants and banks.");

  // =========== 11. IMPACT ===========
  pres.addSection({ title: "Impact" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Impact" });
  s.addText("Measurable impact: a large saving, but only if cheap fixes remain", { placeholder: "title" });
  card(s, 0.5, 1.4, 5.3, 3.65);
  s.addChart(pres.charts.BAR, [{ name: "Expected saving vs buying everything", labels: ["All cheap fixes", "Half left", "A quarter left", "None left"], values: [85, 41, 18, 0] }], {
    x: 0.6, y: 1.5, w: 5.1, h: 3.45, barDir: "col", chartColors: [GREEN], barGapWidthPct: 55,
    showTitle: true, title: "Expected saving vs buying everything (%)", titleFontSize: 12, titleColor: INK, titleFontFace: "+mn-lt",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0"%"', dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelColor: INK, dataLabelFontFace: "+mn-lt",
    valAxisMaxVal: 100, valAxisMinVal: 0, valAxisHidden: true, valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: "none" },
    catAxisLabelColor: MUTED, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt", showLegend: false,
  });
  const impacts = [
    ["Transparency", "186 binding cement targets, once buried in a PDF, are searchable and traceable to the gazette."],
    ["Financial efficiency", "For the example plant: up to 85% lower expected cost if cheap fixes remain, 0% if not. So the tool asks the plant."],
    ["Emissions", "The scheme asks cement to cut 7.2 Mt a year by FY27. The tool helps plants find the cheapest route, so ambitious fixes are easier to justify."],
  ];
  impacts.forEach(([h, t], i) => {
    const y = 1.4 + i * 1.25;
    badge(s, i + 1, 6.05, y);
    tx(s, h, { x: 6.5, y, w: 3.0, h: 0.36, fontSize: 14, bold: true, color: INK, valign: "middle" });
    tx(s, t, { x: 6.5, y: y + 0.38, w: 3.0, h: 0.85, fontSize: 11.5, color: MUTED, valign: "top" });
  });
  tx(s, "Example: Shree Cement (CMTOE084RJ) at ₹800/t, illustrative; savings shown are expected cost.", { x: 0.5, y: 5.05, w: 9, h: 0.2, fontSize: 9.5, color: "8A94A6" });
  s.addNotes("TIMING 1:30. Brief point 5. Read the chart left to right: with all the modelled cheap fixes the plan saves about 85% of expected cost; with none it saves nothing. Say: 'That is exactly why the tool asks the plant for its real headroom.' On emissions be precise: the tool does not itself cut emissions; the scheme does. The tool helps choose the cheapest way to comply, which makes real abatement easier to approve.");

  // =========== 12. SCORECARD ===========
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Impact" });
  s.addText("How this meets the five requirements in the brief", { placeholder: "title" });
  const H = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: NAVY }, fontSize: 12 } });
  const R = (a, b, c, col) => [
    { text: a, options: { bold: true, color: INK, fontSize: 12, valign: "middle" } },
    { text: b, options: { color: MUTED, fontSize: 11.5, valign: "middle" } },
    { text: c, options: { bold: true, color: col, fontSize: 12, valign: "middle", align: "center" } },
  ];
  s.addTable([
    [H("Requirement"), H("What we show"), H("Strength")],
    R("1  Build something real", "Live atlas, Strategy Lab and AI brief; 38 tests; works for all 186 cement plants", "Strong", GREEN),
    R("2  Solve a real problem", "186 cement plants, 7.2 Mt; independent report matches our totals. No user interviews", "Good", GREEN),
    R("3  Be AI-native", "Claude Code built it; Gemini explains results with a number checker", "Strong", GREEN),
    R("4  Commercial potential", "Buyers, price hypothesis and entry path; willingness to pay is untested", "Hypothesis", "B7791F"),
    R("5  Measurable impact", "Saving quantified (85% to 0%); depends on a plant's real headroom", "Good", GREEN),
  ], { x: 0.5, y: 1.4, w: 9.0, colW: [2.4, 5.3, 1.3], rowH: [0.38, 0.6, 0.6, 0.6, 0.6, 0.6], border: { type: "solid", color: LINE, pt: 0.75 }, fill: { color: "FFFFFF" }, margin: [0.04, 0.1, 0.04, 0.1] });
  s.addNotes("TIMING 0:45. Walk the table quickly; do not read every cell. Point out you rated yourselves honestly: two items are 'Good' or 'Hypothesis', not 'Strong'. Judges reward candour. Then move to the last slide.");

  // =========== 13. CLOSE ===========
  pres.addSection({ title: "Close" });
  s = pres.addSlide({ masterName: "CLOSE", sectionTitle: "Close" });
  s.addText("What is not done yet, and what we ask for next", { placeholder: "title" });
  tx(s, "NOT DONE YET", { x: 0.6, y: 2.4, w: 4.2, h: 0.3, fontSize: 12, bold: true, color: AMBER, charSpacing: 2 });
  s.addText([
    { text: "No plant has run its own numbers", options: { bullet: true, breakLine: true } },
    { text: "How much each fix can still deliver is a placeholder", options: { bullet: true, breakLine: true } },
    { text: "The credit price is a scenario; nothing has traded", options: { bullet: true, breakLine: true } },
    { text: "Plant names reconciled, not yet proofread by a person", options: { bullet: true } },
  ], { x: 0.6, y: 2.75, w: 4.2, h: 2.2, fontSize: 14, color: "FFFFFF", valign: "top", paraSpaceAfter: 6, isTextBox: true, margin: 0 });
  tx(s, "OUR ASK", { x: 5.2, y: 2.4, w: 4.2, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 2 });
  s.addText([
    { text: "One cement plant to run its real numbers", options: { bullet: true, breakLine: true } },
    { text: "One practitioner to review the method", options: { bullet: true, breakLine: true } },
    { text: "Introductions to two cement finance heads", options: { bullet: true } },
  ], { x: 5.2, y: 2.75, w: 4.2, h: 2.2, fontSize: 14, color: "FFFFFF", valign: "top", paraSpaceAfter: 6, isTextBox: true, margin: 0 });
  s.addNotes("TIMING 1:00. Finish with honesty and an ask. 'A working, tested framework on a verified dataset. What it needs now is one real plant's numbers.' Then stop and invite questions. Likely questions: where do the fix costs come from (CEEW 2023 study); why would a plant use it (an afternoon instead of six weeks, and data stays in the browser); has anyone used it (no, this is the prototype); does it cut emissions (the scheme does; the tool helps choose the cheapest route).");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
