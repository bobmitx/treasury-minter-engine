"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore, BotLogEntry, TokenData } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Bot,
  Play,
  Square,
  Pause,
  RotateCcw,
  Settings2,
  Target,
  Activity,
  Clock,
  DollarSign,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Gift,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

// ─── Sub-components ─────────────────────────────────────────────────────────

function BotStatusBadge({ running }: { running: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
          running
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
            : "bg-gray-800 text-gray-400 border border-gray-700"
        )}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full glow-dot",
            running ? "bg-emerald-500 status-dot-success status-dot-pulse" : "bg-gray-500"
          )}
        />
        {running ? "Running" : "Idle"}
      </div>
      {running && (
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] bot-mode-pulse gap-1">
          <Bot className="h-2.5 w-2.5" />
          Bot Active
        </Badge>
      )}
    </div>
  );
}

function SessionStatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: any;
  accent?: "emerald" | "amber" | "rose";
}) {
  const colors = {
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/15",
      icon: "text-emerald-400",
      value: "text-emerald-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/15",
      icon: "text-amber-400",
      value: "text-amber-400",
    },
    rose: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/15",
      icon: "text-rose-400",
      value: "text-rose-400",
    },
  };
  const c = colors[accent || "emerald"];

  return (
    <div
      className={cn(
        "rounded-xl p-3 border transition-all",
        c.bg,
        c.border
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-3.5 w-3.5", c.icon)} />
        <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-mono number-animate", c.value)}>
        {value}
      </p>
    </div>
  );
}

function LogEntryRow({ entry, index }: { entry: BotLogEntry; index: number }) {
  const colorMap: Record<
    BotLogEntry["type"],
    { dot: string; text: string; bg: string; icon: any }
  > = {
    mint: {
      dot: "bg-emerald-500",
      text: "text-emerald-400",
      bg: "bg-emerald-500/5 border-emerald-500/10",
      icon: CheckCircle2,
    },
    skip: {
      dot: "bg-amber-500",
      text: "text-amber-400",
      bg: "bg-amber-500/5 border-amber-500/10",
      icon: SkipForward,
    },
    error: {
      dot: "bg-rose-500",
      text: "text-rose-400",
      bg: "bg-rose-500/5 border-rose-500/10",
      icon: XCircle,
    },
    claim: {
      dot: "bg-violet-500",
      text: "text-violet-400",
      bg: "bg-violet-500/5 border-violet-500/10",
      icon: Gift,
    },
    info: {
      dot: "bg-sky-500",
      text: "text-sky-400",
      bg: "bg-sky-500/5 border-sky-500/10",
      icon: Info,
    },
  };

  const style = colorMap[entry.type];
  const IconComp = style.icon;
  const time = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 p-2.5 rounded-lg border transition-all animate-stagger-slide-up",
        style.bg
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <IconComp className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", style.text)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium", style.text)}>
          {entry.tokenSymbol && (
            <span className="font-bold mr-1">[{entry.tokenSymbol}]</span>
          )}
          {entry.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-500 font-mono">{time}</span>
          {entry.profitRatio !== undefined && (
            <Badge
              className={cn(
                "text-[9px] h-4 px-1.5 border",
                entry.profitRatio > 1
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}
            >
              {entry.profitRatio.toFixed(2)}x
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigSection() {
  const { botConfig, setBotConfig, botRunning } = useAppStore();
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={cn(
      "bg-gray-900 border-gray-800/70 glass-card-depth gradient-border",
      botRunning && "neon-border-amber"
    )}>
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full group"
        >
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-amber-400" />
            Bot Configuration
          </CardTitle>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-5">
          {/* Profit Threshold Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-xs font-medium">
                Profit Threshold
              </Label>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {botConfig.profitThreshold.toFixed(1)}x
              </span>
            </div>
            <Slider
              value={[botConfig.profitThreshold]}
              onValueChange={([val]) =>
                setBotConfig({ profitThreshold: val })
              }
              min={1.0}
              max={5.0}
              step={0.1}
              className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&>span:first-child]:bg-gray-700"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>1.0x (Aggressive)</span>
              <span>3.0x (Moderate)</span>
              <span>5.0x (Conservative)</span>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Max Gas Price + Mint Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs font-medium">
                Max Gas Price
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={botConfig.maxGasPrice}
                  onChange={(e) =>
                    setBotConfig({
                      maxGasPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-gray-800 border-gray-700 text-white pr-10 input-glow"
                  min={1}
                  max={500}
                  step={1}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-medium">
                  Gwei
                </span>
              </div>
              <p className="text-[10px] text-gray-600">
                Bot will not mint above this gas price
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs font-medium">
                Default Mint Amount
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={botConfig.mintAmount}
                  onChange={(e) =>
                    setBotConfig({
                      mintAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-gray-800 border-gray-700 text-white pr-10 input-glow"
                  min={0}
                  step={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-medium">
                  PLS
                </span>
              </div>
              <p className="text-[10px] text-gray-600">
                Amount used for each automated mint
              </p>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Check Interval */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-xs font-medium">
                Check Interval
              </Label>
              <span className="text-sm font-mono font-bold text-gray-300">
                {botConfig.interval}s
              </span>
            </div>
            <Slider
              value={[botConfig.interval]}
              onValueChange={([val]) => setBotConfig({ interval: val })}
              min={5}
              max={120}
              step={5}
              className="[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-500 [&>span:first-child]:bg-gray-700"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>5s (Fast)</span>
              <span>60s (Normal)</span>
              <span>120s (Slow)</span>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Auto-Claim Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-800">
            <div className="flex items-center gap-2.5">
              <Gift className="h-4 w-4 text-violet-400" />
              <div>
                <p className="text-xs font-medium text-gray-200">
                  Auto-Claim V4 Rewards
                </p>
                <p className="text-[10px] text-gray-500">
                  Automatically claim accumulated V4 rewards
                </p>
              </div>
            </div>
            <Switch
              checked={botConfig.autoClaim}
              onCheckedChange={(val) => setBotConfig({ autoClaim: val })}
              className="data-[state=checked]:bg-violet-600"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function TargetTokenSection() {
  const { tokens, botConfig, setBotConfig } = useAppStore();
  const [expanded, setExpanded] = useState(true);

  const toggleToken = (address: string) => {
    const current = botConfig.targetTokens;
    const updated = current.includes(address)
      ? current.filter((a) => a !== address)
      : [...current, address];
    setBotConfig({ targetTokens: updated });
  };

  const selectAll = () => {
    setBotConfig({ targetTokens: tokens.map((t) => t.address) });
  };

  const selectNone = () => {
    setBotConfig({ targetTokens: [] });
  };

  const selectProfitable = (threshold: number) => {
    setBotConfig({
      targetTokens: tokens
        .filter((t) => t.profitRatio >= threshold)
        .map((t) => t.address),
    });
  };

  return (
    <Card className="bg-gray-900 border-gray-800/70 glass-card-depth gradient-border">
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full group"
        >
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            Target Tokens
            <Badge
              variant="outline"
              className="border-gray-700 text-gray-400 text-[10px] font-mono"
            >
              {botConfig.targetTokens.length}/{tokens.length}
            </Badge>
          </CardTitle>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3">
          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[11px] h-7 btn-hover-scale"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectNone}
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-700/50 text-[11px] h-7 btn-hover-scale"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectProfitable(1.0)}
              className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-[11px] h-7 btn-hover-scale"
            >
              Profitable (&gt;1.0x)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectProfitable(2.0)}
              className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-[11px] h-7 btn-hover-scale"
            >
              High (&gt;2.0x)
            </Button>
          </div>

          {/* Token list */}
          {tokens.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-3">
                <Target className="h-5 w-5 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400">No tokens tracked</p>
              <p className="text-xs text-gray-600 mt-1">
                Add tokens from V3/V4 Minter tabs to enable bot monitoring
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {tokens
                .sort((a, b) => b.profitRatio - a.profitRatio)
                .map((token) => {
                  const isSelected = botConfig.targetTokens.includes(
                    token.address
                  );
                  return (
                    <div
                      key={token.address}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer group",
                        isSelected
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-gray-800/30 border-transparent hover:bg-gray-800/60 hover:border-gray-700/50"
                      )}
                      onClick={() => toggleToken(token.address)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleToken(token.address)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-gray-600"
                      />
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 flex-shrink-0">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-white truncate">
                            {token.symbol}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] h-4 px-1 border font-mono",
                              token.version === "V4"
                                ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                                : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                            )}
                          >
                            {token.version}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">
                          {token.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={cn(
                            "text-xs font-mono font-bold",
                            token.profitRatio > 1
                              ? "text-emerald-400"
                              : token.profitRatio > 0
                              ? "text-rose-400"
                              : "text-gray-500"
                          )}
                        >
                          {token.profitRatio.toFixed(2)}x
                        </div>
                        <p className="text-[9px] text-gray-600">
                          {token.multiplier.toFixed(1)}x mult
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function BotPanel() {
  const {
    botConfig,
    botRunning,
    botLogs,
    botMintCount,
    botTotalProfit,
    setBotRunning,
    addBotLog,
    clearBotLogs,
    setBotMintCount,
    setBotTotalProfit,
    setBotConfig,
    tokens,
    gasData,
  } = useAppStore();

  const [isPaused, setIsPaused] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [botLogs]);

  // Uptime timer
  useEffect(() => {
    if (botRunning && !isPaused) {
      startTimeRef.current = startTimeRef.current || Date.now();
      uptimeRef.current = setInterval(() => {
        setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    }
    return () => {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    };
  }, [botRunning, isPaused]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const generateSimLog = useCallback(() => {
    const targetTokens = tokens.filter((t) =>
      botConfig.targetTokens.includes(t.address)
    );

    if (targetTokens.length === 0) {
      addBotLog({
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: "info",
        message: "No target tokens selected. Skipping check.",
      });
      setCheckCount((c) => c + 1);
      return;
    }

    // Check gas
    const currentGas = gasData?.standard ?? 25;
    if (currentGas > botConfig.maxGasPrice) {
      addBotLog({
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: "skip",
        message: `Gas price ${Math.round(currentGas)} Gwei exceeds limit (${botConfig.maxGasPrice} Gwei). Waiting...`,
      });
      setCheckCount((c) => c + 1);
      return;
    }

    // Simulate checking each target token
    targetTokens.forEach((token) => {
      // Add slight random variation to profit ratio for simulation
      const noise = (Math.random() - 0.5) * 0.3;
      const simulatedRatio = Math.max(
        0.5,
        token.profitRatio + noise
      );

      if (simulatedRatio >= botConfig.profitThreshold) {
        // SIMULATED MINT
        const profitEstimate =
          (simulatedRatio - 1) * botConfig.mintAmount * 0.000028;

        addBotLog({
          id: `log-${Date.now()}-${token.address}`,
          timestamp: Date.now(),
          type: "mint",
          message: `Auto-mint executed! Profit ratio ${simulatedRatio.toFixed(2)}x meets threshold ${botConfig.profitThreshold.toFixed(1)}x`,
          tokenSymbol: token.symbol,
          profitRatio: simulatedRatio,
        });

        setBotMintCount(botMintCount + 1);
        setBotTotalProfit(
          parseFloat((botTotalProfit + profitEstimate).toFixed(6))
        );
      } else {
        // Skip
        const messages = [
          `Below threshold (${simulatedRatio.toFixed(2)}x < ${botConfig.profitThreshold.toFixed(1)}x). Monitoring...`,
          `Profit ratio ${simulatedRatio.toFixed(2)}x insufficient. Skipping.`,
          `Waiting for better entry. Current: ${simulatedRatio.toFixed(2)}x`,
        ];

        // Don't log every skip for every token to avoid noise
        if (Math.random() > 0.6) {
          addBotLog({
            id: `log-${Date.now()}-${token.address}`,
            timestamp: Date.now(),
            type: "skip",
            message: messages[Math.floor(Math.random() * messages.length)],
            tokenSymbol: token.symbol,
            profitRatio: simulatedRatio,
          });
        }
      }
    });

    // Random claim event for V4 tokens
    if (botConfig.autoClaim && Math.random() > 0.85) {
      const v4Tokens = targetTokens.filter((t) => t.version === "V4");
      if (v4Tokens.length > 0) {
        const claimToken =
          v4Tokens[Math.floor(Math.random() * v4Tokens.length)];
        const claimAmount = (Math.random() * 0.5 + 0.1).toFixed(4);
        addBotLog({
          id: `log-claim-${Date.now()}`,
          timestamp: Date.now(),
          type: "claim",
          message: `Auto-claimed ${claimAmount} PLS reward from ${claimToken.symbol}`,
          tokenSymbol: claimToken.symbol,
        });
      }
    }

    // Random info event
    if (Math.random() > 0.8) {
      const infoMessages = [
        `Market scan complete. ${targetTokens.length} tokens analyzed.`,
        `PulseChain network healthy. Block latency normal.`,
        `Profit opportunity detected on ${targetTokens[Math.floor(Math.random() * targetTokens.length)]?.symbol || "token"}. Evaluating...`,
        `Gas conditions favorable. ${Math.round(currentGas)} Gwei.`,
        `Checking ${targetTokens.length} tokens against ${botConfig.profitThreshold.toFixed(1)}x threshold.`,
      ];
      addBotLog({
        id: `log-info-${Date.now()}`,
        timestamp: Date.now(),
        type: "info",
        message: infoMessages[Math.floor(Math.random() * infoMessages.length)],
      });
    }

    // Random error (rare)
    if (Math.random() > 0.95) {
      const errorMessages = [
        "RPC timeout on price fetch. Retrying next cycle...",
        "Nonce conflict detected. Transaction queued.",
        "Temporary liquidity issue. Skipping token.",
      ];
      addBotLog({
        id: `log-error-${Date.now()}`,
        timestamp: Date.now(),
        type: "error",
        message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
      });
    }

    setCheckCount((c) => c + 1);
  }, [
    tokens,
    botConfig,
    gasData,
    addBotLog,
    setBotMintCount,
    setBotTotalProfit,
    botMintCount,
    botTotalProfit,
  ]);

  // Simulation interval
  useEffect(() => {
    if (botRunning && !isPaused) {
      intervalRef.current = setInterval(
        generateSimLog,
        botConfig.interval * 1000
      );
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [botRunning, isPaused, botConfig.interval, generateSimLog]);

  const handleStart = () => {
    if (botConfig.targetTokens.length === 0 && tokens.length > 0) {
      // Auto-select all tokens if none selected
      setBotConfig({ targetTokens: tokens.map((t) => t.address) });
    }
    setIsPaused(false);
    setBotRunning(true);
    addBotLog({
      id: `log-start-${Date.now()}`,
      timestamp: Date.now(),
      type: "info",
      message: `Bot started. Monitoring ${botConfig.targetTokens.length || tokens.length} tokens with ${botConfig.profitThreshold.toFixed(1)}x threshold. Check interval: ${botConfig.interval}s`,
    });
  };

  const handleStop = () => {
    setBotRunning(false);
    setIsPaused(false);
    setCheckCount(0);
    setUptime(0);
    startTimeRef.current = 0;
    addBotLog({
      id: `log-stop-${Date.now()}`,
      timestamp: Date.now(),
      type: "info",
      message: `Bot stopped. Session: ${botMintCount} mints, ~$${botTotalProfit.toFixed(4)} estimated profit.`,
    });
  };

  const handlePause = () => {
    setIsPaused(true);
    addBotLog({
      id: `log-pause-${Date.now()}`,
      timestamp: Date.now(),
      type: "info",
      message: "Bot paused. Monitoring temporarily suspended.",
    });
  };

  const handleResume = () => {
    setIsPaused(false);
    addBotLog({
      id: `log-resume-${Date.now()}`,
      timestamp: Date.now(),
      type: "info",
      message: "Bot resumed. Monitoring active.",
    });
  };

  const handleClearLogs = () => {
    clearBotLogs();
  };

  const profitColor =
    botTotalProfit >= 0 ? "text-emerald-400" : "text-rose-400";
  const profitBg =
    botTotalProfit >= 0
      ? "bg-emerald-500/10 border-emerald-500/15"
      : "bg-rose-500/10 border-rose-500/15";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center glow-amber-animated">
              <Bot className="h-4 w-4 text-amber-400" />
            </div>
            Bot Mode
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Automated token minting with configurable profit thresholds
          </p>
        </div>
        <BotStatusBadge running={botRunning && !isPaused} />
      </div>

      {/* Session Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SessionStatCard
          label="Mints Executed"
          value={botMintCount.toString()}
          icon={Zap}
          accent="emerald"
        />
        <SessionStatCard
          label="Est. Profit"
          value={`$${botTotalProfit.toFixed(4)}`}
          icon={DollarSign}
          accent={botTotalProfit >= 0 ? "emerald" : "rose"}
        />
        <SessionStatCard
          label="Checks Performed"
          value={checkCount.toString()}
          icon={Activity}
          accent="amber"
        />
        <SessionStatCard
          label="Uptime"
          value={formatUptime(uptime)}
          icon={Clock}
          accent="amber"
        />
      </div>

      {/* Controls Bar */}
      <Card className="bg-gray-900 border-gray-800/70 glass-card-depth">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {!botRunning ? (
                <Button
                  onClick={handleStart}
                  className={cn(
                    "bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-2 shadow-lg shadow-emerald-500/20 gradient-border-active",
                    !botRunning && "breathe-glow focus-ring-animated"
                  )}
                >
                  <Play className="h-4 w-4" />
                  Start Bot
                </Button>
              ) : !isPaused ? (
                <>
                  <Button
                    onClick={handlePause}
                    className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    className="bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 btn-hover-scale gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleResume}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    className="bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 btn-hover-scale gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 sm:ml-auto">
              {/* Live profit summary pill */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                  profitBg
                )}
              >
                <TrendingUp
                  className={cn("h-3.5 w-3.5", profitColor)}
                />
                <span className={profitColor}>
                  ${botTotalProfit.toFixed(4)}
                </span>
              </div>

              {/* Clear logs */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="text-gray-500 hover:text-gray-300 hover:bg-gray-800 gap-1.5 h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-[11px]">Clear</span>
              </Button>
            </div>
          </div>

          {/* Next check countdown */}
          {botRunning && !isPaused && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full progress-gradient-animated transition-all"
                  style={{
                    width: "100%",
                    animation: `countdown ${botConfig.interval}s linear infinite`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                Next check in {botConfig.interval}s
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Config + Target Tokens */}
        <div className="space-y-6">
          <ConfigSection />
          <TargetTokenSection />
        </div>

        {/* Right Column: Activity Log */}
        <Card className="bg-gray-900 border-gray-800/70 glass-card-depth gradient-border lg:row-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-400" />
                Activity Log
                <Badge
                  variant="outline"
                  className="border-gray-700 text-gray-400 text-[10px] font-mono"
                >
                  {botLogs.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {botRunning && !isPaused && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {botLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">No activity yet</p>
                <p className="text-xs text-gray-600 mt-1 max-w-[200px] mx-auto">
                  Start the bot to see real-time decisions and actions here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {botLogs.map((entry, idx) => (
                  <LogEntryRow key={entry.id} entry={entry} index={idx} />
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit Summary */}
      <Card className="bg-gray-900 border-gray-800/70 glass-card-depth gradient-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  profitBg
                )}
              >
                <TrendingUp
                  className={cn("h-5 w-5", profitColor)}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  <span className="status-dot status-dot-success status-dot-pulse inline-block w-1.5 h-1.5 mr-1.5 align-middle" />
                  Session Profit Summary
                </p>
                <p className={cn(
                  "text-2xl font-bold font-mono",
                  botTotalProfit > 0 ? "text-gradient-emerald" : profitColor
                )}>
                  ${botTotalProfit.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Mints
                </p>
                <p className="text-lg font-bold font-mono text-white">
                  {botMintCount}
                </p>
              </div>
              <Separator
                orientation="vertical"
                className="h-8 bg-gray-800"
              />
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Avg. Mint Profit
                </p>
                <p className="text-lg font-bold font-mono text-white">
                  {botMintCount > 0
                    ? `$${(botTotalProfit / botMintCount).toFixed(4)}`
                    : "$0.00"}
                </p>
              </div>
              <Separator
                orientation="vertical"
                className="h-8 bg-gray-800"
              />
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Success Rate
                </p>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {checkCount > 0
                    ? `${((botMintCount / Math.max(checkCount, 1)) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center">
        <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Bot Mode runs as a simulation. No real blockchain transactions are
          executed. For educational purposes only.
        </p>
      </div>
    </div>
  );
}
