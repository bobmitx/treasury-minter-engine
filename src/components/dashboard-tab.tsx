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
  RefreshCw,
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
  const [gasInfo, setGasInfo] = useState<any>(null);

  useEffect(() => {
    const fetchGas = async () => {
      try {
        const res = await fetch("/api/gas");
        const data = await res.json();
        setGasInfo(data);
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

  const getGasLevel = (plsCost: number) => {
    // PulseChain gas is very cheap; thresholds in PLS for a standard tx
    if (plsCost > 50) return { label: "High", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    if (plsCost > 20) return { label: "Normal", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  };

  const level = gasInfo ? getGasLevel(gasInfo.standard) : { label: "...", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" };

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4 text-amber-400" />
            Gas Tracker
          </CardTitle>
          <Badge variant="outline" className={`${level.bg} ${level.color} ${level.border} border text-[10px]`}>
            {level.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading || !gasInfo ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-white">
                  {gasInfo.standard < 0.001
                    ? gasInfo.standard.toExponential(2)
                    : gasInfo.standard < 1
                    ? gasInfo.standard.toFixed(4)
                    : Math.round(gasInfo.standard)}
                </span>
                <span className="text-xs text-gray-500">PLS</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-0.5">Per standard TX (21K gas)</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center p-1.5 rounded-lg bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Slow</p>
                <p className="text-xs font-mono font-semibold text-gray-300">
                  {gasInfo.slow < 0.001 ? gasInfo.slow.toFixed(4) : Math.round(gasInfo.slow)}
                </p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-gray-800/50 border border-emerald-500/10">
                <p className="text-[10px] text-gray-500">Standard</p>
                <p className="text-xs font-mono font-semibold text-white">
                  {gasInfo.standard < 0.001 ? gasInfo.standard.toFixed(4) : Math.round(gasInfo.standard)}
                </p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Fast</p>
                <p className="text-xs font-mono font-semibold text-gray-300">
                  {gasInfo.fast < 0.001 ? gasInfo.fast.toFixed(4) : Math.round(gasInfo.fast)}
                </p>
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-2 border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">Mint TX cost</span>
                <span className="text-[10px] font-mono text-amber-400">
                  ~{gasInfo.mintStandard || "?"} PLS
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-gray-500">Raw gas price</span>
                <span className="text-[10px] font-mono text-gray-600">
                  {gasInfo.gasPriceGwei?.toLocaleString() || "?"} Gwei
                </span>
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
    lastPriceUpdate,
    setPlsPriceUSD,
    setMintCostUSD,
    setLastPriceUpdate,
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");

  const fetchMarketData = useCallback(async () => {
    setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  }, [setPlsPriceUSD, setMintCostUSD, setLastPriceUpdate]);

  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    await fetchMarketData();
  }, [fetchMarketData, isRefreshing]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Update time-ago text every second
  useEffect(() => {
    const update = () => {
      if (lastPriceUpdate === 0) {
        setTimeAgo("");
        return;
      }
      const diff = Math.floor((Date.now() - lastPriceUpdate) / 1000);
      if (diff < 5) setTimeAgo("just now");
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      else setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastPriceUpdate]);

  // Listen for manual refresh events from keyboard shortcuts
  useEffect(() => {
    const handler = () => {
      fetchMarketData();
    };
    window.addEventListener("treasury-refresh-data", handler);
    return () => window.removeEventListener("treasury-refresh-data", handler);
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

      {/* Price Refresh Indicator */}
      <div className="flex items-center justify-center gap-2">
        {timeAgo && (
          <span className="text-[11px] text-gray-500">
            Last updated: <span className="text-gray-400 font-mono">{timeAgo}</span>
          </span>
        )}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50"
          title="Refresh market data"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
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
