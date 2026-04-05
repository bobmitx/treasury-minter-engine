import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Confidence = "high" | "medium" | "low";

interface PriceResult {
  price: number;
  source: string;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// In-memory cache (60-second TTL)
// ---------------------------------------------------------------------------

let cachedPrice: number | null = null;
let cachedSource = "";
let cachedConfidence: Confidence = "low";
let cachedAt = 0;
const CACHE_TTL = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FALLBACK_PRICE = 0; // No hardcoded PLS price — return 0 if all sources fail
const TIMEOUT_MS = 5_000;
const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fetch call with a 5-second AbortController timeout. */
function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

/** Basic sanity check for a price value. */
function isValidPrice(v: number): boolean {
  return v > 0 && isFinite(v) && Number.isFinite(v);
}

// ---------------------------------------------------------------------------
// Source 1 — CoinGecko (primary, highest confidence)
// ---------------------------------------------------------------------------

async function fetchFromCoinGecko(): Promise<PriceResult | null> {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=pulsechain&vs_currencies=usd";
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const usd = data?.pulsechain?.usd;
    if (typeof usd === "number" && isValidPrice(usd)) {
      return { price: usd, source: "CoinGecko", confidence: "high" };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 2 — DexScreener (secondary, medium confidence)
//   Parses the first PLS/WPLS pair from search results.
// ---------------------------------------------------------------------------

async function fetchFromDexScreener(): Promise<PriceResult | null> {
  try {
    const url = "https://api.dexscreener.com/latest/dex/search?q=PLS";
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const pairs: unknown[] = data?.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) return null;

    // Look for the first pair that contains PLS or WPLS in its base/target
    for (const p of pairs) {
      const pair = p as Record<string, unknown>;
      const baseToken = pair?.baseToken as Record<string, unknown> | undefined;
      const quoteToken = pair?.quoteToken as Record<string, unknown> | undefined;
      const baseSymbol = String(baseToken?.symbol ?? "").toUpperCase();
      const quoteSymbol = String(quoteToken?.symbol ?? "").toUpperCase();

      const isPLSPair =
        baseSymbol === "PLS" ||
        baseSymbol === "WPLS" ||
        quoteSymbol === "PLS" ||
        quoteSymbol === "WPLS";

      if (isPLSPair && typeof pair.priceUsd === "string") {
        const price = parseFloat(pair.priceUsd);
        if (isValidPrice(price)) {
          return { price, source: "DexScreener", confidence: "medium" };
        }
      }
    }

    // Fallback: just use the first pair's price if no PLS pair found
    const firstPair = pairs[0] as Record<string, unknown>;
    if (typeof firstPair?.priceUsd === "string") {
      const price = parseFloat(firstPair.priceUsd);
      if (isValidPrice(price)) {
        return { price, source: "DexScreener", confidence: "medium" };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 3 — GeckoTerminal (tertiary, medium confidence)
// ---------------------------------------------------------------------------

async function fetchFromGeckoTerminal(): Promise<PriceResult | null> {
  try {
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/pulsechain/token_price/${WPLS_ADDRESS}`;
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const attrs = data?.data?.attributes;
    if (attrs?.token_prices && typeof attrs.token_prices === "object") {
      const priceStr = attrs.token_prices[WPLS_ADDRESS.toLowerCase()];
      if (priceStr) {
        const price = parseFloat(priceStr);
        if (isValidPrice(price)) {
          return { price, source: "GeckoTerminal", confidence: "medium" };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 4 — Hardcoded fallback (lowest confidence)
// ---------------------------------------------------------------------------

function getFallbackPrice(): PriceResult {
  return {
    price: FALLBACK_PRICE,
    source: "No live data",
    confidence: "low",
  };
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET() {
  const now = Date.now();

  // Return cached result while still fresh
  if (cachedPrice !== null && now - cachedAt < CACHE_TTL) {
    return NextResponse.json({
      price: cachedPrice,
      source: cachedSource,
      lastUpdated: cachedAt,
      confidence: cachedConfidence,
    });
  }

  // --- Try each source in priority order ---
  let result: PriceResult | null = null;

  // 1) CoinGecko (no API key required for basic usage)
  result = await fetchFromCoinGecko();

  // 2) DexScreener
  if (!result) {
    result = await fetchFromDexScreener();
  }

  // 3) GeckoTerminal
  if (!result) {
    result = await fetchFromGeckoTerminal();
  }

  // 4) Hardcoded fallback
  if (!result) {
    result = getFallbackPrice();
  }

  // Update cache
  cachedPrice = result.price;
  cachedSource = result.source;
  cachedConfidence = result.confidence;
  cachedAt = now;

  return NextResponse.json({
    price: result.price,
    source: result.source,
    lastUpdated: now,
    confidence: result.confidence,
  });
}
