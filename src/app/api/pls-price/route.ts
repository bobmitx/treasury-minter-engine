import { NextResponse } from "next/server";

// In-memory cache
let cachedPrice: number | null = null;
let cachedSource = "";
let cachedAt = 0;
const CACHE_TTL = 60_000; // 60 seconds

const FALLBACK_PRICE = 0.000028;
const PLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27";

async function fetchFromCoinGecko(): Promise<{ price: number; source: string } | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=pulse&vs_currencies=usd",
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.pulse?.usd && typeof data.pulse.usd === "number") {
      return { price: data.pulse.usd, source: "CoinGecko" };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromDexScreener(): Promise<{ price: number; source: string } | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${PLS_ADDRESS}`,
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
      const pair = data.pairs[0];
      if (pair?.priceUsd && typeof pair.priceUsd === "string") {
        const price = parseFloat(pair.priceUsd);
        if (price > 0 && isFinite(price)) {
          return { price, source: "DexScreener" };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached price if still valid
  if (cachedPrice !== null && (now - cachedAt) < CACHE_TTL) {
    return NextResponse.json({
      price: cachedPrice,
      source: cachedSource,
      lastUpdated: cachedAt,
    });
  }

  // Try CoinGecko first
  let result = await fetchFromCoinGecko();

  // Fallback to DexScreener
  if (!result) {
    result = await fetchFromDexScreener();
  }

  // Final fallback
  if (!result) {
    result = { price: FALLBACK_PRICE, source: "Fallback" };
  }

  // Update cache
  cachedPrice = result.price;
  cachedSource = result.source;
  cachedAt = now;

  return NextResponse.json({
    price: result.price,
    source: result.source,
    lastUpdated: now,
  });
}
