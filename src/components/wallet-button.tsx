"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  getAddress,
  getChainId,
  switchToPulseChain,
  getPLSBalance,
  isPulseChain,
  shortenAddress,
} from "@/lib/ethereum";
import { PULSECHAIN_CONFIG } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  RefreshCw,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function WalletButton() {
  const {
    address,
    balance,
    chainId,
    connected,
    setAddress,
    setBalance,
    setChainId,
    setConnected,
    setSettingsOpen,
  } = useAppStore();

  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevBalanceRef = useRef(balance);
  const [balanceDirection, setBalanceDirection] = useState<"up" | "down" | null>(null);

  // Track balance changes for direction indicator
  useEffect(() => {
    if (connected && prevBalanceRef.current !== balance) {
      const prev = parseFloat(prevBalanceRef.current) || 0;
      const curr = parseFloat(balance) || 0;
      if (Math.abs(curr - prev) > 0.001) {
        setBalanceDirection(curr > prev ? "up" : "down");
        const timer = setTimeout(() => setBalanceDirection(null), 2000);
        return () => clearTimeout(timer);
      }
      prevBalanceRef.current = balance;
    }
    prevBalanceRef.current = balance;
  }, [balance, connected]);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask is not installed. Please install MetaMask to continue.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setConnecting(true);
    try {
      // Request account access
      const addr = await getAddress();
      const currentChainId = await getChainId();

      // Check if on PulseChain
      if (!isPulseChain(currentChainId)) {
        const switched = await switchToPulseChain();
        if (!switched) {
          toast.error("Please switch to PulseChain network");
          setConnecting(false);
          return;
        }
      }

      // Get balance
      const bal = await getPLSBalance(addr);

      setAddress(addr);
      setBalance(bal);
      setChainId(PULSECHAIN_CONFIG.chainId);
      setConnected(true);

      toast.success("Wallet connected successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [setAddress, setBalance, setChainId, setConnected]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setBalance("0");
    setChainId(0);
    setConnected(false);
    toast.info("Wallet disconnected");
  }, [setAddress, setBalance, setChainId, setConnected]);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await getPLSBalance(address);
      setBalance(bal);
      toast.success("Balance refreshed");
    } catch (error: any) {
      toast.error("Failed to refresh balance");
    }
  }, [address, setBalance]);

  const copyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleSwitchNetwork = useCallback(async () => {
    const switched = await switchToPulseChain();
    if (switched) {
      setChainId(PULSECHAIN_CONFIG.chainId);
      toast.success("Switched to PulseChain");
    }
  }, [setChainId]);

  if (!connected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={connecting}
        className={cn(
          "bg-emerald-600 hover:bg-emerald-700 text-white gap-2",
          connecting && "connecting-spinner"
        )}
      >
        <Wallet className={cn("h-4 w-4", connecting && "animate-pulse")} />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  const wrongNetwork = chainId !== 0 && !isPulseChain(chainId);
  const formattedBalance = parseFloat(balance).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork && (
        <Button
          onClick={handleSwitchNetwork}
          variant="outline"
          size="sm"
          className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          Wrong Network
        </Button>
      )}

      {/* PLS Balance display with change indicator */}
      <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 transition-all duration-200 hover:border-gray-700">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-gentle-pulse" />
          <span className="text-xs text-gray-400">PLS</span>
          <span className="text-sm font-semibold text-white number-animate">
            {formattedBalance}
          </span>
          {/* Balance change direction arrow */}
          {balanceDirection && (
            <span className={cn(
              "flex items-center animate-slide-in-right text-xs",
              balanceDirection === "up" ? "balance-up" : "balance-down"
            )}>
              {balanceDirection === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-gray-900 border-gray-800 hover:border-gray-700 text-white gap-1 transition-all duration-200"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {shortenAddress(address!)}
            <ChevronDown className="h-3 w-3 text-gray-400 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-gray-900 border-gray-800 w-52"
        >
          {/* Address info section */}
          <div className="px-2 py-1.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Wallet</p>
            <p className="text-xs text-gray-300 font-mono truncate">{address}</p>
          </div>
          <DropdownMenuSeparator className="bg-gray-800/70" />

          <DropdownMenuItem
            onClick={copyAddress}
            className="text-gray-300 focus:bg-gray-800 focus:text-white dropdown-item-hover mx-1"
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={refreshBalance}
            className="text-gray-300 focus:bg-gray-800 focus:text-white dropdown-item-hover mx-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Balance
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              window.open(
                `${PULSECHAIN_CONFIG.blockExplorer}address/${address}`,
                "_blank"
              )
            }
            className="text-gray-300 focus:bg-gray-800 focus:text-white dropdown-item-hover mx-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-800/70" />

          <DropdownMenuItem
            onClick={setSettingsOpen.bind(null, true)}
            className="text-gray-300 focus:bg-gray-800 focus:text-white dropdown-item-hover mx-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-800/70" />

          <DropdownMenuItem
            onClick={disconnectWallet}
            className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 dropdown-item-hover mx-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
