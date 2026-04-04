"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { getPLSPriceInUSD, getMintCost, formatUSD, formatLargeNumber } from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";
import { StatsCard } from "@/components/stats-card";
import { ProfitIndicator } from "@/components/profit-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export function DashboardTab() {
  const {
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
    <div className="space-y-6">
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
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Top Performing Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .slice(0, 5)
                  .map((token) => (
                    <div
                      key={token.address}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {token.name || token.symbol}
                          </p>
                          <p className="text-xs text-gray-400">
                            {token.symbol} · {token.version}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {formatUSD(token.priceUSD)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatLargeNumber(token.multiplier)}x mult.
                          </p>
                        </div>
                        <ProfitIndicator ratio={token.profitRatio} size="sm" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTx.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions yet</p>
                <p className="text-xs mt-1">
                  Connect your wallet to get started
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

      {/* Quick Stats Bottom Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
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

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                <ArrowRight className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Best Profit Ratio</p>
                <p className="text-sm font-semibold text-white">
                  {tokens.length > 0
                    ? `${Math.max(...tokens.map((t) => t.profitRatio)).toFixed(2)}x`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                <Coins className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg. Multiplier</p>
                <p className="text-sm font-semibold text-white">
                  {tokens.length > 0
                    ? `${(
                        tokens.reduce((s, t) => s + t.multiplier, 0) /
                        tokens.length
                      ).toFixed(2)}x`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
