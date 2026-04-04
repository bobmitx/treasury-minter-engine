"use client";

import { useAppStore, TokenData } from "@/lib/store";
import {
  formatUSD,
  formatLargeNumber,
  shortenAddress,
  getExplorerAddressUrl,
} from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Search,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  Download,
  Crown,
  AlertTriangle,
  Percent,
  Plus,
  Rocket,
  LineChart,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { ProfitIndicator } from "@/components/profit-indicator";
import { MiniSparkline } from "@/components/mini-sparkline";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

function generateSparklineData(profitRatio: number): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const noise = (Math.sin(i * 1.3 + profitRatio * 5) * 0.15) + (i * 0.04);
    return Math.max(0, profitRatio * (0.6 + noise + i * 0.06));
  });
}

type SortKey =
  | "name"
  | "symbol"
  | "balance"
  | "priceUSD"
  | "multiplier"
  | "profitRatio";
type SortDir = "asc" | "desc";

const PIE_COLORS = [
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#fb7185", // rose-400
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#e879f9", // fuchsia-400
];

function exportPortfolioCSV(tokens: TokenData[]) {
  if (tokens.length === 0) return;

  const headers = [
    "Name",
    "Symbol",
    "Address",
    "Balance",
    "Price (USD)",
    "Multiplier",
    "Profit Ratio",
    "Value (USD)",
    "Version",
  ];

  const rows = tokens.map((t) => {
    const balance = parseFloat(t.balance) || 0;
    const value = balance * t.priceUSD;
    return [
      t.name || t.symbol,
      t.symbol,
      t.address,
      balance.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      t.priceUSD.toFixed(8),
      t.multiplier.toFixed(2),
      t.profitRatio.toFixed(4),
      value.toFixed(8),
      t.version,
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      symbol: string;
      value: number;
    };
  }>;
}

function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-sm font-medium text-white">{data.name}</p>
        <p className="text-xs text-gray-400">{data.symbol}</p>
        <p className="text-sm text-emerald-400 font-mono mt-1">
          {formatUSD(data.value)}
        </p>
      </div>
    );
  }
  return null;
}

