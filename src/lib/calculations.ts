// After-tax yield calculation engine.
// Faithful port of the source spreadsheet's Fund Organizer F2 formula:
//
//   =if('Fund Selector'!$E$5=TRUE, C2,
//     IFS(
//       E2="State Tax Only", $C2*(1-$E$7),
//       E2="Fed Tax Only",   $C2*(1-SUM($E$6,$E$9)),
//       and(RIGHT(E2,15)="Double Tax-Free", I2=$E$8), $C2,
//       and(RIGHT(E2,15)="Double Tax-Free", I2<>$E$8), $C2*(1-$E$7),
//       E2="Fully Taxable",  $C2*(1-SUM($E$6:$E$9))
//     ))
//
// Where:
//   C2 = pre-tax 7-day yield (decimal)
//   E2 = taxation category string
//   I2 = state code parsed from taxation string (LEFT(E2,2))
//   E5 = qualified flag
//   E6 = federal marginal rate (decimal)
//   E7 = state marginal rate (decimal)
//   E8 = user state
//   E9 = NIIT (3.8% or 0%)

import type { Fund, Taxation } from "../data/funds";
import type { StateChoice } from "../data/taxBrackets";

export interface TaxInputs {
  qualifiedAccount: boolean;
  federalRatePct: number; // e.g. 24 for 24%
  stateRatePct: number;
  niitApplies: boolean;
  userState: StateChoice;
}

/**
 * Compute the after-tax yield for a single fund given user tax inputs.
 *
 * @param preTaxYieldPct The fund's published 7-day yield as a percentage (e.g. 4.85 for 4.85%).
 * @param taxation The fund's taxation category.
 * @param fundState The fund's home state (for Double Tax-Free funds), or null.
 * @param inputs User tax situation.
 * @returns After-tax yield as a percentage.
 */
export function computeAfterTaxYield(
  preTaxYieldPct: number,
  taxation: Taxation,
  fundState: string | null,
  inputs: TaxInputs,
): number {
  if (inputs.qualifiedAccount) {
    return preTaxYieldPct;
  }

  const fed = inputs.federalRatePct / 100;
  const state = inputs.stateRatePct / 100;
  const niit = inputs.niitApplies ? 3.8 / 100 : 0;

  const isDoubleTaxFree = taxation.endsWith("Double Tax-Free");

  if (taxation === "State Tax Only") {
    return preTaxYieldPct * (1 - state);
  }
  if (taxation === "Fed Tax Only") {
    return preTaxYieldPct * (1 - (fed + niit));
  }
  if (isDoubleTaxFree) {
    if (fundState && fundState === inputs.userState) {
      return preTaxYieldPct;
    }
    // State mismatch: state tax applies (matches source spreadsheet behavior).
    return preTaxYieldPct * (1 - state);
  }
  if (taxation === "Fully Taxable") {
    return preTaxYieldPct * (1 - (fed + state + niit));
  }
  // Defensive default: treat unknown categories as fully taxed.
  return preTaxYieldPct * (1 - (fed + state + niit));
}

export interface RankedFund {
  fund: Fund;
  preTaxYieldPct: number;
  afterTaxYieldPct: number;
  monthlyGross: number;
  monthlyNet: number;
}

/**
 * Rank funds by after-tax yield, filtered by custodian preference and minimum.
 *
 * @param funds The fund universe.
 * @param yields Map of ticker -> 7-day yield percent. Funds without a yield are dropped.
 * @param inputs User tax situation.
 * @param custodianPreference The user's selected custodian or "Any".
 * @param investmentAmount Dollar amount the user plans to invest.
 * @returns Ranked list, descending by after-tax yield.
 */
export function rankFunds(
  funds: Fund[],
  yields: Record<string, number>,
  inputs: TaxInputs,
  custodianPreference: "Any" | "Fidelity" | "Schwab" | "Vanguard",
  investmentAmount: number,
): RankedFund[] {
  return funds
    .filter((f) => {
      if (custodianPreference === "Any") return true;
      return f.custodian === custodianPreference || f.custodian === "Any";
    })
    .filter((f) => f.minimumInitialInvestment <= investmentAmount)
    .map((f) => {
      const preTax = yields[f.symbol];
      if (typeof preTax !== "number") return null;
      const afterTax = computeAfterTaxYield(preTax, f.taxation, f.state, inputs);
      return {
        fund: f,
        preTaxYieldPct: preTax,
        afterTaxYieldPct: afterTax,
        monthlyGross: (preTax / 100 / 12) * investmentAmount,
        monthlyNet: (afterTax / 100 / 12) * investmentAmount,
      } as RankedFund;
    })
    .filter((r): r is RankedFund => r !== null)
    .sort((a, b) => b.afterTaxYieldPct - a.afterTaxYieldPct);
}

// --- Sanity assertions (run only in development via a simple harness) ---

/**
 * Self-test the formula against hand-computed expected values.
 * Returns an array of failures (empty array means pass).
 */
export function selfTest(): string[] {
  const failures: string[] = [];
  const eps = 1e-9;
  const close = (a: number, b: number) => Math.abs(a - b) < eps;

  const baseInputs: TaxInputs = {
    qualifiedAccount: false,
    federalRatePct: 24,
    stateRatePct: 9.3,
    niitApplies: true,
    userState: "CA",
  };

  // Qualified account bypasses tax.
  if (
    !close(
      computeAfterTaxYield(5, "Fully Taxable", null, { ...baseInputs, qualifiedAccount: true }),
      5,
    )
  ) failures.push("Qualified account should return pre-tax yield");

  // Fed Tax Only: 5 * (1 - 0.24 - 0.038) = 5 * 0.722 = 3.61
  if (!close(computeAfterTaxYield(5, "Fed Tax Only", null, baseInputs), 3.61)) {
    failures.push("Fed Tax Only mismatch");
  }

  // State Tax Only: 5 * (1 - 0.093) = 5 * 0.907 = 4.535
  if (!close(computeAfterTaxYield(5, "State Tax Only", null, baseInputs), 4.535)) {
    failures.push("State Tax Only mismatch");
  }

  // Fully Taxable: 5 * (1 - 0.24 - 0.093 - 0.038) = 5 * 0.629 = 3.145
  if (!close(computeAfterTaxYield(5, "Fully Taxable", null, baseInputs), 3.145)) {
    failures.push("Fully Taxable mismatch");
  }

  // Double Tax-Free, state matches: full pre-tax yield.
  if (
    !close(
      computeAfterTaxYield(5, "CA Double Tax-Free", "CA", baseInputs),
      5,
    )
  ) failures.push("CA Double Tax-Free in CA should return pre-tax");

  // Double Tax-Free, state mismatches: state tax applies (4.535).
  if (
    !close(
      computeAfterTaxYield(5, "NY Double Tax-Free", "NY", baseInputs),
      4.535,
    )
  ) failures.push("NY Double Tax-Free with CA user should be state-taxed");

  return failures;
}
