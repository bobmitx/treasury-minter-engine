import { NextResponse } from "next/server";

// Standard gas units for common transaction types
const STANDARD_TX_GAS = 21000;
const MINT_TX_GAS = 150000;

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

    // Calculate cost in PLS for standard transaction types
    // PLS has 18 decimals, so: gasPrice (wei) * gasUnits / 1e18 = cost in PLS
    const standardTxCostPLS = (gasPriceWei * STANDARD_TX_GAS) / 1e18;
    const mintTxCostPLS = (gasPriceWei * MINT_TX_GAS) / 1e18;

    // Simulate fast/standard/slow tiers
    const fastCostPLS = Math.round(standardTxCostPLS * 1.5 * 1e6) / 1e6;
    const standardCostPLS = Math.round(standardTxCostPLS * 1e6) / 1e6;
    const slowCostPLS = Math.round(standardTxCostPLS * 0.6 * 1e6) / 1e6;
    const fastMintCostPLS = Math.round(mintTxCostPLS * 1.5 * 1e6) / 1e6;
    const mintCostPLS = Math.round(mintTxCostPLS * 1e6) / 1e6;

    return NextResponse.json({
      // PLS cost for a standard 21K gas transaction (transfer, approve, etc.)
      fast: fastCostPLS,
      standard: standardCostPLS,
      slow: slowCostPLS,
      // PLS cost for a mint transaction (~150K gas)
      mintFast: fastMintCostPLS,
      mintStandard: mintCostPLS,
      // Raw gas data for advanced users
      gasPriceGwei: Math.round(gasPriceGwei),
      gasPriceWei,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    // Return fallback data in PLS terms
    return NextResponse.json({
      fast: 30,
      standard: 20,
      slow: 12,
      mintFast: 200,
      mintStandard: 150,
      gasPriceGwei: 800000,
      gasPriceWei: 800000000000000,
      lastUpdated: Date.now(),
    });
  }
}
