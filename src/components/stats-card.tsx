"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "bg-gray-900 border-gray-800/70 card-hover gradient-border",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm text-gray-400 truncate">{title}</p>
            <p className="text-xl font-bold text-white truncate number-animate">{value}</p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-1">
                {trend && trend !== "neutral" && (
                  <span
                    className={cn("flex items-center text-xs", {
                      "text-emerald-400": trend === "up",
                      "text-rose-400": trend === "down",
                    })}
                  >
                    {trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {trendValue}
                  </span>
                )}
                {subtitle && (
                  <span className="text-xs text-gray-500 truncate">
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-2.5 rounded-xl flex-shrink-0 border border-emerald-500/10">
              <Icon className="h-4 w-4 text-emerald-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
