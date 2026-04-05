import { ethers, Contract } from "ethers";

const RPC_URL = "https://rpc.pulsechain.com/";
const WPLS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27";
const PULSEX_FACTORY = "0x1715a3E4A142d8b698131108995174F37aEBA10D";

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

// In-memory cache per token address
const cache = new Map<string, { data: any; timestamp: number }>();
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

// ── Fetch PLS price via CoinGecko / DexScreener ──
async function getPLSPriceUSD(): Promise<number> {
  try {
    const res = await fetchWithTimeout(
      "https://api.coingecko.com/api/v3/simple/price?ids=pulsechain&vs_currencies=usd"
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.pulsechain?.usd) return data.pulsechain.usd;
    }
  } catch {}

  try {
    const res = await fetchWithTimeout(
      "https://api.dexscreener.com/latest/dex/tokens/0xA1077a294dDE1B09bB078844df40758a5D0f9a27"
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.pairs?.[0]?.priceUsd) {
        return parseFloat(data.pairs[0].priceUsd);
      }
    }
  } catch {}

  return 0;
}

// ── Fetch token price from DexScreener ──
async function fetchPriceFromDexScreener(
  tokenAddress: string
): Promise<{ priceUSD: number; source: string } | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const pairs = data?.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) return null;

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

    return {
      priceUSD: priceUsd,
      source: `DexScreener (${bestPair.dexId || bestPair.pairAddress?.slice(0, 8)})`,
    };
  } catch {
    return null;
  }
}

// ── Fetch token price from on-chain LP reserves ──
async function fetchPriceFromLP(
  provider: ethers.providers.JsonRpcProvider,
  tokenAddress: string,
  plsPriceUSD: number
): Promise<{ priceUSD: number; pricePLS: number; source: string } | null> {
  try {
    if (tokenAddress.toLowerCase() === WPLS.toLowerCase()) {
      return { priceUSD: plsPriceUSD, pricePLS: 1, source: "Native PLS" };
    }

    const factory = new Contract(PULSEX_FACTORY, FACTORY_ABI, provider);
    const [addr1, addr2] =
      tokenAddress.toLowerCase() < WPLS.toLowerCase()
        ? [tokenAddress, WPLS]
        : [WPLS, tokenAddress];

    const pairAddress = await factory.getPair(addr1, addr2);
    if (!pairAddress || pairAddress === ethers.constants.AddressZero) return null;

    const pair = new Contract(pairAddress, PAIR_ABI, provider);
    const [token0, reserves] = await Promise.all([
      pair.token0(),
      pair.getReserves(),
    ]);

    const r0 = reserves[0];
    const r1 = reserves[1];

    let tokenReserve: ethers.BigNumber;
    let wplsReserve: ethers.BigNumber;

    if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
      tokenReserve = r0;
      wplsReserve = r1;
    } else {
      wplsReserve = r0;
      tokenReserve = r1;
    }

    const tokenFloat = parseFloat(ethers.utils.formatUnits(tokenReserve, 18));
    const wplsFloat = parseFloat(ethers.utils.formatUnits(wplsReserve, 18));

    if (tokenFloat <= 0) return null;

    const pricePLS = wplsFloat / tokenFloat;
    const priceUSD = pricePLS * plsPriceUSD;

    return {
      priceUSD,
      pricePLS,
      source: "PulseX LP (on-chain)",
    };
  } catch {
    return null;
  }
}

// ── Formatters ──
function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET handler — fetch on-chain data for any token
// Query params: address (required)
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get("address");

    if (!tokenAddress || !ethers.utils.isAddress(tokenAddress)) {
      return Response.json(
        { success: false, error: "Valid token address required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = tokenAddress.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data);
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    // Fetch on-chain data in parallel
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);

    const [totalSupplyBN, name, symbol, decimals] = await Promise.all([
      tokenContract.totalSupply().catch(() => null),
      tokenContract.name().catch(() => "Unknown"),
      tokenContract.symbol().catch(() => "???"),
      tokenContract.decimals().catch(() => 18),
    ]);

    const totalSupply = totalSupplyBN
      ? parseFloat(ethers.utils.formatUnits(totalSupplyBN, decimals))
      : 0;

    // Fallback: known token supplies if on-chain fetch returned 0
    const KNOWN_SUPPLIES: Record<string, number> = {
      "0x463413c579d29c26d59a65312657dfce30d545a1": 1_100_000_000, // T-BILL
      "0x1d177cb9efeea49a8b97ab1c72785a3a37abc9ff": 1_000_000_000, // FED
      "0xefd766ccb38eeaf1dfd701853bfce31359239f305": 100_000_000,  // eDAI
      "0xa1077a294dde1b09bb078844df40758a5d0f9a27": 32_000_000,   // WPLS
    };
    const finalSupply = totalSupply > 0 ? totalSupply : (KNOWN_SUPPLIES[cacheKey] || 0);

    // Fetch PLS price and DexScreener in parallel first
    const [plsPriceUSD, dexScreenerResult] = await Promise.all([
      getPLSPriceUSD(),
      fetchPriceFromDexScreener(tokenAddress),
    ]);

    // Then fetch LP price (needs plsPriceUSD)
    const lpResult = await fetchPriceFromLP(provider, tokenAddress, plsPriceUSD);

    // Pick best price source: DexScreener > LP > 0
    let priceUSD = 0;
    let pricePLS = 0;
    let priceSource = "no-data";

    if (dexScreenerResult && dexScreenerResult.priceUSD > 0) {
      priceUSD = dexScreenerResult.priceUSD;
      priceSource = dexScreenerResult.source;
    }
    if (lpResult && lpResult.priceUSD > 0) {
      if (priceUSD <= 0) {
        priceUSD = lpResult.priceUSD;
        priceSource = lpResult.source;
      }
      if (lpResult.pricePLS > 0) {
        pricePLS = lpResult.pricePLS;
      }
    }

    // Derive PLS price if not from LP
    if (pricePLS <= 0 && priceUSD > 0 && plsPriceUSD > 0) {
      pricePLS = priceUSD / plsPriceUSD;
    }

    const isLive = priceUSD > 0;
    const data = {
      success: true,
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply: finalSupply,
      totalSupplyFormatted: formatLargeNumber(finalSupply),
      priceUSD,
      pricePLS,
      plsPriceUSD,
      isLive,
      source: priceSource,
      lastUpdated: Date.now(),
    };

    // Cache the result
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return Response.json(data);
  } catch (error: any) {
    console.error("Token data API error:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
        address: "",
        name: "Unknown",
        symbol: "???",
        decimals: 18,
        totalSupply: 0,
        totalSupplyFormatted: "0",
        priceUSD: 0,
        pricePLS: 0,
        plsPriceUSD: 0,
        isLive: false,
        source: "error",
        lastUpdated: Date.now(),
      },
      { status: 200 }
    );
  }
}
