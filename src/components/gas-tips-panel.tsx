"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatUSD } from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Clock, Zap, Calculator, Bot, TrendingUp, ChevronDown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Gas Level Thresholds (PLS cost for standard TX) ───
const GAS_LOW_THRESHOLD_PLS = 10;
const GAS_NORMAL_THRESHOLD_PLS = 20;

type GasStatus = "low" | "normal" | "high";

// ─── Gas Tips Data ───
const GAS_TIPS = [
  {
    icon: Clock,
    title: "Mint during low-activity hours for lower gas",
    description:
      "UTC 2–8 AM typically sees the lowest network activity on PulseChain. Scheduling your mints in these windows can save 20–40% on gas costs compared to peak hours.",
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: Zap,
    title: "Batch multiple mints when gas is below 20 PLS",
    description:
      "When standard TX gas drops below 20 PLS, it's an ideal window to execute multiple mint transactions in quick succession. Monitor the gas tracker for dips.",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Calculator,
    title: "V3 mints cost ~130 PLS per transaction — plan accordingly",
    description:
      "Each V3 mint transaction uses approximately 150,000 gas units. At typical PulseChain prices this costs ~130 PLS. Always ensure you have enough PLS balance to cover gas.",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Bot,
    title: "Use the Bot Mode to auto-mint when gas drops below your threshold",
    description:
      "Configure Bot Mode with a max gas price in Settings. The bot will automatically execute mints when conditions are met, saving you from manually watching gas prices.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: TrendingUp,
    title: "Monitor gas trends — PulseChain gas varies significantly",
    description:
      "PulseChain gas prices can fluctuate 3–5x within hours. Use the Gas Optimizer chart to identify trends and avoid minting during sudden spikes.",
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
] as const;

// ─── Helper ───
function getGasStatus(standardCostPLS: number | null): GasStatus {
  if (standardCostPLS === null) return "normal";
  if (standardCostPLS <= GAS_LOW_THRESHOLD_PLS) return "low";
  if (standardCostPLS <= GAS_NORMAL_THRESHOLD_PLS) return "normal";
  return "high";
}

function getGasStatusConfig(status: GasStatus) {
  switch (status) {
    case "low":
      return {
        label: "Low",
        dot: "bg-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        description: "Great time to mint — gas costs are minimal",
        textColor: "text-emerald-400",
      };
    case "normal":
      return {
        label: "Normal",
        dot: "bg-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        description: "Acceptable gas — proceed if needed",
        textColor: "text-amber-400",
      };
    case "high":
      return {
        label: "High",
        dot: "bg-rose-400",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        description: "Consider waiting for gas to decrease",
        textColor: "text-rose-400",
      };
  }
}

// ─── TipRow (defined outside component to avoid lint errors) ───
function TipRow({
  tip,
  index,
}: {
  tip: (typeof GAS_TIPS)[number];
  index: number;
}) {
  const TipIcon = tip.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg bg-gray-800/40",
        "hover:bg-gray-800/70 transition-colors duration-200",
        "group"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 p-2 rounded-lg border transition-transform duration-200 group-hover:scale-105",
          tip.bg,
          tip.border
        )}
      >
        <TipIcon className={cn("h-4 w-4", tip.accent)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 font-mono">#{index + 1}</span>
          <h4 className="text-xs font-semibold text-gray-200 leading-snug">
            {tip.title}
          </h4>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
          {tip.description}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───
export function GasTipsPanel() {
  const { gasData, plsPriceUSD } = useAppStore();
  const [standardCostPLS, setStandardCostPLS] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch gas data for status indicator
  const fetchGas = useCallback(async () => {
    try {
      const res = await fetch("/api/gas");
      if (!res.ok) return;
      const data = await res.json();
      setStandardCostPLS(data.standard ?? data.standardCostPLS ?? null);
    } catch {
      // Silently fail — fallback values will be used
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGas();
    const interval = setInterval(fetchGas, 30000);
    return () => clearInterval(interval);
  }, [fetchGas]);

  const gasStatus = useMemo(
    () => getGasStatus(standardCostPLS),
    [standardCostPLS]
  );
  const statusConfig = useMemo(
    () => getGasStatus(gasStatus),
    [gasStatus]
  );

  return (
    <Card className="gradient-border bg-gray-900 border-gray-800 card-hover animate-fade-in-up">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/20">
              <Lightbulb className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-sm text-gray-100">
                Gas Tips
              </CardTitle>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Optimize your PulseChain minting costs
              </p>
            </div>
          </div>

          {/* Current Gas Status Badge */}
          {loading ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-500 animate-pulse" />
              <span className="text-[10px] text-gray-500">Loading…</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusConfig.dot,
                  gasStatus === "low" && "animate-pulse"
                )}
              />
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0",
                  statusConfig.badge
                )}
              >
                {statusConfig.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Gas Status Sub-line */}
        {!loading && standardCostPLS !== null && (
          <div
            className={cn(
              "flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-md border",
              gasStatus === "low"
                ? "bg-emerald-500/5 border-emerald-500/10"
                : gasStatus === "normal"
                  ? "bg-amber-500/5 border-amber-500/10"
                  : "bg-rose-500/5 border-rose-500/10"
            )}
          >
            <p className={cn("text-[10px] font-medium", statusConfig.textColor)}>
              {statusConfig.description}
            </p>
            <span className="text-[10px] text-gray-600 ml-auto font-mono">
              ~{standardCostPLS.toFixed(1)} PLS/TX
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        {/* Collapsible Tips */}
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="gas-tips" className="border-gray-800">
            <AccordionTrigger className="py-2.5 hover:no-underline text-gray-400 hover:text-gray-300 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-gray-300">
                  {GAS_TIPS.length} optimization tips
                </span>
                <ChevronDown className="h-3 w-3" />
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="space-y-2">
                {GAS_TIPS.map((tip, idx) => (
                  <TipRow key={idx} tip={tip} index={idx} />
                ))}
              </div>

              {/* Bottom note */}
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800/30 border border-gray-700/20">
                <Lightbulb className="h-3 w-3 text-gray-500 shrink-0" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  PulseChain gas is typically 700K+ Gwei but PLS is inexpensive, so actual
                  TX costs remain low (~18 PLS standard, ~130 PLS mint). Focus on PLS cost,
                  not raw Gwei numbers.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
