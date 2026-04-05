import { NextRequest, NextResponse } from "next/server";
import {
  previewMultiHop,
  discoverMintingChain,
  discoverAndPreview,
  calculateTotalMultiplier,
  canMintFromTo,
} from "@/lib/ethereum";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sourceToken, targetToken, targetAmount } = body;

    if (!sourceToken || !targetToken) {
      return NextResponse.json(
        { success: false, error: "sourceToken and targetToken are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "preview": {
        if (!targetAmount) {
          return NextResponse.json(
            { success: false, error: "targetAmount is required for preview" },
            { status: 400 }
          );
        }
        const preview = await previewMultiHop(
          targetToken,
          targetAmount,
          sourceToken
        );
        return NextResponse.json({ success: true, data: preview });
      }

      case "discover": {
        const chain = await discoverMintingChain(sourceToken, targetToken);
        return NextResponse.json({ success: true, data: { mintingChain: chain } });
      }

      case "discoverAndPreview": {
        if (!targetAmount) {
          return NextResponse.json(
            {
              success: false,
              error: "targetAmount is required for discoverAndPreview",
            },
            { status: 400 }
          );
        }
        const result = await discoverAndPreview(
          sourceToken,
          targetToken,
          targetAmount
        );
        return NextResponse.json({ success: true, data: result });
      }

      case "totalMultiplier": {
        if (!targetAmount) {
          return NextResponse.json(
            {
              success: false,
              error: "targetAmount is required for totalMultiplier",
            },
            { status: 400 }
          );
        }
        const multiplier = await calculateTotalMultiplier(
          sourceToken,
          targetToken,
          targetAmount
        );
        return NextResponse.json({ success: true, data: { totalMultiplier: multiplier } });
      }

      case "canMint": {
        const result = await canMintFromTo(sourceToken, targetToken);
        return NextResponse.json({ success: true, data: result });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("MultiHop API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute multihop operation",
      },
      { status: 500 }
    );
  }
}
