"use client";

import { useAppStore } from "@/lib/store";
import { TransactionRecord } from "@/lib/store";
import { getExplorerTxUrl, shortenAddress } from "@/lib/ethereum";
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
} from "lucide-react";
import { useState, useMemo } from "react";

type TxFilter = "all" | "create" | "mint" | "claim" | "multihop" | "withdraw";

export function HistoryTab() {
  const { transactions, connected } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TxFilter>("all");

  const filteredTx = useMemo(() => {
    let result = [...transactions];

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
  }, [transactions, search, filter]);

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
        return <Clock className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />;
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
              }
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
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
          <Input
            placeholder="Search by TX hash, token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white pl-8 text-sm h-8"
          />
        </div>
      </div>

      {/* Transaction Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            Transaction History
            <Badge
              variant="outline"
              className="ml-auto border-gray-700 text-gray-400 text-xs"
            >
              {filteredTx.length} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTx.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs mt-1">
                {transactions.length === 0
                  ? "Start minting to see your transaction history"
                  : "Try adjusting your filters or search"}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Token</TableHead>
                    <TableHead className="text-gray-400 hidden sm:table-cell">
                      Amount
                    </TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">
                      Version
                    </TableHead>
                    <TableHead className="text-gray-400 hidden lg:table-cell">
                      TX Hash
                    </TableHead>
                    <TableHead className="text-gray-400 text-right">
                      Time
                    </TableHead>
                    <TableHead className="text-gray-400 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="border-gray-800 hover:bg-gray-800/50"
                    >
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
                            <span className="text-sm text-gray-500">—</span>
                          )}
                          {tx.details && (
                            <p className="text-xs text-gray-500">{tx.details}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {tx.amount ? (
                          <span className="text-sm text-white font-mono">
                            {parseFloat(tx.amount).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
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
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs font-mono text-gray-400">
                          {tx.txHash ? shortenAddress(tx.txHash, 6) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-gray-400">
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <br />
                          <span className="text-gray-600">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {tx.txHash && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              window.open(
                                getExplorerTxUrl(tx.txHash!),
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
