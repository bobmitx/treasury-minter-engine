"use client";

import { useAppStore, TokenData } from "@/lib/store";
import { formatUSD, formatLargeNumber, shortenAddress, getExplorerAddressUrl } from "@/lib/ethereum";
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
  Wallet,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Search,
  ArrowUpDown,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { useState, useMemo } from "react";
import { ProfitIndicator } from "@/components/profit-indicator";

type SortKey = "name" | "symbol" | "balance" | "priceUSD" | "multiplier" | "profitRatio";
type SortDir = "asc" | "desc";

export function PortfolioTab() {
  const { tokens, connected, mintCostUSD, address } = useAppStore();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("profitRatio");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

    // Filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q)
      );
    }

    // Sort
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
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Total Value</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatUSD(totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Total Tokens</span>
            </div>
            <p className="text-xl font-bold text-white">{totalTokens}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-gray-400">Profitable</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">
              {profitableCount}
              <span className="text-sm text-gray-500 ml-1">
                / {totalTokens}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3 w-3 text-rose-400" />
              <span className="text-xs text-gray-400">Unprofitable</span>
            </div>
            <p className="text-xl font-bold text-rose-400">
              {totalTokens - profitableCount}
              <span className="text-sm text-gray-500 ml-1">
                / {totalTokens}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              Token Portfolio
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
              <Input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pl-8 text-sm h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {search ? "No tokens match your search" : "No tokens in portfolio"}
              </p>
              <p className="text-xs mt-1">
                {search
                  ? "Try a different search term"
                  : "Create or mint tokens to build your portfolio"}
              </p>
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

                    return (
                      <TableRow
                        key={token.address}
                        className="border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                        onClick={() =>
                          window.open(
                            getExplorerAddressUrl(token.address),
                            "_blank"
                          )
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
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
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              token.version === "V4"
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
