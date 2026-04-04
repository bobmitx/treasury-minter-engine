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
import { MultiHopPreview } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch,
  Search,
  Eye,
  Play,
  Zap,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowDownRight,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

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

  const handleDiscoverChain = async () => {
    if (!sourceToken || !targetToken) {
      toast.error("Source and target tokens are required");
      return;
    }

    setDiscovering(true);
    setChainError(null);
    try {
      const chain = await discoverMintingChain(sourceToken, targetToken);
      if (chain.length === 0) {
        setChainError("No minting chain found between these tokens");
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
    try {
      const txHash = await executeAutoMultiHopMint(
        sourceToken,
        targetToken,
        parseFloat(targetAmount)
      );

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
      toast.error(error.message || "Failed to execute multihop mint");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* MultiHop Input Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            MultiHop Minting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Source Token</Label>
              <Input
                value={sourceToken}
                onChange={(e) => setSourceToken(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
                placeholder="0x... (token address)"
                disabled={!connected}
              />
              {tokens.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tokens.slice(0, 4).map((t) => (
                    <button
                      key={t.address}
                      onClick={() => setSourceToken(t.address)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        sourceToken === t.address
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
              <Label className="text-gray-300 text-sm">Target Token</Label>
              <Input
                value={targetToken}
                onChange={(e) => setTargetToken(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
                placeholder="0x... (token address)"
                disabled={!connected}
              />
              {tokens.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tokens.slice(0, 4).map((t) => (
                    <button
                      key={t.address}
                      onClick={() => setTargetToken(t.address)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        targetToken === t.address
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
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Target Amount</Label>
            <Input
              type="number"
              placeholder="1000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white max-w-xs"
              disabled={!connected}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleDiscoverChain}
              disabled={discovering || !connected || !sourceToken || !targetToken}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Search
                className={`h-4 w-4 mr-2 ${discovering ? "animate-pulse" : ""}`}
              />
              {discovering ? "Discovering..." : "Discover Chain"}
            </Button>
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={previewing || !connected || !sourceToken || !targetToken || !targetAmount}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Eye
                className={`h-4 w-4 mr-2 ${previewing ? "animate-pulse" : ""}`}
              />
              {previewing ? "Previewing..." : "Preview Mint"}
            </Button>
            <Separator orientation="vertical" className="hidden sm:block h-9" />
            <Button
              onClick={handleAutoExecute}
              disabled={executing || !connected || !sourceToken || !targetToken || !targetAmount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play
                className={`h-4 w-4 mr-2 ${executing ? "animate-spin" : ""}`}
              />
              {executing ? "Executing..." : "Auto-Mint"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discovered Chain Visualization */}
      {discoveredChain.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-400" />
              Minting Chain Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {discoveredChain.map((addr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex flex-col items-center min-w-[120px]">
                    <span className="text-xs text-gray-400">Step {i + 1}</span>
                    <span className="text-xs font-mono text-white truncate max-w-[100px]">
                      {shortenAddress(addr, 6)}
                    </span>
                    {i === 0 && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-emerald-500/30 text-emerald-400 text-[10px]"
                      >
                        Source
                      </Badge>
                    )}
                    {i === discoveredChain.length - 1 && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-amber-500/30 text-amber-400 text-[10px]"
                      >
                        Target
                      </Badge>
                    )}
                  </div>
                  {i < discoveredChain.length - 1 && (
                    <ArrowDownRight className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chain Error */}
      {chainError && (
        <Card className="bg-gray-900 border-rose-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-400">{chainError}</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Results */}
      {multihopPreview && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                Multihop Preview Results
              </CardTitle>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {multihopPreview.steps.length} steps
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">Source Cost</p>
                <p className="text-lg font-bold text-white font-mono">
                  {parseFloat(multihopPreview.sourceCost).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 2 }
                  )}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">Target Amount</p>
                <p className="text-lg font-bold text-white font-mono">
                  {parseFloat(targetAmount).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">Efficiency</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">
                  {parseFloat(targetAmount) / parseFloat(multihopPreview.sourceCost || "1") > 0
                    ? `${(parseFloat(targetAmount) / parseFloat(multihopPreview.sourceCost || "1")).toFixed(2)}x`
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Mint Steps</p>
              <div className="space-y-2">
                {multihopPreview.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-400 truncate">
                        {shortenAddress(step.token, 6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {step.multiplier}x multiplier
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-white">
                        {parseFloat(step.amountToMint).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        cost: {parseFloat(step.parentCost).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg flex-shrink-0">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                How MultiHop Works
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MultiHop minting allows you to mint a target token by starting
                from a source token you already hold. The system discovers the
                optimal chain of parent-child token relationships and executes
                sequential mints to reach your target. The total multiplier is
                the product of all individual step multipliers, potentially
                giving you significantly more tokens than a direct mint.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
