"use client";

import { useState, useMemo } from "react";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Target,
  GitBranch,
  Zap,
  Shield,
  Info,
  DollarSign,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MINT_COST_PER_TOKEN = 0.00006972;

const QUICK_PRESETS = [
  { label: "Conservative", amount: 1000, icon: Shield, color: "text-emerald-400" },
  { label: "Moderate", amount: 10000, icon: Target, color: "text-amber-400" },
  { label: "Aggressive", amount: 100000, icon: Zap, color: "text-rose-400" },
];

const PIE_COLORS = ["#22c55e", "#f43f5e", "#f59e0b"];

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-300">{payload[0].name}</p>
      <p className="text-sm font-semibold text-white">{formatUSD(payload[0].value)}</p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-300">After {label} mints</p>
      <p className="text-sm font-semibold text-white">
        Multiplier: {payload[0].value.toFixed(2)}x
      </p>
    </div>
  );
}

export function CalculatorTab() {
  const { mintCostUSD } = useAppStore();
  const [chartLoading] = useState(true);

  // ─── Mint Cost Calculator State ───
  const [mintAmount, setMintAmount] = useState("1000");
  const [tokenPrice, setTokenPrice] = useState("0.0005");

  // ─── Multiplier Calculator State ───
  const [currentMultiplier, setCurrentMultiplier] = useState("1.5");
  const [futureMints, setFutureMints] = useState("5");

  // ─── MultiHop Profit Estimator State ───
  const [sourceTokenPrice, setSourceTokenPrice] = useState("0.0003");
  const [targetTokenPrice, setTargetTokenPrice] = useState("0.001");
  const [chainDepth, setChainDepth] = useState("3");

  // ─── Mint Cost Calculations ───
  const mintCostCalc = useMemo(() => {
    const amount = parseFloat(mintAmount) || 0;
    const price = parseFloat(tokenPrice) || 0;
    const cost = amount * MINT_COST_PER_TOKEN;
    const revenue = amount * price;
    const profit = revenue - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;

    return { amount, price, cost, revenue, profit, roi };
  }, [mintAmount, tokenPrice]);

  // ─── Break-Even Analysis ───
  const breakEven = useMemo(() => {
    const price = parseFloat(tokenPrice) || 0;
    const tokensNeeded = price > 0 ? MINT_COST_PER_TOKEN / price : 0;
    return tokensNeeded;
  }, [tokenPrice]);

  // ─── Multiplier Projections ───
  const multiplierData = useMemo(() => {
    const current = parseFloat(currentMultiplier) || 1;
    const mints = parseInt(futureMints) || 0;

    const data = [{ name: "Current", multiplier: current }];
    for (let i = 1; i <= mints; i++) {
      // Each mint slightly increases multiplier (diminishing returns)
      const increase = current * 0.08 * Math.pow(0.7, i - 1);
      data.push({
        name: `+${i}`,
        multiplier: data[data.length - 1].multiplier + increase,
      });
    }

    const finalMultiplier = data[data.length - 1].multiplier;
    const profitChange = current > 0 ? ((finalMultiplier - current) / current) * 100 : 0;

    return { data, finalMultiplier, profitChange };
  }, [currentMultiplier, futureMints]);

  // ─── MultiHop Profit Estimation ───
  const multiHopCalc = useMemo(() => {
    const srcPrice = parseFloat(sourceTokenPrice) || 0;
    const tgtPrice = parseFloat(targetTokenPrice) || 0;
    const depth = parseInt(chainDepth) || 1;

    const totalCost = srcPrice * depth * 1000; // 1000 tokens per hop
    const grossRevenue = tgtPrice * 1000;
    const netProfit = grossRevenue - totalCost;
    const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return { totalCost, grossRevenue, netProfit, roiPercent, depth };
  }, [sourceTokenPrice, targetTokenPrice, chainDepth]);

  // ─── Pie Chart Data ───
  const pieData = useMemo(() => {
    if (mintCostCalc.revenue <= 0 && mintCostCalc.cost <= 0) {
      return [
        { name: "Mint Cost", value: 1 },
        { name: "Revenue", value: 0 },
      ];
    }
    return [
      { name: mintCostCalc.profit >= 0 ? "Revenue" : "Mint Cost", value: Math.max(Math.abs(mintCostCalc.revenue), mintCostCalc.cost) },
      { name: mintCostCalc.profit >= 0 ? "Mint Cost" : "Loss", value: mintCostCalc.profit >= 0 ? mintCostCalc.cost : Math.abs(mintCostCalc.profit) },
    ];
  }, [mintCostCalc.revenue, mintCostCalc.cost, mintCostCalc.profit]);

  const activePieColors = useMemo(() => {
    if (mintCostCalc.profit >= 0) {
      return ["#22c55e", "#374151"]; // emerald for revenue, gray for cost
    }
    return ["#374151", "#f43f5e"]; // gray for cost, rose for loss
  }, [mintCostCalc.profit]);

  const handlePresetClick = (amount: number) => {
    setMintAmount(amount.toString());
  };

  const formatNumberInput = (value: string) => {
    return value.replace(/[^0-9.]/g, "");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center glow-emerald">
              <Calculator className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mint Profit Calculator</h2>
              <p className="text-xs text-gray-500">
                Estimate profitability before minting · Mint cost: {formatUSD(MINT_COST_PER_TOKEN)}/token
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 text-[10px] w-fit self-start"
          >
            Live Estimates
          </Badge>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1.5 mr-1">
            <Zap className="h-3 w-3" />
            Quick Presets:
          </span>
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset.amount)}
              className={cn(
                "border-gray-700 hover:border-gray-600 bg-gray-900/50 text-gray-300 hover:text-white btn-hover-scale card-press",
                mintAmount === preset.amount.toString() && "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
              )}
            >
              <preset.icon className={cn("h-3 w-3 mr-1.5", preset.color)} />
              {preset.label}
              <span className="text-gray-500 ml-1.5 text-[10px]">
                {formatLargeNumber(preset.amount)}
              </span>
            </Button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ─── Left Column: Calculators ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mint Cost Calculator */}
            <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Mint Cost Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Mint Amount</Label>
                    <Input
                      type="text"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(formatNumberInput(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                      placeholder="e.g. 10000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Token Price (USD)</Label>
                    <Input
                      type="text"
                      value={tokenPrice}
                      onChange={(e) => setTokenPrice(formatNumberInput(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                      placeholder="e.g. 0.0005"
                    />
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                {/* Results */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Mint Cost</p>
                    <p className="text-sm font-semibold text-gray-300 number-animate">
                      {formatUSD(mintCostCalc.cost)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-sm font-semibold text-gray-300 number-animate">
                      {formatUSD(mintCostCalc.revenue)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Profit / Loss</p>
                    <p className={cn(
                      "text-sm font-semibold number-animate",
                      mintCostCalc.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {mintCostCalc.profit >= 0 ? "+" : ""}
                      {formatUSD(mintCostCalc.profit)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ROI</p>
                    <div className="flex items-center gap-1">
                      {mintCostCalc.roi >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-rose-400" />
                      )}
                      <p className={cn(
                        "text-sm font-semibold number-animate",
                        mintCostCalc.roi >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {mintCostCalc.roi >= 0 ? "+" : ""}
                        {mintCostCalc.roi.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row: Multiplier + MultiHop + Break-Even */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Multiplier Calculator */}
              <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    Multiplier Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400">Current Multiplier</Label>
                      <Input
                        type="text"
                        value={currentMultiplier}
                        onChange={(e) => setCurrentMultiplier(formatNumberInput(e.target.value))}
                        className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                        placeholder="e.g. 1.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400">Future Mints</Label>
                      <Input
                        type="text"
                        value={futureMints}
                        onChange={(e) => setFutureMints(formatNumberInput(e.target.value))}
                        className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Projected Multiplier</span>
                      <span className="text-sm font-bold text-emerald-400 text-glow-emerald number-animate">
                        {multiplierData.finalMultiplier.toFixed(3)}x
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Est. Profit Change</span>
                      <span className={cn(
                        "text-sm font-semibold number-animate",
                        multiplierData.profitChange >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {multiplierData.profitChange >= 0 ? "+" : ""}
                        {multiplierData.profitChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MultiHop Profit Estimator */}
              <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-rose-400" />
                    MultiHop Profit Estimator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Source Token Price (USD)</Label>
                    <Input
                      type="text"
                      value={sourceTokenPrice}
                      onChange={(e) => setSourceTokenPrice(formatNumberInput(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                      placeholder="e.g. 0.0003"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Target Token Price (USD)</Label>
                    <Input
                      type="text"
                      value={targetTokenPrice}
                      onChange={(e) => setTargetTokenPrice(formatNumberInput(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                      placeholder="e.g. 0.001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Chain Depth (hops)</Label>
                    <Input
                      type="text"
                      value={chainDepth}
                      onChange={(e) => setChainDepth(formatNumberInput(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
                      placeholder="e.g. 3"
                    />
                  </div>

                  <Separator className="bg-gray-800" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Total Cost</span>
                      <span className="text-sm font-semibold text-gray-300">
                        {formatUSD(multiHopCalc.totalCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Gross Revenue</span>
                      <span className="text-sm font-semibold text-gray-300">
                        {formatUSD(multiHopCalc.grossRevenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Net Profit</span>
                      <span className={cn(
                        "text-sm font-semibold number-animate",
                        multiHopCalc.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {multiHopCalc.netProfit >= 0 ? "+" : ""}
                        {formatUSD(multiHopCalc.netProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">ROI</span>
                      <span className={cn(
                        "text-sm font-semibold number-animate",
                        multiHopCalc.roiPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {multiHopCalc.roiPercent >= 0 ? "+" : ""}
                        {multiHopCalc.roiPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Break-Even Analyzer */}
            <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Break-Even Analyzer
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs max-w-xs">
                      Shows how many tokens you need to mint at the current estimated price to
                      break even against the mint cost per token ({formatUSD(MINT_COST_PER_TOKEN)}).
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-4 border border-gray-800 w-full">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                      At token price: {formatUSD(mintCostCalc.price)}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-400 text-glow-emerald number-animate">
                        {breakEven > 0 ? formatLargeNumber(breakEven) : "N/A"}
                      </span>
                      <span className="text-xs text-gray-500">tokens needed</span>
                    </div>
                    {breakEven > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Minting {formatLargeNumber(breakEven)} tokens costs{" "}
                        <span className="text-gray-300">{formatUSD(breakEven * MINT_COST_PER_TOKEN)}</span>
                        {" "}which equals the revenue at {formatUSD(mintCostCalc.price)}/token
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                    <div className="text-right">
                      <p>Mint Cost/Token</p>
                      <p className="text-sm font-semibold text-gray-300">{formatUSD(MINT_COST_PER_TOKEN)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                    <div className="text-right">
                      <p>Token Price</p>
                      <p className="text-sm font-semibold text-gray-300">{formatUSD(mintCostCalc.price)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right Column: Visual Summary ─── */}
          <div className="space-y-4">
            {/* Pie Chart: Cost vs Revenue */}
            <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Cost vs Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] relative">
                  {chartLoading && (
                    <div className="absolute inset-0 skeleton-shimmer rounded-lg z-10" />
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={activePieColors[index]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-[11px] text-gray-400">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">Total Cost</p>
                    <p className="text-xs font-semibold text-gray-300">
                      {formatUSD(mintCostCalc.cost)}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-6 bg-gray-800" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">Total Revenue</p>
                    <p className={cn(
                      "text-xs font-semibold",
                      mintCostCalc.revenue >= mintCostCalc.cost ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {formatUSD(mintCostCalc.revenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart: Multiplier Projections */}
            <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  Multiplier Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] relative">
                  {chartLoading && (
                    <div className="absolute inset-0 skeleton-shimmer rounded-lg z-10" />
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={multiplierData.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#374151" }}
                        tickLine={{ stroke: "#374151" }}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#374151" }}
                        tickLine={{ stroke: "#374151" }}
                        tickFormatter={(v: number) => `${v.toFixed(1)}x`}
                      />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="multiplier"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      >
                        {multiplierData.data.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={
                              entry.multiplier >= parseFloat(currentMultiplier) || 1
                                ? index === 0
                                  ? "#374151"
                                  : "#22c55e"
                                : "#f43f5e"
                            }
                            opacity={index === 0 ? 0.6 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-gray-600" />
                    <span className="text-[10px] text-gray-500">Current</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-[10px] text-gray-500">Projected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className={cn(
              "bg-gray-900/80 border-gray-800 card-hover gradient-border",
              mintCostCalc.profit >= 0 && "neon-border-emerald"
            )}>
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Summary
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Mint Amount</span>
                    <span className="text-sm font-semibold text-white number-animate">
                      {formatLargeNumber(mintCostCalc.amount)}
                    </span>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Profit/Loss</span>
                    <div className="flex items-center gap-1.5">
                      {mintCostCalc.profit >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span className={cn(
                        "text-sm font-bold number-animate",
                        mintCostCalc.profit >= 0 ? "text-gradient-emerald" : "text-rose-400"
                      )}>
                        {mintCostCalc.profit >= 0 ? "+" : ""}
                        {formatUSD(mintCostCalc.profit)}
                      </span>
                    </div>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ROI</span>
                    <Badge
                      className={cn(
                        "text-[10px] border",
                        mintCostCalc.roi >= 0
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}
                    >
                      {mintCostCalc.roi >= 0 ? "+" : ""}
                      {mintCostCalc.roi.toFixed(1)}%
                    </Badge>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Break-Even Tokens</span>
                    <span className="text-sm font-semibold text-amber-400 number-animate">
                      {breakEven > 0 ? formatLargeNumber(breakEven) : "N/A"}
                    </span>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Projected Multiplier</span>
                    <span className="text-sm font-semibold text-emerald-400 text-glow-emerald number-animate">
                      {multiplierData.finalMultiplier.toFixed(3)}x
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
