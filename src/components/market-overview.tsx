"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { formatUSD } from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Activity,
  Crown,
  AlertTriangle,
  Gauge,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Simulated data                                                     */
/* ------------------------------------------------------------------ */

interface TopMover {
  name: string;
  symbol: string;
  version: "V3" | "V4";
  priceChange: number;
  volume: number;
}

const SIMULATED_MOVERS: TopMover[] = [
  { name: "PulseX Treasury", symbol: "PLS-TREAS", version: "V3", priceChange: 14.7, volume: 42_300 },
  { name: "eDAI Yield", symbol: "eDAI-Y", version: "V4", priceChange: 8.2, volume: 31_800 },
  { name: "NINE Token", symbol: "NINE", version: "V4", priceChange: -5.3, volume: 27_100 },
  { name: "T-BILL Bond", symbol: "T-BILL", version: "V3", priceChange: 3.1, volume: 18_500 },
  { name: "SKILLS Gem", symbol: "SKILLS", version: "V4", priceChange: -9.8, volume: 14_200 },
];

const SIMULATED_VOLUME = 159_000;
const SIMULATED_MCAP = 56_000_000;
const SIMULATED_WALLETS = 1_200;
const SIMULATED_PLS_24H_CHANGE = 2.34;

/* ------------------------------------------------------------------ */
/*  Helper: Fear & Greed label                                         */
/* ------------------------------------------------------------------ */

function getFearGreedInfo(value: number) {
  if (value <= 20) return { label: "Extreme Fear", color: "text-rose-400", bg: "bg-rose-500" };
  if (value <= 40) return { label: "Fear", color: "text-amber-400", bg: "bg-amber-500" };
  if (value <= 60) return { label: "Neutral", color: "text-gray-300", bg: "bg-gray-400" };
  if (value <= 80) return { label: "Greed", color: "text-emerald-400", bg: "bg-emerald-400" };
  return { label: "Extreme Greed", color: "text-emerald-300", bg: "bg-emerald-500" };
}

/* ------------------------------------------------------------------ */
/*  Helper: format compact volume                                      */
/* ------------------------------------------------------------------ */

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/* ------------------------------------------------------------------ */
/*  MarketStatsRow                                                     */
/* ------------------------------------------------------------------ */

