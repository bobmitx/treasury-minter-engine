"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  GitCompare,
  ArrowLeftRight,
  Trophy,
  TrendingUp,
  TrendingDown,
  X,
  Copy,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfitIndicator } from "@/components/profit-indicator";
import { useAppStore, type TokenData } from "@/lib/store";
import { formatUSD, formatLargeNumber, shortenAddress } from "@/lib/ethereum";

// ─── Sparkline Bar ────────────────────────────────────────────────────────────
function SparklineBar({
  value,
  maxValue,
  color,
  label,
}: {
  value: number;
  maxValue: number;
  color: string;
  label: string;
}) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-400 font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Comparison Metric Bar ────────────────────────────────────────────────────
function ComparisonBar({
  label,
  value1,
  value2,
  formatValue,
  higherIsBetter = true,
}: {
  label: string;
  value1: number;
  value2: number;
  formatValue: (v: number) => string;
  higherIsBetter?: boolean;
}) {
  const max = Math.max(Math.abs(value1), Math.abs(value2), 0.0001);
  const pct1 = max > 0 ? (Math.abs(value1) / max) * 100 : 0;
  const pct2 = max > 0 ? (Math.abs(value2) / max) * 100 : 0;
  const winner =
    higherIsBetter
      ? value1 > value2
        ? 1
        : value2 > value1
          ? 2
          : 0
      : value1 < value2
        ? 1
        : value2 < value1
          ? 2
          : 0;

  const delta =
    value2 !== 0
      ? ((value1 - value2) / Math.abs(value2)) * 100
      : value1 !== 0
        ? 100
        : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 border-gray-700 bg-gray-800/50",
            delta > 0
              ? "text-emerald-400 border-emerald-500/20"
              : delta < 0
                ? "text-rose-400 border-rose-500/20"
                : "text-gray-500"
          )}
        >
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-500">Token 1</span>
            <span
              className={cn(
                "font-mono",
                winner === 1 ? "text-emerald-400 font-semibold" : "text-gray-400"
              )}
            >
              {formatValue(value1)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                winner === 1
                  ? "bg-emerald-500"
                  : "bg-gray-600"
              )}
              style={{ width: `${pct1}%` }}
            />
          </div>
        </div>
        <ArrowLeftRight className="h-3 w-3 text-gray-600 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-500">Token 2</span>
            <span
              className={cn(
                "font-mono",
                winner === 2 ? "text-emerald-400 font-semibold" : "text-gray-400"
              )}
            >
              {formatValue(value2)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                winner === 2
                  ? "bg-amber-500"
                  : "bg-gray-600"
              )}
              style={{ width: `${pct2}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Token Column ─────────────────────────────────────────────────────────────
function TokenColumn({
  token,
  slot,
  selectedAddress,
  tokens,
  onSelect,
}: {
  token: TokenData | null;
  slot: 1 | 2;
  selectedAddress: string | null;
  tokens: TokenData[];
  onSelect: (address: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isV4 = token?.version === "V4";

  const handleCopy = useCallback(() => {
    if (!token?.address) return;
    navigator.clipboard.writeText(token.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [token]);

  const availableTokens = tokens.filter(
    (t) => t.address !== (slot === 1 ? selectedAddress : undefined)
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl p-4 border transition-all duration-300",
        token
          ? isV4
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-emerald-500/5 border-emerald-500/20"
          : "bg-gray-800/30 border-gray-700/50 border-dashed"
      )}
    >
      {/* Selector */}
      <Select
        value={selectedAddress ?? ""}
        onValueChange={onSelect}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            "w-full bg-gray-800/80 border-gray-700 text-white text-sm",
            "hover:border-gray-600 transition-colors",
            "focus:ring-emerald-500/30 focus:border-emerald-500/50"
          )}
        >
          <SelectValue placeholder={`Token ${slot} — Select...`} />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700 max-h-48">
          {availableTokens.length === 0 ? (
            <div className="px-2 py-3 text-sm text-gray-500 text-center">
              No tokens available
            </div>
          ) : (
            availableTokens.map((t) => (
              <SelectItem
                key={t.address}
                value={t.address}
                className="text-gray-300 focus:bg-gray-800 focus:text-white"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      t.version === "V4" ? "bg-amber-400" : "bg-emerald-400"
                    )}
                  />
                  {t.symbol}
                  <span className="text-gray-500 text-xs">{t.name}</span>
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Token Info Card */}
      {token ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                  isV4
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                )}
              >
                {token.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm truncate">
                    {token.symbol}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1 py-0 shrink-0",
                      isV4
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    )}
                  >
                    {token.version}
                  </Badge>
                </div>
                <p className="text-gray-500 text-xs truncate">{token.name}</p>
              </div>
            </div>
          </div>

          {/* Address with copy */}
          <div className="flex items-center gap-1.5 bg-gray-900/60 rounded-md px-2.5 py-1.5">
            <span className="text-gray-500 text-[10px] font-mono flex-1 truncate">
              {shortenAddress(token.address, 6)}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-500 hover:text-white transition-colors shrink-0"
              aria-label="Copy address"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Stats Grid 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Price" value={formatUSD(token.priceUSD)} />
            <StatBox
              label="Multiplier"
              value={`${token.multiplier.toFixed(2)}x`}
              glow={token.multiplier > 1.5}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">Profit Ratio</span>
              <ProfitIndicator ratio={token.profitRatio} size="sm" showLabel={false} />
            </div>
            <StatBox label="Balance" value={formatLargeNumber(parseFloat(token.balance))} />
          </div>

          {/* Value Bar */}
          <div className="space-y-1">
            <SparklineBar
              label="Relative Value"
              value={token.priceUSD * parseFloat(token.balance) || 0}
              maxValue={1}
              color={
                token.profitRatio > 1
                  ? "bg-emerald-500/70"
                  : "bg-rose-500/70"
              }
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <ArrowLeftRight className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">Select a token</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────
function StatBox({
  label,
  value,
  glow = false,
}: {
  label: string;
  value: string;
  glow?: boolean;
}) {
  return (
    <div className="bg-gray-900/60 rounded-lg p-2.5">
      <span className="text-[10px] text-gray-500 block mb-0.5">{label}</span>
      <span
        className={cn(
          "text-sm font-mono font-semibold text-white block",
          glow && "text-glow-emerald number-animate"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up">
      <div className="h-16 w-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
        <GitCompare className="h-8 w-8 text-gray-500" />
      </div>
      <p className="text-gray-400 font-medium text-sm mb-1">
        Select two tokens to compare
      </p>
      <p className="text-gray-600 text-xs text-center max-w-[220px]">
        Choose tokens from the dropdowns above to see a side-by-side performance comparison
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TokenComparison() {
  const tokens = useAppStore((s) => s.tokens);
  const [token1, setToken1] = useState<string | null>(null);
  const [token2, setToken2] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const token1Data = tokens.find((t) => t.address === token1) ?? null;
  const token2Data = tokens.find((t) => t.address === token2) ?? null;
  const bothSelected = !!token1Data && !!token2Data;

  // Determine winner
  const winner =
    bothSelected && token1Data && token2Data
      ? token1Data.profitRatio > token2Data.profitRatio
        ? 1
        : token2Data.profitRatio > token1Data.profitRatio
          ? 2
          : 0
      : 0;

  return (
    <Card
      className={cn(
        "bg-gray-900 border-gray-800 overflow-hidden",
        "glass-card-depth gradient-border card-hover",
        "animate-fade-in-up"
      )}
    >
      {/* Header */}
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <GitCompare className="h-4 w-4 text-emerald-400" />
            </div>
            <CardTitle className="text-white text-sm">Token Comparison</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((v) => !v)}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-gray-800"
            >
              {collapsed ? (
                <ArrowLeftRight className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Collapsed indicator */}
      {collapsed && (
        <CardContent className="pt-2">
          <div className="flex items-center justify-center py-4">
            <p className="text-gray-500 text-xs">
              Click to expand comparison
            </p>
          </div>
        </CardContent>
      )}

      {/* Content */}
      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Two-column comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TokenColumn
              token={token1Data}
              slot={1}
              selectedAddress={token1}
              tokens={tokens}
              onSelect={setToken1}
            />
            <TokenColumn
              token={token2Data}
              slot={2}
              selectedAddress={token2}
              tokens={tokens}
              onSelect={setToken2}
            />
          </div>

          {/* Empty state — no tokens selected */}
          {!token1 && !token2 && tokens.length === 0 && <EmptyState />}

          {/* Empty state — no selection but tokens available */}
          {!token1 && !token2 && tokens.length > 0 && <EmptyState />}

          {/* Comparison Summary — only when both tokens selected */}
          {bothSelected && token1Data && token2Data && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Divider */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">
                    Comparison Summary
                  </span>
                </div>
              </div>

              {/* Winner Indicator */}
              {winner > 0 && (
                <div
                  className={cn(
                    "rounded-lg p-3 border flex items-center gap-3",
                    winner === 1
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}
                >
                  <Trophy
                    className={cn(
                      "h-5 w-5",
                      winner === 1 ? "text-emerald-400" : "text-amber-400"
                    )}
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {(winner === 1 ? token1Data : token2Data).symbol} wins
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Higher profit ratio ({(winner === 1 ? token1Data : token2Data).profitRatio.toFixed(2)}x
                      vs {(winner === 1 ? token2Data : token1Data).profitRatio.toFixed(2)}x)
                    </p>
                  </div>
                  <div className="ml-auto">
                    <ProfitIndicator
                      ratio={(winner === 1 ? token1Data : token2Data).profitRatio}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                </div>
              )}

              {/* Metric Comparison Bars */}
              <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 space-y-4">
                <ComparisonBar
                  label="Price"
                  value1={token1Data.priceUSD}
                  value2={token2Data.priceUSD}
                  formatValue={formatUSD}
                />
                <ComparisonBar
                  label="Multiplier"
                  value1={token1Data.multiplier}
                  value2={token2Data.multiplier}
                  formatValue={(v) => `${v.toFixed(2)}x`}
                />
                <ComparisonBar
                  label="Profit Ratio"
                  value1={token1Data.profitRatio}
                  value2={token2Data.profitRatio}
                  formatValue={(v) => `${v.toFixed(2)}x`}
                />
              </div>

              {/* Quick Delta Summary */}
              <div className="grid grid-cols-3 gap-2">
                <DeltaBadge
                  label="Price Δ"
                  value1={token1Data.priceUSD}
                  value2={token2Data.priceUSD}
                  formatDiff={formatUSD}
                />
                <DeltaBadge
                  label="Multiplier Δ"
                  value1={token1Data.multiplier}
                  value2={token2Data.multiplier}
                  formatDiff={(d) => `${d.toFixed(3)}x`}
                />
                <DeltaBadge
                  label="Profit Δ"
                  value1={token1Data.profitRatio}
                  value2={token2Data.profitRatio}
                  formatDiff={(d) => `${d.toFixed(3)}x`}
                  invertColor
                />
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Delta Badge ──────────────────────────────────────────────────────────────
function DeltaBadge({
  label,
  value1,
  value2,
  formatDiff,
  invertColor = false,
}: {
  label: string;
  value1: number;
  value2: number;
  formatDiff: (d: number) => string;
  invertColor?: boolean;
}) {
  const diff = value1 - value2;
  const isPositive = invertColor ? diff < 0 : diff > 0;
  const isZero = Math.abs(diff) < 0.000001;

  return (
    <div className="bg-gray-800/40 rounded-lg p-2.5 border border-gray-700/50 text-center">
      <span className="text-[10px] text-gray-500 block mb-0.5">{label}</span>
      <div className="flex items-center justify-center gap-1">
        {!isZero &&
          (isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-rose-400" />
          ))}
        <span
          className={cn(
            "text-xs font-mono font-semibold",
            isZero
              ? "text-gray-500"
              : isPositive
                ? "text-emerald-400"
                : "text-rose-400"
          )}
        >
          {isZero ? "—" : `${diff > 0 ? "+" : ""}${formatDiff(diff)}`}
        </span>
      </div>
    </div>
  );
}
