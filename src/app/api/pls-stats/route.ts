import { NextResponse } from "next/server";

interface PLSStats {
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  circulatingSupply: number;
  price: number;
  lastUpdated: string;
  source: string;
}

// In-memory cache with 120-second TTL
let cachedStats: PLSStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 120_000; // 120 seconds

const FALLBACK_STATS: PLSStats = {
  marketCap: 56_682_676,
  volume24h: 162_593,
  priceChange24h: 2.27,
  circulatingSupply: 7_770_816_899_027,
  price: 0.00020136,
  lastUpdated: new Date().toISOString(),
  source: "fallback",
};

export async function GET() {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedStats && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedStats);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    // Use DexScreener for reliable PLS data
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`DexScreener API returned status ${res.status}`);
      return NextResponse.json(cachedStats ?? FALLBACK_STATS);
    }

    const data = await res.json();
    const pair = data?.pairs?.[0];

    if (!pair) {
      console.error("DexScreener API returned unexpected data format");
      return NextResponse.json(cachedStats ?? FALLBACK_STATS);
    }

    const stats: PLSStats = {
      marketCap: pair.marketCap ?? 0,
      volume24h: pair.volume?.h24 ?? 0,
      priceChange24h: pair.priceChange?.h24 ?? 0,
      circulatingSupply: pair.fdv ?? 0, // FDV as proxy for circulating supply
      price: parseFloat(pair.priceUsd ?? "0"),
      lastUpdated: new Date().toISOString(),
      source: "DexScreener",
    };

    // Update cache
    cachedStats = stats;
    cacheTimestamp = now;

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch PLS stats:", error);

    // Return stale cache if available
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    return NextResponse.json(FALLBACK_STATS);
  }
}
