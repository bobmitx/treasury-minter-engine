import { ethers, Contract } from "ethers";

const RPC_URL = "https://rpc.pulsechain.com/";
const T_BILL = "0x463413c579D29c26D59a65312657DFCe30D545A1";
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

// In-memory cache
let cache: {
  data: any;
  timestamp: number;
} | null = null;
const CACHE_TTL = 30_000; // 30 seconds

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return Response.json(cache.data);
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    // Fetch T-BILL info and PLS price in parallel
    const [plsPriceUSD, totalSupplyBN] = await Promise.all([
      getPLSPriceUSD(),
      new Contract(T_BILL, ERC20_ABI, provider).totalSupply(),
    ]);

    const totalSupply = parseFloat(ethers.utils.formatUnits(totalSupplyBN, 18));

    // Try to find T-BILL/WPLS LP pair on PulseX for real-time pricing
    let tbillPricePLS = 0;
    let tbillPriceUSD = 0;
    let lpReserves = null;
    let lpFound = false;

    try {
      const factory = new Contract(PULSEX_FACTORY, FACTORY_ABI, provider);
      const [addr1, addr2] =
        T_BILL.toLowerCase() < WPLS.toLowerCase()
          ? [T_BILL, WPLS]
          : [WPLS, T_BILL];
      const pairAddress = await factory.getPair(addr1, addr2);

      if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
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

        if (tbillFloat > 0) {
          tbillPricePLS = wplsFloat / tbillFloat;
          tbillPriceUSD = tbillPricePLS * plsPriceUSD;
          lpFound = true;
          lpReserves = {
            tbillReserve: tbillFloat,
            wplsReserve: wplsFloat,
            pairAddress,
          };
        }
      }
    } catch (e) {
      console.error("LP pair lookup failed:", e);
    }

    // Fallback price estimation
    if (!lpFound) {
      tbillPriceUSD = 0.00006972;
      tbillPricePLS = plsPriceUSD > 0 ? tbillPriceUSD / plsPriceUSD : 0;
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
      mintCostEstimateUSD: 0.00006972,
      lastUpdated: Date.now(),
      source: lpFound ? "pulsex-dex" : "fallback",
    };

    cache = { data, timestamp: Date.now() };
    return Response.json(data);
  } catch (error: any) {
    console.error("T-BILL info API error:", error);
    return Response.json(
      {
        success: false,
        tbillPriceUSD: 0.00006972,
        tbillPricePLS: 0,
        plsPriceUSD: 0,
        totalSupply: 0,
        totalSupplyFormatted: "0",
        lpFound: false,
        mintCostEstimateUSD: 0.00006972,
        lastUpdated: Date.now(),
        source: "error-fallback",
        error: error.message,
      },
      { status: 200 }
    );
  }
}

async function getPLSPriceUSD(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=pulse&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.pulse?.usd) return data.pulse.usd;
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

  return 0.000028;
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}
