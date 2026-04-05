import { ethers, Contract } from "ethers";

const RPC_URL = "https://rpc.pulsechain.com/";
const T_BILL = "0x463413c579D29c26D59a65312657DFCe30D545A1";
const WPLS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27";
const PULSEX_FACTORY = "0x1715a3E4A142d8b698131108995174F37aEBA10D";
const ESTIMATED_TOTAL_SUPPLY = 1_100_000_000; // ~1.1B T-BILL

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

const PAIR_ABI = [
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
];

const FACTORY_ABI = [
  "function getPair(address, address) view returns (address)",
];

// In-memory cache
let cache: {
  data: any;
  timestamp: number;
} | null = null;
const CACHE_TTL = 30_000; // 30 seconds

const TIMEOUT_MS = 8_000;

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

// ── Source 1: DexScreener — T-BILL token price (most reliable from sandbox) ──
async function fetchTBillFromDexScreener(): Promise<{
  priceUSD: number;
  pricePLS: number | null;
  source: string;
} | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${T_BILL}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const pairs = data?.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) return null;

    // Find the best pair (highest liquidity, preferably T-BILL/WPLS)
    let bestPair = pairs[0];
    let bestLiquidity = 0;
    for (const p of pairs) {
      const liq = parseFloat(p.liquidity?.usd || "0");
      if (liq > bestLiquidity) {
        bestLiquidity = liq;
        bestPair = p;
      }
    }

    const priceUsd = bestPair.priceUsd
      ? parseFloat(bestPair.priceUsd)
      : bestPair.priceNative
      ? parseFloat(bestPair.priceNative)
      : 0;

    if (!priceUsd || priceUsd <= 0) return null;

    // Try to get PLS price from the same pair if it's T-BILL/WPLS
    let pricePLS: number | null = null;
    if (bestPair.baseToken?.address?.toLowerCase() === WPLS.toLowerCase() ||
        bestPair.quoteToken?.address?.toLowerCase() === WPLS.toLowerCase()) {
      pricePLS = priceUsd; // If denom is PLS, pricePLS = priceUSD / plsPriceUSD
    }

    return {
      priceUSD: priceUsd,
      pricePLS,
      source: `DexScreener (${bestPair.dexId || bestPair.pairAddress?.slice(0, 8)})`,
    };
  } catch {
    return null;
  }
}

