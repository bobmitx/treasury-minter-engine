"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppStore, type TokenData } from "@/lib/store";
import { formatUSD, formatLargeNumber, shortenAddress } from "@/lib/ethereum";
import { ProfitIndicator } from "@/components/profit-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  GitCompare,
  Scale,
  X,
  Check,
  TrendingUp,
  ArrowRight,
  Crown,
  Sparkles,
  Copy,
  ExternalLink,
  Eye,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_TOKENS = 4;

// ─── Relative Time Helper ───
function getRelativeTime(timestamp: number): string {
  if (!timestamp) return "Never";
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Custom Chart Tooltip ───
function ComparisonChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-white font-mono font-semibold">
            {entry.value.toFixed(2)}x
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ───
function EmptyState({ hasTrackedTokens }: { hasTrackedTokens: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center mb-4 animate-gentle-bounce">
        <Scale className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-300 mb-1.5">
        Select tokens to compare
      </h3>
      <p className="text-xs text-gray-500 text-center max-w-xs">
        {hasTrackedTokens
          ? "Select 2+ tokens from your tracked list above to see a side-by-side comparison"
          : "You don't have any tracked tokens yet. Create or track tokens first to use the comparison tool."}
      </p>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
        <GitCompare className="h-3.5 w-3.5" />
        <span>Up to {MAX_TOKENS} tokens can be compared at once</span>
      </div>
    </div>
  );
}

// ─── Token Selector Chip ───
function TokenChip({
  token,
  isSelected,
  isDisabled,
  onClick,
}: {
  token: TokenData;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  const isV4 = token.version === "V4";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={!isSelected && isDisabled}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
            "btn-hover-scale",
            isSelected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10"
              : isDisabled
                ? "bg-gray-800/50 border-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                : "bg-gray-800/80 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 cursor-pointer"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
          <span className="font-semibold">{token.symbol}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1 py-0 h-4 border",
              isV4
                ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
            )}
          >
            {token.version}
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
        <p className="font-semibold">{token.name}</p>
        <p className="text-gray-500">{shortenAddress(token.address)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Comparison Card for Each Token ───
function ComparisonCard({
  token,
  transactions,
  onCopyAddress,
  onViewDetails,
  onMintMore,
}: {
  token: TokenData;
  transactions: number;
  onCopyAddress: () => void;
  onViewDetails: () => void;
  onMintMore: () => void;
}) {
  const isV4 = token.version === "V4";
  const balance = parseFloat(token.balance) || 0;
  const totalValue = balance * token.priceUSD;
  const accentColor = isV4 ? "amber" : "emerald";

  return (
    <Card
      className={cn(
        "bg-gray-900/80 border-gray-800 card-hover gradient-border overflow-hidden"
      )}
    >
      {/* Card Header with colored accent stripe */}
      <div className={cn(
        "h-0.5 w-full",
        isV4 ? "bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" : "bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"
      )} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border",
                isV4
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}
            >
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-white leading-tight">
                {token.name}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400">{token.symbol}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1 py-0 h-3.5 border",
                    isV4
                      ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                      : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                  )}
                >
                  {token.version}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Price
          </span>
          <span className="text-sm font-semibold text-white font-mono number-animate">
            {formatUSD(token.priceUSD)}
          </span>
        </div>

        <Separator className="bg-gray-800/60" />

        {/* Balance */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Balance
          </span>
          <span className="text-sm font-semibold text-gray-300 font-mono number-animate">
            {formatLargeNumber(balance)}
          </span>
        </div>

        <Separator className="bg-gray-800/60" />

        {/* Multiplier */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Multiplier
          </span>
          <span
            className={cn(
              "text-sm font-bold font-mono number-animate",
              token.multiplier > 2
                ? "text-emerald-400 text-glow-emerald"
                : token.multiplier > 1
                  ? "text-emerald-300"
                  : "text-gray-400"
            )}
          >
            {token.multiplier.toFixed(2)}x
          </span>
        </div>

        <Separator className="bg-gray-800/60" />

        {/* Profit Ratio */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Profit Ratio
          </span>
          <ProfitIndicator
            ratio={token.profitRatio}
            size="sm"
            showLabel={false}
            animated={token.profitRatio > 1.5}
          />
        </div>

        <Separator className="bg-gray-800/60" />

        {/* Total Value */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Total Value
          </span>
          <span className="text-sm font-semibold text-white font-mono number-animate">
            {formatUSD(totalValue)}
          </span>
        </div>

        <Separator className="bg-gray-800/60" />

        {/* Mint Count */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Mint Count
          </span>
          <span className="text-sm font-semibold text-gray-300 number-animate">
            {transactions > 0 ? transactions : "—"}
          </span>
        </div>

        <Separator className="bg-gray-800/60" />

        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Updated
          </span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-600" />
            <span className="text-xs text-gray-500">
              {getRelativeTime(token.lastUpdated)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className={cn(
                  "flex-1 h-7 text-[10px] border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white btn-hover-scale"
                )}
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
              View token details
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onMintMore}
                className={cn(
                  "flex-1 h-7 text-[10px] border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white btn-hover-scale"
                )}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Mint More
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
              Navigate to minter
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyAddress}
                className={cn(
                  "h-7 w-7 p-0 border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white btn-hover-scale"
                )}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
              Copy contract address
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Insights Section ───
function ComparisonInsights({ selectedTokens }: { selectedTokens: TokenData[] }) {
  const insights = useMemo(() => {
    const sortedByProfit = [...selectedTokens].sort(
      (a, b) => b.profitRatio - a.profitRatio
    );
    const sortedByMultiplier = [...selectedTokens].sort(
      (a, b) => b.multiplier - a.multiplier
    );
    const sortedByValue = [...selectedTokens].sort((a, b) => {
      const valA = (parseFloat(a.balance) || 0) * a.priceUSD;
      const valB = (parseFloat(b.balance) || 0) * b.priceUSD;
      return valB - valA;
    });

    const highestProfit = sortedByProfit[0];
    const bestMultiplier = sortedByMultiplier[0];
    const mostValuable = sortedByValue[0];

    // Determine the "strongest" token (composite score: profit ratio weight 60% + multiplier weight 40%)
    const scored = selectedTokens.map((t) => ({
      token: t,
      score: t.profitRatio * 0.6 + t.multiplier * 0.4,
    }));
    scored.sort((a, b) => b.score - a.score);
    const recommended = scored[0].token;

    return {
      highestProfit,
      bestMultiplier,
      mostValuable,
      recommended,
      highestProfitValue: (parseFloat(highestProfit.balance) || 0) * highestProfit.priceUSD,
      bestMultiplierValue: sortedByMultiplier[0].multiplier,
      mostValuableValue: (parseFloat(mostValuable.balance) || 0) * mostValuable.priceUSD,
      recommendedScore: scored[0].score,
    };
  }, [selectedTokens]);

  if (selectedTokens.length < 2) return null;

  return (
    <div className="space-y-3 animate-fade-in-up">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        Comparison Insights
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Highest Profit Ratio */}
        <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Highest Profit
              </span>
            </div>
            <p className="text-lg font-bold text-white number-animate">
              {insights.highestProfit.symbol}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-500">at</span>
              <ProfitIndicator
                ratio={insights.highestProfit.profitRatio}
                size="sm"
                showLabel={false}
                animated={insights.highestProfit.profitRatio > 1.5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Best Multiplier */}
        <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Best Multiplier
              </span>
            </div>
            <p className="text-lg font-bold text-white number-animate">
              {insights.bestMultiplier.symbol}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-500">at</span>
              <span
                className={cn(
                  "text-sm font-bold font-mono text-glow-emerald text-emerald-400"
                )}
              >
                {insights.bestMultiplierValue.toFixed(2)}x
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Most Valuable */}
        <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Most Valuable
              </span>
            </div>
            <p className="text-lg font-bold text-white number-animate">
              {insights.mostValuable.symbol}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-500">worth</span>
              <span className="text-sm font-bold font-mono text-cyan-400">
                {formatUSD(insights.mostValuableValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Card */}
      <Card className="bg-gray-900/80 border-emerald-500/20 card-hover overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white mb-1">Recommendation</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-emerald-400 font-semibold">
                  {insights.recommended.symbol}
                </span>{" "}
                shows the strongest minting opportunity with a composite score of{" "}
                <span className="text-white font-semibold font-mono">
                  {insights.recommendedScore.toFixed(2)}
                </span>
                . It combines a profit ratio of{" "}
                <span
                  className={cn(
                    "font-mono font-semibold",
                    insights.recommended.profitRatio > 1
                      ? "text-emerald-400"
                      : "text-rose-400"
                  )}
                >
                  {insights.recommended.profitRatio.toFixed(2)}x
                </span>{" "}
                and multiplier of{" "}
                <span
                  className={cn(
                    "font-mono font-semibold",
                    insights.recommended.multiplier > 2
                      ? "text-emerald-400"
                      : "text-gray-300"
                  )}
                >
                  {insights.recommended.multiplier.toFixed(2)}x
                </span>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───
export function TokenComparison() {
  const { tokens, transactions, setActiveTab, setTokenDetailOpen, setTokenDetailAddress } =
    useAppStore();
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);

  // Get selected token data
  const selectedTokens = useMemo(
    () => tokens.filter((t) => selectedAddresses.includes(t.address)),
    [tokens, selectedAddresses]
  );

  // Count transactions per token
  const mintCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === "mint" && tx.tokenAddress) {
        counts[tx.tokenAddress] = (counts[tx.tokenAddress] || 0) + 1;
      }
    });
    return counts;
  }, [transactions]);

  // Toggle token selection
  const toggleToken = useCallback(
    (address: string) => {
      setSelectedAddresses((prev) => {
        if (prev.includes(address)) {
          return prev.filter((a) => a !== address);
        }
        if (prev.length >= MAX_TOKENS) return prev;
        return [...prev, address];
      });
    },
    []
  );

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedAddresses([]);
  }, []);

  // Copy address to clipboard
  const copyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
  }, []);

  // View token details
  const viewDetails = useCallback(
    (token: TokenData) => {
      setTokenDetailAddress(token.address);
      setTokenDetailOpen(true);
    },
    [setTokenDetailAddress, setTokenDetailOpen]
  );

  // Mint more - navigate to appropriate minter tab
  const mintMore = useCallback(
    (token: TokenData) => {
      setActiveTab(token.version === "V4" ? "v4-minter" : "v3-minter");
    },
    [setActiveTab]
  );

  // Chart data
  const chartData = useMemo(() => {
    if (selectedTokens.length === 0) return [];
    return selectedTokens.map((t) => ({
      name: t.symbol,
      profitRatio: t.profitRatio,
      multiplier: t.multiplier,
    }));
  }, [selectedTokens]);

  // Determine grid columns based on selection count
  const gridCols = useMemo(() => {
    const count = selectedTokens.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  }, [selectedTokens.length]);

  const hasTrackedTokens = tokens.length > 0;
  const isAtMax = selectedAddresses.length >= MAX_TOKENS;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6 animate-fade-in-up">
        {/* ─── Comparison Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center glow-emerald">
              <GitCompare className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Token Comparison</h2>
              <p className="text-xs text-gray-500">Select tokens to compare</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 h-5 border",
                isAtMax
                  ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                  : "border-gray-700 text-gray-400 bg-gray-800/50"
              )}
            >
              {selectedAddresses.length}/{MAX_TOKENS} tokens selected
            </Badge>
            {selectedAddresses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="h-7 text-[10px] border-gray-700 hover:border-rose-500/30 bg-gray-800/50 hover:bg-rose-500/5 text-gray-400 hover:text-rose-400 btn-hover-scale"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* ─── Token Selector Chips ─── */}
        {hasTrackedTokens && (
          <Card className="bg-gray-900/80 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Tracked Tokens
                </span>
                {isAtMax && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 border-amber-500/20 text-amber-400 bg-amber-500/5"
                  >
                    Max reached
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {tokens.map((token) => (
                  <TokenChip
                    key={token.address}
                    token={token}
                    isSelected={selectedAddresses.includes(token.address)}
                    isDisabled={isAtMax}
                    onClick={() => toggleToken(token.address)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Empty State ─── */}
        {selectedTokens.length === 0 && (
          <EmptyState hasTrackedTokens={hasTrackedTokens} />
        )}

        {/* ─── Comparison Cards Grid ─── */}
        {selectedTokens.length > 0 && (
          <div className={cn("grid gap-4", gridCols)}>
            {selectedTokens.map((token) => (
              <ComparisonCard
                key={token.address}
                token={token}
                transactions={mintCounts[token.address] || 0}
                onCopyAddress={() => copyAddress(token.address)}
                onViewDetails={() => viewDetails(token)}
                onMintMore={() => mintMore(token)}
              />
            ))}
          </div>
        )}

        {/* ─── Visual Comparison Chart ─── */}
        {selectedTokens.length >= 2 && (
          <Card className="bg-gray-900/80 border-gray-800 card-hover gradient-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Visual Comparison
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-[10px] text-gray-500">Profit Ratio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    <span className="text-[10px] text-gray-500">Multiplier</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                    barCategoryGap="20%"
                  >
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
                    <RechartsTooltip
                      content={<ComparisonChartTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      dataKey="profitRatio"
                      name="Profit Ratio"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`profit-${index}`}
                          fill="#22c55e"
                          opacity={0.85}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="multiplier"
                      name="Multiplier"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`multi-${index}`}
                          fill="#f59e0b"
                          opacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Comparison Insights ─── */}
        {selectedTokens.length >= 2 && (
          <ComparisonInsights selectedTokens={selectedTokens} />
        )}
      </div>
    </TooltipProvider>
  );
}
