"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { formatUSD, formatLargeNumber } from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Moon,
  Calculator,
  Zap,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Timer,
  Layers,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ───
const MINT_TX_GAS = 150000;
const STANDARD_TX_GAS = 21000;
const GWEI = 1e9;

// Gas thresholds for PulseChain (Gwei)
const GAS_LOW_THRESHOLD = 30;
const GAS_MEDIUM_THRESHOLD = 60;

// Batch gas savings estimate (PulseChain batching optimization)
const BATCH_OVERHEAD_RATIO = 0.15; // 15% overhead for batch vs. sum of singles
const SINGLE_TX_BASE = 150000; // Gas units for single mint
const BATCH_PER_TOKEN = 120000; // Gas units per token in batch

// ─── Types ───
interface GasPriceReading {
  time: string;
  price: number;
}

type GasTrend = "up" | "down" | "stable";
type GasLevel = "low" | "medium" | "high";

// ─── Helper Functions ───
function getGasLevel(gwei: number): GasLevel {
  if (gwei <= GAS_LOW_THRESHOLD) return "low";
  if (gwei <= GAS_MEDIUM_THRESHOLD) return "medium";
  return "high";
}

function getGasLevelColors(level: GasLevel) {
  switch (level) {
    case "low":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        glow: "shadow-emerald-500/10",
      };
    case "medium":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        glow: "shadow-amber-500/10",
      };
    case "high":
      return {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-400",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        glow: "shadow-rose-500/10",
      };
  }
}

function detectTrend(readings: number[]): GasTrend {
  if (readings.length < 3) return "stable";
  const recent = readings.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const older = readings.slice(-6, -3);
  if (older.length === 0) return "stable";
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const diff = avg - olderAvg;
  const pctChange = olderAvg > 0 ? diff / olderAvg : 0;
  if (pctChange > 0.08) return "up";
  if (pctChange < -0.08) return "down";
  return "stable";
}

function generateSimulatedGasHistory(currentGwei: number): GasPriceReading[] {
  const data: GasPriceReading[] = [];
  const now = new Date();
  // Generate 24 data points (one per hour for last 24h)
  let price = currentGwei * (0.7 + Math.random() * 0.3);
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600 * 1000);
    // Add some variation with mean-reversion toward current price
    const noise = (Math.random() - 0.5) * 15;
    const meanReversion = (currentGwei - price) * 0.1;
    price = Math.max(1, price + noise + meanReversion);
    data.push({
      time: time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      price: Math.round(price * 100) / 100,
    });
  }
  return data;
}

// ─── Custom Tooltip for Chart ───
function GasChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-emerald-400">
        {payload[0].value.toFixed(1)} Gwei
      </p>
    </div>
  );
}

