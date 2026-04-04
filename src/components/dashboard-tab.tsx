"use client";

import { useEffect, useCallback, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getPLSPriceInUSD, getMintCost, formatUSD, formatLargeNumber } from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";
import { StatsCard } from "@/components/stats-card";
import { ProfitIndicator } from "@/components/profit-indicator";
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Coins,
  Zap,
  Activity,
  TrendingUp,
  ArrowRight,
  Clock,
  Globe,
  Fuel,
  Plus,
  GitBranch,
  Gift,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function GasTrackerCard() {
  const { gasData, setGasData } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGas = async () => {
      try {
        const res = await fetch("/api/gas");
        const data = await res.json();
        setGasData({
          fast: data.fast,
          standard: data.standard,
          slow: data.slow,
          lastUpdated: data.lastUpdated,
        });
      } catch {
        // use fallback
      } finally {
        setLoading(false);
      }
    };
    fetchGas();
    const interval = setInterval(fetchGas, 30000);
    return () => clearInterval(interval);
  }, [setGasData]);

  const getGasLevel = (gwei: number) => {
    if (gwei > 30) return { label: "High", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    if (gwei > 15) return { label: "Normal", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  };

  const level = gasData ? getGasLevel(gasData.standard) : { label: "...", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" };

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Fuel className="h-4 w-4 text-amber-400" />
          Gas Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold font-mono text-white">
                {gasData ? `${Math.round(gasData.standard)}` : "..."}
              </span>
              <span className="text-xs text-gray-500">Gwei</span>
            </div>
            <Badge variant="outline" className={`${level.bg} ${level.color} ${level.border} border text-[10px]`}>
              {level.label}
            </Badge>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center p-1.5 rounded-lg bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Slow</p>
                <p className="text-xs font-mono font-semibold text-gray-300">
                  {gasData ? `${Math.round(gasData.slow)}` : "..."}
                </p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-gray-800/50 border border-emerald-500/10">
                <p className="text-[10px] text-gray-500">Standard</p>
                <p className="text-xs font-mono font-semibold text-white">
                  {gasData ? `${Math.round(gasData.standard)}` : "..."}
                </p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Fast</p>
                <p className="text-xs font-mono font-semibold text-gray-300">
                  {gasData ? `${Math.round(gasData.fast)}` : "..."}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProfitabilityChart({ tokens }: { tokens: Array<{ symbol: string; profitRatio: number }> }) {
  // Generate mock time series data from top 5 tokens
  const topTokens = [...tokens]
    .sort((a, b) => b.profitRatio - a.profitRatio)
    .slice(0, 5);

  if (topTokens.length === 0) return null;

  // Generate 7 data points simulating historical data
  const data = Array.from({ length: 7 }, (_, i) => {
    const point: Record<string, string | number> = {
      time: `${i + 1}d`,
    };
    topTokens.forEach((token) => {
      const noise = (Math.sin(i * 0.8 + token.profitRatio) * 0.15) + (i * 0.05);
      point[token.symbol] = Math.max(0, token.profitRatio * (0.5 + noise + i * 0.08));
    });
    return point;
  });

  const colors = ["#34d399", "#f59e0b", "#f43f5e", "#06b6d4", "#a78bfa"];

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Profitability Trend (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {topTokens.map((token, idx) => (
                  <linearGradient
                    key={token.symbol}
                    id={`gradient-${idx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={{ stroke: "#374151" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={{ stroke: "#374151" }}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                labelStyle={{ color: "#9ca3af" }}
              />
              {topTokens.map((token, idx) => (
                <Area
                  key={token.symbol}
                  type="monotone"
                  dataKey={token.symbol}
                  stroke={colors[idx % colors.length]}
                  fill={`url(#gradient-${idx})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {topTokens.map((token, idx) => (
            <div key={token.symbol} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="text-[10px] text-gray-400">{token.symbol}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsBar() {
  const { setActiveTab, connected } = useAppStore();

  const actions = [
    { label: "Create V3", tab: "v3-minter" as const, icon: Zap },
    { label: "Create V4", tab: "v4-minter" as const, icon: Plus },
    { label: "MultiHop Mint", tab: "multihop" as const, icon: GitBranch },
    { label: "Claim Rewards", tab: "v4-minter" as const, icon: Gift },
  ];

  return (
    <Card className="bg-gray-900 border-gray-800/70">
      <CardContent className="p-4">
        <p className="text-xs text-gray-400 mb-3 font-medium">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(action.tab)}
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 btn-hover-scale gap-1.5"
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardTab() {
  const {
    connected,
    plsPriceUSD,
    mintCostUSD,
    tokens,
    transactions,
    setPlsPriceUSD,
    setMintCostUSD,
    setLastPriceUpdate,
  } = useAppStore();

  const fetchMarketData = useCallback(async () => {
    try {
      const [plsPrice, mintCost] = await Promise.all([
        getPLSPriceInUSD(),
        getMintCost(),
      ]);
      setPlsPriceUSD(plsPrice);
      setMintCostUSD(mintCost);
      setLastPriceUpdate(Date.now());
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    }
  }, [setPlsPriceUSD, setMintCostUSD, setLastPriceUpdate]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const profitableTokens = tokens.filter((t) => t.profitRatio > 1.0);
  const recentTx = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="PLS Price"
          value={formatUSD(plsPriceUSD)}
          icon={DollarSign}
          subtitle="Live price"
        />
        <StatsCard
          title="Mint Cost"
          value={formatUSD(mintCostUSD)}
          icon={Coins}
          subtitle="Per token"
        />
        <StatsCard
          title="V3 Tokens"
          value={tokens.filter((t) => t.version === "V3").length.toString()}
          icon={Zap}
          subtitle="Active"
        />
        <StatsCard
          title="V4 Tokens"
          value={tokens.filter((t) => t.version === "V4").length.toString()}
          icon={Activity}
          subtitle="Active"
        />
        <StatsCard
          title="Profitable"
          value={profitableTokens.length.toString()}
          icon={TrendingUp}
          subtitle={`of ${tokens.length} tokens`}
          trend={profitableTokens.length > 0 ? "up" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Tokens */}
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800/70 card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Top Performing Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!connected && tokens.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">No tokens tracked yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Connect your wallet and create or add tokens to start tracking performance
                </p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-400">No tokens tracked yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Create or add tokens from the V3/V4 Minter tabs
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .slice(0, 5)
                  .map((token) => (
                    <TokenDetailDialog key={token.address} tokenAddress={token.address}>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
                              {token.name || token.symbol}
                            </p>
                            <p className="text-xs text-gray-500">
                              {token.symbol} · {token.version}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              {formatUSD(token.priceUSD)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatLargeNumber(token.multiplier)}x mult.
                            </p>
                          </div>
                          <ProfitIndicator ratio={token.profitRatio} size="sm" animated={token.profitRatio > 1.5} />
                        </div>
                      </div>
                    </TokenDetailDialog>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Gas + Activity */}
        <div className="space-y-6">
          <GasTrackerCard />

          <Card className="bg-gray-900 border-gray-800/70 card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTx.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-500">No transactions yet</p>
                  <p className="text-xs mt-1 text-gray-600">
                    {connected
                      ? "Start minting to see activity"
                      : "Connect wallet to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTx.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          tx.status === "confirmed"
                            ? "bg-emerald-500"
                            : tx.status === "pending"
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-rose-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {tx.type === "create" && "Created"}{" "}
                          {tx.type === "mint" && "Minted"}{" "}
                          {tx.type === "claim" && "Claimed"}{" "}
                          {tx.type === "multihop" && "MultiHop Minted"}{" "}
                          {tx.type === "withdraw" && "Withdraw"}{" "}
                          {tx.tokenSymbol && (
                            <span className="text-emerald-400">
                              {tx.tokenSymbol}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString()} ·{" "}
                          {tx.version}
                        </p>
                      </div>
                      <Badge
                        variant={
                          tx.status === "confirmed"
                            ? "default"
                            : tx.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className={`text-xs ${
                          tx.status === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : ""
                        }`}
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* Profitability Chart */}
      {tokens.length > 0 && <ProfitabilityChart tokens={tokens} />}

      {/* Quick Stats Bottom Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                <Globe className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Network</p>
                <p className="text-sm font-semibold text-white">PulseChain</p>
              </div>
              <Badge
                variant="outline"
                className="ml-auto border-emerald-500/30 text-emerald-400 text-xs"
              >
                Mainnet
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                <ArrowRight className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Best Profit Ratio</p>
                {tokens.length > 0 ? (
                  <p className="text-sm font-semibold text-emerald-400 font-mono text-glow-emerald-animated">
                    {Math.max(...tokens.map((t) => t.profitRatio)).toFixed(2)}x
                  </p>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-500">No data</p>
                    <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Add tokens first</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                <Coins className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg. Multiplier</p>
                {tokens.length > 0 ? (
                  <p className="text-sm font-semibold text-white font-mono">
                    {(
                      tokens.reduce((s, t) => s + t.multiplier, 0) /
                      tokens.length
                    ).toFixed(2)}x
                  </p>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-500">No data</p>
                    <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Add tokens first</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
