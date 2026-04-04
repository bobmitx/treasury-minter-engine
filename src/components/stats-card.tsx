"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Accent color for the icon container and hover glow. Defaults to emerald. */
  accent?: "emerald" | "amber" | "rose";
}

const accentMap = {
  emerald: {
    iconBg: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/10",
    iconText: "text-emerald-400",
    glowClass: "hover:shadow-[0_0_20px_oklch(0.7_0.17_162/15%)]",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
  amber: {
    iconBg: "from-amber-500/15 to-amber-500/5 border-amber-500/10",
    iconText: "text-amber-400",
    glowClass: "hover:shadow-[0_0_20px_oklch(0.65_0.2_40/15%)]",
    trendUp: "text-amber-400",
    trendDown: "text-rose-400",
  },
  rose: {
    iconBg: "from-rose-500/15 to-rose-500/5 border-rose-500/10",
    iconText: "text-rose-400",
    glowClass: "hover:shadow-[0_0_20px_oklch(0.65_0.2_25/15%)]",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  accent = "emerald",
}: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [valueTick, setValueTick] = useState(false);
  const prevValueRef = useRef(value);

  // Trigger number-tick animation when value changes
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const timer = setTimeout(() => {
        // Animation reset handled via CSS class re-application
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const colors = accentMap[accent];

  // Card spotlight mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--spotlight-x", `${x}%`);
    cardRef.current.style.setProperty("--spotlight-y", `${y}%`);
  }, []);

  return (
    <Card
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "bg-gray-900 border-gray-800/70 card-hover gradient-border card-spotlight",
        "gradient-bg-shift card-press",
        colors.glowClass,
        className
      )}
      style={{
        backgroundImage: isHovered
          ? `linear-gradient(135deg, oklch(0.16 0 0) 0%, oklch(0.16 ${accent === "emerald" ? "0.01" : accent === "amber" ? "0.015" : "0.01"} ${accent === "emerald" ? "162" : accent === "amber" ? "40" : "25"} / 40%) 50%, oklch(0.16 0 0) 100%)`
          : undefined,
      }}
    >
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm text-gray-400 truncate">{title}</p>
            <p className={cn(
              "text-xl font-bold text-white truncate number-animate",
              valueTick && "number-tick"
            )}>
              {value}
            </p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-1 animate-slide-in-right" style={{ animationDuration: "0.3s" }}>
                {trend && trend !== "neutral" && (
                  <span
                    className={cn("flex items-center text-xs font-medium", {
                      [colors.trendUp]: trend === "up",
                      [colors.trendDown]: trend === "down",
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
            <div className={cn(
              "bg-gradient-to-br p-2.5 rounded-xl flex-shrink-0 border transition-shadow duration-300",
              colors.iconBg,
              isHovered && accent === "emerald" && "shadow-[0_0_12px_oklch(0.7_0.17_162/20%)]",
              isHovered && accent === "amber" && "shadow-[0_0_12px_oklch(0.65_0.2_40/20%)]",
              isHovered && accent === "rose" && "shadow-[0_0_12px_oklch(0.65_0.2_25/20%)]"
            )}>
              <Icon className={cn("h-4 w-4", colors.iconText)} />
            </div>
          )}
          {!value && !subtitle && !trendValue && (
            <div className="absolute inset-0 dot-grid-bg rounded-[inherit] opacity-30 pointer-events-none" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
