"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
import { ActivityTicker } from "@/components/activity-ticker";
import { NotificationBell } from "@/components/notification-center";
import { PriceAlertSoundToggle } from "@/components/price-alert-sound";
import { QuickMintFAB } from "@/components/quick-mint-fab";
import { TokenComparison } from "@/components/token-comparison";
import { TokenWatchlist } from "@/components/token-watchlist";
import { useProfitAlertChecker } from "@/hooks/use-profit-alert-checker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Keyboard,
  Cpu,
  Blocks,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  Eye,
  ChevronLeft,
  ChevronRight,
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
  { id: "comparison", label: "Compare", icon: GitCompare },
  { id: "watchlist", label: "Watchlist", icon: Eye },
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
          <DialogDescription className="text-gray-500 text-xs">
            Configure your Treasury Minter Engine preferences, bot mode, and network settings.
          </DialogDescription>
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

          <Separator className="bg-gray-800" />

          {/* Keyboard Shortcuts */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Keyboard className="h-3.5 w-3.5 text-emerald-400" />
              Keyboard Shortcuts
            </Label>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
              {[
                { key: "1-9, 0", desc: "Switch tabs (Dashboard through Watchlist)" },
                { key: "W", desc: "Connect wallet / open wallet dialog" },
                { key: "R", desc: "Refresh market data" },
                { key: "Esc", desc: "Close any open dialog" },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{shortcut.desc}</span>
                  <kbd className="inline-flex items-center justify-center h-5 min-w-[24px] px-1.5 rounded bg-gray-900 border border-gray-700 text-[10px] font-mono text-gray-300">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
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

/* Parallax mesh gradient background that shifts on scroll */
function ParallaxMeshBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return;
      const scrollY = window.scrollY;
      const maxShift = 30;
      const shift = Math.min(scrollY * 0.05, maxShift);
      bgRef.current.style.transform = `translateY(${shift}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div ref={bgRef} className="mesh-gradient-bg">
        {/* Extra amber blob for richer gradient */}
        <div className="mesh-blob-amber" />
      </div>
      {/* Subtle grain/noise overlay for premium depth texture */}
      <div className="grain-overlay" />
    </>
  );
}

/* Scroll progress indicator - thin bar at top of page */
function ScrollProgressBar() {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollPercent((scrollTop / docHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className="scroll-indicator" style={{ width: `${scrollPercent}%` }} />;
}

/* Thin loading bar at top of page during route transitions */
function RouteLoadingBar() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      setLoading(true);
      timer = setTimeout(() => setLoading(false), 2000);
    };
    const stop = () => {
      clearTimeout(timer);
      setTimeout(() => setLoading(false), 200);
    };

    // Simulate initial page load
    start();

    window.addEventListener("treasury-route-start", start);
    window.addEventListener("treasury-route-stop", stop);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("treasury-route-start", start);
      window.removeEventListener("treasury-route-stop", stop);
    };
  }, []);

  if (!loading) return null;
  return <div className="route-loading-bar" />;
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

/* Enhanced Footer with live network stats, PLS price, and session info */
function EnhancedFooter() {
  const { botMode, botRunning, plsPriceUSD, tokens, transactions } = useAppStore();
  const [networkInfo, setNetworkInfo] = useState<{
    blockNumber: number;
    latency: number;
    syncStatus: boolean;
  } | null>(null);
  const [uptime, setUptime] = useState(0);

  // Fetch network health for footer
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/network-health");
        const data = await res.json();
        if (data.blockNumber && data.blockNumber !== 0) {
          setNetworkInfo(data);
        }
      } catch { /* use stale */ }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Session uptime counter
  useEffect(() => {
    const timer = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 0) return "text-gray-500";
    if (latency < 200) return "text-emerald-400";
    if (latency < 500) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <footer className="sticky bottom-0 z-30">
      {/* Live Stats Bar */}
      <div className="border-t border-gray-800/50 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-7 gap-3 overflow-hidden">
            {/* Left: Branding */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Activity className="h-2.5 w-2.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap hidden sm:inline">
                Treasury Minter Engine
              </span>
            </div>

            {/* Center: Live Stats - visible on sm+ */}
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono">
              {/* Block Height */}
              {networkInfo && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Blocks className="h-2.5 w-2.5 text-gray-600" />
                  <span className="hidden lg:inline">Block</span>
                  <span className="text-gray-300">{networkInfo.blockNumber.toLocaleString()}</span>
                </div>
              )}

              {/* Latency */}
              {networkInfo && (
                <div className="flex items-center gap-1.5">
                  <Timer className="h-2.5 w-2.5 text-gray-600" />
                  <span className={getLatencyColor(networkInfo.latency)}>
                    {networkInfo.latency}ms
                  </span>
                </div>
              )}

              {/* PLS Price */}
              {plsPriceUSD > 0 && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Cpu className="h-2.5 w-2.5 text-gray-600" />
                  <span>PLS</span>
                  <span className="text-gray-300">${plsPriceUSD.toFixed(6)}</span>
                </div>
              )}

              {/* Tokens Tracked */}
              <div className="flex items-center gap-1.5 text-gray-500">
                <Zap className="h-2.5 w-2.5 text-gray-600" />
                <span>{tokens.length} tokens</span>
              </div>

              {/* Uptime */}
              <div className="flex items-center gap-1.5 text-gray-500">
                <Globe className="h-2.5 w-2.5 text-gray-600" />
                <span>Session {formatUptime(uptime)}</span>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {botMode && botRunning && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-medium">Bot Active</span>
                </div>
              )}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-800/50 border border-gray-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                <span className="text-[9px] text-gray-500 font-mono">
                  #{PULSECHAIN_CONFIG.chainId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { activeTab, setActiveTab, setChainId, botMode, botRunning, onboardingOpen, hasSeenOnboarding, setOnboardingOpen, setSettingsOpen } = useAppStore();

  // Tab scroll arrow state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollLeft = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: -200, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: 200, behavior: "smooth" });
  }, []);

  // Run profit alert background checker
  useProfitAlertChecker();

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

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tabMap: Record<string, TabType> = {
      "1": "dashboard",
      "2": "v3-minter",
      "3": "v4-minter",
      "4": "multihop",
      "5": "calculator",
      "6": "portfolio",
      "7": "history",
      "8": "bot-mode",
      "9": "comparison",
      "0": "watchlist",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // 1-9, 0: Switch tabs
      if (tabMap[key]) {
        e.preventDefault();
        setActiveTab(tabMap[key]);
        return;
      }

      // w: Connect wallet
      if (key === "w") {
        e.preventDefault();
        if (typeof window !== "undefined" && window.ethereum) {
          window.ethereum.request({ method: "eth_requestAccounts" });
        }
        return;
      }

      // Escape: Close any open dialog
      if (key === "Escape") {
        const state = useAppStore.getState();
        if (state.settingsOpen) {
          state.setSettingsOpen(false);
          return;
        }
        if (state.onboardingOpen) {
          state.setOnboardingOpen(false);
          return;
        }
        if (state.tokenDetailOpen) {
          state.setTokenDetailOpen(false);
          return;
        }
        return;
      }

      // r: Refresh market data
      if (key === "r") {
        e.preventDefault();
        // Dispatch a custom event that DashboardTab can listen to
        window.dispatchEvent(new CustomEvent("treasury-refresh-data"));
        toast.info("Refreshing market data...");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTab]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Scroll progress indicator */}
        <ScrollProgressBar />

        {/* Route loading bar */}
        <RouteLoadingBar />

        {/* Animated mesh gradient background with parallax, extra amber blob, and grain overlay */}
        <ParallaxMeshBackground />

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

              {/* Right Side: Settings + Help + Notifications + Network + Wallet */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-white hover:bg-gray-800/50"
                      onClick={() => setSettingsOpen(true)}
                      aria-label="Open Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 border-gray-800 text-xs">
                    Settings
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-white hover:bg-gray-800/50"
                      onClick={() => setOnboardingOpen(true)}
                      aria-label="Open Getting Started Guide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 border-gray-800 text-xs">
                    Getting Started Guide
                  </TooltipContent>
                </Tooltip>
                <NotificationBell />
                <PriceAlertSoundToggle />
                <NetworkStatus />
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Skip Navigation Link for keyboard users */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-emerald-600 focus:text-white focus:text-xs focus:font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-950">
          Skip to main content
        </a>

        {/* Tab Navigation - Glassmorphism with ARIA tablist */}
        <nav className="sticky top-14 z-40 glass-header border-b border-gray-800/70" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              {/* Left scroll arrow */}
              {canScrollLeft && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center w-7 bg-gradient-to-r from-gray-950/90 to-transparent backdrop-blur-sm hover:from-gray-800/90 transition-colors"
                  aria-label="Scroll tabs left"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>
              )}
              {/* Right scroll arrow */}
              {canScrollRight && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center w-7 bg-gradient-to-l from-gray-950/90 to-transparent backdrop-blur-sm hover:from-gray-800/90 transition-colors"
                  aria-label="Scroll tabs right"
                >
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <div
                ref={scrollRef}
                role="tablist"
                className="flex gap-0.5 overflow-x-auto scrollbar-none py-1 scroll-smooth"
              >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>
                      <button
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(e) => {
                          const tabIds = TABS.map(t => t.id);
                          const currentIndex = tabIds.indexOf(tab.id);
                          if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            const nextIndex = (currentIndex + 1) % tabIds.length;
                            setActiveTab(tabIds[nextIndex]);
                            document.getElementById(`tab-${tabIds[nextIndex]}`)?.focus();
                          } else if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
                            setActiveTab(tabIds[prevIndex]);
                            document.getElementById(`tab-${tabIds[prevIndex]}`)?.focus();
                          }
                        }}
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap btn-hover-scale",
                          isActive
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                        )}
                        aria-label={tab.label}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.badge && (
                          <span className="sm:hidden text-[8px] px-1 py-0 rounded bg-emerald-500/20 text-emerald-400 font-bold leading-none ml-0.5" aria-hidden="true">{tab.badge}</span>
                        )}
                        {tab.badge && (
                          <span className="hidden sm:inline text-[8px] px-1 py-0 rounded bg-emerald-500/20 text-emerald-400 font-bold leading-none ml-0.5" aria-hidden="true">{tab.badge}</span>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="tab-indicator"
                            className="absolute inset-0 rounded-md border border-emerald-500/20 -z-10 animate-tab-spring"
                            transition={{ type: "spring", bounce: 0.5, duration: 0.6, stiffness: 300, damping: 20 }}
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
          </div>
        </nav>

        {/* Activity Ticker - shown when wallet not connected */}
        <ActivityTicker />

        {/* Main Content */}
        <main id="main-content" role="tabpanel" aria-label="Content area" className="flex-1 relative" tabIndex={0}>
          <div className="container-premium max-w-7xl mx-auto py-6">
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
                {activeTab === "comparison" && <TokenComparison />}
                {activeTab === "watchlist" && <TokenWatchlist />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer - Glassmorphism with Live Stats */}
        <EnhancedFooter />

        {/* Settings Dialog */}
        <SettingsDialog />

        {/* Onboarding Modal */}
        <OnboardingModal />

        {/* Quick Mint Floating Action Button */}
        <QuickMintFAB />
      </div>
    </TooltipProvider>
  );
}
