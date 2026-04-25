// Tax bracket marginal rates available in the input form.
// 2025 TCJA-era figures. Income thresholds are NOT used; users pick their
// marginal rate directly. Update annually.

import type { StateCode } from "./funds";

export const FEDERAL_BRACKETS_PCT: number[] = [
  0, 10, 12, 22, 24, 32, 35, 37,
];

// State marginal rate ladders. Source: 2025 published rate schedules.
// Single set per state (single filer top-of-bracket marginal rates).
// Users pick their effective marginal rate from this list.
//
// CA: California Franchise Tax Board 2025 schedule
// NY: New York State 2025 (state portion only, NYC local not included)
// NJ: New Jersey 2025
// MA: Massachusetts 2025 flat 5%, plus 4% surtax over $1M
//
// These are inputs the user picks from. The tool does not compute the user's
// bracket from AGI.
export const STATE_BRACKETS_PCT: Record<StateCode | "None", number[]> = {
  None: [0],
  CA: [0, 1, 2, 4, 6, 8, 9.3, 10.3, 11.3, 12.3, 13.3],
  NY: [0, 4, 4.5, 5.25, 5.5, 6, 6.85, 9.65, 10.3, 10.9],
  NJ: [0, 1.4, 1.75, 3.5, 5.525, 6.37, 8.97, 10.75],
  MA: [0, 5, 9],
};

export const NIIT_PCT = 3.8;

export type StateChoice = StateCode | "None";
export const STATE_CHOICES: readonly StateChoice[] = ["None", "CA", "NY", "NJ", "MA"] as const;
