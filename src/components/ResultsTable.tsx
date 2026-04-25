import type { RankedFund } from "../lib/calculations";

interface Props {
  rows: RankedFund[];
  totalUniverse: number;
  withYields: number;
}

const fmtPct = (n: number) => `${n.toFixed(3)}%`;
const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
const fmtMin = (n: number) =>
  n === 0
    ? "$0"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

export default function ResultsTable({ rows, totalUniverse, withYields }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-ares-100 bg-white p-6 text-sm text-gray-600 shadow-sm">
        No funds match the current filters yet. {withYields === 0 ? "Click Refresh yields to fetch current data." : "Try widening your custodian preference or lowering the investment amount."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ares-100 bg-white shadow-sm">
      <div className="px-4 py-3 text-xs text-gray-500">
        Showing {rows.length} of {totalUniverse} funds. {withYields} have current yield data.
      </div>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-ares-50">
          <tr>
            <Th>Rank</Th>
            <Th>Ticker</Th>
            <Th>Fund</Th>
            <Th>Custodian</Th>
            <Th>Taxation</Th>
            <Th align="right">Min</Th>
            <Th align="right">Pre-tax</Th>
            <Th align="right">After-tax</Th>
            <Th align="right">Monthly gross</Th>
            <Th align="right">Monthly net</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={r.fund.symbol} className={i === 0 ? "bg-amber-50/50" : ""}>
              <Td>{i + 1}</Td>
              <Td className="font-mono font-semibold">{r.fund.symbol}</Td>
              <Td className="max-w-md truncate" title={r.fund.name}>
                {r.fund.name}
              </Td>
              <Td>{r.fund.custodian}</Td>
              <Td className="text-xs text-gray-500">{r.fund.taxation}</Td>
              <Td align="right">{fmtMin(r.fund.minimumInitialInvestment)}</Td>
              <Td align="right">{fmtPct(r.preTaxYieldPct)}</Td>
              <Td align="right" className="font-semibold">
                {fmtPct(r.afterTaxYieldPct)}
              </Td>
              <Td align="right">{fmtMoney(r.monthlyGross)}</Td>
              <Td align="right" className="font-semibold">
                {fmtMoney(r.monthlyNet)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ares-700 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
  title,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={`px-3 py-2 ${align === "right" ? "text-right tabular-nums" : ""} ${className}`}
    >
      {children}
    </td>
  );
}
