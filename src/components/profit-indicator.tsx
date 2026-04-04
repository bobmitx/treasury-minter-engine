"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitIndicatorProps {
  ratio: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProfitIndicator({
  ratio,
  className,
  showLabel = true,
  size = "md",
  animated = false,
}: ProfitIndicatorProps) {
  const isProfit = ratio > 1.0;
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-bold transition-all duration-300",
        isSmall ? "px-2 py-0.5 text-xs" : isLarge ? "px-3 py-1 text-lg" : "px-2.5 py-0.5 text-sm",
        isProfit
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        isProfit && animated && "glow-emerald-animated",
        !isProfit && animated && "glow-rose-animated",
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
}

interface ProfitBadgeProps {
  ratio: number;
  className?: string;
  animated?: boolean;
}

export function ProfitBadge({ ratio, className, animated = false }: ProfitBadgeProps) {
  const isProfit = ratio > 1.0;

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-semibold transition-all duration-300",
        isProfit ? "text-emerald-400" : "text-rose-400",
        isProfit && animated && "text-glow-emerald-animated",
        className
      )}
    >
      {ratio.toFixed(2)}x
    </span>
  );
}
