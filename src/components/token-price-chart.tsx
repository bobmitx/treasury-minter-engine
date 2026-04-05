"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatUSD } from "@/lib/ethereum";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenPriceChartProps {
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice: number;
}

interface ChartDataPoint {
  day: string;
  price: number;
}

function generateMockPriceHistory(currentPrice: number, tokenAddress: string): ChartDataPoint[] {
  // Use tokenAddress as a seed-like value for deterministic noise per token
  const seed = parseInt(tokenAddress.slice(2, 10), 16) % 1000;
  const pseudoRandom = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 4973 + 7) * 49297;
    return x - Math.floor(x);
  };

  // Determine trend direction (slightly biased positive ~55%)
  const trendBias = seed % 100 < 55 ? 1 : -1;
  const trendStrength = 0.03 + pseudoRandom(0) * 0.07; // 3-10% change over 7 days

  const data: ChartDataPoint[] = [];
  const startPrice = currentPrice / (1 + trendBias * trendStrength);

  for (let i = 0; i < 7; i++) {
    // Interpolate from start to current with noise
    const progress = i / 6;
    const basePrice = startPrice + (currentPrice - startPrice) * progress;
    // Add random noise (±5% of base)
    const noise = (pseudoRandom(i + 10) - 0.5) * 0.1 * basePrice;
    const price = Math.max(0, basePrice + noise);

    data.push({
      day: `Day ${i + 1}`,
      price,
    });
  }

  // Ensure last point is exactly current price
  data[6].price = currentPrice;

  return data;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-xs text-white font-mono font-medium">
        {formatUSD(payload[0].value)}
      </p>
    </div>
  );
}

export function TokenPriceChart({
  tokenAddress,
  tokenSymbol,
  currentPrice,
}: TokenPriceChartProps) {
  const data = useMemo(
    () => generateMockPriceHistory(currentPrice, tokenAddress),
    [currentPrice, tokenAddress]
  );

  const startPrice = data[0].price;
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = startPrice > 0 ? (priceChange / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const strokeColor = isPositive ? "#34d399" : "#fb7185";
  const gradientId = `gradient-${tokenAddress.slice(2, 10)}`;

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
      {/* Header: period label + price change badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          Price History
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">7 Day</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono",
              isPositive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {priceChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={isPositive ? "#10b981" : "#f43f5e"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "#10b981" : "#f43f5e"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              dy={8}
            />
            <YAxis
              hide
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: strokeColor,
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: strokeColor,
                stroke: "#111827",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: start vs current price */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
        <div className="text-[10px] text-gray-500">
          <span className="block">7d ago</span>
          <span className="text-gray-300 font-mono">{formatUSD(startPrice)}</span>
        </div>
        <div className="text-[10px] text-gray-500 text-right">
          <span className="block">Now</span>
          <span
            className={cn(
              "font-mono font-medium",
              isPositive ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {formatUSD(currentPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}
