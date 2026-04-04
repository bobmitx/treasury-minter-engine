"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
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
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  const wrongNetwork = chainId !== 0 && !isPulseChain(chainId);

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

      <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">PLS</span>
          <span className="text-sm font-semibold text-white">
            {parseFloat(balance).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-gray-900 border-gray-800 hover:border-gray-700 text-white gap-1"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {shortenAddress(address!)}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-gray-900 border-gray-800"
        >
          <DropdownMenuItem
            onClick={copyAddress}
            className="text-gray-300 focus:bg-gray-800 focus:text-white"
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
            className="text-gray-300 focus:bg-gray-800 focus:text-white"
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
            className="text-gray-300 focus:bg-gray-800 focus:text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={setSettingsOpen.bind(null, true)}
            className="text-gray-300 focus:bg-gray-800 focus:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={disconnectWallet}
            className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