function MarketStatsRow() {
  const { plsPriceUSD } = useAppStore();
  const [priceDirection, setPriceDirection] = useState<"up" | "down">("up");

  // Simulate price direction changes
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceDirection(Math.random() > 0.45 ? "up" : "down");
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "PLS Price",
        value: formatUSD(plsPriceUSD),
        icon: DollarSign,
        trend: priceDirection,
        accent: priceDirection === "up" ? "text-emerald-400" : "text-rose-400",
        iconBg: priceDirection === "up" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20",
      },
      {
        label: "24h Volume",
        value: formatCompact(SIMULATED_VOLUME),
        icon: Activity,
        trend: "up" as const,
        accent: "text-emerald-400",
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
      },
      {
        label: "Market Cap",
        value: formatCompact(SIMULATED_MCAP),
        icon: BarChart3,
        trend: "up" as const,
        accent: "text-emerald-400",
        iconBg: "bg-cyan-500/10 border-cyan-500/20",
      },
      {
        label: "Active Wallets",
        value: `${(SIMULATED_WALLETS / 1000).toFixed(1)}K`,
        icon: Users,
        trend: "up" as const,
        accent: "text-gray-300",
        iconBg: "bg-violet-500/10 border-violet-500/20",
      },
    ],
    [plsPriceUSD, priceDirection]
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/30 hover:border-gray-700/60 transition-all duration-200 group"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`p-1 rounded-md border ${s.iconBg} transition-colors`}>
              <s.icon className={`h-3 w-3 ${s.accent}`} />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold font-mono text-white">{s.value}</p>
            {s.trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-rose-400" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TopMoversList                                                      */
/* ------------------------------------------------------------------ */

function TopMoversList() {
  const sorted = useMemo(
    () => [...SIMULATED_MOVERS].sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange)),
    []
  );

  return (
    <div className="space-y-1.5">
      {sorted.map((mover, idx) => {
        const isPositive = mover.priceChange >= 0;
        return (
          <div
            key={mover.symbol}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 transition-colors duration-150 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] text-gray-600 font-mono w-3 text-right">
                {idx + 1}
              </span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mover.version === "V3"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                }`}
              >
                {mover.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                  {mover.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{mover.symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 ${
                      mover.version === "V3"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {mover.version}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p
                className={`text-xs font-semibold font-mono ${
                  isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {mover.priceChange.toFixed(1)}%
              </p>
              <p className="text-[10px] text-gray-500">{formatCompact(mover.volume)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FearGreedGauge                                                     */
/* ------------------------------------------------------------------ */

function FearGreedGauge() {
  // Simulated fear & greed value — varies slightly over time
  const [value, setValue] = useState(45);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.min(100, Math.max(0, Math.round(prev + delta)));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const info = getFearGreedInfo(value);
  const pct = value;

  // Compute gradient stops: rose (0%) → amber (50%) → emerald (100%)
  const barGradient = "from-rose-500 via-amber-500 to-emerald-500";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs font-medium text-gray-300">Market Sentiment</p>
        </div>
        <span className={`text-xs font-semibold font-mono ${info.color}`}>
          {value}
        </span>
      </div>

      {/* Gradient bar */}
      <div className="relative">
        <div className={`h-2.5 rounded-full bg-gradient-to-r ${barGradient} opacity-30`} />
        <div
          className={`h-2.5 rounded-full bg-gradient-to-r ${barGradient}`}
          style={{ width: `${pct}%` }}
        />

        {/* Position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
          style={{ left: `calc(${pct}% - 5px)` }}
        >
          <div className={`w-3 h-3 rounded-full ${info.bg} border-2 border-gray-900 shadow-lg`} />
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-rose-400/60 font-medium">Extreme Fear</span>
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 ${
            value <= 20
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : value <= 40
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : value <= 60
              ? "bg-gray-500/10 border-gray-500/20 text-gray-400"
              : value <= 80
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          }`}
        >
          {info.label}
        </Badge>
        <span className="text-[9px] text-emerald-400/60 font-medium">Extreme Greed</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QuickStats                                                         */
/* ------------------------------------------------------------------ */

function QuickStats() {
  const topGainer = useMemo(
    () =>
      [...SIMULATED_MOVERS].sort((a, b) => b.priceChange - a.priceChange)[0],
    []
  );
  const topLoser = useMemo(
    () =>
      [...SIMULATED_MOVERS].sort((a, b) => a.priceChange - b.priceChange)[0],
    []
  );

  const stats = [
    {
      label: "PLS 24h Change",
      value: `${SIMULATED_PLS_24H_CHANGE > 0 ? "+" : ""}${SIMULATED_PLS_24H_CHANGE.toFixed(2)}%`,
      icon: SIMULATED_PLS_24H_CHANGE >= 0 ? TrendingUp : TrendingDown,
      color: SIMULATED_PLS_24H_CHANGE >= 0 ? "text-emerald-400" : "text-rose-400",
      bg: SIMULATED_PLS_24H_CHANGE >= 0
        ? "bg-emerald-500/10 border-emerald-500/20"
        : "bg-rose-500/10 border-rose-500/20",
    },
    {
      label: "Top Gainer",
      value: topGainer.symbol,
      subValue: `+${topGainer.priceChange.toFixed(1)}%`,
      icon: Crown,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Top Loser",
      value: topLoser.symbol,
      subValue: `${topLoser.priceChange.toFixed(1)}%`,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="p-2.5 rounded-lg bg-gray-800/30 border border-gray-700/20 text-center"
        >
          <div className={`inline-flex p-1.5 rounded-lg border ${s.bg} mb-1.5`}>
            <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
          </div>
          <p className="text-[10px] text-gray-500 mb-0.5">{s.label}</p>
          <p className={`text-xs font-bold font-mono ${s.color}`}>{s.value}</p>
          {s.subValue && (
            <p className={`text-[9px] font-mono mt-0.5 ${s.color} opacity-70`}>
              {s.subValue}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MarketOverview (exported)                                          */
/* ------------------------------------------------------------------ */

export function MarketOverview() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Market Stats Row */}
      <Card className="bg-gray-900 border-gray-800/70 card-hover glass-card-depth">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              Market Overview
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]">
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MarketStatsRow />
        </CardContent>
      </Card>

      {/* Two-column layout: Top Movers + Fear & Greed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Top Movers */}
        <Card className="lg:col-span-3 bg-gray-900 border-gray-800/70 card-hover glass-card-depth">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" />
                Top Movers
              </CardTitle>
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-[10px]">
                24h
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <TopMoversList />
            </div>
          </CardContent>
        </Card>

        {/* Fear & Greed + Quick Stats */}
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800/70 card-hover glass-card-depth">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Gauge className="h-4 w-4 text-violet-400" />
              Sentiment & Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FearGreedGauge />
            <div className="border-t border-gray-800 pt-4">
              <QuickStats />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
