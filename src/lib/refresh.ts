// Client-side yield refresh via the Anthropic Messages API + web search tool.
// Runs in the browser; the user provides their own API key.
// Anthropic enables direct browser calls when the
// `anthropic-dangerous-direct-browser-access: true` header is set.

import { FUNDS } from "../data/funds";
import type { Fund } from "../data/funds";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

export interface RefreshResult {
  yields: Record<string, number>;
  fetchedAt: string;
  warnings: string[];
}

/**
 * Group the fund universe by custodian. Each custodian gets its own Claude
 * call with web search, which keeps each prompt focused and reduces the
 * chance of a single failure killing the whole refresh.
 */
function groupByCustodian(funds: Fund[]): Record<string, Fund[]> {
  const groups: Record<string, Fund[]> = {};
  for (const f of funds) {
    const key = f.custodian;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  return groups;
}

function buildPrompt(custodian: string, funds: Fund[]): string {
  const ticker_list = funds.map((f) => `${f.symbol} - ${f.name}`).join("\n");
  return [
    `Look up the current 7-day SEC yield for each of the following ${custodian === "Any" ? "" : custodian + " "}money market funds and ETFs:`,
    "",
    ticker_list,
    "",
    `Use ${
      custodian === "Fidelity"
        ? "fidelity.com"
        : custodian === "Schwab"
          ? "schwab.com"
          : custodian === "Vanguard"
            ? "vanguard.com"
            : "the issuer's website (e.g. wisdomtree.com for USFR)"
    } as the primary source. Cross-reference with morningstar.com or marketwatch.com if needed.`,
    "",
    "Your final message must be a single JSON object mapping each ticker symbol to its 7-day yield as a number (no percent sign).",
    'Required exact format: {"FZDXX": 4.85, "SPRXX": 4.72}',
    "",
    "Rules:",
    "- Use 7-day SEC yield, not 30-day or distribution yield. For ETFs that don't publish a 7-day yield, use the 30-day SEC yield.",
    "- Numbers as decimals (4.85 means 4.85%). No percent signs.",
    "- If a yield can't be found, omit that ticker from the response. Don't guess.",
    "- Your final response message must contain ONLY the JSON object. No prose, no commentary, no markdown code fences, no headers, no explanation. Just the raw JSON.",
    "- It is fine to think out loud and search the web during intermediate steps, but the very last message you produce must be only the JSON.",
  ].join("\n");
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason?: string;
}

async function callClaudeForCustodian(
  apiKey: string,
  custodian: string,
  funds: Fund[],
): Promise<{ yields: Record<string, number>; warning?: string }> {
  const body = {
    model: MODEL,
    max_tokens: 1024,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [
      {
        role: "user",
        content: buildPrompt(custodian, funds),
      },
    ],
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  // With the web_search tool, the response contains multiple text blocks
  // interleaved with tool_use / tool_result blocks. The LAST text block is the
  // final answer; earlier ones are reasoning between searches. We try the last
  // first, then fall back to concatenating all text blocks.
  const textBlocks = (data.content ?? []).filter(
    (b) => b.type === "text" && typeof b.text === "string",
  );
  if (textBlocks.length === 0) {
    return { yields: {}, warning: `${custodian}: no text in response` };
  }

  const lastText = textBlocks[textBlocks.length - 1].text!;
  let parsed = parseYieldJson(lastText);
  if (!parsed || Object.keys(parsed).length === 0) {
    const concatenated = textBlocks.map((b) => b.text).join("\n\n");
    parsed = parseYieldJson(concatenated);
  }
  if (!parsed || Object.keys(parsed).length === 0) {
    return {
      yields: {},
      warning: `${custodian}: could not parse JSON from response (response started with: ${lastText.slice(0, 120).replace(/\s+/g, " ")})`,
    };
  }
  return { yields: parsed };
}

/**
 * Extract the JSON object from Claude's response. Tolerates leading/trailing
 * prose, markdown code fences, and one level of nesting (e.g. {"yields": {...}}).
 */
function parseYieldJson(text: string): Record<string, number> | null {
  // Strip markdown code fences if present.
  const stripped = text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // Try direct parse first.
  const direct = tryParseAndExtract(stripped);
  if (direct && Object.keys(direct).length > 0) return direct;

  // Look for the first { ... } block. Prefer a tight match by finding balanced
  // braces from the first `{`.
  const firstBrace = stripped.indexOf("{");
  if (firstBrace === -1) return null;

  // Try every closing-brace position from the end working backwards. The
  // greedy-then-shrink approach handles cases where prose contains stray braces.
  for (let end = stripped.length; end > firstBrace; end--) {
    if (stripped[end - 1] !== "}") continue;
    const candidate = stripped.slice(firstBrace, end);
    const obj = tryParseAndExtract(candidate);
    if (obj && Object.keys(obj).length > 0) return obj;
  }
  return null;
}

function tryParseAndExtract(s: string): Record<string, number> | null {
  try {
    const parsed = JSON.parse(s);
    if (!parsed || typeof parsed !== "object") return null;
    // Direct ticker -> yield map.
    const direct = sanitize(parsed as Record<string, unknown>);
    if (Object.keys(direct).length > 0) return direct;
    // Maybe nested under a wrapper key like {"yields": {...}}. Try one level.
    for (const v of Object.values(parsed as Record<string, unknown>)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = sanitize(v as Record<string, unknown>);
        if (Object.keys(nested).length > 0) return nested;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function sanitize(obj: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    // Keys must look like a ticker (3-5 uppercase letters/digits).
    const key = k.toUpperCase().trim();
    if (!/^[A-Z0-9]{2,6}$/.test(key)) continue;
    let n: number | null = null;
    if (typeof v === "number") n = v;
    else if (typeof v === "string") {
      const cleaned = v.replace(/%/g, "").trim();
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) n = parsed;
    }
    if (n !== null && n >= 0 && n < 30) {
      out[key] = n;
    }
  }
  return out;
}

/**
 * Refresh yields for every fund in the universe, batched by custodian.
 * Resolves all batches in parallel.
 */
export async function refreshAllYields(apiKey: string): Promise<RefreshResult> {
  const groups = groupByCustodian(FUNDS);
  const warnings: string[] = [];

  const results = await Promise.allSettled(
    Object.entries(groups).map(async ([custodian, funds]) => {
      try {
        const { yields, warning } = await callClaudeForCustodian(apiKey, custodian, funds);
        if (warning) warnings.push(warning);
        return yields;
      } catch (e) {
        warnings.push(`${custodian}: ${(e as Error).message}`);
        return {} as Record<string, number>;
      }
    }),
  );

  const merged: Record<string, number> = {};
  for (const r of results) {
    if (r.status === "fulfilled") Object.assign(merged, r.value);
  }

  return {
    yields: merged,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}
