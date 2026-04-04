"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileJson,
  DatabaseBackup,
  History,
  Download,
} from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportPortfolioCSV(tokens: ReturnType<typeof useAppStore.getState>["tokens"]) {
  const headers = [
    "Name",
    "Symbol",
    "Address",
    "Balance",
    "Price (USD)",
    "Multiplier",
    "Profit Ratio",
    "Value (USD)",
    "Version",
  ];

  const rows = tokens.map((t) => [
    t.name,
    t.symbol,
    t.address,
    t.balance,
    t.priceUSD.toFixed(6),
    t.multiplier.toFixed(4),
    t.profitRatio.toFixed(4),
    (parseFloat(t.balance) * t.priceUSD).toFixed(4),
    t.version,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `treasury-portfolio-${getTimestamp()}.csv`);
}

function exportTransactionsCSV(transactions: ReturnType<typeof useAppStore.getState>["transactions"]) {
  const headers = [
    "Type",
    "Status",
    "Token Symbol",
    "Token Address",
    "Amount",
    "TX Hash",
    "Gas Cost",
    "Version",
    "Timestamp",
  ];

  const rows = transactions.map((tx) => [
    tx.type,
    tx.status,
    tx.tokenSymbol ?? "",
    tx.tokenAddress ?? "",
    tx.amount ?? "",
    tx.txHash,
    tx.gasCost ?? "",
    tx.version,
    new Date(tx.timestamp).toISOString(),
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `treasury-transactions-${getTimestamp()}.csv`);
}

function exportSettingsJSON(state: ReturnType<typeof useAppStore.getState>) {
  const settings = {
    botConfig: state.botConfig,
    profitAlerts: state.profitAlerts,
    autoRefreshInterval: state.autoRefreshInterval,
    botMode: state.botMode,
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
  };

  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  downloadBlob(blob, `treasury-settings-${getTimestamp()}.json`);
}

function exportFullBackup(state: ReturnType<typeof useAppStore.getState>) {
  const backup = {
    tokens: state.tokens,
    transactions: state.transactions,
    botConfig: state.botConfig,
    profitAlerts: state.profitAlerts,
    autoRefreshInterval: state.autoRefreshInterval,
    botMode: state.botMode,
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  downloadBlob(blob, `treasury-full-backup-${getTimestamp()}.json`);
}

const EXPORT_OPTIONS = [
  {
    id: "portfolio",
    title: "Portfolio Data",
    description: "Export all tracked tokens with balances, prices, multipliers, and profit ratios.",
    format: "CSV" as const,
    icon: FileSpreadsheet,
    accent: "from-emerald-500/20 to-emerald-500/5",
    borderAccent: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    id: "transactions",
    title: "Transaction History",
    description: "Export all transactions including type, status, amounts, and gas costs.",
    format: "CSV" as const,
    icon: History,
    accent: "from-cyan-500/20 to-cyan-500/5",
    borderAccent: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    id: "settings",
    title: "Settings & Config",
    description: "Export bot configuration, profit alerts, and app settings.",
    format: "JSON" as const,
    icon: FileJson,
    accent: "from-amber-500/20 to-amber-500/5",
    borderAccent: "border-amber-500/20",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    id: "backup",
    title: "Full Backup",
    description: "Export everything: tokens, transactions, settings, and alerts for restore.",
    format: "JSON" as const,
    icon: DatabaseBackup,
    accent: "from-violet-500/20 to-violet-500/5",
    borderAccent: "border-violet-500/20",
    iconColor: "text-violet-400",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
];

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const storeState = useAppStore();

  const handleExport = useCallback(
    (optionId: string) => {
      try {
        switch (optionId) {
          case "portfolio":
            if (storeState.tokens.length === 0) {
              toast.error("No tokens to export", {
                description: "Add some tokens to your portfolio first.",
              });
              return;
            }
            exportPortfolioCSV(storeState.tokens);
            toast.success("Portfolio exported", {
              description: `${storeState.tokens.length} tokens exported as CSV.`,
            });
            break;

          case "transactions":
            if (storeState.transactions.length === 0) {
              toast.error("No transactions to export", {
                description: "No transaction history available.",
              });
              return;
            }
            exportTransactionsCSV(storeState.transactions);
            toast.success("Transactions exported", {
              description: `${storeState.transactions.length} transactions exported as CSV.`,
            });
            break;

          case "settings":
            exportSettingsJSON(storeState);
            toast.success("Settings exported", {
              description: "Configuration and settings exported as JSON.",
            });
            break;

          case "backup":
            exportFullBackup(storeState);
            toast.success("Full backup exported", {
              description: "All data exported as JSON for restore.",
            });
            break;

          default:
            break;
        }

        onOpenChange(false);
      } catch (error) {
        toast.error("Export failed", {
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
        });
      }
    },
    [storeState, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-950 border-gray-800 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-400" />
            Data Export Hub
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Export your treasury data in various formats. Choose an export option below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {EXPORT_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className="gradient-border bg-gray-900 border-gray-800/70 hover:border-gray-700 transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${option.accent} border ${option.borderAccent} flex items-center justify-center`}
                  >
                    <option.icon className={`h-5 w-5 ${option.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {option.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border ${option.badgeBg}`}
                      >
                        {option.format}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {option.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleExport(option.id)}
                      className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 btn-hover-scale text-xs h-8"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
