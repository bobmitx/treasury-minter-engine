"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfitIndicatorProps {
  ratio: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  /** Optional cost value in USD for tooltip breakdown */
  costUSD?: number;
  /** Optional revenue value in USD for tooltip breakdown */
  revenueUSD?: number;
}

export function ProfitIndicator({
  ratio,
  className,
  showLabel = true,
  size = "sm",
  animated = false,
  costUSD,
  revenueUSD,
}: ProfitIndicatorProps) {
  const isProfit = ratio > 1.0;
  const isSmall = size === "sm";
  const isLarge = size === "lg";
  // Compute pulse key as stable hash of ratio rounded to 4 decimals
  // This causes the element to re-mount when ratio changes, triggering CSS animations
  const pulseKey = Math.round(ratio * 10000);

  const indicator = (
    <div
      key={pulseKey}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-bold transition-all duration-300",
        isSmall ? "px-2 py-0.5 text-xs" : isLarge ? "px-3 py-1 text-lg" : "px-2.5 py-0.5 text-sm",
        isProfit
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        isProfit && animated && "glow-emerald-animated",
        !isProfit && animated && "glow-rose-animated",
        animated && "profit-shimmer-overlay",
        pulseKey > 0 && "animate-micro-pulse",
        className
      )}
    >
      {isProfit ? (
        <TrendingUp className={isSmall ? "h-3 w-3" : isLarge ? "h-5 w-5" : "h-4 w-4"} />
      ) : (
        <TrendingDown className={isSmall ? "h-3 w-3" : isLarge ? "h-5 w-5" : "h-4 w-4"} />
      )}
      <span className={cn(isProfit && animated && "text-glow-emerald-animated")}>
        {ratio.toFixed(2)}x
      </span>
      {showLabel && (
        <span className="text-gray-500 font-normal ml-1">
          {isProfit ? "profit" : "loss"}
        </span>
      )}
    </div>
  );

  // If we have cost/revenue data, wrap in a detailed tooltip
  if (costUSD !== undefined && revenueUSD !== undefined) {
    const pnl = revenueUSD - costUSD;
    const pnlPercent = costUSD > 0 ? ((pnl / costUSD) * 100) : 0;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent side="top" className="profit-tooltip max-w-[220px]">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-white">Profit Breakdown</p>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Mint Cost</span>
              <span className="text-white font-mono">${costUSD.toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Revenue</span>
              <span className="text-white font-mono">${revenueUSD.toFixed(6)}</span>
            </div>
            <div className="border-t border-gray-700/50 pt-1 flex justify-between text-[11px]">
              <span className="text-gray-400">P&amp;L</span>
              <span className={cn("font-mono font-semibold", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {pnl >= 0 ? "+" : ""}{pnl.toFixed(6)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return indicator;
}

interface ProfitBadgeProps {
  ratio: number;
  className?: string;
  animated?: boolean;
}

export function ProfitBadge({ ratio, className, animated = false }: ProfitBadgeProps) {
  const isProfit = ratio > 1.0;
  // Compute pulse key as stable hash of ratio rounded to 4 decimals
  const pulseKey = Math.round(ratio * 10000);

  return (
    <span
      key={pulseKey}
      className={cn(
        "inline-flex items-center font-mono font-semibold transition-all duration-300",
        isProfit ? "text-emerald-400" : "text-rose-400",
        isProfit && animated && "text-glow-emerald-animated",
        pulseKey > 0 && "animate-micro-pulse",
        className
      )}
    >
      {ratio.toFixed(2)}x
    </span>
  );
}
