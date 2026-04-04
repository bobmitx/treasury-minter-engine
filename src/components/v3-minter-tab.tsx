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
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
  Trash2,
  Loader2,
  Search,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export function V3MinterTab() {
  const {
    connected,
    address,
    mintCostUSD,
    tokens,
    addToken,
    removeToken,
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

  // Token creation animation state
  const [createdTokenKey, setCreatedTokenKey] = useState(0);

  // Add custom token
  const [addTokenAddress, setAddTokenAddress] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);

  const fetchMultiplier = useCallback(async () => {
    setLoadingMultiplier(true);
    try {
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

      setCreateName("");
      setCreateSymbol("");
      setCreateInitialMint("1000");
      setCreatedTokenKey((k) => k + 1);
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

      fetchMultiplier();
    } catch (error: any) {
      toast.error(error.message || "Failed to mint tokens");
    } finally {
      setMinting(false);
    }
  };

  const handleAddToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!addTokenAddress.trim()) {
      toast.error("Please enter a token address");
      return;
    }

    // Basic address validation
    if (!addTokenAddress.startsWith("0x") || addTokenAddress.length !== 42) {
      toast.error("Invalid token address format");
      return;
    }

    // Check if already tracked
    if (tokens.find((t) => t.address.toLowerCase() === addTokenAddress.toLowerCase())) {
      toast.error("Token is already being tracked");
      return;
    }

    setAddingToken(true);
    try {
      const [info, price, balance, mult] = await Promise.all([
        getTokenInfo(addTokenAddress),
        getTokenPrice(addTokenAddress),
        address ? getTokenBalance(addTokenAddress, address) : Promise.resolve("0"),
        getMultiplier(addTokenAddress, 1),
      ]);

      addToken({
        address: addTokenAddress,
        name: info.name,
        symbol: info.symbol,
        decimals: info.decimals,
        balance,
        priceUSD: price.priceUSD,
        pricePLS: price.pricePLS,
        multiplier: mult,
        profitRatio: mintCostUSD > 0 ? price.priceUSD / mintCostUSD : 0,
        version: "V3",
        lastUpdated: Date.now(),
      });

      setAddTokenAddress("");
      setShowAddToken(false);
      toast.success(`${info.symbol} added to tracking`);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch token info");
    } finally {
      setAddingToken(false);
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

  const handleRemoveToken = (tokenAddress: string) => {
    const token = tokens.find((t) => t.address === tokenAddress);
    removeToken(tokenAddress);
    if (mintToken === tokenAddress) setMintToken("");
    toast.success(`${token?.symbol || "Token"} removed from tracking`);
  };

  const v3Tokens = tokens.filter((t) => t.version === "V3");

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Multiplier Display with Progress Ring */}
      <Card className="bg-gray-900 border-gray-800/70 card-hover">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Progress ring around multiplier value */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="oklch(0.22 0 0)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="oklch(0.7 0.17 162)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={loadingMultiplier ? "0 100" : `${Math.min(currentMultiplier * 5, 100)} 100`}
                    className={cn(!loadingMultiplier && "animate-ring-fill")}
                    style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {loadingMultiplier ? (
                    <Skeleton className="h-8 w-16 shimmer rounded" />
                  ) : (
                    <span className="text-lg font-bold font-mono text-white text-glow-emerald-animated">
                      {formatLargeNumber(currentMultiplier)}x
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">V3 Index Multiplier</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  >
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Increases every 1,111,111,111 tokens minted globally
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMultiplier}
              disabled={loadingMultiplier}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 btn-hover-scale"
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
        {/* Create New Token - with expand animation on success */}
        <Card key={createdTokenKey} className={cn(
          "bg-gray-900 border-gray-800/70 card-hover",
          createdTokenKey > 0 && "animate-expand-in"
        )}>
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
                className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                disabled={!connected}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Symbol</Label>
              <Input
                placeholder="MTK"
                value={createSymbol}
                onChange={(e) => setCreateSymbol(e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
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
                className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                disabled={!connected}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Parent Token</Label>
              <div className="flex gap-2">
                <Input
                  value={createParent}
                  onChange={(e) => setCreateParent(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-xs flex-1 input-focus-ring"
                  placeholder="0x..."
                  disabled={!connected}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 text-xs flex-shrink-0 btn-hover-scale"
                  onClick={() => setCreateParent(CONTRACTS.tbill)}
                >
                  T-BILL
                </Button>
              </div>
            </div>
            <Button
              onClick={handleCreateToken}
              disabled={creating || !connected}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
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
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
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
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs input-focus-ring"
                placeholder="0x..."
                disabled={!connected}
              />
              {v3Tokens.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {v3Tokens.slice(0, 5).map((t) => (
                    <button
                      key={t.address}
                      onClick={() => setMintToken(t.address)}
                      className={`text-xs px-2 py-0.5 rounded border transition-all duration-200 btn-hover-scale ${
                        mintToken === t.address
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
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
                className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                disabled={!connected}
              />
            </div>

            {/* Mint Preview */}
            {mintPreview && (
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mint Cost</span>
                  <span className="text-white">
                    {formatUSD(mintPreview.cost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Profit Ratio</span>
                  <ProfitIndicator ratio={mintPreview.ratio} size="sm" animated={mintPreview.ratio > 1.5} />
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale"
            >
              {minting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {minting ? "Minting..." : "Mint Tokens"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Custom Token */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardContent className="p-4">
          {!showAddToken ? (
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 btn-hover-scale gap-2"
              onClick={() => setShowAddToken(true)}
            >
              <Search className="h-4 w-4" />
              Add Custom Token by Address
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Paste token address (0x...)"
                value={addTokenAddress}
                onChange={(e) => setAddTokenAddress(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs flex-1 input-focus-ring"
                disabled={addingToken}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToken}
                  disabled={addingToken || !addTokenAddress.trim() || !connected}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-1.5"
                >
                  {addingToken ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add Token
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 btn-hover-scale"
                  onClick={() => { setShowAddToken(false); setAddTokenAddress(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active V3 Tokens List */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Active V3 Tokens
              {v3Tokens.length > 0 && (
                <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs ml-2">
                  {v3Tokens.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshTokenList}
              disabled={refreshing || !connected}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs btn-hover-scale"
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
            <div className="text-center py-8">
              <Zap className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">No V3 tokens tracked yet</p>
              <p className="text-xs mt-1 text-gray-600">
                Create a token above or add a custom address to start tracking
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96 scroll-shadow-bottom">
              <div className="space-y-2">
                {v3Tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .map((token, index) => (
                    <div
                      key={token.address}
                      className="animate-stagger-slide-up"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <TokenDetailDialog tokenAddress={token.address}>
                        <div
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all duration-300 cursor-pointer group border border-transparent hover:border-emerald-500/20 hover:shadow-[0_0_12px_oklch(0.7_0.17_162/8%)]"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                              {token.symbol.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
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

                          {/* Quick actions: revealed on hover with staggered fade */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="text-right hidden sm:block mr-2">
                              <p className="text-sm font-medium text-white">
                                {formatUSD(token.priceUSD)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatLargeNumber(token.multiplier)}x mult.
                              </p>
                            </div>

                            {/* Mint quick action */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 btn-hover-scale"
                              style={{ transitionDelay: "50ms" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMintToken(token.address);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Zap className="h-3 w-3 mr-0.5" />
                              Mint
                            </Button>

                            {/* Details quick action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-700"
                              style={{ transitionDelay: "100ms" }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>

                            {/* Copy quick action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200"
                              style={{ transitionDelay: "150ms" }}
                              onClick={(e) => { e.stopPropagation(); copyAddress(token.address); }}
                            >
                              {copiedAddress === token.address ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-400" />
                              )}
                            </Button>

                            {/* Remove quick action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                              style={{ transitionDelay: "200ms" }}
                              onClick={(e) => { e.stopPropagation(); handleRemoveToken(token.address); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>

                            <ProfitIndicator ratio={token.profitRatio} size="sm" animated={token.profitRatio > 1.5} />
                          </div>
                        </div>
                      </TokenDetailDialog>
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
