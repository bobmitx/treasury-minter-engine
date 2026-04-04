"use client";

import { useState } from "react";
import { useAppStore, ProfitAlert } from "@/lib/store";
import { formatUSD } from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  BellRing,
  BellOff,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Utility: Format Timestamp ───
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Empty State Component ───
function AlertsEmptyState({
  trackedTokens,
  onCreateClick,
  compact,
}: {
  trackedTokens: Array<{ address: string; symbol: string; profitRatio: number }>;
  onCreateClick: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-center py-8 px-4">
        <BellOff className="h-8 w-8 text-gray-600 mb-3" />
        <p className="text-xs text-gray-500 text-center">
          No alerts configured yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center mb-4">
        <BellOff className="h-7 w-7 text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-300 mb-1">No Profit Alerts</h3>
      <p className="text-xs text-gray-500 text-center max-w-[240px] mb-4">
        Set up alerts to get notified when a token&apos;s profit ratio crosses your specified threshold.
      </p>
      {trackedTokens.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800 max-w-[280px]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-gray-400">
              You need to track tokens first. Go to the V3 or V4 Minter tab to add tokens to your watchlist.
            </p>
          </div>
        </div>
      ) : (
        <Button
          onClick={onCreateClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Create First Alert
        </Button>
      )}
    </div>
  );
}