export function PortfolioTab() {
  const { tokens, connected, mintCostUSD, address, setActiveTab } =
    useAppStore();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("profitRatio");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir(sortDir === "asc" ? "desc" : "asc");
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey, sortDir]
  );

  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: number | string = "";
      let bVal: number | string = "";

      switch (sortKey) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "symbol":
          aVal = a.symbol.toLowerCase();
          bVal = b.symbol.toLowerCase();
          break;
        case "balance":
          aVal = parseFloat(a.balance) || 0;
          bVal = parseFloat(b.balance) || 0;
          break;
        case "priceUSD":
          aVal = a.priceUSD;
          bVal = b.priceUSD;
          break;
        case "multiplier":
          aVal = a.multiplier;
          bVal = b.multiplier;
          break;
        case "profitRatio":
          aVal = a.profitRatio;
          bVal = b.profitRatio;
          break;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [tokens, search, sortKey, sortDir]);

  const totalValue = useMemo(() => {
    return tokens.reduce((sum, t) => {
      const balance = parseFloat(t.balance) || 0;
      return sum + balance * t.priceUSD;
    }, 0);
  }, [tokens]);

  const profitableCount = tokens.filter((t) => t.profitRatio > 1.0).length;
  const totalTokens = tokens.length;

  // P&L calculations
  const bestPerformer = useMemo(() => {
    if (tokens.length === 0) return null;
    return tokens.reduce(
      (best, t) => (t.profitRatio > best.profitRatio ? t : best),
      tokens[0]
    );
  }, [tokens]);

  const worstPerformer = useMemo(() => {
    if (tokens.length === 0) return null;
    return tokens.reduce(
      (worst, t) => (t.profitRatio < worst.profitRatio ? t : worst),
      tokens[0]
    );
  }, [tokens]);

  const avgProfitRatio = useMemo(() => {
    if (tokens.length === 0) return 0;
    const sum = tokens.reduce((s, t) => s + t.profitRatio, 0);
    return sum / tokens.length;
  }, [tokens]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (tokens.length === 0) return [];
    return tokens
      .map((t) => {
        const balance = parseFloat(t.balance) || 0;
        return {
          name: t.name || t.symbol,
          symbol: t.symbol,
          value: balance * t.priceUSD,
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tokens]);

  if (!connected) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-16 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-sm text-gray-400">
            Connect your wallet to view your portfolio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Stats Grid (3 cols on left, spans 3/5) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">Total Value</span>
              </div>
              <p className="text-xl font-bold text-white number-animate">
                {formatUSD(totalValue)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">Total Tokens</span>
              </div>
              <p className="text-xl font-bold text-white number-animate">
                {totalTokens}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-gray-400">Profitable</span>
              </div>
              <p className="text-xl font-bold text-emerald-400 number-animate">
                {profitableCount}
                <span className="text-sm text-gray-500 ml-1">
                  / {totalTokens}
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-3 w-3 text-rose-400" />
                <span className="text-xs text-gray-400">Unprofitable</span>
              </div>
              <p className="text-xl font-bold text-rose-400 number-animate">
                {totalTokens - profitableCount}
                <span className="text-sm text-gray-500 ml-1">
                  / {totalTokens}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart (spans 2/5 on right) */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2 card-hover glass-card-depth border-rotate">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <LineChart className="h-3.5 w-3.5" />
              Distribution by Value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                No token data yet
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={<CustomPieTooltip />}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 pb-2 justify-center">
                  {pieData.slice(0, 5).map((entry, i) => (
                    <div
                      key={entry.symbol}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      <span className="text-gray-400">{entry.symbol}</span>
                    </div>
                  ))}
                  {pieData.length > 5 && (
                    <span className="text-xs text-gray-600">
                      +{pieData.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* P&L Summary Row */}
      {tokens.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Best Performer */}
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth">
            <CardContent className="p-4 flex items-center gap-3 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Crown className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Best Performer</p>
                <p className="text-sm font-medium text-white truncate">
                  {bestPerformer?.name || bestPerformer?.symbol || "—"}
                </p>
                <p className="text-sm font-mono font-bold text-emerald-400 text-glow-emerald-animated">
                  {bestPerformer
                    ? `${bestPerformer.profitRatio.toFixed(2)}x`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Worst Performer */}
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth">
            <CardContent className="p-4 flex items-center gap-3 bg-gradient-to-br from-rose-500/5 to-transparent">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Worst Performer</p>
                <p className="text-sm font-medium text-white truncate">
                  {worstPerformer?.name || worstPerformer?.symbol || "—"}
                </p>
                <p className="text-sm font-mono font-bold text-rose-400">
                  {worstPerformer
                    ? `${worstPerformer.profitRatio.toFixed(2)}x`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Avg. Profit Ratio */}
          <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  avgProfitRatio > 1
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-rose-500/10 border-rose-500/20"
                }`}
              >
                <Percent
                  className={`h-4 w-4 ${
                    avgProfitRatio > 1
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-0.5">
                  Avg. Profit Ratio
                </p>
                <p
                  className={`text-lg font-mono font-bold ${
                    avgProfitRatio > 1
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {avgProfitRatio.toFixed(2)}x
                </p>
                <p className="text-xs text-gray-500">
                  across {totalTokens} token{totalTokens !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Table */}
      <Card className="bg-gray-900 border-gray-800 glass-card-depth">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              Token Portfolio
              <Badge
                variant="outline"
                className="ml-1 border-gray-700 text-gray-400 text-xs"
              >
                {tokens.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPortfolioCSV(tokens)}
                disabled={tokens.length === 0}
                className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white btn-hover-scale"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Export CSV
              </Button>
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                <Input
                  placeholder="Search tokens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white pl-8 text-sm h-8 input-glow"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 && !search ? (
            /* Improved Empty State */
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center animate-bounce">
                <Wallet className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your Portfolio is Empty
              </h3>
              <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
                Start building your treasury portfolio by creating and minting
                PulseChain tokens.
              </p>

              {/* 3-Step Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-white">Create</span>
                  <span className="text-[10px] text-gray-500">
                    New V3/V4 token
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-white">Mint</span>
                  <span className="text-[10px] text-gray-500">
                    Tokens to grow
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-xs font-medium text-white">Track</span>
                  <span className="text-[10px] text-gray-500">
                    Profits & ratios
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setActiveTab("v3-minter")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Token
              </Button>
            </div>
          ) : filteredAndSortedTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tokens match your search</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">
                      <button
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Token
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right">
                      <button
                        onClick={() => toggleSort("balance")}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Balance
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right hidden md:table-cell">
                      <button
                        onClick={() => toggleSort("priceUSD")}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Price
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right hidden md:table-cell">
                      <button
                        onClick={() => toggleSort("multiplier")}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Multiplier
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right">
                      <button
                        onClick={() => toggleSort("profitRatio")}
                        className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                      >
                        Profit Ratio
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right hidden lg:table-cell">
                      Value
                    </TableHead>
                    <TableHead className="text-gray-400 text-center w-20 hidden xl:table-cell">
                      Trend
                    </TableHead>
                    <TableHead className="text-gray-400 text-center w-10">
                      Ver
                    </TableHead>
                    <TableHead className="text-gray-400 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTokens.map((token) => {
                    const balance = parseFloat(token.balance) || 0;
                    const value = balance * token.priceUSD;
                    const isV4 = token.version === "V4";

                    return (
                      <TableRow
                        key={token.address}
                        className="border-gray-800 hover:bg-gray-800/80 transition-all duration-200 cursor-pointer hover-lift"
                        onClick={() =>
                          window.open(
                            getExplorerAddressUrl(token.address),
                            "_blank"
                          )
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isV4
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {token.symbol.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {token.name || token.symbol}
                              </p>
                              <p className="text-xs text-gray-500 font-mono truncate">
                                {shortenAddress(token.address, 4)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-white font-mono">
                          {balance.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-sm text-white hidden md:table-cell">
                          {formatUSD(token.priceUSD)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-300 font-mono hidden md:table-cell">
                          {formatLargeNumber(token.multiplier)}x
                        </TableCell>
                        <TableCell className="text-right">
                          <ProfitIndicator
                            ratio={token.profitRatio}
                            size="sm"
                            showLabel={false}
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm text-white font-mono hidden lg:table-cell">
                          {formatUSD(value)}
                        </TableCell>
                        <TableCell className="text-center hidden xl:table-cell">
                          <div className="flex justify-center">
                            <MiniSparkline
                              data={generateSparklineData(token.profitRatio)}
                              width={64}
                              height={20}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isV4
                                ? "border-amber-500/30 text-amber-400"
                                : "border-emerald-500/30 text-emerald-400"
                            }`}
                          >
                            {token.version}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                getExplorerAddressUrl(token.address),
                                "_blank"
                              );
                            }}
                          >
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
