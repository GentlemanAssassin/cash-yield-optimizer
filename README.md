# Cash Yield Optimizer

After-tax cash yield optimizer for money market funds and Treasury ETFs across Fidelity, Schwab, Vanguard, and the WisdomTree USFR ETF. Internal Ares Financial Consulting tool. Successor to the Excel-based AresIR Tools Cash Management Yield Maximizer.

## What it does

Given your federal marginal bracket, state, NIIT applicability, custodian preference, and investment amount, the tool ranks 54 money market funds plus USFR by after-tax yield and shows projected monthly gross and net income. Yields are pulled live from custodian websites via the Anthropic API with web search.

## Setup

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173.

## How yield refresh works

When you click Refresh, the app sends one Claude request per custodian (Fidelity, Schwab, Vanguard, Any/USFR) to the Anthropic Messages API with the web search tool enabled. Each request asks Claude to look up current 7-day SEC yields for that custodian's funds and return JSON. Results are merged and cached in browser localStorage. The cached snapshot persists until you click Refresh again.

## API key

The tool needs your Anthropic API key. On first launch you're prompted to paste it. The key lives in localStorage on your device only and is never sent anywhere except api.anthropic.com when you click Refresh. Click Manage key in the header to update or remove it.

This works because the Anthropic API supports direct browser calls when you set the `anthropic-dangerous-direct-browser-access: true` header. There's no backend; everything runs client-side.

If you share the deployed URL with someone, they will need their own API key to refresh. Without a key, the app shows the last cached yields read-only.

## Calculation logic

Faithful port of the source spreadsheet's Fund Organizer F2 formula. Rules:

- Qualified account, return pre-tax yield (no tax)
- Fed Tax Only, subtract federal + NII
- State Tax Only (national munis), subtract state only
- CA / NY / NJ / MA Double Tax-Free with matching user state, no tax
- Double Tax-Free with state mismatch, subtract state only
- Fully Taxable, subtract federal + state + NII

`src/lib/calculations.ts` includes a `selfTest()` function with hand-computed expected values. Run it from a Node REPL or import it from a debug page.

## Deploy to GitHub Pages

1. Create a new GitHub repo (any name; default scaffold assumes `cash-yield-optimizer`)
2. `git init`, `git remote add origin git@github.com:<you>/<repo>.git`, then push
3. In repo settings, enable GitHub Pages and set the source to "GitHub Actions"
4. If the repo name differs from `cash-yield-optimizer`, set a repo Variable named `VITE_BASE` to `/<your-repo-name>/`
5. Push to `main`. The workflow at `.github/workflows/deploy.yml` builds and deploys

The deployed URL will be `https://<you>.github.io/<repo-name>/`.

## Project structure

```
src/
  data/
    funds.ts          54 unique tickers, generated from Cash_Fund_Database.csv
    taxBrackets.ts    Federal + CA/NY/NJ/MA marginal rate ladders, NIIT constant
  lib/
    calculations.ts   After-tax yield engine + selfTest()
    refresh.ts        Anthropic API call with web search, batched by custodian
    storage.ts        localStorage helpers for key, snapshot, last inputs
  components/
    ApiKeyPrompt.tsx
    InputForm.tsx
    ResultsTable.tsx
  App.tsx             Composition + state
  main.tsx            React mount
```

## Adding or correcting fund data

Edit `Cash_Fund_Database.csv` in the parent folder, then regenerate:

```bash
# From the parent folder
python3 - <<'PY'
# (regeneration script in the project vault notes)
PY
```

Or hand-edit `src/data/funds.ts` directly for one-off corrections.

## Known issues

See `../Cash Management Tool Vault/Bugs.md` for the full list. Highlights:

- `Cash_Fund_Database.csv` lists FMPXX twice; deduplicated automatically when porting
- "Double Tax-Free" classifier uses string-suffix matching; values must match exactly
- NII application asymmetry between taxation categories mirrors the source spreadsheet pending Mike's verdict
