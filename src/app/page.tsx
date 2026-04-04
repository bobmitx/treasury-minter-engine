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
} from "lucide-react";
import { toast } from "sonner";
import { getChainId, switchToPulseChain, isPulseChain } from "@/lib/ethereum";
import { PULSECHAIN_CONFIG } from "@/lib/contracts";

const TABS: Array<{
  id: TabType;
  label: string;
  icon: any;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "v3-minter", label: "V3 Minter", icon: Zap },
  { id: "v4-minter", label: "V4 Minter", icon: Gem },
  { id: "multihop", label: "MultiHop", icon: GitBranch },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
  { id: "history", label: "History", icon: History },
];

function SettingsDialog() {
  const { autoRefreshInterval, setAutoRefreshInterval, settingsOpen, setSettingsOpen } =
    useAppStore();
  // Use key-based remount to reset when dialog opens
  const [localInterval, setLocalInterval] = useState(() => autoRefreshInterval.toString());

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

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-400" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-gray-300">Auto-Refresh Interval (ms)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localInterval}
                onChange={(e) => setLocalInterval(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                min={5000}
                max={120000}
                step={1000}
              />
              <span className="text-sm text-gray-400">
                {(parseInt(localInterval) / 1000).toFixed(0)}s
              </span>
            </div>
            <p className="text-xs text-gray-500">
              How often to refresh prices and multipliers. Range: 5s - 120s.
            </p>
          </div>

          <Separator className="bg-gray-800" />

          <div className="space-y-2">
            <Label className="text-gray-300">Network Info</Label>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">PulseChain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chain ID</span>
                <span className="text-white font-mono">
                  {PULSECHAIN_CONFIG.chainId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RPC</span>
                <span className="text-white text-xs font-mono">
                  {PULSECHAIN_CONFIG.rpcUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Explorer</span>
                <span className="text-white text-xs font-mono">
                  {PULSECHAIN_CONFIG.blockExplorer}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        onPulse
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20"
      )}
      onClick={!onPulse ? handleSwitch : undefined}
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
  );
}

export default function Home() {
  const { activeTab, setActiveTab, setChainId } = useAppStore();

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (...args: any[]) => {
      if (args[0] && args[0].length === 0) {
        // User disconnected
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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
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
            </div>

            {/* Right Side: Network + Wallet */}
            <div className="flex items-center gap-3">
              <NetworkStatus />
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-14 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "v3-minter" && <V3MinterTab />}
          {activeTab === "v4-minter" && <V4MinterTab />}
          {activeTab === "multihop" && <MultihopTab />}
          {activeTab === "portfolio" && <PortfolioTab />}
          {activeTab === "history" && <HistoryTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Treasury Minter Engine · PulseChain
              </span>
              <Separator
                orientation="vertical"
                className="h-3 bg-gray-800 hidden sm:block"
              />
              <span className="text-xs text-gray-600">
                V3: {PULSECHAIN_CONFIG.blockExplorer.replace("https://", "").split("/")[0]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="border-gray-800 text-gray-500 text-[10px] font-mono"
              >
                Chain ID: {PULSECHAIN_CONFIG.chainId}
              </Badge>
              <span className="text-[10px] text-gray-600">
                Built for PulseChain Mainnet
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Dialog */}
      <SettingsDialog />
    </div>
  );
}
