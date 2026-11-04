/** Default cement abatements (ways for a plant to cut its own CO2). Costs from the CEEW cost curve; sizes are placeholders. */

/** INR per USD used to convert dollar costs from the study. An assumption; shown wherever it is used. */
export const FX_INR_PER_USD = 88;

const CEEW = "CEEW, Evaluating Net-zero for the Indian Cement Industry (Oct 2023)";
const ILLUS = "Illustrative placeholder, not a published figure: the real cost depends on the plant. Enter your own.";
const SIZE_NOTE = "How much it can cut at your plant is a placeholder: enter your own figure.";

export type DefaultAbatement = { id: string; name: string; shareOfGap: number; costPerTonne: number; source: string };

/**
 * shareOfGap: placeholder size of the abatement as a share of the plant's FY27 gap (the shares add to more than 100%
 * on purpose, so the plant can see what happens when it needs the more expensive ones).
 */
export const DEFAULT_ABATEMENTS: DefaultAbatement[] = [
  { id: "clinker", name: "Clinker-factor reduction", shareOfGap: 0.45, costPerTonne: 400, source: `${ILLUS} (CEEW 2023 finds it pays back over time.) ${SIZE_NOTE}` },
  { id: "efficiency", name: "Energy efficiency", shareOfGap: 0.3, costPerTonne: 600, source: `${ILLUS} (CEEW 2023 finds it pays back over time.) ${SIZE_NOTE}` },
  { id: "whr", name: "Waste heat recovery", shareOfGap: 0.15, costPerTonne: 900, source: `${ILLUS} (CEEW 2023 finds it pays back over time.) ${SIZE_NOTE}` },
  { id: "re", name: "Renewable power (round the clock)", shareOfGap: 0.25, costPerTonne: Math.round(20 * FX_INR_PER_USD), source: `${CEEW}: about USD 20 per tonne read off a chart (approximate), converted at ₹${FX_INR_PER_USD}/USD. ${SIZE_NOTE}` },
  { id: "afr", name: "Alternative fuels (30% thermal share)", shareOfGap: 0.4, costPerTonne: Math.round(42 * FX_INR_PER_USD), source: `${CEEW}: about USD 42 per tonne, converted at ₹${FX_INR_PER_USD}/USD. ${SIZE_NOTE}` },
];
