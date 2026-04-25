// Client-side yield refresh via the Anthropic Messages API + web search tool.
// Runs in the browser; the user provides their own API key.
// Anthropic enables direct browser calls when the
// `anthropic-dangerous-direct-browser-access: true` header is set.

import { FUNDS } from "../data/funds";
import type { Fund } from "../data/funds";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
// Haiku has higher input-token-per-minute limits than Sonnet on Tier 1
// (50K vs 10K TPM as of 2026-04). For ticker -> yield extraction the speed
// and rate-limit headroom matter more than the marginal accuracy gain.
const MODEL = "claude-haiku-4-5-20251001";

// Spacing between sequential custodian calls (ms). Helps stay under the
// per-minute input-token rate limit when web_search returns large result blocks.
const INTER_CALL_DELAY_MS = 8000;
// Max retries on 429 rate-limit errors per custodian call.
const MAX_429_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        // Lower max_uses to keep input tokens (search result blocks) under the
        // per-minute rate limit. 2 searches is usually enough for one custodian.
        max_uses: 2,
      },
    ],
    messages: [
      {
        role: "user",
        content: buildPrompt(custodian, funds),
      },
    ],
  };

  let res: Response | null = null;
  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 429) break;
    if (attempt === MAX_429_RETRIES) break;
    // Respect Retry-After header if present, otherwise exponential backoff.
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(60000, 8000 * Math.pow(2, attempt));
    await sleep(waitMs);
  }

  if (!res || !res.ok) {
    const errText = res ? await res.text().catch(() => "") : "no response";
    throw new Error(`Anthropic API ${res?.status ?? "?"}: ${errText.slice(0, 300)}`);
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
 * Runs SEQUENTIALLY with a delay between calls to stay under the
 * per-minute input-token rate limit when web_search returns large blocks.
 */
export async function refreshAllYields(apiKey: string): Promise<RefreshResult> {
  const groups = groupByCustodian(FUNDS);
  const warnings: string[] = [];
  const merged: Record<string, number> = {};

  const entries = Object.entries(groups);
  for (let i = 0; i < entries.length; i++) {
    const [custodian, funds] = entries[i];
    try {
      const { yields, warning } = await callClaudeForCustodian(apiKey, custodian, funds);
      if (warning) warnings.push(warning);
      Object.assign(merged, yields);
    } catch (e) {
      warnings.push(`${custodian}: ${(e as Error).message}`);
    }
    // Throttle between calls to spread input-token usage across the per-minute
    // window. Skip the wait after the last call.
    if (i < entries.length - 1) {
      await sleep(INTER_CALL_DELAY_MS);
    }
  }

  return {
    yields: merged,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}
