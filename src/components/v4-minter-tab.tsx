"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import {
  createV4Token,
  mintV4,
  claimV4Rewards,
  createGaiToken,
  getV4Multiplier,
  getV4SystemInfo,
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
import { WatchlistButton } from "@/components/token-watchlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Gem,
  Gift,
  Server,
  Shield,
  Sparkles,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export function V4MinterTab() {
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

  // GAI form
  const [gaiName, setGaiName] = useState("");
  const [gaiSymbol, setGaiSymbol] = useState("");
  const [creatingGai, setCreatingGai] = useState(false);

  // Mint form
  const [mintToken, setMintToken] = useState("");
  const [mintAmount, setMintAmount] = useState("1000");
  const [minting, setMinting] = useState(false);

  // Claim form
  const [claimAmount, setClaimAmount] = useState("0");
  const [claiming, setClaiming] = useState(false);

  // System info
  const [systemInfo, setSystemInfo] = useState<{
    bbc: string;
    indexMinter: string;
    nine: string;
    nots: string;
    skills: string;
  } | null>(null);

  // Multiplier display
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [loadingMultiplier, setLoadingMultiplier] = useState(false);

  // Token list refresh
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Add custom token
  const [addTokenAddress, setAddTokenAddress] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);

  // Token creation animation state
  const [createdTokenKey, setCreatedTokenKey] = useState(0);
  const [createdGaiKey, setCreatedGaiKey] = useState(0);

  const fetchSystemData = useCallback(async () => {
    setLoadingMultiplier(true);
    try {
      const [mult, info] = await Promise.all([
        getV4Multiplier(CONTRACTS.v4PersonalMinter, 1),
        getV4SystemInfo(CONTRACTS.v4PersonalMinter),
      ]);
      setCurrentMultiplier(mult);
      setSystemInfo(info);
    } catch (error) {
      console.error("Error fetching V4 data:", error);
    } finally {
      setLoadingMultiplier(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 15000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  const handleCreateToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!createName.trim() || !createSymbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }

    setCreating(true);
    try {
      const result = await createV4Token(
        createName.trim(),
        createSymbol.trim().toUpperCase(),
        parseFloat(createInitialMint) || 1000,
        createParent
      );

      toast.success(
        <div className="space-y-1">
          <p>V4 Token created successfully!</p>
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
        version: "V4",
        tokenAddress: result.tokenAddress,
        tokenSymbol: createSymbol.trim().toUpperCase(),
        amount: createInitialMint,
        txHash: result.txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      setCreateName("");
      setCreateSymbol("");
      setCreatedTokenKey((k) => k + 1);
      fetchSystemData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create V4 token");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGai = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!gaiName.trim() || !gaiSymbol.trim()) {
      toast.error("Name and symbol are required for GAI token");
      return;
    }

    setCreatingGai(true);
    try {
      const result = await createGaiToken(
        CONTRACTS.v4PersonalMinter,
        gaiName.trim(),
        gaiSymbol.trim().toUpperCase()
      );

      toast.success(
        <div className="space-y-1">
          <p>GAI Token created successfully!</p>
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
        version: "V4",
        tokenAddress: result.tokenAddress,
        tokenSymbol: `GAI-${gaiSymbol.trim().toUpperCase()}`,
        txHash: result.txHash,
        status: "confirmed",
        timestamp: Date.now(),
        details: "GAI Token",
      });

      setGaiName("");
      setGaiSymbol("");
      setCreatedGaiKey((k) => k + 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to create GAI token");
    } finally {
      setCreatingGai(false);
    }
  };

  const handleMint = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!mintToken || !mintAmount) {
      toast.error("Token and amount are required");
      return;
    }

    setMinting(true);
    try {
      const txHash = await mintV4(mintToken, parseFloat(mintAmount));

      toast.success(
        <div className="space-y-1">
          <p>V4 Minted {mintAmount} tokens!</p>
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
        version: "V4",
        tokenAddress: mintToken,
        tokenSymbol: tokenData?.symbol,
        amount: mintAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      fetchSystemData();
    } catch (error: any) {
      toast.error(error.message || "Failed to mint V4 tokens");
    } finally {
      setMinting(false);
    }
  };

  const handleClaim = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!claimAmount || parseFloat(claimAmount) <= 0) {
      toast.error("Claim amount must be positive");
      return;
    }

    setClaiming(true);
    try {
      const txHash = await claimV4Rewards(
        CONTRACTS.v4PersonalMinter,
        parseFloat(claimAmount)
      );

      toast.success(
        <div className="space-y-1">
          <p>Claimed rewards successfully!</p>
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

      addTransaction({
        id: `tx-${Date.now()}`,
        type: "claim",
        version: "V4",
        amount: claimAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to claim rewards");
    } finally {
      setClaiming(false);
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
    if (!addTokenAddress.startsWith("0x") || addTokenAddress.length !== 42) {
      toast.error("Invalid token address format");
      return;
    }
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
        getV4Multiplier(addTokenAddress, 1),
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
        version: "V4",
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
      const v4Tokens = tokens.filter((t) => t.version === "V4");
      for (const token of v4Tokens) {
        try {
          const [price, balance, mult] = await Promise.all([
            getTokenPrice(token.address),
            getTokenBalance(token.address, address),
            getV4Multiplier(token.address, 1),
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
          // skip
        }
      }
      toast.success("V4 token list refreshed");
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

  const v4Tokens = tokens.filter((t) => t.version === "V4");

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* V4 System Info + Multiplier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="V4 Multiplier"
          value={loadingMultiplier ? "..." : `${formatLargeNumber(currentMultiplier)}x`}
          icon={Zap}
          subtitle="Current"
          accent="amber"
        />
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">BBC</span>
            </div>
            <p className="text-xs font-mono text-white mt-1 truncate">
              {systemInfo ? shortenAddress(systemInfo.bbc, 6) : "..."}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">Index Minter</span>
            </div>
            <p className="text-xs font-mono text-white mt-1 truncate">
              {systemInfo ? shortenAddress(systemInfo.indexMinter, 6) : "..."}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">Contracts</span>
            </div>
            <p className="text-xs text-white mt-1">
              {systemInfo
                ? `${[systemInfo.nine, systemInfo.nots, systemInfo.skills].filter((a) => a !== "0x0000000000000000000000000000000000000000").length} active`
                : "..."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* V4 Actions Tabs */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="bg-gray-900 border border-gray-800/70">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </TabsTrigger>
          <TabsTrigger
            value="gai"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Gem className="h-3 w-3 mr-1" />
            GAI
          </TabsTrigger>
          <TabsTrigger
            value="mint"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Coins className="h-3 w-3 mr-1" />
            Mint
          </TabsTrigger>
          <TabsTrigger
            value="claim"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Gift className="h-3 w-3 mr-1" />
            Claim
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create">
          <Card key={createdTokenKey} className={cn(
            "bg-gray-900 border-gray-800/70 card-hover",
            createdTokenKey > 0 && "animate-expand-in"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Create New V4 Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onChange={(e) =>
                      setCreateSymbol(e.target.value.toUpperCase())
                    }
                    className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
                    maxLength={10}
                    disabled={!connected}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">
                    Initial Mint Amount
                  </Label>
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
              </div>
              <Button
                onClick={handleCreateToken}
                disabled={creating || !connected}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {creating ? "Creating..." : "Create V4 Token"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GAI Tab */}
        <TabsContent value="gai">
          <Card key={createdGaiKey} className={cn(
            "bg-gray-900 border-gray-800/70 card-hover border-amber-500/10",
            createdGaiKey > 0 && "animate-expand-in"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Gem className="h-4 w-4 text-amber-400" />
                Create GAI Token
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">Special</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                GAI tokens are special V4 tokens created through the GAI mechanism.
                They have unique properties within the V4 ecosystem.
              </p>
              {/* GAI feature cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-center">
                  <Shield className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">Staking</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-center">
                  <Gift className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">Rewards</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-center">
                  <TrendingUp className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">Yield</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">GAI Token Name</Label>
                  <Input
                    placeholder="My GAI"
                    value={gaiName}
                    onChange={(e) => setGaiName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                    disabled={!connected}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Symbol</Label>
                  <Input
                    placeholder="GAI"
                    value={gaiSymbol}
                    onChange={(e) =>
                      setGaiSymbol(e.target.value.toUpperCase())
                    }
                    className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
                    maxLength={10}
                    disabled={!connected}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateGai}
                disabled={creatingGai || !connected}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {creatingGai ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gem className="h-4 w-4 mr-2" />
                )}
                {creatingGai ? "Creating..." : "Create GAI Token"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mint Tab */}
        <TabsContent value="mint">
          <Card className="bg-gray-900 border-gray-800/70 card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                Mint V4 Tokens
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
                {v4Tokens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {v4Tokens.slice(0, 5).map((t) => (
                      <button
                        key={t.address}
                        onClick={() => setMintToken(t.address)}
                        className={`text-xs px-2 py-0.5 rounded border transition-all duration-200 btn-hover-scale ${
                          mintToken === t.address
                            ? "bg-gray-800 border-gray-700 text-gray-400 selected-amber-glow"
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
              <Button
                onClick={handleMint}
                disabled={minting || !connected || !mintToken}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {minting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {minting ? "Minting..." : "Mint V4 Tokens"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claim Tab */}
        <TabsContent value="claim">
          <Card className="bg-gray-900 border-gray-800/70 card-hover claim-preview-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400" />
                Claim V4 Rewards
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">Rewards</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                Claim accumulated rewards from the V4 system. Enter the amount
                you wish to claim.
              </p>
              {/* Reward estimation preview */}
              {claimAmount && parseFloat(claimAmount) > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 animate-slide-in-right">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs text-amber-300 font-medium">Estimated Reward Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Claim Amount</p>
                      <p className="text-sm font-mono text-white">{parseFloat(claimAmount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Est. Gas Cost</p>
                      <p className="text-sm font-mono text-gray-400">~0.001 PLS</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Claim Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                  disabled={!connected}
                />
              </div>
              <Button
                onClick={handleClaim}
                disabled={claiming || !connected || !claimAmount || parseFloat(claimAmount) <= 0}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                {claiming ? "Claiming..." : "Claim Rewards"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              Add Custom V4 Token by Address
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Paste V4 token address (0x...)"
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

      {/* Active V4 Tokens */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              Active V4 Tokens
              {v4Tokens.length > 0 && (
                <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs ml-2">
                  {v4Tokens.length}
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
          {v4Tokens.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">No V4 tokens tracked yet</p>
              <p className="text-xs mt-1 text-gray-600">
                Create a V4 token above or add a custom address to start tracking
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {v4Tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .map((token) => (
                    <TokenDetailDialog key={token.address} tokenAddress={token.address}>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-700/50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
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
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">
                              {formatUSD(token.priceUSD)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatLargeNumber(token.multiplier)}x mult.
                            </p>
                          </div>
                          {/* Watchlist quick action */}
                          <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <WatchlistButton tokenAddress={token.address} size="sm" />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-rose-400"
                            onClick={(e) => { e.stopPropagation(); handleRemoveToken(token.address); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); copyAddress(token.address); }}
                          >
                            {copiedAddress === token.address ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity btn-hover-scale"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMintToken(token.address);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Mint <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          <ProfitIndicator ratio={token.profitRatio} size="sm" animated={token.profitRatio > 1.5} />
                        </div>
                      </div>
                    </TokenDetailDialog>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
