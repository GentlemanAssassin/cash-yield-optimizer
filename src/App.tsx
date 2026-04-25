import { useEffect, useMemo, useState } from "react";
import InputForm, { type InputState } from "./components/InputForm";
import ResultsTable from "./components/ResultsTable";
import ApiKeyPrompt from "./components/ApiKeyPrompt";
import { FUNDS } from "./data/funds";
import { rankFunds } from "./lib/calculations";
import { refreshAllYields } from "./lib/refresh";
import {
  getApiKey,
  clearApiKey,
  getYieldsSnapshot,
  setYieldsSnapshot,
  getSavedInputs,
  setSavedInputs,
  type YieldSnapshot,
} from "./lib/storage";

const DEFAULT_INPUTS: InputState = {
  qualifiedAccount: false,
  federalRatePct: 24,
  stateRatePct: 9.3,
  userState: "CA",
  niitApplies: true,
  custodianPreference: "Any",
  investmentAmount: 100000,
};

export default function App() {
  const [hasKey, setHasKey] = useState<boolean>(() => Boolean(getApiKey()));
  const [showKeyPrompt, setShowKeyPrompt] = useState<boolean>(() => !getApiKey());
  const [snapshot, setSnapshot] = useState<YieldSnapshot | null>(() => getYieldsSnapshot());
  const [inputs, setInputs] = useState<InputState>(() => {
    const saved = getSavedInputs();
    if (!saved) return DEFAULT_INPUTS;
    return {
      ...DEFAULT_INPUTS,
      ...saved,
      userState: (saved.userState as InputState["userState"]) ?? "CA",
      custodianPreference:
        (saved.custodianPreference as InputState["custodianPreference"]) ?? "Any",
    };
  });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    setSavedInputs({
      qualifiedAccount: inputs.qualifiedAccount,
      federalRatePct: inputs.federalRatePct,
      stateRatePct: inputs.stateRatePct,
      userState: inputs.userState,
      niitApplies: inputs.niitApplies,
      custodianPreference: inputs.custodianPreference,
      investmentAmount: inputs.investmentAmount,
    });
  }, [inputs]);

  const ranked = useMemo(() => {
    const yields = snapshot?.yields ?? {};
    return rankFunds(
      FUNDS,
      yields,
      {
        qualifiedAccount: inputs.qualifiedAccount,
        federalRatePct: inputs.federalRatePct,
        stateRatePct: inputs.stateRatePct,
        niitApplies: inputs.niitApplies,
        userState: inputs.userState,
      },
      inputs.custodianPreference,
      inputs.investmentAmount,
    );
  }, [inputs, snapshot]);

  async function handleRefresh() {
    const key = getApiKey();
    if (!key) {
      setShowKeyPrompt(true);
      return;
    }
    setRefreshing(true);
    setRefreshError(null);
    try {
      const result = await refreshAllYields(key);
      const next: YieldSnapshot = {
        fetchedAt: result.fetchedAt,
        yields: result.yields,
        source: "claude-web-search",
      };
      setYieldsSnapshot(next);
      setSnapshot(next);
      setWarnings(result.warnings);
    } catch (e) {
      setRefreshError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  function handleClearKey() {
    clearApiKey();
    setHasKey(false);
    setShowKeyPrompt(true);
  }

  if (showKeyPrompt) {
    return (
      <Shell>
        <ApiKeyPrompt
          onSaved={() => {
            setHasKey(Boolean(getApiKey()));
            setShowKeyPrompt(false);
          }}
        />
      </Shell>
    );
  }

  const yieldCount = snapshot ? Object.keys(snapshot.yields).length : 0;
  const fetchedAt = snapshot ? new Date(snapshot.fetchedAt).toLocaleString() : "never";

  return (
    <Shell>
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ares-700">Cash Yield Optimizer</h1>
          <p className="text-sm text-gray-600">
            After-tax money market and Treasury ETF rankings, refreshed on demand.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 text-xs text-gray-500 md:items-end">
          <div>Yields last refreshed: {fetchedAt}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || !hasKey}
              className="rounded-md bg-ares-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-ares-600 disabled:opacity-50"
              title={refreshing ? "Refresh runs sequentially across custodians and may take ~40 seconds" : ""}
            >
              {refreshing ? "Refreshing (~40s)..." : "Refresh yields"}
            </button>
            <button
              type="button"
              onClick={handleClearKey}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
              title="Clear stored API key"
            >
              Manage key
            </button>
          </div>
        </div>
      </header>

      {!hasKey && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No API key set. The tool is read-only against the last cached yields. Click "Manage key" to add one.
        </div>
      )}

      {refreshError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Refresh failed: {refreshError}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="font-medium">Refresh warnings:</div>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <InputForm value={inputs} onChange={setInputs} />

      <ResultsTable rows={ranked} totalUniverse={FUNDS.length} withYields={yieldCount} />

      <footer className="text-center text-xs text-gray-500">
        Internal Ares tool. Calculations follow the source spreadsheet's after-tax yield logic. Verify before relying
        on output for client recommendations.
      </footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-6">{children}</div>
    </div>
  );
}
