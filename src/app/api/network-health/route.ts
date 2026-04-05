import { NextResponse } from "next/server";

const RPC_URL = "https://rpc.pulsechain.com/";
const CACHE_TTL = 15_000; // 15 seconds

interface NetworkHealthData {
  blockNumber: number;
  syncStatus: boolean;
  latency: number;
  lastUpdated: number;
}

let cachedData: NetworkHealthData | null = null;
let cacheTimestamp = 0;

async function fetchNetworkHealth(): Promise<NetworkHealthData> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  try {
    const startTime = performance.now();

    // Fire both RPC calls in parallel
    const [blockNumberRes, syncingRes] = await Promise.all([
      fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      }),
      fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_syncing",
          params: [],
          id: 2,
        }),
      }),
    ]);

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    const blockNumberJson = await blockNumberRes.json();
    const syncingJson = await syncingRes.json();

    // Convert hex block number to decimal
    const blockNumberHex = blockNumberJson.result as string;
    const blockNumber = parseInt(blockNumberHex, 16);

    // Determine sync status
    // eth_syncing returns false (boolean) when synced, or an object with sync progress
    const syncingResult = syncingJson.result;
    const syncStatus = syncingResult === false;

    cachedData = {
      blockNumber,
      syncStatus,
      latency,
      lastUpdated: now,
    };
    cacheTimestamp = now;

    return cachedData;
  } catch {
    // Return stale cache if available, otherwise fallback
    if (cachedData) {
      return cachedData;
    }

    return {
      blockNumber: 0,
      syncStatus: false,
      latency: -1,
      lastUpdated: now,
    };
  }
}

export async function GET() {
  const data = await fetchNetworkHealth();
  return NextResponse.json(data);
}
