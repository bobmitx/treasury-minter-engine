import { NextResponse } from "next/server";
import { getV4SystemInfo } from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";

export async function GET() {
  try {
    const systemInfo = await getV4SystemInfo(CONTRACTS.v4PersonalMinter);

    return NextResponse.json({
      success: true,
      data: {
        v4PersonalMinter: CONTRACTS.v4PersonalMinter,
        v3IndexMinter: CONTRACTS.v3IndexMinter,
        multiHop: CONTRACTS.multiHop,
        ...systemInfo,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error("System API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch system data",
      },
      { status: 500 }
    );
  }
}