// ── Source 2: GeckoTerminal — T-BILL on PulseChain ──
async function fetchTBillFromGeckoTerminal(): Promise<{
  priceUSD: number;
  source: string;
} | null> {
  try {
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/pulsechain/token_price/${T_BILL}`;
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const attrs = data?.data?.attributes;
    if (attrs?.token_prices && typeof attrs.token_prices === "object") {
      const priceStr = attrs.token_prices[T_BILL.toLowerCase()];
      if (priceStr) {
        const price = parseFloat(priceStr);
        if (price > 0) {
          return { priceUSD: price, source: "GeckoTerminal" };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ── Source 3: PulseX LP — On-chain T-BILL/WPLS pair reserves ──
async function fetchTBillFromPulseXLP(
  provider: ethers.providers.JsonRpcProvider,
  plsPriceUSD: number
): Promise<{
  priceUSD: number;
  pricePLS: number;
  totalSupply: number;
  reserves: any;
  source: string;
} | null> {
  try {
    const factory = new Contract(PULSEX_FACTORY, FACTORY_ABI, provider);
    const [addr1, addr2] =
      T_BILL.toLowerCase() < WPLS.toLowerCase()
        ? [T_BILL, WPLS]
        : [WPLS, T_BILL];
    const pairAddress = await factory.getPair(addr1, addr2);

    if (!pairAddress || pairAddress === ethers.constants.AddressZero) return null;

    const pair = new Contract(pairAddress, PAIR_ABI, provider);
    const [token0, reserves] = await Promise.all([
      pair.token0(),
      pair.getReserves(),
    ]);

    const r0 = reserves[0];
    const r1 = reserves[1];

    let tbillReserve: ethers.BigNumber;
    let wplsReserve: ethers.BigNumber;

    if (token0.toLowerCase() === T_BILL.toLowerCase()) {
      tbillReserve = r0;
      wplsReserve = r1;
    } else {
      wplsReserve = r0;
      tbillReserve = r1;
    }

    const tbillFloat = parseFloat(ethers.utils.formatUnits(tbillReserve, 18));
    const wplsFloat = parseFloat(ethers.utils.formatUnits(wplsReserve, 18));

    if (tbillFloat <= 0) return null;

    const pricePLS = wplsFloat / tbillFloat;
    const priceUSD = pricePLS * plsPriceUSD;

    return {
      priceUSD,
      pricePLS,
      totalSupply: 0, // will be fetched separately
      reserves: {
        tbillReserve: tbillFloat,
        wplsReserve: wplsFloat,
        pairAddress,
      },
      source: "PulseX LP (on-chain)",
    };
  } catch {
    return null;
  }
}

// ── PLS Price ──
async function getPLSPriceUSD(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=pulsechain&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.pulsechain?.usd) return data.pulsechain.usd;
    }
  } catch {}

  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.pairs?.[0]?.priceUsd) {
        return parseFloat(data.pairs[0].priceUsd);
      }
    }
  } catch {}

  return 0; // no live PLS price available
}

// ── Formatters ──
function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET handler
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return Response.json(cache.data);
    }

    // ── Step 1: Get PLS price and external T-BILL price in parallel ──
    const [plsPriceUSD, dexScreenerResult, geckoTerminalResult] = await Promise.all([
      getPLSPriceUSD(),
      fetchTBillFromDexScreener(),
      fetchTBillFromGeckoTerminal(),
    ]);

    // Pick best external price
    let tbillPriceUSD = 0;
    let priceSource = "fallback";

    if (dexScreenerResult && dexScreenerResult.priceUSD > 0) {
      tbillPriceUSD = dexScreenerResult.priceUSD;
      priceSource = dexScreenerResult.source;
    } else if (geckoTerminalResult && geckoTerminalResult.priceUSD > 0) {
      tbillPriceUSD = geckoTerminalResult.priceUSD;
      priceSource = geckoTerminalResult.source;
    }

    // ── Step 2: Try on-chain LP as secondary/validation source ──
    let tbillPricePLS = 0;
    let lpReserves = null;
    let lpFound = false;
    let totalSupply = ESTIMATED_TOTAL_SUPPLY; // default estimate

    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

      // Fetch total supply and LP price in parallel
      const [lpResult, totalSupplyBN] = await Promise.all([
        fetchTBillFromPulseXLP(provider, plsPriceUSD),
        new Contract(T_BILL, ERC20_ABI, provider).totalSupply().catch(() => null),
      ]);

      if (totalSupplyBN) {
        totalSupply = parseFloat(ethers.utils.formatUnits(totalSupplyBN, 18));
      }

      if (lpResult) {
        // If external source failed but LP worked, use LP price
        if (tbillPriceUSD <= 0) {
          tbillPriceUSD = lpResult.priceUSD;
          priceSource = lpResult.source;
        }
        tbillPricePLS = lpResult.pricePLS;
        lpReserves = lpResult.reserves;
        lpFound = true;
      }
    } catch {
      // RPC unavailable (sandbox) — already have external price
    }

    // If we still don't have a PLS price for T-BILL, derive it
    if (tbillPricePLS <= 0 && tbillPriceUSD > 0 && plsPriceUSD > 0) {
      tbillPricePLS = tbillPriceUSD / plsPriceUSD;
    }

    // Absolute fallback — do NOT fake a price; return 0 and mark isLive=false
    let isLive = tbillPriceUSD > 0;
    if (tbillPriceUSD <= 0) {
      tbillPriceUSD = 0;
      tbillPricePLS = 0;
      priceSource = "no-live-data";
    }

    const data = {
      success: true,
      tbillPriceUSD,
      tbillPricePLS,
      plsPriceUSD,
      totalSupply,
      totalSupplyFormatted: formatLargeNumber(totalSupply),
      lpFound,
      lpReserves,
      mintCostEstimateUSD: tbillPriceUSD,
      lastUpdated: Date.now(),
      source: priceSource,
      isLive,
    };

    cache = { data, timestamp: Date.now() };
    return Response.json(data);
  } catch (error: any) {
    console.error("T-BILL info API error:", error);
    // On error: return 0 prices (never fake) and mark isLive=false
    return Response.json(
      {
        success: false,
        tbillPriceUSD: 0,
        tbillPricePLS: 0,
        plsPriceUSD: 0,
        totalSupply: ESTIMATED_TOTAL_SUPPLY,
        totalSupplyFormatted: "~1.10B",
        lpFound: false,
        mintCostEstimateUSD: 0,
        lastUpdated: Date.now(),
        source: "error",
        isLive: false,
        error: error.message,
      },
      { status: 200 }
    );
  }
}
