"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  discoverMintingChain,
  discoverAndPreview,
  executeAutoMultiHopMint,
  getExplorerTxUrl,
  shortenAddress,
} from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  GitBranch,
  Search,
  Eye,
  Play,
  Zap,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowDownRight,
  Link2,
  Info,
  Shield,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ProfitIndicator } from "@/components/profit-indicator";

export function MultihopTab() {
  const { connected, tokens, multihopPreview, setMultihopPreview, addTransaction } =
    useAppStore();

  const [sourceToken, setSourceToken] = useState("");
  const [targetToken, setTargetToken] = useState("");
  const [targetAmount, setTargetAmount] = useState("1000");

  const [discovering, setDiscovering] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);

  const [discoveredChain, setDiscoveredChain] = useState<string[]>([]);
  const [chainError, setChainError] = useState<string | null>(null);
  const [executionStep, setExecutionStep] = useState(0);

  const handleDiscoverChain = async () => {
    if (!sourceToken || !targetToken) {
      toast.error("Source and target tokens are required");
      return;
    }

    setDiscovering(true);
    setChainError(null);
    setDiscoveredChain([]);
    setMultihopPreview(null);
    try {
      const chain = await discoverMintingChain(sourceToken, targetToken);
      if (chain.length === 0) {
        setChainError("No minting chain found between these tokens. They may not have a parent-child relationship.");
        setDiscoveredChain([]);
      } else {
        setDiscoveredChain(chain);
        toast.success(`Found chain with ${chain.length} steps`);
      }
    } catch (error: any) {
      setChainError(error.message || "Failed to discover chain");
      toast.error("Failed to discover minting chain");
    } finally {
      setDiscovering(false);
    }
  };

  const handlePreview = async () => {
    if (!sourceToken || !targetToken || !targetAmount) {
      toast.error("All fields are required");
      return;
    }

    setPreviewing(true);
    try {
      const result = await discoverAndPreview(
        sourceToken,
        targetToken,
        parseFloat(targetAmount)
      );

      setMultihopPreview({
        sourceCost: result.sourceCost,
        mintingChain: result.chainPath,
        steps: result.steps,
      });

      setDiscoveredChain(result.chainPath);
      toast.success("Preview calculated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to preview multihop mint");
    } finally {
      setPreviewing(false);
    }
  };

  const handleAutoExecute = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!sourceToken || !targetToken || !targetAmount) {
      toast.error("All fields are required");
      return;
    }

    setExecuting(true);
    setExecutionStep(1);

    try {
      // Simulate step progress
      if (multihopPreview && multihopPreview.steps.length > 0) {
        for (let i = 0; i < multihopPreview.steps.length; i++) {
          setExecutionStep(i + 1);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      const txHash = await executeAutoMultiHopMint(
        sourceToken,
        targetToken,
        parseFloat(targetAmount)
      );

      setExecutionStep(0);

      toast.success(
        <div className="space-y-1">
          <p>MultiHop mint executed successfully!</p>
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
        type: "multihop",
        version: "MultiHop",
        tokenAddress: targetToken,
        amount: targetAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
        details: `${discoveredChain.length} steps`,
      });
    } catch (error: any) {
      setExecutionStep(0);
      toast.error(error.message || "Failed to execute multihop mint");
    } finally {
      setExecuting(false);
    }
  };

  const selectToken = (address: string, type: "source" | "target") => {
    if (type === "source") setSourceToken(address);
    else setTargetToken(address);
  };

  const swapTokens = () => {
    const temp = sourceToken;
    setSourceToken(targetToken);
    setTargetToken(temp);
    setDiscoveredChain([]);
    setMultihopPreview(null);
    setChainError(null);
  };

  const efficiency = multihopPreview
    ? parseFloat(targetAmount) / (parseFloat(multihopPreview.sourceCost || "1") || 1)
    : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header Info Card */}
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-2.5 rounded-xl flex-shrink-0 border border-emerald-500/10">
                <GitBranch className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">MultiHop Minting</h3>
                  <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">
                    Advanced
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Chain multiple mint operations together to leverage compound multipliers. 
                  The system discovers the optimal parent-child token path and executes sequential mints, 
                  potentially giving you significantly more tokens than a direct mint.
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-gray-800 border-gray-700 text-xs max-w-xs">
                  MultiHop uses the Treasury System&apos;s parent-child token relationships to create 
                  a chain of mints. Total multiplier = product of all step multipliers.
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* MultiHop Input Form */}
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-400" />
              Configure Mint Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-sm">Source Token</Label>
                  <span className="text-[10px] text-gray-500">Starting point</span>
                </div>
                <Input
                  value={sourceToken}
                  onChange={(e) => setSourceToken(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-xs input-focus-ring"
                  placeholder="0x... (token address)"
                  disabled={!connected}
                />
                {tokens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tokens.slice(0, 6).map((t) => (
                      <button
                        key={t.address}
                        onClick={() => selectToken(t.address, "source")}
                        className={`text-xs px-2 py-0.5 rounded border transition-all duration-200 btn-hover-scale ${
                          sourceToken === t.address
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

              {/* Swap Button */}
              <div className="hidden sm:flex items-end justify-center pb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full border border-gray-700 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-gray-400 hover:text-emerald-400 transition-all duration-200"
                      onClick={swapTokens}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 border-gray-800 text-xs">
                    Swap source and target
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-sm">Target Token</Label>
                  <span className="text-[10px] text-gray-500">Destination</span>
                </div>
                <Input
                  value={targetToken}
                  onChange={(e) => setTargetToken(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-xs input-focus-ring"
                  placeholder="0x... (token address)"
                  disabled={!connected}
                />
                {tokens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tokens.slice(0, 6).map((t) => (
                      <button
                        key={t.address}
                        onClick={() => selectToken(t.address, "target")}
                        className={`text-xs px-2 py-0.5 rounded border transition-all duration-200 btn-hover-scale ${
                          targetToken === t.address
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 text-sm">Target Amount</Label>
                <div className="flex gap-1">
                  {[1000, 5000, 10000, 50000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTargetAmount(amt.toString())}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        targetAmount === amt.toString()
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                placeholder="1000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white max-w-xs input-focus-ring"
                disabled={!connected}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleDiscoverChain}
                    disabled={discovering || !connected || !sourceToken || !targetToken}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 btn-hover-scale gap-2"
                  >
                    {discovering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    {discovering ? "Discovering..." : "Discover Chain"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 border-gray-800 text-xs">
                  Find the parent-child path between tokens
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewing || !connected || !sourceToken || !targetToken || !targetAmount}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 btn-hover-scale gap-2"
                  >
                    {previewing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {previewing ? "Previewing..." : "Preview Mint"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 border-gray-800 text-xs">
                    Calculate cost and profitability
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="hidden sm:block h-9" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleAutoExecute}
                    disabled={executing || !connected || !sourceToken || !targetToken || !targetAmount}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-2"
                  >
                    {executing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {executing ? `Executing Step ${executionStep}...` : "Auto-Mint"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 border-gray-800 text-xs">
                  Automatically discover, preview and execute the mint
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Execution Progress */}
            {executing && multihopPreview && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Execution Progress</span>
                  <span className="text-emerald-400 font-mono">
                    {executionStep}/{multihopPreview.steps.length} steps
                  </span>
                </div>
                <Progress
                  value={(executionStep / (multihopPreview.steps.length || 1)) * 100}
                  className="h-2 bg-gray-800"
                />
                <div
                  className="h-2 rounded-full progress-gradient-animated mt-[-32px] pointer-events-none"
                  style={{
                    width: `${(executionStep / (multihopPreview.steps.length || 1)) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discovered Chain Visualization */}
        {discoveredChain.length > 0 && (
          <Card className="bg-gray-900 border-gray-800/70 card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-emerald-400" />
                  Minting Chain Path
                </CardTitle>
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">
                  {discoveredChain.length} step{discoveredChain.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {discoveredChain.map((addr, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn(
                      "bg-gray-800/80 border rounded-xl px-4 py-3 flex flex-col items-center min-w-[130px] transition-all duration-200",
                      "hover:scale-105 hover:shadow-lg",
                      i === 0 ? "border-emerald-500/30 hover:shadow-emerald-500/10" : i === discoveredChain.length - 1 ? "border-amber-500/30 hover:shadow-amber-500/10" : "border-gray-700 hover:shadow-gray-500/10"
                    )}>
                      <span className={cn(
                        "chip",
                        i === 0 ? "chip-emerald" : i === discoveredChain.length - 1 ? "chip-amber" : "bg-gray-700/50 text-gray-400 border-gray-600/30"
                      )}>Step {i + 1}</span>
                      <span className="text-xs font-mono text-white truncate max-w-[110px] mt-1">
                        {shortenAddress(addr, 6)}
                      </span>
                      <div className="flex gap-1 mt-1.5">
                        {i === 0 && (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] py-0">
                            Source
                          </Badge>
                        )}
                        {i === discoveredChain.length - 1 && (
                          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px] py-0">
                            Target
                          </Badge>
                        )}
                      </div>
                      {executing && i + 1 <= executionStep && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-1.5" />
                      )}
                    </div>
                    {i < discoveredChain.length - 1 && (
                      <div className="flex flex-col items-center gap-0.5">
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chain Error */}
        {chainError && (
          <Card className="bg-gray-900 border-rose-500/20 card-hover">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="bg-rose-500/10 p-2 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-400">Chain Discovery Failed</p>
                <p className="text-xs text-gray-400 mt-0.5">{chainError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Results */}
        {multihopPreview && (
          <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border-active">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  Multihop Preview
                </CardTitle>
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {multihopPreview.steps.length} steps
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Source Cost</p>
                  <p className="text-lg font-bold text-white font-mono">
                    {parseFloat(multihopPreview.sourceCost).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 2 }
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500">tokens needed</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Target Output</p>
                  <p className="text-lg font-bold text-white font-mono">
                    {parseFloat(targetAmount).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[10px] text-gray-500">tokens received</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Efficiency</p>
                  <p className={cn(
                    "text-lg font-bold font-mono",
                    efficiency > 1 ? "text-emerald-400 text-glow-emerald-animated" : "text-rose-400"
                  )}>
                    {efficiency > 0 ? `${efficiency.toFixed(2)}x` : "N/A"}
                  </p>
                  <p className="text-[10px] text-gray-500">output / cost</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Profit Ratio</p>
                  <ProfitIndicator ratio={efficiency} size="sm" animated={efficiency > 1.2} />
                  <p className="text-[10px] text-gray-500 mt-1">
                    {efficiency > 1 ? "Profitable" : "Below threshold"}
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">Mint Steps Detail</p>
                <div className="space-y-2">
                  {multihopPreview.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 transition-all duration-200 border border-transparent hover:border-gray-700/50"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0",
                        "chip-emerald"
                      )}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-gray-300 truncate">
                          {shortenAddress(step.token, 6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {parseFloat(step.multiplier).toFixed(2)}x multiplier
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-white">
                          {parseFloat(step.amountToMint).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          cost: {parseFloat(step.parentCost).toLocaleString()}
                        </p>
                      </div>
                      {executing && i + 1 <= executionStep && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800 flex items-start gap-2">
                <Shield className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Important Note</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    MultiHop execution involves multiple sequential transactions. Gas costs will accumulate 
                    for each step. Ensure you have sufficient PLS balance to cover all gas fees.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
