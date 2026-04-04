"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import {
  createV3Token,
  mintV3,
  getMultiplier,
  getTokenPrice,
  getTokenBalance,
  getTokenInfo,
  getMintCost,
  getExplorerTxUrl,
  shortenAddress,
  formatUSD,
  formatLargeNumber,
} from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";
import { StatsCard } from "@/components/stats-card";
import { ProfitIndicator } from "@/components/profit-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap,
  Plus,
  Coins,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function V3MinterTab() {
  const {
    connected,
    address,
    mintCostUSD,
    tokens,
    addToken,
    addTransaction,
  } = useAppStore();

  // Create token form
  const [createName, setCreateName] = useState("");
  const [createSymbol, setCreateSymbol] = useState("");
  const [createInitialMint, setCreateInitialMint] = useState("1000");
  const [createParent, setCreateParent] = useState(CONTRACTS.tbill);
  const [creating, setCreating] = useState(false);

  // Mint form
  const [mintToken, setMintToken] = useState("");
  const [mintAmount, setMintAmount] = useState("1000");
  const [minting, setMinting] = useState(false);

  // Multiplier display
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [loadingMultiplier, setLoadingMultiplier] = useState(false);

  // Token preview
  const [mintPreview, setMintPreview] = useState<{
    cost: number;
    ratio: number;
  } | null>(null);

  // Token list refresh
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const fetchMultiplier = useCallback(async () => {
    setLoadingMultiplier(true);
    try {
      // Fetch V3 Index Minter multiplier
      const mult = await getMultiplier(CONTRACTS.v3IndexMinter, 1);
      setCurrentMultiplier(mult);
    } catch (error) {
      console.error("Error fetching multiplier:", error);
    } finally {
      setLoadingMultiplier(false);
    }
  }, []);

  const fetchMintPreview = useCallback(async () => {
    if (!mintToken || !mintAmount) {
      setMintPreview(null);
      return;
    }
    try {
      const [price, cost] = await Promise.all([
        getTokenPrice(mintToken),
        getMintCost(),
      ]);
      const ratio = cost > 0 ? price.priceUSD / cost : 0;
      setMintPreview({ cost, ratio });
    } catch (error) {
      setMintPreview(null);
    }
  }, [mintToken, mintAmount]);

  useEffect(() => {
    fetchMultiplier();
    const interval = setInterval(fetchMultiplier, 15000);
    return () => clearInterval(interval);
  }, [fetchMultiplier]);

  useEffect(() => {
    const timer = setTimeout(fetchMintPreview, 300);
    return () => clearTimeout(timer);
  }, [fetchMintPreview]);

  const handleCreateToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!createName.trim() || !createSymbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }
    if (!createInitialMint || parseFloat(createInitialMint) <= 0) {
      toast.error("Initial mint amount must be positive");
      return;
    }

    setCreating(true);
    try {
      const result = await createV3Token(
        createName.trim(),
        createSymbol.trim().toUpperCase(),
        parseFloat(createInitialMint),
        createParent
      );

      toast.success(
        <div className="space-y-1">
          <p>Token created successfully!</p>
          <a
            href={getExplorerTxUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      addTransaction({
        id: `tx-${Date.now()}`,
        type: "create",
        version: "V3",
        tokenAddress: result.tokenAddress,
        tokenSymbol: createSymbol.trim().toUpperCase(),
        amount: createInitialMint,
        txHash: result.txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      // Reset form
      setCreateName("");
      setCreateSymbol("");
      setCreateInitialMint("1000");

      // Refresh multiplier
      fetchMultiplier();
    } catch (error: any) {
      toast.error(error.message || "Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const handleMint = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!mintToken) {
      toast.error("Please select a token to mint");
      return;
    }
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast.error("Mint amount must be positive");
      return;
    }

    setMinting(true);
    try {
      const txHash = await mintV3(mintToken, parseFloat(mintAmount));

      toast.success(
        <div className="space-y-1">
          <p>Minted {mintAmount} tokens successfully!</p>
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      const tokenData = tokens.find((t) => t.address === mintToken);
      addTransaction({
        id: `tx-${Date.now()}`,
        type: "mint",
        version: "V3",
        tokenAddress: mintToken,
        tokenSymbol: tokenData?.symbol,
        amount: mintAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      // Refresh multiplier
      fetchMultiplier();
    } catch (error: any) {
      toast.error(error.message || "Failed to mint tokens");
    } finally {
      setMinting(false);
    }
  };

  const refreshTokenList = async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const v3Tokens = tokens.filter((t) => t.version === "V3");
      for (const token of v3Tokens) {
        try {
          const [price, balance, mult] = await Promise.all([
            getTokenPrice(token.address),
            getTokenBalance(token.address, address),
            getMultiplier(token.address, 1),
          ]);
          addToken({
            ...token,
            balance,
            priceUSD: price.priceUSD,
            pricePLS: price.pricePLS,
            multiplier: mult,
            profitRatio: mintCostUSD > 0 ? price.priceUSD / mintCostUSD : 0,
            lastUpdated: Date.now(),
          });
        } catch {
          // skip failed tokens
        }
      }
      toast.success("Token list refreshed");
    } catch (error: any) {
      toast.error("Failed to refresh tokens");
    } finally {
      setRefreshing(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    toast.success("Address copied");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const v3Tokens = tokens.filter((t) => t.version === "V3");

  return (
    <div className="space-y-6">
      {/* Multiplier Display */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">V3 Index Multiplier</p>
              <div className="flex items-center gap-3">
                {loadingMultiplier ? (
                  <Skeleton className="h-12 w-32" />
                ) : (
                  <span className="text-4xl font-bold font-mono text-white">
                    {formatLargeNumber(currentMultiplier)}x
                  </span>
                )}
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400"
                >
                  Live
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Increases every 1,111,111,111 tokens minted globally
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMultiplier}
              disabled={loadingMultiplier}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${loadingMultiplier ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Token */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Create New V3 Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Token Name</Label>
              <Input
                placeholder="My Token"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                disabled={!connected}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Symbol</Label>
              <Input
                placeholder="MTK"
                value={createSymbol}
                onChange={(e) => setCreateSymbol(e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 text-white font-mono"
                maxLength={10}
                disabled={!connected}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Initial Mint Amount</Label>
              <Input
                type="number"
                placeholder="1000"
                value={createInitialMint}
                onChange={(e) => setCreateInitialMint(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                disabled={!connected}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Parent Token</Label>
              <div className="flex gap-2">
                <Input
                  value={createParent}
                  onChange={(e) => setCreateParent(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-xs flex-1"
                  placeholder="0x..."
                  disabled={!connected}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 text-xs flex-shrink-0"
                  onClick={() => setCreateParent(CONTRACTS.tbill)}
                >
                  T-BILL
                </Button>
              </div>
            </div>
            <Button
              onClick={handleCreateToken}
              disabled={creating || !connected}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : "Create Token"}
            </Button>
            {!connected && (
              <p className="text-xs text-gray-500 text-center">
                Connect wallet to create tokens
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mint Panel */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              Mint V3 Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Token Address</Label>
              <Input
                value={mintToken}
                onChange={(e) => setMintToken(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
                placeholder="0x..."
                disabled={!connected}
              />
              {v3Tokens.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {v3Tokens.slice(0, 5).map((t) => (
                    <button
                      key={t.address}
                      onClick={() => setMintToken(t.address)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        mintToken === t.address
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Mint Amount</Label>
              <Input
                type="number"
                placeholder="1000"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                disabled={!connected}
              />
            </div>

            {/* Mint Preview */}
            {mintPreview && (
              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mint Cost</span>
                  <span className="text-white">
                    {formatUSD(mintPreview.cost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Profit Ratio</span>
                  <ProfitIndicator ratio={mintPreview.ratio} size="sm" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Action</span>
                  <span
                    className={`font-medium ${
                      mintPreview.ratio > 1.0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {mintPreview.ratio > 1.0
                      ? `${mintPreview.ratio.toFixed(2)}x Mint for profit`
                      : "Below profit threshold"}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleMint}
              disabled={minting || !connected || !mintToken}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              {minting ? "Minting..." : "Mint Tokens"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active V3 Tokens List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Active V3 Tokens
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshTokenList}
              disabled={refreshing || !connected}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {v3Tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No V3 tokens tracked yet</p>
              <p className="text-xs mt-1">
                Create or add a token to start tracking
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {v3Tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .map((token) => (
                    <div
                      key={token.address}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {token.name || token.symbol}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-mono">
                              {token.symbol}
                            </span>
                            <span className="text-xs text-gray-600">·</span>
                            <span className="text-xs text-gray-500 font-mono">
                              {shortenAddress(token.address)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-white">
                            {formatUSD(token.priceUSD)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatLargeNumber(token.multiplier)}x mult.
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyAddress(token.address)}
                        >
                          {copiedAddress === token.address ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            window.open(
                              getExplorerAddressUrl(token.address),
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setMintToken(token.address);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Mint <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>

                        <ProfitIndicator ratio={token.profitRatio} size="sm" />
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
