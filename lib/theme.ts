/** One colour per sector, used everywhere (Okabe–Ito: colour-blind safe). */
export const SECTOR_COLOR: Record<string, string> = {
  Cement: "#E69F00",
  Textile: "#CC79A7",
  "Pulp and Paper": "#009E73",
  "Chlor-Alkali": "#56B4E9",
  "Petroleum Refinery": "#D55E00",
  Aluminium: "#9aa7ff",
  Petrochemical: "#F0E442",
};
export const sectorColor = (s: string) => SECTOR_COLOR[s] ?? "#8b98aa";
