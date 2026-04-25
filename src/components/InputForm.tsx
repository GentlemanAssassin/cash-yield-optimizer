import { FEDERAL_BRACKETS_PCT, STATE_BRACKETS_PCT, STATE_CHOICES, type StateChoice } from "../data/taxBrackets";

export interface InputState {
  qualifiedAccount: boolean;
  federalRatePct: number;
  stateRatePct: number;
  userState: StateChoice;
  niitApplies: boolean;
  custodianPreference: "Any" | "Fidelity" | "Schwab" | "Vanguard";
  investmentAmount: number;
}

interface Props {
  value: InputState;
  onChange: (next: InputState) => void;
}

export default function InputForm({ value, onChange }: Props) {
  function patch(p: Partial<InputState>) {
    onChange({ ...value, ...p });
  }

  function handleStateChange(next: StateChoice) {
    // When the state changes, snap the state rate to the highest bracket
    // available for that state if the current rate isn't valid there.
    const validRates = STATE_BRACKETS_PCT[next];
    const newRate = validRates.includes(value.stateRatePct)
      ? value.stateRatePct
      : validRates[validRates.length - 1];
    patch({ userState: next, stateRatePct: newRate });
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-ares-100 bg-white p-6 shadow-sm md:grid-cols-2">
      <Field label="Federal marginal bracket">
        <select
          className="form-select"
          value={value.federalRatePct}
          onChange={(e) => patch({ federalRatePct: Number(e.target.value) })}
        >
          {FEDERAL_BRACKETS_PCT.map((r) => (
            <option key={r} value={r}>
              {r}%
            </option>
          ))}
        </select>
      </Field>

      <Field label="State">
        <select
          className="form-select"
          value={value.userState}
          onChange={(e) => handleStateChange(e.target.value as StateChoice)}
        >
          {STATE_CHOICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="State marginal bracket">
        <select
          className="form-select"
          value={value.stateRatePct}
          onChange={(e) => patch({ stateRatePct: Number(e.target.value) })}
          disabled={value.userState === "None"}
        >
          {STATE_BRACKETS_PCT[value.userState].map((r) => (
            <option key={r} value={r}>
              {r}%
            </option>
          ))}
        </select>
      </Field>

      <Field label="Custodian preference">
        <select
          className="form-select"
          value={value.custodianPreference}
          onChange={(e) =>
            patch({ custodianPreference: e.target.value as InputState["custodianPreference"] })
          }
        >
          <option value="Any">Any</option>
          <option value="Fidelity">Fidelity</option>
          <option value="Schwab">Schwab</option>
          <option value="Vanguard">Vanguard</option>
        </select>
      </Field>

      <Field label="Investment amount">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            min={0}
            step={1000}
            className="form-input flex-1"
            value={value.investmentAmount}
            onChange={(e) => patch({ investmentAmount: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </Field>

      <div className="flex flex-col justify-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.niitApplies}
            onChange={(e) => patch({ niitApplies: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-ares-500 focus:ring-ares-500"
          />
          NIIT applies (3.8% surtax)
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.qualifiedAccount}
            onChange={(e) => patch({ qualifiedAccount: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-ares-500 focus:ring-ares-500"
          />
          Qualified account (bypass tax)
        </label>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
