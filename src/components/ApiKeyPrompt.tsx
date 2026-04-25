import { useState } from "react";
import { setApiKey } from "../lib/storage";

interface Props {
  onSaved: () => void;
}

export default function ApiKeyPrompt({ onSaved }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed.startsWith("sk-")) {
      setError("That doesn't look like an Anthropic API key. Keys start with 'sk-'.");
      return;
    }
    setApiKey(trimmed);
    setError(null);
    onSaved();
  }

  return (
    <div className="rounded-lg border border-ares-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ares-700">Add your Anthropic API key</h2>
      <p className="mt-2 text-sm text-gray-600">
        The tool uses Anthropic's API with web search to pull current 7-day yields from Fidelity, Schwab, Vanguard,
        and the WisdomTree USFR ETF. Your key is stored locally in this browser only and is never sent anywhere
        except to api.anthropic.com when you click Refresh. You can update or remove it any time.
      </p>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        API Key
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-ares-500 focus:outline-none focus:ring-1 focus:ring-ares-500"
          autoComplete="off"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-ares-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-ares-600"
        >
          Save key
        </button>
        <button
          type="button"
          onClick={onSaved}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Continue without (cached yields only)
        </button>
      </div>
    </div>
  );
}
