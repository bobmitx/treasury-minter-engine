"use client";

import { useEffect, useCallback, useState } from "react";
import { useAppStore, TabType } from "@/lib/store";
import { WalletButton } from "@/components/wallet-button";
import { DashboardTab } from "@/components/dashboard-tab";
import { V3MinterTab } from "@/components/v3-minter-tab";
import { V4MinterTab } from "@/components/v4-minter-tab";
import { MultihopTab } from "@/components/multihop-tab";
import { PortfolioTab } from "@/components/portfolio-tab";
import { HistoryTab } from "@/components/history-tab";
import { BotPanel } from "@/components/bot-panel";
import { CalculatorTab } from "@/components/calculator-tab";
import { OnboardingModal } from "@/components/onboarding-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  Gem,
  GitBranch,
  Wallet,
  History,
  Settings,
  Globe,
  Shield,
  RefreshCw,
  Activity,
  Bot,
  Calculator,
  Info,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getChainId, switchToPulseChain, isPulseChain } from "@/lib/ethereum";
import { PULSECHAIN_CONFIG } from "@/lib/contracts";
import { motion, AnimatePresence } from "framer-motion";

const TABS: Array<{
  id: TabType;
  label: string;
  icon: any;
  badge?: string;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "v3-minter", label: "V3 Minter", icon: Zap },
  { id: "v4-minter", label: "V4 Minter", icon: Gem },
  { id: "multihop", label: "MultiHop", icon: GitBranch },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
  { id: "history", label: "History", icon: History },
  { id: "bot-mode", label: "Bot Mode", icon: Bot, badge: "New" },
];