// ─── Alert Row Component ───
function AlertRow({
  alert,
  onDelete,
}: {
  alert: ProfitAlert;
  onDelete: (id: string, symbol: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors group",
        alert.triggered
          ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20"
          : "bg-gray-800/30 border-gray-800 hover:border-gray-700"
      )}
    >
      {/* Direction Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          alert.direction === "above"
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-rose-500/10 border border-rose-500/20"
        )}
      >
        {alert.direction === "above" ? (
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-rose-400" />
        )}
      </div>

      {/* Alert Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white truncate">
            {alert.tokenSymbol}
          </span>
          <Badge
            className={cn(
              "text-[9px] px-1.5 py-0 h-4 border",
              alert.direction === "above"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}
          >
            {alert.direction === "above" ? "Above" : "Below"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>
            Threshold: <span className="text-gray-300 font-medium">{alert.threshold.toFixed(2)}x</span>
          </span>
          <span className="text-gray-700">·</span>
          <span>{formatTime(alert.createdAt)}</span>
        </div>
      </div>

      {/* Status + Delete */}
      <div className="flex items-center gap-2 shrink-0">
        {alert.triggered ? (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
            Triggered
          </Badge>
        ) : (
          <Badge variant="outline" className="border-gray-700 text-gray-500 text-[10px]">
            <Clock className="h-2.5 w-2.5 mr-1" />
            Waiting
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(alert.id, alert.tokenSymbol)}
          className="h-7 w-7 p-0 text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Create Alert Dialog Component ───
interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackedTokens: Array<{ address: string; symbol: string; profitRatio: number }>;
  selectedTokenAddress: string;
  setSelectedTokenAddress: (address: string) => void;
  threshold: string;
  setThreshold: (value: string) => void;
  direction: "above" | "below";
  setDirection: (dir: "above" | "below") => void;
  onCreate: () => void;
}

function CreateAlertDialog({
  open,
  onOpenChange,
  trackedTokens,
  selectedTokenAddress,
  setSelectedTokenAddress,
  threshold,
  setThreshold,
  direction,
  setDirection,
  onCreate,
}: CreateAlertDialogProps) {
  return (
    <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4 text-emerald-400" />
          Create Profit Alert
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {/* Token Select */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Token</Label>
          <Select value={selectedTokenAddress} onValueChange={setSelectedTokenAddress}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9">
              <SelectValue placeholder="Select a tracked token" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              {trackedTokens.map((token) => (
                <SelectItem key={token.address} value={token.address} className="text-gray-300 focus:bg-gray-800 focus:text-white">
                  <div className="flex items-center gap-2">
                    <span>{token.symbol}</span>
                    <span className="text-[10px] text-gray-500">
                      {token.profitRatio.toFixed(2)}x
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {trackedTokens.length === 0 && (
            <p className="text-[10px] text-amber-400/80">
              No tracked tokens. Add tokens from V3/V4 Minter first.
            </p>
          )}
        </div>

        {/* Threshold */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">
            Profit Ratio Threshold (e.g. 1.5 for 1.5x)
          </Label>
          <Input
            type="text"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value.replace(/[^0-9.]/g, ""))}
            className="bg-gray-800 border-gray-700 text-white input-focus-ring h-9"
            placeholder="e.g. 1.5"
          />
          <p className="text-[10px] text-gray-600">
            Alert will trigger when the token&apos;s profit ratio goes {direction} this value.
          </p>
        </div>

        {/* Direction */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Alert When</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "above" ? "default" : "outline"}
              onClick={() => setDirection("above")}
              className={cn(
                "h-9 btn-hover-scale",
                direction === "above"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                  : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Goes Above
            </Button>
            <Button
              type="button"
              variant={direction === "below" ? "default" : "outline"}
              onClick={() => setDirection("below")}
              className={cn(
                "h-9 btn-hover-scale",
                direction === "below"
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                  : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
              )}
            >
              <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
              Goes Below
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        {/* Preview */}
        {selectedTokenAddress && threshold && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
              Alert Preview
            </p>
            <p className="text-xs text-gray-300">
              Notify me when{" "}
              <span className="text-white font-semibold">
                {trackedTokens.find((t) => t.address === selectedTokenAddress)?.symbol || "Token"}
              </span>
              &apos;s profit ratio{" "}
              <span className={cn("font-semibold", direction === "above" ? "text-emerald-400" : "text-rose-400")}>
                goes {direction} {parseFloat(threshold || "0").toFixed(2)}x
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreate}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale h-9"
          >
            Create Alert
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 h-9"
          >
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Main Panel Component ───
interface ProfitAlertsPanelProps {
  embedded?: boolean;
  className?: string;
}

export function ProfitAlertsPanel({ embedded = false, className }: ProfitAlertsPanelProps) {
  const {
    profitAlerts,
    addProfitAlert,
    removeProfitAlert,
    tokens,
  } = useAppStore();

  // ─── Create Alert State ───
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState("");
  const [threshold, setThreshold] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");

  // ─── Filter State ───
  const [filterStatus, setFilterStatus] = useState<"all" | "triggered" | "waiting">("all");

  const trackedTokens = tokens.length > 0 ? tokens : [];

  // ─── Filtered Alerts ───
  const filteredAlerts = profitAlerts.filter((alert) => {
    if (filterStatus === "triggered") return alert.triggered;
    if (filterStatus === "waiting") return !alert.triggered;
    return true;
  });

  // ─── Create Alert Handler ───
  const handleCreateAlert = () => {
    const thresholdNum = parseFloat(threshold);

    if (!selectedTokenAddress) {
      toast.error("Please select a token");
      return;
    }
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      toast.error("Please enter a valid threshold");
      return;
    }

    const selectedToken = trackedTokens.find(
      (t) => t.address === selectedTokenAddress
    );

    if (!selectedToken) {
      toast.error("Selected token not found in tracked tokens");
      return;
    }

    // Check for duplicate
    const exists = profitAlerts.find(
      (a) =>
        a.tokenAddress === selectedTokenAddress &&
        a.threshold === thresholdNum &&
        a.direction === direction
    );
    if (exists) {
      toast.error("An identical alert already exists");
      return;
    }

    const newAlert: ProfitAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      tokenAddress: selectedTokenAddress,
      tokenSymbol: selectedToken.symbol,
      threshold: thresholdNum,
      direction,
      triggered: false,
      createdAt: Date.now(),
    };

    addProfitAlert(newAlert);
    toast.success(
      `Alert created: ${selectedToken.symbol} ${direction === "above" ? "above" : "below"} ${thresholdNum.toFixed(2)}x`
    );

    // Reset form
    setSelectedTokenAddress("");
    setThreshold("");
    setDirection("above");
    setCreateOpen(false);
  };

  // ─── Delete Alert Handler ───
  const handleDeleteAlert = (id: string, symbol: string) => {
    removeProfitAlert(id);
    toast.success(`Alert removed for ${symbol}`);
  };

  // ─── Triggered Count ───
  const triggeredCount = profitAlerts.filter((a) => a.triggered).length;
  const waitingCount = profitAlerts.filter((a) => !a.triggered).length;

  // ─── Dialog Component ───
  const dialogElement = (
    <CreateAlertDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      trackedTokens={trackedTokens}
      selectedTokenAddress={selectedTokenAddress}
      setSelectedTokenAddress={setSelectedTokenAddress}
      threshold={threshold}
      setThreshold={setThreshold}
      direction={direction}
      setDirection={setDirection}
      onCreate={handleCreateAlert}
    />
  );

  // ─── Embedded Layout ───
  if (embedded) {
    return (
      <>
        {/* Embedded Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Profit Alerts</h3>
            {profitAlerts.length > 0 && (
              <Badge
                variant="outline"
                className="border-gray-700 text-gray-400 text-[10px]"
              >
                {profitAlerts.length}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
            disabled={trackedTokens.length === 0}
            className="h-7 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 btn-hover-scale text-[11px]"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Alert
          </Button>
        </div>

        {/* Alerts List */}
        {profitAlerts.length === 0 ? (
          <AlertsEmptyState
            trackedTokens={trackedTokens}
            onCreateClick={() => setCreateOpen(true)}
            compact
          />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onDelete={handleDeleteAlert} />
            ))}
          </div>
        )}

        {/* Create Alert Dialog */}
        {dialogElement}
      </>
    );
  }

  // ─── Full Panel Layout ───
  return (
    <div className={cn("space-y-4 animate-fade-in-up", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center glow-emerald">
            <BellRing className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Profit Alerts</h2>
            <p className="text-xs text-gray-500">
              Get notified when profit ratios cross thresholds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          {triggeredCount > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
              {triggeredCount} Triggered
            </Badge>
          )}
          {waitingCount > 0 && (
            <Badge variant="outline" className="border-gray-700 text-gray-500 text-[10px]">
              <Clock className="h-2.5 w-2.5 mr-1" />
              {waitingCount} Waiting
            </Badge>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={trackedTokens.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                New Alert
              </Button>
            </DialogTrigger>
            {dialogElement}
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      {profitAlerts.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[11px] text-gray-500">Filter:</span>
          {(["all", "triggered", "waiting"] as const).map((status) => (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={cn(
                "h-7 px-2.5 text-[11px] font-medium",
                filterStatus === status
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
              )}
            >
              {status === "all" && "All"}
              {status === "triggered" && "Triggered"}
              {status === "waiting" && "Waiting"}
              {status !== "all" && (
                <span className="ml-1 text-gray-600">
                  ({status === "triggered" ? triggeredCount : waitingCount})
                </span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Alerts Content */}
      {profitAlerts.length === 0 ? (
        <AlertsEmptyState
          trackedTokens={trackedTokens}
          onCreateClick={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-500">
                No {filterStatus} alerts found
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onDelete={handleDeleteAlert} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
