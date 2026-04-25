// Auto-generated from Cash_Fund_Database.csv on 2026-04-25.
// FMPXX duplicate removed. Source CSV: 55 rows -> 54 unique tickers.

export type Custodian = "Fidelity" | "Schwab" | "Vanguard" | "Any";

export type Taxation =
  | "Fully Taxable"
  | "Fed Tax Only"
  | "State Tax Only"
  | "CA Double Tax-Free"
  | "NY Double Tax-Free"
  | "NJ Double Tax-Free"
  | "MA Double Tax-Free";

export type StateCode = "CA" | "NY" | "NJ" | "MA";

export interface Fund {
  symbol: string;
  name: string;
  minimumInitialInvestment: number;
  taxation: Taxation;
  custodian: Custodian;
  state: StateCode | null;
}

export const FUNDS: Fund[] = [
  { symbol: "FABXX", name: "Fidelity California Municipal Money Market Fund", minimumInitialInvestment: 0, taxation: "CA Double Tax-Free", custodian: "Fidelity", state: "CA" },
  { symbol: "FSBXX", name: "Fidelity California Municipal Money Market Fund - Institutional Class", minimumInitialInvestment: 1000000, taxation: "CA Double Tax-Free", custodian: "Fidelity", state: "CA" },
  { symbol: "FSPXX", name: "Fidelity California Municipal Money Market Fund - Premium Class", minimumInitialInvestment: 25000, taxation: "CA Double Tax-Free", custodian: "Fidelity", state: "CA" },
  { symbol: "SWKXX", name: "Schwab CA Municipal Money Inv", minimumInitialInvestment: 0, taxation: "CA Double Tax-Free", custodian: "Schwab", state: "CA" },
  { symbol: "SCAXX", name: "Schwab California Municipal Money Ultra", minimumInitialInvestment: 1000000, taxation: "CA Double Tax-Free", custodian: "Schwab", state: "CA" },
  { symbol: "VCTXX", name: "Vanguard CA Municipal Money Market Inv", minimumInitialInvestment: 3000, taxation: "CA Double Tax-Free", custodian: "Vanguard", state: "CA" },
  { symbol: "USFR", name: "WisdomTree Floating Rate Treasury Fund", minimumInitialInvestment: 0, taxation: "Fed Tax Only", custodian: "Any", state: null },
  { symbol: "FSIXX", name: "Fidelity Investments Money Market Treasury Only Class I", minimumInitialInvestment: 1000000, taxation: "Fed Tax Only", custodian: "Fidelity", state: null },
  { symbol: "FRSXX", name: "Fidelity Investments Money Market Treasury Only - Institutional Class", minimumInitialInvestment: 10000000, taxation: "Fed Tax Only", custodian: "Fidelity", state: null },
  { symbol: "FDLXX", name: "Fidelity Treasury Only Money Market Fund", minimumInitialInvestment: 0, taxation: "Fed Tax Only", custodian: "Fidelity", state: null },
  { symbol: "SNSXX", name: "Schwab US Treasury Money Investor", minimumInitialInvestment: 0, taxation: "Fed Tax Only", custodian: "Schwab", state: null },
  { symbol: "SUTXX", name: "Schwab US Treasury Money Ultra", minimumInitialInvestment: 1000000, taxation: "Fed Tax Only", custodian: "Schwab", state: null },
  { symbol: "VUSXX", name: "Vanguard Treasury Money Market Investor", minimumInitialInvestment: 3000, taxation: "Fed Tax Only", custodian: "Vanguard", state: null },
  { symbol: "FDRXX", name: "Fidelity Government Cash Reserves", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "SPAXX", name: "Fidelity Government Money Market Fund", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FZCXX", name: "Fidelity Government Money Market Fund Premium Class", minimumInitialInvestment: 100000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FIGXX", name: "Fidelity Investments Money Market Government Portfolio Class I", minimumInitialInvestment: 1000000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FRGXX", name: "Fidelity Investments Money Market Government Portfolio - Institutional Class", minimumInitialInvestment: 10000000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FMPXX", name: "Fidelity Investments Money Market - Money Market Portfolio - Class I", minimumInitialInvestment: 1000000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FNSXX", name: "Fidelity Investments Money Market - Money Market Portfolio - Institutional Class", minimumInitialInvestment: 10000000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FISXX", name: "Fidelity Investments Money Market Treasury Portfolio - Class I", minimumInitialInvestment: 1000000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FRBXX", name: "Fidelity Investments Money Market Treasury Portfolio - Institutional Class", minimumInitialInvestment: 10000000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "SPRXX", name: "Fidelity Money Market Fund", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FZDXX", name: "Fidelity Money Market Fund Premium Class", minimumInitialInvestment: 100000, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "FZFXX", name: "Fidelity Treasury Money Market Fund", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Fidelity", state: null },
  { symbol: "SNVXX", name: "Schwab Government Money Inv", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Schwab", state: null },
  { symbol: "SGUXX", name: "Schwab Government Money Ultra", minimumInitialInvestment: 1000000, taxation: "Fully Taxable", custodian: "Schwab", state: null },
  { symbol: "SNOXX", name: "Schwab Treasury Oblig Money Inv", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Schwab", state: null },
  { symbol: "SCOXX", name: "Schwab Treasury Oblig Money Ultra", minimumInitialInvestment: 1000000, taxation: "Fully Taxable", custodian: "Schwab", state: null },
  { symbol: "SWVXX", name: "Schwab Value Advantage Money Inv", minimumInitialInvestment: 0, taxation: "Fully Taxable", custodian: "Schwab", state: null },
  { symbol: "SNAXX", name: "Schwab Value Advantage Money Ultra", minimumInitialInvestment: 1000000, taxation: "Fully Taxable", custodian: "Schwab", state: null },
  { symbol: "VMRXX", name: "Vanguard Cash Rsrv Federal MnyMktAdmiral", minimumInitialInvestment: 3000, taxation: "Fully Taxable", custodian: "Vanguard", state: null },
  { symbol: "VMFXX", name: "Vanguard Federal Money Market Investor", minimumInitialInvestment: 3000, taxation: "Fully Taxable", custodian: "Vanguard", state: null },
  { symbol: "FAUXX", name: "Fidelity Massachusetts Municipal Money Market Fund", minimumInitialInvestment: 0, taxation: "MA Double Tax-Free", custodian: "Fidelity", state: "MA" },
  { symbol: "FMSXX", name: "Fidelity Massachusetts Municipal Money Market Fund - Premium Class", minimumInitialInvestment: 25000, taxation: "MA Double Tax-Free", custodian: "Fidelity", state: "MA" },
  { symbol: "FMAXX", name: "Fidelity Massachusetts Municipal Money Market Fund - Institutional Class", minimumInitialInvestment: 1000000, taxation: "MA Double Tax-Free", custodian: "Fidelity", state: "MA" },
  { symbol: "FAYXX", name: "Fidelity New Jersey Municipal Money Market Fund", minimumInitialInvestment: 0, taxation: "NJ Double Tax-Free", custodian: "Fidelity", state: "NJ" },
  { symbol: "FSJXX", name: "Fidelity New Jersey Municipal Money Market Fund - Premium Class", minimumInitialInvestment: 25000, taxation: "NJ Double Tax-Free", custodian: "Fidelity", state: "NJ" },
  { symbol: "FSKXX", name: "Fidelity New Jersey Municipal Money Market Fund - Institutional Class", minimumInitialInvestment: 1000000, taxation: "NJ Double Tax-Free", custodian: "Fidelity", state: "NJ" },
  { symbol: "SWYXX", name: "Schwab New York Municipal Money Fund - Investor Shares", minimumInitialInvestment: 0, taxation: "NY Double Tax-Free", custodian: "Schwab", state: "NY" },
  { symbol: "SNYXX", name: "Schwab New York Municipal Money Fund - Ultra Shares", minimumInitialInvestment: 1000000, taxation: "NY Double Tax-Free", custodian: "Schwab", state: "NY" },
  { symbol: "FAWXX", name: "Fidelity New York Municipal Money Market Fund", minimumInitialInvestment: 0, taxation: "NY Double Tax-Free", custodian: "Fidelity", state: "NY" },
  { symbol: "FSNXX", name: "Fidelity New York Municipal Money Market Fund - Premium Class", minimumInitialInvestment: 25000, taxation: "NY Double Tax-Free", custodian: "Fidelity", state: "NY" },
  { symbol: "FNKXX", name: "Fidelity New York Municipal Money Market Fund - Institutional Class", minimumInitialInvestment: 1000000, taxation: "NY Double Tax-Free", custodian: "Fidelity", state: "NY" },
  { symbol: "VYFXX", name: "Vanguard New York Municipal Money Market Fund", minimumInitialInvestment: 3000, taxation: "NY Double Tax-Free", custodian: "Vanguard", state: "NY" },
  { symbol: "FTCXX", name: "Fidelity Investments Money Market Tax Exempt - Class I", minimumInitialInvestment: 1000000, taxation: "State Tax Only", custodian: "Fidelity", state: null },
  { symbol: "FTEXX", name: "Fidelity Municipal Money Market Fund", minimumInitialInvestment: 0, taxation: "State Tax Only", custodian: "Fidelity", state: null },
  { symbol: "FMOXX", name: "Fidelity Tax-Exempt Money Market Fund", minimumInitialInvestment: 0, taxation: "State Tax Only", custodian: "Fidelity", state: null },
  { symbol: "FZEXX", name: "Fidelity Tax-Exempt Money Market Fund Premium Class", minimumInitialInvestment: 25000, taxation: "State Tax Only", custodian: "Fidelity", state: null },
  { symbol: "SWWXX", name: "Schwab AMT Tax-Free Money Inv", minimumInitialInvestment: 0, taxation: "State Tax Only", custodian: "Schwab", state: null },
  { symbol: "SCTXX", name: "Schwab AMT Tax-Free Money Ultra", minimumInitialInvestment: 1000000, taxation: "State Tax Only", custodian: "Schwab", state: null },
  { symbol: "SWTXX", name: "Schwab Municipal Money Inv", minimumInitialInvestment: 0, taxation: "State Tax Only", custodian: "Schwab", state: null },
  { symbol: "SWOXX", name: "Schwab Municipal Money Ultra", minimumInitialInvestment: 1000000, taxation: "State Tax Only", custodian: "Schwab", state: null },
  { symbol: "VMSXX", name: "Vanguard Municipal Money Market Inv", minimumInitialInvestment: 3000, taxation: "State Tax Only", custodian: "Vanguard", state: null },
];

export const FUND_COUNT = 54; // unique tickers
