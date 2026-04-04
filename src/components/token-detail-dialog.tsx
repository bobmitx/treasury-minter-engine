"use client";

import { ReactNode, useState } from "react";
import { useAppStore, TokenData } from "@/lib/store";
import {
  formatUSD,
  formatLargeNumber,
  shortenAddress,
  getExplorerAddressUrl,
} from "@/lib/ethereum";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfitIndicator } from "@/components/profit-indicator";
import {
  Copy,
  ExternalLink,
  Zap,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TokenDetailDialogProps {
  tokenAddress: string;
  children: ReactNode;
}

export function TokenDetailDialog({ tokenAddress, children }: TokenDetailDialogProps) {
  const { tokens, removeToken, setActiveTab, setMintToken, connected } = useAppStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = tokens.find((t) => t.address === tokenAddress);

  if (!token) return <>{children}</>;

  const handleCopy = () => {
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = () => {
    removeToken(token.address);
    setOpen(false);
    toast.success(`${token.symbol} removed from tracking`);
  };

  const handleMintMore = () => {
    if (token.version === "V3") {
      setActiveTab("v3-minter");
    } else {
      setActiveTab("v4-minter");
    }
    setOpen(false);
    setTimeout(() => {
      const mintInput = document.querySelector<HTMLInputElement>('input[placeholder="0x..."]');
      if (mintInput) {
        mintInput.value = token.address;
        mintInput.dispatchEvent(new Event("input", { bubbles: true }));
        mintInput.focus();
      }
    }, 300);
  };

  const balance = parseFloat(token.balance) || 0;
  const value = balance * token.priceUSD;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md neon-border-emerald">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-shimmer text-white">{token.name || token.symbol}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    token.version === "V4"
                      ? "border-amber-500/30 text-amber-400"
                      : "border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {token.version}
                </Badge>
              </div>
              <span className="text-xs text-gray-500 font-mono">{token.symbol}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800 animate-stagger-slide-up" style={{ animationDelay: "0ms" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="status-dot status-dot-success" />Price
              </p>
              <p className="text-sm font-semibold text-white font-mono number-tick">{formatUSD(token.priceUSD)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800 animate-stagger-slide-up" style={{ animationDelay: "60ms" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="status-dot status-dot-success" />Balance
              </p>
              <p className="text-sm font-semibold text-white font-mono number-tick">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className={cn(
              "rounded-lg p-3 border animate-stagger-slide-up",
              token.multiplier > 1 ? "bg-emerald-500/5 border-emerald-500/15" : "bg-gray-800/50 border-gray-800"
            )} style={{ animationDelay: "120ms" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className={cn("status-dot", token.multiplier > 1 ? "status-dot-success" : "status-dot-warning")} />Multiplier
              </p>
              <p className="text-sm font-semibold text-white font-mono number-tick">{formatLargeNumber(token.multiplier)}x</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800 animate-stagger-slide-up" style={{ animationDelay: "180ms" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className={cn("status-dot", value > 0 ? "status-dot-success" : "status-dot-warning")} />Value
              </p>
              <p className="text-sm font-semibold text-white font-mono number-tick">{formatUSD(value)}</p>
            </div>
          </div>

          {/* Profit ratio */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Profit Ratio</p>
            <div className="flex items-center justify-between">
              <ProfitIndicator ratio={token.profitRatio} size="lg" animated />
              <span className="text-xs text-gray-500">
                {token.profitRatio > 1.0 ? "Above profit threshold" : "Below profit threshold"}
              </span>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Contract Address</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-300 font-mono flex-1 truncate">{token.address}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white btn-hover-scale gap-1.5"
              onClick={handleMintMore}
              disabled={!connected}
            >
              <Zap className="h-3.5 w-3.5" />
              Mint More
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white btn-hover-scale gap-1.5"
              onClick={() => window.open(getExplorerAddressUrl(token.address), "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Explorer
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white btn-hover-scale gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy Address
            </Button>
            <Button
              variant="outline"
              className="bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 btn-hover-scale gap-1.5"
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
