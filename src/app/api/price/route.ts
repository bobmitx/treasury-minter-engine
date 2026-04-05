import { NextRequest, NextResponse } from "next/server";
import {
  getProvider,
  getPLSPriceInUSD,
  getTokenPrice,
  getMintCost,
  getMultiplier,
  getV4Multiplier,
  getTokenInfo,
} from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get("token");

    const plsPrice = await getPLSPriceInUSD();
    const { price: mintCost, isLive: mintCostIsLive, source: mintCostSource } = await getMintCost();

    if (tokenAddress) {
      // Get specific token data
      const [price, info, multiplier] = await Promise.all([
        getTokenPrice(tokenAddress),
        getTokenInfo(tokenAddress),
        getMultiplier(tokenAddress, 1),
      ]);

      const profitRatio = mintCost > 0 ? price.priceUSD / mintCost : 0;

      return NextResponse.json({
        success: true,
        data: {
          plsPriceUSD: plsPrice,
          mintCostUSD: mintCost,
          mintCostIsLive,
          mintCostSource,
          token: {
            address: tokenAddress,
            name: info.name,
            symbol: info.symbol,
            decimals: info.decimals,
            priceUSD: price.priceUSD,
            pricePLS: price.pricePLS,
            multiplier,
            profitRatio,
          },
          timestamp: Date.now(),
        },
      });
    }

    // Get system-wide price data
    const systemTokens = [
      { address: CONTRACTS.eDAI, label: "eDAI" },
      { address: CONTRACTS.mvToken, label: "MV Token" },
      { address: CONTRACTS.tbill, label: "T-BILL" },
      { address: CONTRACTS.fed, label: "FED" },
      { address: CONTRACTS.wPLS, label: "WPLS" },
    ];

    const tokenData = await Promise.allSettled(
      systemTokens.map(async (t) => {
        const [price, info, multiplier] = await Promise.all([
          getTokenPrice(t.address),
          getTokenInfo(t.address),
          getMultiplier(t.address, 1),
        ]);
        return {
          ...t,
          ...info,
          priceUSD: price.priceUSD,
          pricePLS: price.pricePLS,
          multiplier,
          profitRatio: mintCost > 0 ? price.priceUSD / mintCost : 0,
        };
      })
    );

    const tokens = tokenData
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({
      success: true,
      data: {
        plsPriceUSD: plsPrice,
        mintCostUSD: mintCost,
        mintCostIsLive,
        mintCostSource,
        tokens,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error("Price API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch price data",
      },
      { status: 500 }
    );
  }
}
