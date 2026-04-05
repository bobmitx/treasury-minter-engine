"use client";

import { useAppStore, TransactionRecord } from "@/lib/store";
import {
  getExplorerTxUrl,
  shortenAddress,
  formatUSD,
} from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  History,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  Plus,
  Gift,
  GitBranch,
  LogOut,
  Download,
  Activity,
  TrendingUp,
  Flame,
  ChevronDown,
  ChevronUp,
  Copy,
  Rocket,
  Hash,
  Gauge,
} from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";

type TxFilter = "all" | "create" | "mint" | "claim" | "multihop" | "withdraw";
type DateRange = "all" | "today" | "7days" | "30days";

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
}

function getFullTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDateRangeFilter(dateRange: DateRange): number | null {
  const now = Date.now();
  switch (dateRange) {
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start.getTime();
    }
    case "7days":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30days":
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function exportHistoryCSV(transactions: TransactionRecord[]) {
  if (transactions.length === 0) return;

  const headers = [
    "Type",
    "Status",
    "Token Symbol",
    "Token Address",
    "Amount",
    "TX Hash",
    "Gas Cost",
    "Version",
    "Timestamp",
    "Details",
  ];

  const rows = transactions.map((tx) => [
    tx.type,
    tx.status,
    tx.tokenSymbol || "",
    tx.tokenAddress || "",
    tx.amount || "",
    tx.txHash,
    tx.gasCost || "",
    tx.version,
    new Date(tx.timestamp).toISOString(),
    tx.details || "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryTab() {
  const { transactions, connected, setActiveTab } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TxFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedTx((prev) => (prev === id ? null : id));
  }, []);

  const filteredTx = useMemo(() => {
    let result = [...transactions];

    // Date range filter
    const rangeStart = getDateRangeFilter(dateRange);
    if (rangeStart) {
      result = result.filter((tx) => tx.timestamp >= rangeStart);
    }

    // Filter by type
    if (filter !== "all") {
      result = result.filter((tx) => tx.type === filter);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          (tx.txHash && tx.txHash.toLowerCase().includes(q)) ||
          (tx.tokenSymbol && tx.tokenSymbol.toLowerCase().includes(q)) ||
          (tx.tokenAddress && tx.tokenAddress.toLowerCase().includes(q)) ||
          (tx.details && tx.details.toLowerCase().includes(q))
      );
    }

    return result;
  }, [transactions, search, filter, dateRange]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = transactions.length;
    const confirmed = transactions.filter(
      (tx) => tx.status === "confirmed"
    ).length;
    const successRate =
      total > 0 ? ((confirmed / total) * 100).toFixed(1) : "0";

    // Most active type
    const typeCounts: Record<string, number> = {};
    transactions.forEach((tx) => {
      typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1;
    });
    const mostActiveType =
      Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "—";

    // Gas spent
    const totalGas = transactions.reduce((sum, tx) => {
      const cost = parseFloat(tx.gasCost || "0");
      return sum + cost;
    }, 0);

    return { total, successRate, mostActiveType, totalGas, confirmed };
  }, [transactions]);

  const filters: { key: TxFilter; label: string; icon: any }[] = [
    { key: "all", label: "All", icon: History },
    { key: "create", label: "Create", icon: Plus },
    { key: "mint", label: "Mint", icon: Zap },
    { key: "claim", label: "Claim", icon: Gift },
    { key: "multihop", label: "MultiHop", icon: GitBranch },
    { key: "withdraw", label: "Withdraw", icon: LogOut },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case "pending":
        return (
          <Clock className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
        );
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "create":
        return <Plus className="h-4 w-4 text-emerald-400" />;
      case "mint":
        return <Zap className="h-4 w-4 text-emerald-400" />;
      case "claim":
        return <Gift className="h-4 w-4 text-amber-400" />;
      case "multihop":
        return <GitBranch className="h-4 w-4 text-emerald-400" />;
      case "withdraw":
        return <LogOut className="h-4 w-4 text-gray-400" />;
      default:
        return <History className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!connected) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-16 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-sm text-gray-400">
            Connect your wallet to view transaction history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] text-gray-400">Total TX</span>
            </div>
            <p className="text-lg font-bold text-white number-animate">
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] text-gray-400">Success Rate</span>
            </div>
            <p
              className={`text-lg font-bold number-animate ${
                parseFloat(stats.successRate) >= 80
                  ? "text-emerald-400"
                  : parseFloat(stats.successRate) >= 50
                    ? "text-amber-400"
                    : "text-rose-400"
              }`}
            >
              {stats.successRate}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] text-gray-400">Most Active</span>
            </div>
            <p className="text-lg font-bold text-white capitalize number-animate">
              {stats.mostActiveType}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800 card-hover glass-card-depth gradient-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge className="h-3 w-3 text-cyan-400" />
              <span className="text-[11px] text-gray-400">Gas Spent</span>
            </div>
            <p className="text-lg font-bold text-white font-mono number-animate">
              {stats.totalGas > 0 ? formatUSD(stats.totalGas) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={`btn-hover-scale hover-lift ${
                filter === f.key
                  ? "border border-gray-700 bg-gray-800 text-white selected-amber-glow"
                  : "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <f.icon className="h-3 w-3 mr-1" />
              {f.label}
              {f.key === "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({transactions.length})
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={dateRange}
            onValueChange={(val) => setDateRange(val as DateRange)}
          >
            <SelectTrigger className="w-full sm:w-36 bg-gray-800 border-gray-700 text-gray-300 text-sm h-8 input-glow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all" className="text-gray-300 focus:bg-gray-800 focus:text-white">
                All Time
              </SelectItem>
              <SelectItem value="today" className="text-gray-300 focus:bg-gray-800 focus:text-white">
                Today
              </SelectItem>
              <SelectItem value="7days" className="text-gray-300 focus:bg-gray-800 focus:text-white">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30days" className="text-gray-300 focus:bg-gray-800 focus:text-white">
                Last 30 Days
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
            <Input
              placeholder="Search by TX hash, token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-8 text-sm h-8 input-glow"
            />
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <Card className="bg-gray-900 border-gray-800 glass-card-depth">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" />
              Transaction History
              <Badge
                variant="outline"
                className="ml-1 border-gray-700 text-gray-400 text-xs badge-pop"
              >
                {filteredTx.length}
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportHistoryCSV(transactions)}
              disabled={transactions.length === 0}
              className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white btn-hover-scale"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && !search && filter === "all" && dateRange === "all" ? (
            /* Improved Empty State */
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center animate-bounce">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Transactions Yet
              </h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                Your transaction history will appear here once you start
                minting or creating tokens.
              </p>
              <Button
                onClick={() => setActiveTab("v3-minter")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale px-6"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Start Minting
              </Button>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs mt-1">
                {transactions.length === 0
                  ? "Start minting to see your transaction history"
                  : "Try adjusting your filters or search"}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400 w-8" />
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Token</TableHead>
                    <TableHead className="text-gray-400 hidden sm:table-cell">
                      Amount
                    </TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">
                      Version
                    </TableHead>
                    <TableHead className="text-gray-400 text-right">
                      Time
                    </TableHead>
                    <TableHead className="text-gray-400 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.map((tx) => {
                    const isExpanded = expandedTx === tx.id;
                    return (
                      <Fragment key={tx.id}>
                        <TableRow
                          className="border-gray-800 hover:bg-gray-800/80 transition-all duration-200 cursor-pointer hover-lift"
                          onClick={() => toggleExpand(tx.id)}
                        >
                          {/* Expand chevron */}
                          <TableCell className="px-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-gray-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(tx.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(tx.type)}
                              <span className="text-sm text-white capitalize">
                                {tx.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {tx.tokenSymbol ? (
                                <span className="text-sm text-emerald-400 font-medium">
                                  {tx.tokenSymbol}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  —
                                </span>
                              )}
                              {tx.details && (
                                <p className="text-xs text-gray-500 truncate max-w-[140px]">
                                  {tx.details}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {tx.amount ? (
                              <span className="text-sm text-white font-mono">
                                {parseFloat(tx.amount).toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 2 }
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                tx.version === "MultiHop"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : tx.version === "V4"
                                    ? "border-amber-500/30 text-amber-400"
                                    : "border-gray-600 text-gray-400"
                              }`}
                            >
                              {tx.version}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-gray-400">
                                  {getRelativeTime(tx.timestamp)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
                                {getFullTimestamp(tx.timestamp)}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {tx.txHash && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    getExplorerTxUrl(tx.txHash!),
                                    "_blank"
                                  );
                                }}
                              >
                                <ExternalLink className="h-3 w-3 text-gray-400" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <TableRow
                            key={`${tx.id}-detail`}
                            className="border-gray-800 bg-gray-800/40 hover:bg-gray-800/40"
                          >
                            <TableCell colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* TX Hash */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Hash className="h-3 w-3" />
                                    TX Hash
                                  </div>
                                  {tx.txHash ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-mono text-gray-300 truncate max-w-[180px]">
                                        {tx.txHash}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 flex-shrink-0"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            tx.txHash!
                                          );
                                        }}
                                      >
                                        <Copy className="h-2.5 w-2.5 text-gray-500 hover:text-white" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-600">
                                      —
                                    </span>
                                  )}
                                </div>

                                {/* Gas Cost */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Gauge className="h-3 w-3" />
                                    Gas Cost
                                  </div>
                                  <span className="text-sm font-mono text-white">
                                    {tx.gasCost
                                      ? formatUSD(parseFloat(tx.gasCost))
                                      : "—"}
                                  </span>
                                </div>

                                {/* Full Timestamp */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    Timestamp
                                  </div>
                                  <span className="text-sm text-gray-300">
                                    {getFullTimestamp(tx.timestamp)}
                                  </span>
                                </div>

                                {/* Version + Status */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Activity className="h-3 w-3" />
                                    Details
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${
                                        tx.version === "MultiHop"
                                          ? "border-emerald-500/30 text-emerald-400"
                                          : tx.version === "V4"
                                            ? "border-amber-500/30 text-amber-400"
                                            : "border-gray-600 text-gray-400"
                                      }`}
                                    >
                                      {tx.version}
                                    </Badge>
                                    {getStatusBadge(tx.status)}
                                  </div>
                                  {tx.tokenAddress && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-[10px] font-mono text-gray-500 truncate block max-w-[180px] cursor-pointer">
                                          {tx.tokenAddress}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
                                        {tx.tokenAddress}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
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