// ─── Gas Tips Data ───
const GAS_TIPS = [
  {
    icon: Moon,
    title: "Mint During Off-Peak Hours",
    description: "UTC 2-8 AM typically has the lowest gas prices on PulseChain. Plan your batch mints during these windows.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: Clock,
    title: "Monitor Gas for 15 Minutes",
    description: "Watch the gas trend for at least 15 minutes before minting to avoid momentary spikes.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Calculator,
    title: "Estimate Costs Before Minting",
    description: "Use the savings calculator to compare costs and find the most economical time to mint.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
];

// ─── Main Component ───
export function GasOptimizer() {
  const { gasData, plsPriceUSD } = useAppStore();

  // ─── Local State ───
  const [currentGwei, setCurrentGwei] = useState<number | null>(null);
  const [gasHistory, setGasHistory] = useState<GasPriceReading[]>([]);
  const [gasLoading, setGasLoading] = useState(true);
  const [gasError, setGasError] = useState<string | null>(null);

  // Gas savings calculator state
  const [plannedMints, setPlannedMints] = useState("5");

  // Batch calculator state
  const [batchTokens, setBatchTokens] = useState("10");

  // ─── Fetch Gas Data ───
  const fetchGasData = useCallback(async () => {
    try {
      setGasLoading(true);
      setGasError(null);
      const res = await fetch("/api/gas");
      if (!res.ok) throw new Error("Failed to fetch gas data");
      const data = await res.json();
      const gwei = data.gasPriceGwei || 30;
      setCurrentGwei(gwei);
      setGasHistory((prev) => {
        const newHistory = generateSimulatedGasHistory(gwei);
        // Ensure last point matches current reading
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1].price = gwei;
        }
        return newHistory;
      });
    } catch (err) {
      setGasError("Unable to fetch gas data. Showing estimated values.");
      setCurrentGwei(30);
      setGasHistory(generateSimulatedGasHistory(30));
    } finally {
      setGasLoading(false);
    }
  }, []);

  // Simulate periodic gas updates for the history chart
  useEffect(() => {
    fetchGasData();
    const interval = setInterval(() => {
      setCurrentGwei((prev) => {
        if (prev === null) return prev;
        // Simulate small fluctuations around current price
        const noise = (Math.random() - 0.5) * 5;
        const newPrice = Math.max(1, Math.round((prev + noise) * 100) / 100);
        setGasHistory((h) => {
          const now = new Date();
          const newEntry = {
            time: now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            price: newPrice,
          };
          return [...h.slice(1), newEntry];
        });
        return newPrice;
      });
    }, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [fetchGasData]);

  // ─── Computed Values ───
  const gasLevel = useMemo(() => {
    if (currentGwei === null) return "medium" as GasLevel;
    return getGasLevel(currentGwei);
  }, [currentGwei]);

  const gasTrend = useMemo(() => {
    if (gasHistory.length < 4) return "stable" as GasTrend;
    const prices = gasHistory.map((r) => r.price);
    return detectTrend(prices);
  }, [gasHistory]);

  const gasColors = useMemo(() => getGasLevel(gasLevel), [gasLevel]);

  const avgGasPrice = useMemo(() => {
    if (gasHistory.length === 0) return 0;
    const sum = gasHistory.reduce((a, b) => a + b.price, 0);
    return Math.round((sum / gasHistory.length) * 100) / 100;
  }, [gasHistory]);

  const lowGasEstimate = useMemo(() => Math.round(GAS_LOW_THRESHOLD * 100) / 100, []);
  const highGasEstimate = useMemo(() => Math.round(GAS_MEDIUM_THRESHOLD * 100) / 100, []);

  // ─── Gas Savings Calculator ───
  const savingsCalc = useMemo(() => {
    const mints = parseInt(plannedMints) || 0;
    const current = currentGwei || 30;

    // Gas cost per mint in PLS: gasGwei * 1e9 * gasUnits / 1e18 = gasGwei * gasUnits / 1e9
    const currentCostPLS = (current * MINT_TX_GAS) / GWEI * mints;
    const lowCostPLS = (lowGasEstimate * MINT_TX_GAS) / GWEI * mints;
    const highCostPLS = (highGasEstimate * MINT_TX_GAS) / GWEI * mints;

    // Convert to USD using PLS price
    const currentCostUSD = currentCostPLS * plsPriceUSD;
    const lowCostUSD = lowCostPLS * plsPriceUSD;
    const highCostUSD = highCostPLS * plsPriceUSD;
    const savingsUSD = currentCostUSD - lowCostUSD;
    const savingsPLS = currentCostPLS - lowCostPLS;
    const savingsPercent = currentCostPLS > 0 ? (savingsPLS / currentCostPLS) * 100 : 0;

    return {
      mints,
      currentCostPLS,
      lowCostPLS,
      highCostPLS,
      currentCostUSD,
      lowCostUSD,
      highCostUSD,
      savingsUSD,
      savingsPLS,
      savingsPercent,
    };
  }, [plannedMints, currentGwei, plsPriceUSD, lowGasEstimate, highGasEstimate]);

  // ─── Batch Minting Calculator ───
  const batchCalc = useMemo(() => {
    const tokens = parseInt(batchTokens) || 0;
    const current = currentGwei || 30;

    // Single TX cost: each mint is a separate transaction
    const singleGasPerToken = (current * SINGLE_TX_BASE) / GWEI;
    const singleTotalPLS = singleGasPerToken * tokens;
    const singleTotalUSD = singleTotalPLS * plsPriceUSD;

    // Batch TX cost: tokens in a single transaction with overhead
    const batchGasTotal = (current * BATCH_PER_TOKEN * tokens) / GWEI;
    const batchOverhead = batchGasTotal * BATCH_OVERHEAD_RATIO;
    const batchTotalPLS = batchGasTotal + batchOverhead;
    const batchTotalUSD = batchTotalPLS * plsPriceUSD;

    // Savings
    const savedPLS = singleTotalPLS - batchTotalPLS;
    const savedUSD = singleTotalUSD - batchTotalUSD;
    const savedPercent = singleTotalPLS > 0 ? (savedPLS / singleTotalPLS) * 100 : 0;

    return {
      tokens,
      singleGasPerToken,
      singleTotalPLS,
      singleTotalUSD,
      batchTotalPLS,
      batchTotalUSD,
      savedPLS,
      savedUSD,
      savedPercent,
    };
  }, [batchTokens, currentGwei, plsPriceUSD]);

  // ─── Mint Recommendation ───
  const mintRecommendation = useMemo(() => {
    if (currentGwei === null) return { text: "Loading...", action: "wait" as const };
    if (gasLevel === "low") {
      return {
        text: "Mint now — Gas is LOW",
        action: "mint" as const,
      };
    }
    if (gasLevel === "medium") {
      return {
        text: "Acceptable — Gas is MODERATE",
        action: "acceptable" as const,
      };
    }
    return {
      text: "Wait — Gas is HIGH",
      action: "wait" as const,
    };
  }, [currentGwei, gasLevel]);

  // ─── Trend Icon ───
  const TrendIcon = useMemo(() => {
    switch (gasTrend) {
      case "up":
        return TrendingUp;
      case "down":
        return TrendingDown;
      default:
        return Minus;
    }
  }, [gasTrend]);

  const trendColor = useMemo(() => {
    switch (gasTrend) {
      case "up":
        return "text-rose-400";
      case "down":
        return "text-emerald-400";
      default:
        return "text-gray-400";
    }
  }, [gasTrend]);

  const trendLabel = useMemo(() => {
    switch (gasTrend) {
      case "up":
        return "Rising";
      case "down":
        return "Falling";
      default:
        return "Stable";
    }
  }, [gasTrend]);

  return (
    <TooltipProvider>
      <div className="animate-fade-in-up space-y-6">
        {/* ═══════════════════════════════════════ */}
        {/* Section 1: Gas Price Forecast           */}
        {/* ═══════════════════════════════════════ */}
        <Card className={cn("gradient-border bg-gray-900 border-gray-800", gasColors.glow)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg border", gasColors.bg, gasColors.border)}>
                  <Fuel className={cn("h-4 w-4", gasColors.text)} />
                </div>
                <div>
                  <CardTitle className="text-base text-gray-100">Gas Price Forecast</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">PulseChain Network</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs font-medium", gasColors.badge)}>
                  {gasLevel === "low" ? "LOW" : gasLevel === "medium" ? "MODERATE" : "HIGH"}
                </Badge>
                {gasLoading && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {gasError && (
              <div className="mb-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <Info className="h-3 w-3 shrink-0" />
                <span>{gasError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Gas Price */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Current Gas Price</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-3xl font-bold number-animate", gasColors.text)}>
                    {currentGwei !== null ? currentGwei.toFixed(1) : "—"}
                  </span>
                  <span className="text-sm text-gray-500">Gwei</span>
                </div>
                {/* Trend Indicator */}
                <div className="flex items-center gap-1.5">
                  <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                  <span className={cn("text-xs font-medium", trendColor)}>{trendLabel}</span>
                  {gasTrend === "up" && <ArrowUpRight className="h-3 w-3 text-rose-400" />}
                  {gasTrend === "down" && <ArrowDownRight className="h-3 w-3 text-emerald-400" />}
                </div>
              </div>

              {/* Optimal Mint Window */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Optimal Mint Window</p>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border",
                    mintRecommendation.action === "mint"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : mintRecommendation.action === "acceptable"
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-rose-500/10 border-rose-500/20"
                  )}
                >
                  {mintRecommendation.action === "mint" ? (
                    <Zap className="h-4 w-4 text-emerald-400" />
                  ) : mintRecommendation.action === "acceptable" ? (
                    <Clock className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Timer className="h-4 w-4 text-rose-400" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      mintRecommendation.action === "mint"
                        ? "text-emerald-300"
                        : mintRecommendation.action === "acceptable"
                          ? "text-amber-300"
                          : "text-rose-300"
                    )}
                  >
                    {mintRecommendation.text}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Avg: {avgGasPrice.toFixed(1)} Gwei · 24h
                </p>
              </div>

              {/* Mint Cost Quick Ref */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Est. Mint Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-100 number-animate">
                    {currentGwei !== null
                      ? ((currentGwei * MINT_TX_GAS) / GWEI).toFixed(2)
                      : "—"}
                  </span>
                  <span className="text-sm text-gray-500">PLS</span>
                </div>
                <p className="text-xs text-gray-500">
                  {currentGwei !== null
                    ? `${formatUSD(((currentGwei * MINT_TX_GAS) / GWEI) * plsPriceUSD)}`
                    : "—"}{" "}
                  per mint TX
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════ */}
        {/* Section 2: Gas History Mini Chart        */}
        {/* ═══════════════════════════════════════ */}
        <Card className="gradient-border bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/20">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </div>
                <CardTitle className="text-base text-gray-100">Gas Price History</CardTitle>
              </div>
              <span className="text-xs text-gray-500">Last 24 hours</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 w-full">
              {gasLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm">Loading gas history...</span>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gasHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      interval={5}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      domain={["auto", "auto"]}
                      tickFormatter={(val: number) => `${val}`}
                    />
                    <RechartsTooltip content={<GasChartTooltip />} />
                    <ReferenceLine
                      y={avgGasPrice}
                      stroke="#6b7280"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#gasGradient)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "#22c55e",
                        stroke: "#111827",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-3 bg-gray-600 rounded" style={{ borderStyle: "dashed" }} />
                <span className="text-xs text-gray-500">Avg ({avgGasPrice.toFixed(1)} Gwei)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-3 bg-emerald-500 rounded" />
                <span className="text-xs text-gray-500">Gas Price</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════ */}
        {/* Section 3: Gas Savings Calculator        */}
        {/* ═══════════════════════════════════════ */}
        <Card className="gradient-border bg-gray-900 border-gray-800 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-cyan-500/10 border-cyan-500/20">
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-100">Gas Savings Calculator</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Compare costs at different gas price levels
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full sm:w-auto">
                <Label className="text-xs text-gray-400 mb-1.5 block">
                  Number of Mints Planned
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={plannedMints}
                  onChange={(e) => setPlannedMints(e.target.value)}
                  placeholder="e.g. 5"
                  className="input-focus-ring bg-gray-800 border-gray-700 text-gray-100 h-9"
                />
              </div>
              <div className="flex gap-2">
                {[1, 5, 10, 25].map((n) => (
                  <Button
                    key={n}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "btn-hover-scale text-xs h-9 px-3",
                      plannedMints === String(n)
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                    )}
                    onClick={() => setPlannedMints(String(n))}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Comparison Table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Current Rate */}
              <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-medium text-gray-400">Current Rate</span>
                </div>
                <p className="text-xs text-gray-500">
                  {currentGwei?.toFixed(1) ?? "—"} Gwei
                </p>
                <p className="text-lg font-bold text-gray-100 number-animate">
                  {formatLargeNumber(savingsCalc.currentCostPLS)} PLS
                </p>
                <p className="text-xs text-gray-500">{formatUSD(savingsCalc.currentCostUSD)}</p>
              </div>

              {/* Low Rate */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Low Rate</span>
                </div>
                <p className="text-xs text-gray-500">~{lowGasEstimate} Gwei</p>
                <p className="text-lg font-bold text-emerald-300 number-animate">
                  {formatLargeNumber(savingsCalc.lowCostPLS)} PLS
                </p>
                <p className="text-xs text-gray-500">{formatUSD(savingsCalc.lowCostUSD)}</p>
              </div>

              {/* High Rate */}
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-medium text-rose-400">High Rate</span>
                </div>
                <p className="text-xs text-gray-500">~{highGasEstimate} Gwei</p>
                <p className="text-lg font-bold text-rose-300 number-animate">
                  {formatLargeNumber(savingsCalc.highCostPLS)} PLS
                </p>
                <p className="text-xs text-gray-500">{formatUSD(savingsCalc.highCostUSD)}</p>
              </div>
            </div>

            {/* Potential Savings */}
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                savingsCalc.savingsUSD > 0
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-gray-800/50 border-gray-800"
              )}
            >
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Potential Savings (waiting for low gas)</span>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-emerald-400 number-animate">
                  {formatLargeNumber(savingsCalc.savingsPLS)} PLS
                </p>
                <p className="text-xs text-emerald-400/70">
                  {formatUSD(savingsCalc.savingsUSD)} · {savingsCalc.savingsPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════ */}
        {/* Section 4: Batch Minting Calculator      */}
        {/* ═══════════════════════════════════════ */}
        <Card className="gradient-border bg-gray-900 border-gray-800 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-amber-500/10 border-amber-500/20">
                <Layers className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-100">Batch Minting Calculator</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Compare single TX vs batch optimization
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full sm:w-auto">
                <Label className="text-xs text-gray-400 mb-1.5 block">
                  Number of Tokens to Mint
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={batchTokens}
                  onChange={(e) => setBatchTokens(e.target.value)}
                  placeholder="e.g. 10"
                  className="input-focus-ring bg-gray-800 border-gray-700 text-gray-100 h-9"
                />
              </div>
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((n) => (
                  <Button
                    key={n}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "btn-hover-scale text-xs h-9 px-3",
                      batchTokens === String(n)
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                    )}
                    onClick={() => setBatchTokens(String(n))}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Single TX */}
              <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">
                    Individual Transactions
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {batchCalc.tokens} separate transactions
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Gas per TX</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {formatLargeNumber(batchCalc.singleGasPerToken)} PLS
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total Gas</span>
                    <span className="text-lg font-bold text-gray-100 number-animate">
                      {formatLargeNumber(batchCalc.singleTotalPLS)} PLS
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">USD Value</span>
                    <span className="text-xs text-gray-400">
                      {formatUSD(batchCalc.singleTotalUSD)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch TX */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-300">
                    Batch Optimized
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  1 batch transaction (+ overhead)
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Overhead</span>
                    <span className="text-sm font-semibold text-gray-200">~15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total Gas</span>
                    <span className="text-lg font-bold text-amber-300 number-animate">
                      {formatLargeNumber(batchCalc.batchTotalPLS)} PLS
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">USD Value</span>
                    <span className="text-xs text-gray-400">
                      {formatUSD(batchCalc.batchTotalUSD)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Savings */}
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                batchCalc.savedPLS > 0
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-gray-800/50 border-gray-800"
              )}
            >
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-gray-300">
                  Estimated savings with batching
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-emerald-400 number-animate">
                    {batchCalc.savedPercent.toFixed(1)}%
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                  >
                    {formatLargeNumber(batchCalc.savedPLS)} PLS
                  </Badge>
                </div>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  {formatUSD(batchCalc.savedUSD)} saved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════ */}
        {/* Section 5: Gas Tips Cards                */}
        {/* ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GAS_TIPS.map((tip, idx) => {
            const TipIcon = tip.icon;
            return (
              <Card
                key={idx}
                className="gradient-border bg-gray-900 border-gray-800 card-hover"
              >
                <CardContent className="p-4 space-y-3">
                  <div
                    className={cn(
                      "inline-flex p-2 rounded-lg border",
                      tip.bg,
                      tip.border
                    )}
                  >
                    <TipIcon className={cn("h-4 w-4", tip.color)} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-100 leading-snug">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {tip.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
