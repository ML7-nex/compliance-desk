const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");

const OUT = path.join(__dirname, "..", "..", "Cut or Buy Short Deck v3.pptx");
const GREEN = "0E9F6E", MINT = "3DDC97", NAVY = "0B1220", INK = "111827", MUTED = "5B6776", LINE = "E3E8EF", PALE = "B6C2D4", AMBER = "E69F00", BLUE = "1F6FCB";

async function icon(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { color: "#" + color, size: String(size) }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.theme = { headFontFace: "Cambria", bodyFontFace: "Calibri" };
  pres.title = "Cut or Buy: context";
  pres.author = "Niraj";

  const card = (s, x, y, w, h) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 }, shadow: { type: "outer", color: "000000", opacity: 0.06, blur: 6, offset: 2, angle: 90 } });
  const circle = async (s, x, y, d, Icon, bg) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
    s.addImage({ data: await icon(Icon, "FFFFFF"), x: x + d * 0.26, y: y + d * 0.26, w: d * 0.48, h: d * 0.48 });
  };
  const light = (title) => {
    const s = pres.addSlide();
    s.background = { color: "F7F9FB" };
    s.addText(title, { x: 0.5, y: 0.3, w: 9, h: 0.95, fontFace: "Cambria", fontSize: 26, bold: true, color: INK, valign: "middle", margin: 0 });
    s.addText("Cut or Buy  ·  a decision tool for cement plants facing legal carbon limits", { x: 0.5, y: 5.25, w: 7, h: 0.25, fontSize: 10, color: "8A94A6", margin: 0 });
    return s;
  };

  // 1. Title
  let s = pres.addSlide();
  s.background = { color: NAVY };
  s.addText("CUT OR BUY", { x: 0.6, y: 0.8, w: 8.8, h: 0.4, fontSize: 14, bold: true, color: MINT, charSpacing: 6, margin: 0 });
  s.addText("A decision tool for cement plants facing legal carbon limits", { x: 0.6, y: 1.3, w: 8.6, h: 1.9, fontFace: "Cambria", fontSize: 40, bold: true, color: "FFFFFF", valign: "top", margin: 0 });
  s.addText("For each plant: how much must be cut, and what is the cheapest way to cover it?", { x: 0.6, y: 3.5, w: 8.2, h: 0.8, fontSize: 18, color: PALE, valign: "top", margin: 0 });
  s.addText("Niraj  ·  Live: compliance-desk-lovat.vercel.app", { x: 0.6, y: 4.9, w: 8, h: 0.3, fontSize: 12, color: "8A94A6", margin: 0 });
  s.addNotes("Open with one sentence: every notified cement plant in India now has a legal limit on CO2 per tonne of cement. Our tool tells a plant how much it must cut and what the cheapest way to cover that is. First I want to give you the context: how cement makes CO2, what the new law says, and why we chose cement. Then I will show the tool.");

  // 2. How cement makes CO2
  s = light("Cement is hard to clean up because the CO₂ comes from the rock itself");
  const steps = [
    [fa.FaMountain, "1  Heat limestone", "Limestone (calcium carbonate) is heated to about 1,450°C. The rock itself releases CO₂ as it breaks down: roughly 60% of a plant's CO₂.", AMBER],
    [fa.FaFire, "2  Make clinker", "The result is clinker, the energy-hungry ingredient. Burning coal and petcoke to heat the kiln gives the other roughly 40%.", "D55E00"],
    [fa.FaIndustry, "3  Grind into cement", "Clinker is ground with gypsum, fly ash or slag. The less clinker per tonne of cement, the less CO₂.", GREEN],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.45, 2.85, 2.6);
    await circle(s, x + 0.2, 1.6, 0.6, steps[i][0], steps[i][3]);
    s.addText(steps[i][1], { x: x + 0.2, y: 2.3, w: 2.5, h: 0.35, fontSize: 15, bold: true, color: INK, margin: 0 });
    s.addText(steps[i][2], { x: x + 0.2, y: 2.7, w: 2.5, h: 1.3, fontSize: 12, color: MUTED, valign: "top", margin: 0 });
  }
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.3, w: 9, h: 0.7, fill: { color: "E6F6EF" }, line: { color: "E6F6EF", width: 0 } });
  s.addText("Cement is about 7–8% of the world's CO₂, and India is the world's second-largest producer. Cleaner fuel cannot remove the CO₂ locked in the limestone, so every cut is real work.", { x: 0.7, y: 4.3, w: 8.6, h: 0.7, fontSize: 13, color: INK, valign: "middle", margin: 0 });
  s.addNotes("Explain simply. Limestone is calcium carbonate; heating it to make clinker releases CO2 from the rock. That process share is roughly 60 percent (a commonly cited figure; say roughly). Fuel is the rest. So a plant cannot just switch fuel and be done. The practical levers are: use less clinker per tonne of cement, recover waste heat, burn alternative fuels, use renewable power. These are the abatements you will see in the demo. The global share and India's rank are widely cited industry figures; say about, and do not over-claim.");

  // 2b. How plants can cut (the abatements)
  s = light("How a cement plant can cut its CO₂: five abatements");
  const ab = [
    [fa.FaCubes, "Clinker-factor reduction", "Replace part of the clinker with fly ash, slag or calcined clay (blended cement). Cuts rock and fuel CO₂ together.", "Pays back over time", GREEN],
    [fa.FaTachometerAlt, "Energy efficiency", "Better coolers, mills and kiln controls use less fuel and power per tonne.", "Pays back over time", GREEN],
    [fa.FaRecycle, "Waste heat recovery", "Capture hot kiln exhaust to generate electricity on site instead of buying it from the grid.", "Pays back over time", GREEN],
    [fa.FaSolarPanel, "Renewable power", "Solar and wind power, firmed to run round the clock, replace grid electricity.", "About ₹1,760 a tonne", AMBER],
    [fa.FaLeaf, "Alternative fuels", "Burn waste and biomass instead of coal and petcoke in the kiln (30% of heat in the study).", "About ₹3,700 a tonne", "D55E00"],
  ];
  s.addText([{ text: "What it does", options: {} }], { x: 3.35, y: 1.22, w: 4, h: 0.22, fontSize: 10, bold: true, color: MUTED, charSpacing: 2, margin: 0 });
  s.addText("COST IN THE TOOL", { x: 7.9, y: 1.22, w: 1.6, h: 0.22, fontSize: 10, bold: true, color: MUTED, charSpacing: 2, margin: 0 });
  for (let i = 0; i < 5; i++) {
    const y = 1.48 + i * 0.66;
    card(s, 0.5, y, 9, 0.58);
    await circle(s, 0.62, y + 0.07, 0.44, ab[i][0], ab[i][4]);
    s.addText(ab[i][1], { x: 1.2, y, w: 2.1, h: 0.58, fontSize: 13, bold: true, color: INK, valign: "middle", margin: 0 });
    s.addText(ab[i][2], { x: 3.35, y, w: 4.45, h: 0.58, fontSize: 11, color: MUTED, valign: "middle", margin: 0 });
    s.addText(ab[i][3], { x: 7.9, y, w: 1.55, h: 0.58, fontSize: 11, bold: true, color: INK, valign: "middle", margin: 0 });
  }
  s.addText("The first three cost money up front but save it later (CEEW 2023); the tool uses illustrative ₹400 to ₹900 a tonne for them. How much each can cut depends on the plant. Carbon capture is not modelled.", { x: 0.5, y: 4.82, w: 9, h: 0.4, fontSize: 10.5, italic: true, color: MUTED, valign: "top", margin: 0 });
  s.addNotes("These five are the abatements in the tool. In the demo they appear as blocks, cheapest first. Clinker-factor reduction: make each tonne of cement with less clinker by blending in fly ash, slag or calcined clay; this is the biggest lever because clinker is where the CO2 is. Energy efficiency: CEEW cites about 20 kcal per kg of clinker from efficient coolers and about 8 kWh per tonne of cement from efficient grinding. Waste heat recovery: turns kiln exhaust heat into power; needs about Rs 8 to 10 crore of capital per MW and pays back in roughly 3 years on one reported plant. Renewable power: about USD 20 per tonne (read off a CEEW chart) converted at Rs 88. Alternative fuels: about USD 42 per tonne (CEEW). Carbon capture (about USD 90 per tonne in CEEW) is deliberately not modelled. Important honesty point: the Rs 400, 600 and 900 for the first three are illustrative placeholders; CEEW only says they pay back. Real costs depend on the factory.");

  // 3. The law
  s = light("The law: 186 cement plants now have a legal CO₂ limit per tonne");
  const stats = [["186", "notified cement plants\n(131 integrated, 55 grinding)"], ["7.18 Mt", "of CO₂ a year to be cut\nby FY27"], ["264 Mt", "CO₂ baseline of these plants\n(FY2023-24)"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.45, 2.85, 1.65);
    s.addText(stats[i][0], { x: x + 0.2, y: 1.55, w: 2.5, h: 0.75, fontFace: "Cambria", fontSize: 38, bold: true, color: GREEN, margin: 0 });
    s.addText(stats[i][1], { x: x + 0.2, y: 2.3, w: 2.5, h: 0.7, fontSize: 12, color: MUTED, valign: "top", margin: 0 });
  }
  card(s, 0.5, 3.3, 9, 1.75);
  const rules = [
    "Each plant gets its own target for CO₂ per tonne of cement, for FY2025-26 and FY2026-27 (Gazette G.S.R. 739(E), 8 Oct 2025).",
    "A plant that stays above its target must cover the shortfall with carbon credits (rule 4).",
    "No credit has traded yet and there is no official price. Analysts expect ₹600 to ₹1,200 a tonne early on.",
  ];
  s.addText(rules.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < rules.length - 1 } })), { x: 0.75, y: 3.4, w: 8.5, h: 1.55, fontSize: 13, color: INK, valign: "middle", paraSpaceAfter: 6, margin: 0 });
  s.addNotes("Source: MoEFCC gazette G.S.R. 739(E) dated 8 Oct 2025, rules 3 and 4, read in full from the PDF. 186 is our count and matches an independent ACEEE 2026 report (186 entities; 7.18 vs their 7.179 Mt). Say 186 notified cement plants, never every plant in India. The price range is from two analyst write-ups, not official. The credit price is the one big unknown, which is why the tool lets the user pick it.");

  // 4. Why cement
  s = light("Why cement? It is where this decision matters most");
  const why = [
    [fa.FaChartPie, "Biggest share of the cuts", "Cement must cut 7.18 of the 16.7 Mt required across all notified sectors: 43%."],
    [fa.FaBalanceScale, "A real cut-or-buy choice", "Chemistry limits how much a plant can cut, so credits will be a real option, not an afterthought."],
    [fa.FaBook, "Published abatement costs", "Only cement has a public cost study (CEEW, 2023) to ground the numbers."],
    [fa.FaCheckDouble, "One clean measure", "One product, one number (CO₂ per tonne of cement), so plants are comparable and our totals can be checked."],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + (i % 2) * 4.6, y = 1.45 + Math.floor(i / 2) * 1.8;
    card(s, x, y, 4.4, 1.6);
    await circle(s, x + 0.2, y + 0.2, 0.55, why[i][0], i === 0 ? GREEN : BLUE);
    s.addText(why[i][1], { x: x + 0.95, y: y + 0.18, w: 3.3, h: 0.4, fontSize: 15, bold: true, color: INK, margin: 0 });
    s.addText(why[i][2], { x: x + 0.95, y: y + 0.6, w: 3.3, h: 0.9, fontSize: 12, color: MUTED, valign: "top", margin: 0 });
  }
  s.addNotes("If asked why only cement: (1) it carries 43 percent of the required cuts; (2) it is the only sector where I found a published abatement cost study, so we are not inventing costs; (3) it is hard to abate, so the cut-versus-buy trade-off is real; (4) one clear intensity number. All 490 notified plants are in our data; other sectors would need sourced cost figures first. Be honest that the size of each abatement at a given plant is a placeholder until the plant enters its own.");

  // 4b. The simulation
  s = light("Nobody knows the credit price, so the tool tries 10,000 of them");
  const how = [
    ["1", "You set two things", "The price you expect (₹800) and how much it can swing in a year, the volatility (30%)."],
    ["2", "We try 10,000 prices", "Around ₹800, mostly between about ₹465 and ₹1,270. Prices can swing up or down, never below zero."],
    ["3", "Same sums, every price", "For each price we work out the three costs and report the average, a good year and a bad year."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.4 + i * 1.12;
    card(s, 0.5, y, 3.9, 1.0);
    s.addShape(pres.shapes.OVAL, { x: 0.65, y: y + 0.3, w: 0.4, h: 0.4, fill: { color: GREEN }, line: { color: GREEN, width: 0 } });
    s.addText(how[i][0], { x: 0.65, y: y + 0.3, w: 0.4, h: 0.4, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(how[i][1], { x: 1.2, y: y + 0.08, w: 3.1, h: 0.3, fontSize: 13, bold: true, color: INK, margin: 0 });
    s.addText(how[i][2], { x: 1.2, y: y + 0.38, w: 3.1, h: 0.58, fontSize: 10.5, color: MUTED, valign: "top", margin: 0 });
  }
  card(s, 4.6, 1.4, 4.9, 3.2);
  s.addText("Shree Cement, expected price ₹800, volatility 30%", { x: 4.8, y: 1.48, w: 4.5, h: 0.3, fontSize: 12, bold: true, color: INK, margin: 0 });
  const hdr = (t, x, w, al) => s.addText(t, { x, y: 1.85, w, h: 0.28, fontSize: 10, bold: true, color: MUTED, align: al, margin: 0 });
  hdr("", 4.8, 1.8, "left"); hdr("Average", 6.55, 0.9, "right"); hdr("Good year", 7.5, 0.95, "right"); hdr("Bad year", 8.5, 0.85, "right");
  const sim = [
    ["Buy all the credits", "₹19.8 cr", "₹11.5 cr", "₹31.3 cr", "8B98AA", false],
    ["Cut it all with abatements", "₹16.6 cr", "₹16.6 cr", "₹16.6 cr", AMBER, false],
    ["Abatements first, buy the rest", "₹13.5 cr", "₹10.7 cr", "₹15.3 cr", GREEN, true],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 2.2 + i * 0.72;
    s.addShape(pres.shapes.LINE, { x: 4.8, y, w: 4.5, h: 0, line: { color: LINE, width: 0.75 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 4.8, y: y + 0.27, w: 0.12, h: 0.12, fill: { color: sim[i][4] }, line: { color: sim[i][4], width: 0 } });
    s.addText(sim[i][0], { x: 5.0, y: y + 0.05, w: 1.55, h: 0.6, fontSize: 10.5, bold: true, color: INK, valign: "middle", margin: 0 });
    const b = sim[i][5];
    s.addText(sim[i][1], { x: 6.55, y, w: 0.9, h: 0.7, fontSize: 12, bold: true, color: b ? GREEN : INK, align: "right", valign: "middle", margin: 0 });
    s.addText(sim[i][2], { x: 7.5, y, w: 0.95, h: 0.7, fontSize: 12, color: INK, align: "right", valign: "middle", margin: 0 });
    s.addText(sim[i][3], { x: 8.5, y, w: 0.85, h: 0.7, fontSize: 12, bold: b, color: b ? GREEN : INK, align: "right", valign: "middle", margin: 0 });
  }
  s.addText("Good year = best 1 in 20 prices. Bad year = worst 1 in 20.", { x: 4.8, y: 4.35, w: 4.5, h: 0.22, fontSize: 9.5, italic: true, color: MUTED, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.75, w: 9, h: 0.42, fill: { color: "E6F6EF" }, line: { color: "E6F6EF", width: 0 } });
  s.addText("If the price spikes, buying everything can cost ₹31 cr. Abatements first caps it near ₹15 cr.", { x: 0.7, y: 4.75, w: 8.6, h: 0.42, fontSize: 13, bold: true, color: INK, valign: "middle", margin: 0 });
  s.addNotes("This is the simulation. Two inputs, both the plant's assumptions: the expected credit price and the volatility, meaning how much the price can swing in a year. No credit has traded yet, so there is no price history to measure volatility from; 30 percent is a starting guess the user can change. The tool then draws 10,000 prices around the expected one (a price can swing up or down but never below zero) and runs the same three sums for each. Good year is the best 1 in 20, bad year the worst 1 in 20. Key message: buying credits swings with the price; cutting with abatements does not; abatements first is never dearer than the other two, and its bad year is far lower than buying everything. Numbers are Shree Cement with illustrative abatement costs. Results are repeatable because the random numbers are seeded.");

  // 5. The decision + bridge to demo
  s = light("The decision each plant faces, and what the tool shows");
  s.addText("Every tonne above the limit must be cut or covered by a credit. Three ways to cover the gap:", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 14, color: MUTED, margin: 0 });
  const opts = [
    ["Buy all the credits", "₹19.7 cr", "Do nothing yourself and buy credits for the whole gap.", "8B98AA"],
    ["Cut it all with abatements", "₹16.6 cr", "Cheapest first, buy no credits. Includes costly ones.", AMBER],
    ["Abatements first, buy the rest", "₹13.8 cr", "Only abatements cheaper than a credit; credits for the remainder.", GREEN],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.85, 2.85, 2.3);
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 2.03, w: 0.18, h: 0.18, fill: { color: opts[i][3] }, line: { color: opts[i][3], width: 0 } });
    s.addText(opts[i][0], { x: x + 0.45, y: 1.95, w: 2.3, h: 0.35, fontSize: 13, bold: true, color: INK, margin: 0 });
    s.addText(opts[i][1], { x: x + 0.2, y: 2.4, w: 2.5, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: i === 2 ? GREEN : INK, margin: 0 });
    s.addText("a year", { x: x + 0.2, y: 3.05, w: 2.5, h: 0.25, fontSize: 11, color: MUTED, margin: 0 });
    s.addText(opts[i][2], { x: x + 0.2, y: 3.35, w: 2.5, h: 0.7, fontSize: 12, color: MUTED, valign: "top", margin: 0 });
  }
  s.addText("Example: Shree Cement, credit price ₹800 a tonne. Illustrative: abatement costs and sizes are placeholders; every plant enters its own.", { x: 0.5, y: 4.25, w: 9, h: 0.35, fontSize: 11, italic: true, color: MUTED, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.7, w: 9, h: 0.45, fill: { color: GREEN }, line: { color: GREEN, width: 0 } });
  s.addText("Let me show you how it works  →  live demo", { x: 0.5, y: 4.7, w: 9, h: 0.45, fontSize: 15, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
  s.addNotes("This is the bridge to the demo. The point: the middle option is not always cheapest, and the third is never dearer than the second, because it takes the cheaper of cut-it or buy-a-credit for each tonne. Numbers are Shree Cement at Rs 800: buy all about Rs 19.7 crore, cut all about Rs 16.6 crore, abatements first then buy the rest about Rs 13.8 crore. They rest on placeholder abatement costs (clinker 400, efficiency 600, waste heat 900 per tonne; renewable power 1,760 and alternative fuels 3,696 from CEEW), so say illustrative, it depends on the factory. Then jump to the live site: pick a plant, move the price slider, show the three costs change, then show the volatility slider.");

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
})();
