"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitIndicatorProps {
  ratio: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProfitIndicator({
  ratio,
  className,
  showLabel = true,
  size = "md",
}: ProfitIndicatorProps) {
  const isProfit = ratio > 1.0;
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-bold",
        isSmall ? "px-2 py-0.5 text-xs" : isLarge ? "px-3 py-1 text-lg" : "px-2.5 py-0.5 text-sm",
        isProfit
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        className
      )}
    >
      {isProfit ? (
        <TrendingUp className={isSmall ? "h-3 w-3" : isLarge ? "h-5 w-5" : "h-4 w-4"} />
      ) : (
        <TrendingDown className={isSmall ? "h-3 w-3" : isLarge ? "h-5 w-5" : "h-4 w-4"} />
      )}
      <span>
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
}

export function ProfitBadge({ ratio, className }: ProfitBadgeProps) {
  const isProfit = ratio > 1.0;

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-semibold",
        isProfit ? "text-emerald-400" : "text-rose-400",
        className
      )}
    >
      {ratio.toFixed(2)}x
    </span>
  );
}
