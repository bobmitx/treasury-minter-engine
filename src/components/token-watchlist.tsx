"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { ProfitIndicator } from "@/components/profit-indicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Star,
  StarOff,
  TrendingUp,
  Trash2,
  Zap,
  ExternalLink,
  Eye,
  ArrowUpDown,
  Clock,
} from "lucide-react";
import { formatUSD, getExplorerAddressUrl, shortenAddress } from "@/lib/ethereum";

// ---------------------------------------------------------------------------
// WatchlistButton — star toggle for individual tokens
// ---------------------------------------------------------------------------

interface WatchlistButtonProps {
  tokenAddress: string;
  size?: "sm" | "md";
}

export function WatchlistButton({ tokenAddress, size = "md" }: WatchlistButtonProps) {
  const watchlist = useAppStore((s) => s.watchlist);
  const toggleWatchlist = useAppStore((s) => s.toggleWatchlist);
  const isWatched = watchlist.includes(tokenAddress);

  const isSmall = size === "sm";
  const iconClass = isSmall ? "h-3.5 w-3.5" : "h-5 w-5";
  const btnClass = isSmall
    ? "h-7 w-7 p-0"
    : "h-8 w-8 p-0";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            btnClass,
            "rounded-full transition-all duration-200",
            isWatched
              ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/50",
            "btn-hover-scale"
          )}
          onClick={() => toggleWatchlist(tokenAddress)}
        >
          <Star
            className={cn(
              iconClass,
              "transition-transform duration-300",
              isWatched && "scale-110"
            )}
            fill={isWatched ? "currentColor" : "none"}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {isWatched ? "Remove from watchlist" : "Add to watchlist"}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

type SortKey = "name" | "profit" | "multiplier" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: "name", label: "Name", icon: <ArrowUpDown className="h-3 w-3" /> },
  { key: "profit", label: "Profit", icon: <TrendingUp className="h-3 w-3" /> },
  { key: "multiplier", label: "Multiplier", icon: <Zap className="h-3 w-3" /> },
  { key: "recent", label: "Recent", icon: <Clock className="h-3 w-3" /> },
];

// ---------------------------------------------------------------------------
// TokenWatchlist — full panel / card view
// ---------------------------------------------------------------------------

export function TokenWatchlist() {
  const tokens = useAppStore((s) => s.tokens);
  const watchlist = useAppStore((s) => s.watchlist);
  const removeFromWatchlist = useAppStore((s) => s.removeFromWatchlist);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const watchedTokens = useMemo(() => {
    const watched = tokens.filter((t) => watchlist.includes(t.address));

    switch (sortBy) {
      case "name":
        return [...watched].sort((a, b) => a.name.localeCompare(b.name));
      case "profit":
        return [...watched].sort((a, b) => b.profitRatio - a.profitRatio);
      case "multiplier":
        return [...watched].sort((a, b) => b.multiplier - a.multiplier);
      case "recent":
      default:
        // Already filtered in store order — stable sort by lastUpdated desc
        return [...watched].sort((a, b) => b.lastUpdated - a.lastUpdated);
    }
  }, [tokens, watchlist, sortBy]);

  const handleClearAll = useCallback(() => {
    watchlist.forEach((addr) => removeFromWatchlist(addr));
  }, [watchlist, removeFromWatchlist]);

  // ---- Empty state ----
  if (watchedTokens.length === 0) {
    return (
      <div className="glass-card-depth gradient-border rounded-xl border border-gray-800 bg-gray-900 p-6 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 animate-gentle-bounce">
            <Star className="h-8 w-8 text-amber-400/60" />
          </div>
          <h3 className="text-base font-semibold text-gray-300 mb-1">
            No tokens in watchlist
          </h3>
          <p className="text-sm text-gray-500 max-w-[260px]">
            Start tracking tokens from V3/V4 Minter tabs
          </p>
        </div>
      </div>
    );
  }

  // ---- Populated state ----
  return (
    <div className="glass-card-depth gradient-border rounded-xl border border-gray-800 bg-gray-900 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
          <h2 className="text-base font-semibold text-white">Watchlist</h2>
          <Badge
            variant="secondary"
            className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs px-2 py-0"
          >
            {watchedTokens.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort selector */}
          <div className="hidden sm:flex items-center gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                  sortBy === opt.key
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
          {/* Mobile sort */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  const keys: SortKey[] = ["name", "profit", "multiplier", "recent"];
                  const idx = (keys.indexOf(sortBy) + 1) % keys.length;
                  setSortBy(keys[idx]);
                }}
                className="sm:hidden flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Sort: {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
            </TooltipContent>
          </Tooltip>
          {/* Clear all */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 text-xs"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Remove all from watchlist
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Token list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-800/60 smooth-scroll">
        {watchedTokens.map((token) => (
          <WatchlistRow
            key={token.address}
            token={token}
            onRemove={() => removeFromWatchlist(token.address)}
            onMintMore={() =>
              setActiveTab(token.version === "V4" ? "v4-minter" : "v3-minter")
            }
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WatchlistRow — single token row inside the panel
// ---------------------------------------------------------------------------

interface WatchlistRowProps {
  token: import("@/lib/store").TokenData;
  onRemove: () => void;
  onMintMore: () => void;
}

function WatchlistRow({ token, onRemove, onMintMore }: WatchlistRowProps) {
  const isV4 = token.version === "V4";
  const firstChars = token.symbol.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5 hover:bg-gray-800/60 transition-colors group animate-stagger-slide-up">
      {/* Star */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-amber-400 hover:text-amber-300 transition-colors"
        aria-label="Remove from watchlist"
      >
        <Star className="h-4 w-4" fill="currentColor" />
      </button>

      {/* Token icon */}
      <div
        className={cn(
          "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border",
          isV4
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        )}
      >
        {firstChars}
      </div>

      {/* Name + symbol + version */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">
            {token.name}
          </span>
          <span className="text-xs text-gray-500 truncate">{token.symbol}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 leading-4 font-mono flex-shrink-0",
              isV4
                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            )}
          >
            {token.version}
          </Badge>
        </div>
        <p className="text-[11px] text-gray-600 font-mono truncate">
          {shortenAddress(token.address)}
        </p>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        <p className="text-sm font-mono text-white">
          {formatUSD(token.priceUSD)}
        </p>
        <p className="text-[11px] text-gray-500">
          {token.balance !== "0"
            ? `${Number(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol}`
            : "—"}
        </p>
      </div>

      {/* Multiplier */}
      <div className="flex-shrink-0 text-right hidden md:block">
        <p
          className={cn(
            "text-sm font-mono font-bold text-glow-emerald-animated",
            token.multiplier >= 1
              ? "text-emerald-400"
              : "text-gray-400"
          )}
        >
          {token.multiplier.toFixed(2)}x
        </p>
        <p className="text-[11px] text-gray-500">mult.</p>
      </div>

      {/* Profit indicator */}
      <div className="flex-shrink-0 hidden lg:block">
        <ProfitIndicator ratio={token.profitRatio} size="sm" showLabel={false} />
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 text-xs",
                isV4
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : "text-emerald-400 hover:bg-emerald-400/10"
              )}
              onClick={onMintMore}
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Mint More
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={getExplorerAddressUrl(token.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            View on Explorer
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50"
              onClick={onRemove}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Remove
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
