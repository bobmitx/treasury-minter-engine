import { NextResponse } from "next/server";

const RPC_URL = "https://rpc.pulsechain.com/";
const CACHE_TTL = 10_000; // 10 seconds
const RPC_TIMEOUT = 5_000; // 5 seconds

interface NetworkStats {
  blockHeight: number;
  gasPrice: number; // Gwei
  gasPriceGwei: number;
  plsPrice: number;
  syncStatus: boolean;
  activeAddresses: number;
  tps: number;
  blockTime: number; // seconds
  blockTimestamp: number;
  lastUpdated: number;
}

let cachedData: NetworkStats | null = null;
let cacheTimestamp = 0;

async function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT);

  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: 1,
      }),
      signal: controller.signal,
    });
    const json = await res.json();
    return json.result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchNetworkStats(): Promise<NetworkStats> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  try {
    // Fire all independent RPC calls in parallel
    const [blockNumberHex, gasPriceHex, syncingResult, prevBlockHex] = await Promise.all([
      rpcCall("eth_blockNumber"),
      rpcCall("eth_gasPrice"),
      rpcCall("eth_syncing"),
      // Also get previous block for block time calculation
      rpcCall("eth_blockNumber").then((hex) => {
        const num = parseInt(hex as string, 16);
        return num > 0 ? rpcCall("eth_getBlockByNumber", ["0x" + (num - 1).toString(16), false]) : null;
      }),
    ]);

    const blockNumber = parseInt(blockNumberHex as string, 16);
    const gasPriceWei = parseInt(gasPriceHex as string, 16);
    const gasPriceGwei = Math.round(gasPriceWei / 1e9);

    // Determine sync status
    const syncStatus = syncingResult === false;

    // Get current block with transactions for TPS and active addresses
    const currentBlock = await rpcCall("eth_getBlockByNumber", [
      blockNumberHex as string,
      true, // with transactions
    ]) as Record<string, unknown> | null;

    const prevBlock = prevBlockHex as Record<string, unknown> | null;

    // Calculate block time
    let blockTime = 10; // default 10s for PulseChain
    if (currentBlock && prevBlock) {
      const currentTs = parseInt(currentBlock.timestamp as string, 16);
      const prevTs = parseInt(prevBlock.timestamp as string, 16);
      if (currentTs > prevTs) {
        blockTime = currentTs - prevTs;
      }
    }

    // Extract transaction count and unique addresses from current block
    let tps = 0;
    let activeAddresses = 0;
    if (currentBlock && Array.isArray(currentBlock.transactions)) {
      const txCount = (currentBlock.transactions as unknown[]).length;
      tps = blockTime > 0 ? Math.round((txCount / blockTime) * 10) / 10 : txCount;

      // Count unique addresses (from + to)
      const addrSet = new Set<string>();
      for (const tx of currentBlock.transactions as Array<Record<string, unknown>>) {
        if (tx.from) addrSet.add(tx.from as string);
        if (tx.to) addrSet.add(tx.to as string);
      }
      activeAddresses = addrSet.size;
    }

    // Try to get PLS price from the pls-price API (internal call)
    let plsPrice = 0;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const priceRes = await fetch(`${baseUrl}/api/pls-price`, {
        signal: AbortSignal.timeout(3000),
      });
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        if (priceData.price) {
          plsPrice = priceData.price;
        }
      }
    } catch {
      // PLS price fetch failed, use 0
    }

    cachedData = {
      blockHeight: blockNumber,
      gasPrice: gasPriceWei,
      gasPriceGwei,
      plsPrice,
      syncStatus,
      activeAddresses,
      tps,
      blockTime,
      blockTimestamp: currentBlock
        ? parseInt(currentBlock.timestamp as string, 16) * 1000
        : now,
      lastUpdated: now,
    };
    cacheTimestamp = now;

    return cachedData;
  } catch {
    // Return stale cache if available
    if (cachedData) {
      return cachedData;
    }

    // Absolute fallback
    return {
      blockHeight: 0,
      gasPrice: 0,
      gasPriceGwei: 0,
      plsPrice: 0,
      syncStatus: false,
      activeAddresses: 0,
      tps: 0,
      blockTime: 10,
      blockTimestamp: 0,
      lastUpdated: now,
    };
  }
}

export async function GET() {
  const data = await fetchNetworkStats();
  return NextResponse.json(data);
}
