import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rpcUrl = "https://rpc.pulsechain.com/";

    // Fetch current gas price via eth_gasPrice
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_gasPrice",
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    const gasPriceHex = data.result;
    const gasPriceWei = parseInt(gasPriceHex, 16);
    const gasPriceGwei = gasPriceWei / 1e9;

    // Simulate fast/standard/slow tiers based on current gas
    const fast = Math.round(gasPriceGwei * 1.5 * 100) / 100;
    const standard = Math.round(gasPriceGwei * 100) / 100;
    const slow = Math.round(gasPriceGwei * 0.6 * 100) / 100;

    return NextResponse.json({
      fast,
      standard,
      slow,
      baseGwei: gasPriceGwei,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    // Return fallback data
    return NextResponse.json({
      fast: 30,
      standard: 20,
      slow: 12,
      baseGwei: 20,
      lastUpdated: Date.now(),
    });
  }
}