function SettingsDialog() {
  const {
    autoRefreshInterval,
    setAutoRefreshInterval,
    settingsOpen,
    setSettingsOpen,
    botMode,
    setBotMode,
    botConfig,
    setBotConfig,
    hasSeenOnboarding,
    setOnboardingOpen,
  } = useAppStore();
  const [localInterval, setLocalInterval] = useState(() => autoRefreshInterval.toString());
  const [localThreshold, setLocalThreshold] = useState(() => botConfig.profitThreshold.toString());
  const [localGas, setLocalGas] = useState(() => botConfig.maxGasPrice.toString());
  const [localMintAmount, setLocalMintAmount] = useState(() => botConfig.mintAmount.toString());

  const handleSave = () => {
    const val = parseInt(localInterval);
    if (val >= 5000 && val <= 120000) {
      setAutoRefreshInterval(val);
      toast.success(`Auto-refresh set to ${val / 1000}s`);
      setSettingsOpen(false);
    } else {
      toast.error("Interval must be between 5s and 120s");
    }
  };

  const handleBotConfigSave = () => {
    const threshold = parseFloat(localThreshold);
    const gas = parseFloat(localGas);
    const mintAmount = parseFloat(localMintAmount);

    if (isNaN(threshold) || threshold < 1.0 || threshold > 10.0) {
      toast.error("Profit threshold must be between 1.0x and 10.0x");
      return;
    }
    if (isNaN(gas) || gas < 1 || gas > 500) {
      toast.error("Max gas price must be between 1 and 500 Gwei");
      return;
    }
    if (isNaN(mintAmount) || mintAmount <= 0) {
      toast.error("Mint amount must be positive");
      return;
    }

    setBotConfig({
      profitThreshold: threshold,
      maxGasPrice: gas,
      mintAmount: mintAmount,
    });
    toast.success("Bot configuration saved");
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-400" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Auto-Refresh */}
          <div className="space-y-2">
            <Label className="text-gray-300">Auto-Refresh Interval</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localInterval}
                onChange={(e) => setLocalInterval(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                min={5000}
                max={120000}
                step={1000}
              />
              <span className="text-sm text-gray-400 min-w-[32px]">
                {(parseInt(localInterval) / 1000).toFixed(0)}s
              </span>
            </div>
            <p className="text-xs text-gray-500">
              How often to refresh prices and multipliers. Range: 5s - 120s.
            </p>
          </div>

          <Separator className="bg-gray-800" />

          {/* Bot Mode Config */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-amber-400" />
                <Label className="text-gray-300">Bot Mode</Label>
              </div>
              <Switch
                checked={botMode}
                onCheckedChange={(checked) => {
                  setBotMode(checked);
                  setBotConfig({ enabled: checked });
                  toast.success(checked ? "Bot mode enabled" : "Bot mode disabled");
                }}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800 space-y-3">
              <div className="flex items-center gap-1.5">
                {botMode ? (
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] bot-mode-pulse">
                    <Bot className="h-2.5 w-2.5 mr-1" />
                    Bot Mode Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-700 text-gray-500 text-[10px]">
                    Inactive
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Profit Threshold</span>
                  <span className="text-xs text-emerald-400 font-mono">{localThreshold}x</span>
                </div>
                <Slider
                  value={[parseFloat(localThreshold) || 1.2]}
                  onValueChange={(v) => setLocalThreshold(v[0].toFixed(2))}
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  className="py-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 uppercase">Max Gas (Gwei)</Label>
                  <Input
                    type="number"
                    value={localGas}
                    onChange={(e) => setLocalGas(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white text-xs h-8 input-focus-ring"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 uppercase">Mint Amount</Label>
                  <Input
                    type="number"
                    value={localMintAmount}
                    onChange={(e) => setLocalMintAmount(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white text-xs h-8 input-focus-ring"
                  />
                </div>
              </div>

              <Button
                onClick={handleBotConfigSave}
                variant="outline"
                size="sm"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 btn-hover-scale"
              >
                Save Bot Config
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Onboarding */}
          {!hasSeenOnboarding && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-gray-700 text-gray-400 hover:bg-gray-800 btn-hover-scale gap-2"
              onClick={() => {
                setSettingsOpen(false);
                setTimeout(() => setOnboardingOpen(true), 200);
              }}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Show Getting Started Guide
            </Button>
          )}

          <Separator className="bg-gray-800" />

          {/* Network Info */}
          <div className="space-y-2">
            <Label className="text-gray-300">Network Info</Label>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">PulseChain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chain ID</span>
                <span className="text-white font-mono">{PULSECHAIN_CONFIG.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RPC</span>
                <span className="text-white text-xs font-mono">{PULSECHAIN_CONFIG.rpcUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Explorer</span>
                <span className="text-white text-xs font-mono">{PULSECHAIN_CONFIG.blockExplorer}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NetworkStatus() {
  const { chainId, setChainId } = useAppStore();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkChain = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const id = await getChainId();
          setChainId(id);
        } catch {
          // ignore
        }
      }
    };

    checkChain();

    if (window.ethereum) {
      const handler = () => checkChain();
      window.ethereum.on("chainChanged", handler);
      return () => {
        window.ethereum!.removeListener("chainChanged", handler);
      };
    }
  }, [setChainId]);

  const onPulse = chainId !== 0 && isPulseChain(chainId);
  const handleSwitch = async () => {
    setChecking(true);
    const switched = await switchToPulseChain();
    if (switched) {
      setChainId(PULSECHAIN_CONFIG.chainId);
    }
    setChecking(false);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-default",
              onPulse
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : chainId !== 0
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20"
                : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
            )}
            onClick={!onPulse && chainId !== 0 ? handleSwitch : undefined}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                onPulse ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
              )}
            />
            {onPulse ? "PulseChain" : chainId !== 0 ? "Wrong Network" : "Not Connected"}
            {!onPulse && chainId !== 0 && (
              <RefreshCw className={cn("h-3 w-3 ml-1", checking && "animate-spin")} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-900 border-gray-800 text-xs">
          {onPulse ? "Connected to PulseChain Mainnet" : chainId !== 0 ? "Click to switch to PulseChain" : "Connect wallet to use"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function Home() {
  const { activeTab, setActiveTab, setChainId, botMode, botRunning, onboardingOpen, hasSeenOnboarding, setOnboardingOpen } = useAppStore();

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (...args: any[]) => {
      if (args[0] && args[0].length === 0) {
        useAppStore.getState().setAddress(null);
        useAppStore.getState().setConnected(false);
        useAppStore.getState().setBalance("0");
        toast.info("Wallet disconnected");
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  // Show onboarding for first-time users
  useEffect(() => {
    if (!hasSeenOnboarding && typeof window !== "undefined") {
      const timer = setTimeout(() => setOnboardingOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding, setOnboardingOpen]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Animated mesh gradient background */}
        <div className="mesh-gradient-bg" />

        {/* Header - Glassmorphism */}
        <header className="sticky top-0 z-50 glass-header border-b border-gray-800/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center glow-emerald">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight">
                    Treasury Minter Engine
                  </h1>
                  <p className="text-[10px] text-gray-500 leading-none">
                    PulseChain V3/V4
                  </p>
                </div>
                {/* Bot Mode Badge */}
                {botMode && (
                  <Badge className={cn(
                    "text-[10px] gap-1 ml-2",
                    botRunning
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 bot-mode-pulse"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}>
                    <Bot className="h-2.5 w-2.5" />
                    {botRunning ? "Bot Running" : "Bot Active"}
                  </Badge>
                )}
              </div>

              {/* Right Side: Help + Network + Wallet */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-white hover:bg-gray-800/50"
                      onClick={() => setOnboardingOpen(true)}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 border-gray-800 text-xs">
                    Getting Started Guide
                  </TooltipContent>
                </Tooltip>
                <NetworkStatus />
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation - Glassmorphism */}
        <nav className="sticky top-14 z-40 glass-header border-b border-gray-800/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0.5 overflow-x-auto scrollbar-none py-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap btn-hover-scale",
                          isActive
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                        )}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.badge && (
                          <span className="text-[8px] px-1 py-0 rounded bg-emerald-500/20 text-emerald-400 font-bold leading-none">
                            {tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="tab-indicator"
                            className="absolute inset-0 rounded-md border border-emerald-500/20 -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 border-gray-800 text-xs sm:hidden">
                      {tab.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === "dashboard" && <DashboardTab />}
                {activeTab === "v3-minter" && <V3MinterTab />}
                {activeTab === "v4-minter" && <V4MinterTab />}
                {activeTab === "multihop" && <MultihopTab />}
                {activeTab === "calculator" && <CalculatorTab />}
                {activeTab === "portfolio" && <PortfolioTab />}
                {activeTab === "history" && <HistoryTab />}
                {activeTab === "bot-mode" && <BotPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer - Glassmorphism */}
        <footer className="sticky bottom-0 glass-header border-t border-gray-800/70 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  Treasury Minter Engine
                </span>
                <Separator
                  orientation="vertical"
                  className="h-3 bg-gray-800 hidden sm:block"
                />
                <span className="text-xs text-gray-600 hidden sm:inline">
                  PulseChain Mainnet
                </span>
              </div>
              <div className="flex items-center gap-3">
                {botMode && botRunning && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] gap-1 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Bot Running
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="border-gray-800 text-gray-500 text-[10px] font-mono"
                >
                  Chain {PULSECHAIN_CONFIG.chainId}
                </Badge>
              </div>
            </div>
          </div>
        </footer>

        {/* Settings Dialog */}
        <SettingsDialog />

        {/* Onboarding Modal */}
        <OnboardingModal />
      </div>
    </TooltipProvider>
  );
}
