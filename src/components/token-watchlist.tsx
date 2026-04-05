"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppStore, TokenData } from "@/lib/store";
import { formatUSD, formatLargeNumber } from "@/lib/ethereum";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProfitIndicator } from "@/components/profit-indicator";
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import {
  Eye,
  EyeOff,
  Plus,
  Search,
  Star,
  Trash2,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  Crown,
  Percent,
  Sparkles,
  ChevronDown,
  X,
  Check,
  Zap,
  ListFilter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortOption = "profit" | "multiplier" | "name" | "recent";
type ViewMode = "compact" | "full";

// ── Empty State ──────────────────────────────────────────────────────────────
function WatchlistEmptyState({ onOpenAdd }: { onOpenAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border border-gray-800 flex items-center justify-center animate-gentle-bounce">
          <Eye className="h-9 w-9 text-gray-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Star className="h-3 w-3 text-emerald-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Start watching tokens
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Add tokens to your watchlist to track their performance, set price
        alerts, and monitor profit ratios at a glance.
      </p>
      <Button
        onClick={onOpenAdd}
        className="btn-hover-scale gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
      >
        <Plus className="h-4 w-4" />
        Add from Tracked Tokens
      </Button>
    </div>
  );
}

// ── Compact Watchlist Item ───────────────────────────────────────────────────
function CompactWatchlistItem({
  token,
  onRemove,
}: {
  token: TokenData;
  onRemove: (addr: string) => void;
}) {
  return (
    <TokenDetailDialog tokenAddress={token.address}>
      <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-700/50">
        {/* Avatar */}
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
            token.version === "V4"
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          )}
        >
          {token.symbol.charAt(0)}
        </div>

        {/* Name + Symbol */}
        <span className="text-sm text-gray-200 font-medium truncate flex-1 min-w-0">
          {token.symbol}
        </span>

        {/* Price */}
        <span className="text-xs text-gray-400 font-mono flex-shrink-0">
          {formatUSD(token.priceUSD)}
        </span>

        {/* Profit Ratio */}
        <div className="flex-shrink-0">
          <ProfitIndicator ratio={token.profitRatio} size="sm" showLabel={false} />
        </div>

        {/* Remove button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(token.address);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-500/10"
        >
          <Trash2 className="h-3 w-3 text-rose-400" />
        </button>
      </div>
    </TokenDetailDialog>
  );
}

// ── Full Watchlist Item ──────────────────────────────────────────────────────
function FullWatchlistItem({
  token,
  onRemove,
  index,
}: {
  token: TokenData;
  onRemove: (addr: string) => void;
  index: number;
}) {
  const balance = parseFloat(token.balance) || 0;
  const value = balance * token.priceUSD;

  return (
    <TokenDetailDialog tokenAddress={token.address}>
      <div
        className="group relative p-4 rounded-xl bg-gray-800/40 border border-gray-800 hover:border-gray-700 card-hover transition-all duration-300 cursor-pointer animate-fade-in-up"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        {/* Top row: Avatar + Name + Version + Price */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
              token.version === "V4"
                ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 text-amber-400"
                : "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 text-emerald-400"
            )}
          >
            {token.symbol.slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + Symbol + Version badge */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-white truncate">
                {token.name || token.symbol}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] flex-shrink-0",
                  token.version === "V4"
                    ? "border-amber-500/30 text-amber-400"
                    : "border-emerald-500/30 text-emerald-400"
                )}
              >
                {token.version}
              </Badge>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {token.symbol}
            </span>
          </div>

          {/* Current Price */}
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
              Price
            </p>
            <p className="text-sm font-semibold text-white font-mono number-animate">
              {formatUSD(token.priceUSD)}
            </p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="mt-3 flex items-center justify-between gap-4">
          {/* Profit Ratio */}
          <ProfitIndicator ratio={token.profitRatio} size="sm" animated />

          {/* Multiplier */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Mult.
            </span>
            <span
              className={cn(
                "text-sm font-bold font-mono number-animate",
                token.multiplier > 1
                  ? "text-emerald-400"
                  : "text-gray-400"
              )}
            >
              {formatLargeNumber(token.multiplier)}x
            </span>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Bal.
            </span>
            <span className="text-sm font-mono text-gray-300">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Value */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Value
            </span>
            <span className="text-sm font-mono text-gray-300">
              {formatUSD(value)}
            </span>
          </div>

          {/* Remove button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(token.address);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-500/10 flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
          </button>
        </div>
      </div>
    </TokenDetailDialog>
  );
}

// ── Add to Watchlist Dialog ──────────────────────────────────────────────────
function AddToWatchlistDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tokens, watchlist, addToWatchlist, removeFromWatchlist } =
    useAppStore();
  const [search, setSearch] = useState("");

  const availableTokens = useMemo(() => {
    const notInWatchlist = tokens.filter(
      (t) => !watchlist.includes(t.address)
    );
    if (!search.trim()) return notInWatchlist;
    const q = search.toLowerCase();
    return notInWatchlist.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [tokens, watchlist, search]);

  const alreadyWatchlisted = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return tokens.filter(
      (t) =>
        watchlist.includes(t.address) &&
        (t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q))
    );
  }, [tokens, watchlist, search]);

  const profitableTokens = useMemo(
    () => tokens.filter((t) => t.profitRatio > 1.0 && !watchlist.includes(t.address)),
    [tokens, watchlist]
  );

  const handleAddAllProfitable = useCallback(() => {
    let added = 0;
    profitableTokens.forEach((t) => {
      if (!watchlist.includes(t.address)) {
        addToWatchlist(t.address);
        added++;
      }
    });
    toast.success(`Added ${added} profitable tokens to watchlist`);
  }, [profitableTokens, watchlist, addToWatchlist]);

  const handleToggle = useCallback(
    (address: string, symbol: string) => {
      if (watchlist.includes(address)) {
        removeFromWatchlist(address);
        toast.success(`${symbol} removed from watchlist`);
      } else {
        addToWatchlist(address);
        toast.success(`${symbol} added to watchlist`);
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg neon-border-emerald">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-400" />
            Add to Watchlist
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Search and add tracked tokens to your personal watchlist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, symbol, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 input-focus-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Quick add all profitable */}
          {profitableTokens.length > 0 && !search && (
            <Button
              onClick={handleAddAllProfitable}
              variant="outline"
              className="w-full bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 btn-hover-scale gap-2"
            >
              <Zap className="h-4 w-4" />
              Quick Add All Profitable Tokens ({profitableTokens.length})
            </Button>
          )}

          {/* Already in watchlist results */}
          {search && alreadyWatchlisted.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
                Already in watchlist
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                {alreadyWatchlisted.slice(0, 5).map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/30 opacity-60"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                        token.version === "V4"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-400 flex-1 truncate">
                      {token.symbol}
                    </span>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] text-gray-500">
                      Watching
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available tokens list */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
              Available tokens ({availableTokens.length})
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
              {availableTokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">
                    {tokens.length === 0
                      ? "No tracked tokens yet"
                      : "No matching tokens found"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {tokens.length === 0
                      ? "Add tokens in V3 or V4 Minter first"
                      : "Try a different search term"}
                  </p>
                </div>
              ) : (
                availableTokens.map((token) => (
                  <div
                    key={token.address}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/60 transition-all duration-200"
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        token.version === "V4"
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {token.symbol.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {token.symbol}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] flex-shrink-0",
                            token.version === "V4"
                              ? "border-amber-500/30 text-amber-400"
                              : "border-emerald-500/30 text-emerald-400"
                          )}
                        >
                          {token.version}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 font-mono truncate block">
                        {token.name}
                      </span>
                    </div>

                    {/* Price + Ratio */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 font-mono">
                        {formatUSD(token.priceUSD)}
                      </p>
                      <ProfitIndicator
                        ratio={token.profitRatio}
                        size="sm"
                        showLabel={false}
                      />
                    </div>

                    {/* Add button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(token.address, token.symbol)}
                      className="btn-hover-scale flex-shrink-0 h-7 px-2.5 gap-1 bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary */}
          <Separator className="bg-gray-800" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {watchlist.length} token{watchlist.length !== 1 ? "s" : ""} in
              watchlist
            </span>
            <span>{availableTokens.length} available to add</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Watchlist Summary ────────────────────────────────────────────────────────
function WatchlistSummary({ tokens }: { tokens: TokenData[] }) {
  const avgProfit =
    tokens.length > 0
      ? tokens.reduce((sum, t) => sum + t.profitRatio, 0) / tokens.length
      : 0;

  const bestToken = useMemo(() => {
    if (tokens.length === 0) return null;
    return tokens.reduce((best, t) =>
      t.profitRatio > best.profitRatio ? t : best
    );
  }, [tokens]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/30 border border-gray-800">
      <div className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-500">
          <span className="text-white font-semibold">{tokens.length}</span> tokens
        </span>
      </div>

      <div className="w-px h-4 bg-gray-700" />

      <div className="flex items-center gap-1.5">
        <Percent className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-500">
          Avg{" "}
          <span
            className={cn(
              "font-semibold",
              avgProfit > 1 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {avgProfit.toFixed(2)}x
          </span>
        </span>
      </div>

      {bestToken && (
        <>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-gray-500">
              Best{" "}
              <span className="text-amber-400 font-semibold">
                {bestToken.symbol}
              </span>{" "}
              <span
                className={cn(
                  "font-semibold",
                  bestToken.profitRatio > 1
                    ? "text-emerald-400"
                    : "text-rose-400"
                )}
              >
                {bestToken.profitRatio.toFixed(2)}x
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Watchlist Button (used by V3/V4 minter tabs) ─────────────────────────────
export function WatchlistButton({ tokenAddress, size = "md" }: { tokenAddress: string; size?: "sm" | "md" }) {
  const { watchlist, toggleWatchlist } = useAppStore();
  const isWatched = watchlist.includes(tokenAddress);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleWatchlist(tokenAddress);
      }}
      className={cn(
        `${padding} rounded-lg transition-all duration-200 flex-shrink-0`,
        isWatched
          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
      )}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isWatched ? (
        <Star className={cn(iconSize, "fill-amber-400")} />
      ) : (
        <Star className={iconSize} />
      )}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function TokenWatchlist() {
  const { tokens, watchlist, removeFromWatchlist } = useAppStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("profit");
  const [viewMode, setViewMode] = useState<ViewMode>("full");

  const watchlistTokens = useMemo(() => {
    const watched = tokens.filter((t) => watchlist.includes(t.address));
    const sorted = [...watched];

    switch (sortOption) {
      case "profit":
        sorted.sort((a, b) => b.profitRatio - a.profitRatio);
        break;
      case "multiplier":
        sorted.sort((a, b) => b.multiplier - a.multiplier);
        break;
      case "name":
        sorted.sort((a, b) =>
          a.symbol.localeCompare(b.symbol)
        );
        break;
      case "recent":
        // watchlist order is the add order, so we keep the array index order
        sorted.sort(
          (a, b) => watchlist.indexOf(a.address) - watchlist.indexOf(b.address)
        );
        break;
    }

    return sorted;
  }, [tokens, watchlist, sortOption]);

  const handleRemove = useCallback(
    (address: string) => {
      const token = tokens.find((t) => t.address === address);
      removeFromWatchlist(address);
      toast.success(
        `${token?.symbol || "Token"} removed from watchlist`
      );
    },
    [tokens, removeFromWatchlist]
  );

  const sortLabels: Record<SortOption, string> = {
    profit: "By Profit Ratio",
    multiplier: "By Multiplier",
    name: "By Name",
    recent: "By Recently Added",
  };

  return (
    <div className="animate-fade-in-up">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Watchlist
              {watchlist.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                >
                  {watchlist.length}
                </Badge>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 btn-hover-scale text-xs"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span className="hidden sm:inline">{sortLabels[sortOption]}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gray-900 border-gray-700 text-gray-300"
            >
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSortOption(option)}
                  className={cn(
                    "text-xs cursor-pointer",
                    sortOption === option &&
                      "text-emerald-400 bg-emerald-500/5"
                  )}
                >
                  {sortLabels[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center bg-gray-800/60 rounded-lg border border-gray-700 p-0.5">
            <button
              onClick={() => setViewMode("full")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                viewMode === "full"
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              )}
              title="Full view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                viewMode === "compact"
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              )}
              title="Compact view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add token button */}
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white btn-hover-scale text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Token</span>
          </Button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {watchlistTokens.length === 0 ? (
        <WatchlistEmptyState onOpenAdd={() => setAddDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {/* Watchlist items */}
          <div
            className={cn(
              viewMode === "compact"
                ? "space-y-0.5 max-h-96 overflow-y-auto custom-scrollbar rounded-xl bg-gray-800/20 border border-gray-800 p-2"
                : "space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar"
            )}
          >
            {watchlistTokens.map((token, index) =>
              viewMode === "compact" ? (
                <CompactWatchlistItem
                  key={token.address}
                  token={token}
                  onRemove={handleRemove}
                />
              ) : (
                <FullWatchlistItem
                  key={token.address}
                  token={token}
                  onRemove={handleRemove}
                  index={index}
                />
              )
            )}
          </div>

          {/* Summary */}
          <WatchlistSummary tokens={watchlistTokens} />
        </div>
      )}

      {/* ── Add to Watchlist Dialog ─────────────────────────────────────── */}
      <AddToWatchlistDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
