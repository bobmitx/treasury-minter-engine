"use client";

import { useMemo, useCallback, useState } from "react";
import { useAppStore, TabType } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Gem,
  GitBranch,
  Wallet,
  Bot,
  Calculator,
  Pin,
  PinOff,
  Clock,
  ArrowRight,
  Star,
  History,
  Coins,
  Gift,
  RotateCcw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActionItem {
  id: string;
  label: string;
  tab: TabType;
  icon: React.ElementType;
}

interface ActionWithPin extends ActionItem {
  pinned: boolean;
}

/* ------------------------------------------------------------------ */
/*  Action definitions                                                 */
/* ------------------------------------------------------------------ */

const ALL_ACTIONS: ActionItem[] = [
  { id: "create-v3", label: "Create V3 Token", tab: "v3-minter", icon: Zap },
  { id: "create-v4", label: "Create V4 Token", tab: "v4-minter", icon: Gem },
  { id: "multihop", label: "MultiHop Mint", tab: "multihop", icon: GitBranch },
  { id: "portfolio", label: "View Portfolio", tab: "portfolio", icon: Wallet },
  { id: "bot-mode", label: "Start Bot", tab: "bot-mode", icon: Bot },
  { id: "calculator", label: "Calculator", tab: "calculator", icon: Calculator },
];

const MAX_PINS = 2;
const FAVORITES_KEY = "treasury-minter-favorites";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_PINS) as string[];
    return [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids.slice(0, MAX_PINS)));
}

function getRelativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Action Grid                                                        */
/* ------------------------------------------------------------------ */

function ActionGrid({
  actions,
  onActionClick,
  onTogglePin,
}: {
  actions: ActionWithPin[];
  onActionClick: (tab: TabType) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className="relative group"
        >
          <Button
            variant="outline"
            className="w-full h-auto py-3 px-3 flex flex-col items-center gap-2 bg-gray-800/50 border-gray-700/50 text-gray-300 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 card-hover btn-hover-scale rounded-xl"
            onClick={() => onActionClick(action.tab)}
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/15 transition-colors">
              <action.icon className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-[11px] font-medium">{action.label}</span>
          </Button>

          {/* Pin toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(action.id);
            }}
            className="absolute -top-1 -right-1 p-0.5 rounded-full bg-gray-900 border border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:border-emerald-500/30 z-10"
            title={action.pinned ? "Unpin action" : "Pin action"}
          >
            {action.pinned ? (
              <PinOff className="h-2.5 w-2.5 text-emerald-400" />
            ) : (
              <Pin className="h-2.5 w-2.5 text-gray-500" />
            )}
          </button>

          {/* Pinned indicator dot */}
          {action.pinned && (
            <div className="absolute -top-0.5 -left-0.5">
              <Pin className="h-3 w-3 text-emerald-400 opacity-60" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Actions Log                                                 */
/* ------------------------------------------------------------------ */

const TX_TYPE_ICONS: Record<string, React.ElementType> = {
  create: Coins,
  mint: Zap,
  claim: Gift,
  multihop: GitBranch,
  withdraw: RotateCcw,
};

const TX_TYPE_LABELS: Record<string, string> = {
  create: "Created",
  mint: "Minted",
  claim: "Claimed",
  multihop: "MultiHop Mint",
  withdraw: "Withdrew",
};

function RecentActionsLog() {
  const { transactions } = useAppStore();

  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (recentTx.length === 0) {
    return (
      <div className="text-center py-6">
        <History className="h-7 w-7 mx-auto mb-2 text-gray-600" />
        <p className="text-xs text-gray-500">No recent actions</p>
        <p className="text-[10px] text-gray-600 mt-0.5">
          Start minting to see your activity here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
      {recentTx.map((tx) => {
        const Icon = TX_TYPE_ICONS[tx.type] || ArrowRight;
        const label = TX_TYPE_LABELS[tx.type] || tx.type;
        const statusColor =
          tx.status === "confirmed"
            ? "bg-emerald-500"
            : tx.status === "pending"
            ? "bg-amber-500 animate-pulse"
            : "bg-rose-500";

        return (
          <div
            key={tx.id}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 transition-colors duration-150 group"
          >
            <div
              className={`w-7 h-7 rounded-lg bg-gray-700/50 border border-gray-700/50 flex items-center justify-center shrink-0 group-hover:border-gray-600 transition-colors`}
            >
              <Icon className="h-3 w-3 text-gray-400 group-hover:text-gray-300 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                {label}{" "}
                {tx.tokenSymbol && (
                  <span className="text-emerald-400 font-medium">
                    {tx.tokenSymbol}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-2.5 w-2.5 text-gray-600" />
                <p className="text-[10px] text-gray-500">
                  {getRelativeTime(tx.timestamp)}
                </p>
              </div>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FavoriteActions                                                    */
/* ------------------------------------------------------------------ */

function FavoriteActions({
  pinnedActions,
  onActionClick,
}: {
  pinnedActions: ActionWithPin[];
  onActionClick: (tab: TabType) => void;
}) {
  if (pinnedActions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Star className="h-3 w-3 text-amber-400" />
        <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wide">
          Favorites
        </p>
        <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded ml-1">
          {pinnedActions.length}/{MAX_PINS}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pinnedActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-7 px-2.5 gap-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/15 btn-hover-scale text-[11px] rounded-lg"
            onClick={() => onActionClick(action.tab)}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QuickActionsPanel (exported)                                       */
/* ------------------------------------------------------------------ */

export function QuickActionsPanel() {
  const { setActiveTab } = useAppStore();
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => loadFavorites());

  // Build actions with pin state
  const actions: ActionWithPin[] = useMemo(
    () =>
      ALL_ACTIONS.map((a) => ({
        ...a,
        pinned: pinnedIds.includes(a.id),
      })),
    [pinnedIds]
  );

  // Pinned actions shown at top
  const pinnedActions = useMemo(
    () => actions.filter((a) => a.pinned),
    [actions]
  );

  const handleActionClick = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  const handleTogglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < MAX_PINS
        ? [...prev, id]
        : prev;
      saveFavorites(next);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Main Card */}
      <Card className="bg-gray-900 border-gray-800/70 card-hover glass-card-depth">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Quick Actions
            </CardTitle>
            <Badge variant="outline" className="bg-gray-500/10 border-gray-500/20 text-gray-400 text-[10px]">
              {ALL_ACTIONS.length} actions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pinned / Favorite Actions */}
          <FavoriteActions
            pinnedActions={pinnedActions}
            onActionClick={handleActionClick}
          />

          {/* Action Grid */}
          <ActionGrid
            actions={actions}
            onActionClick={handleActionClick}
            onTogglePin={handleTogglePin}
          />

          {/* Pin hint */}
          <p className="text-[10px] text-gray-600 text-center">
            Hover over an action and click <Pin className="h-2.5 w-2.5 inline text-gray-500" /> to pin up to {MAX_PINS} favorites
          </p>
        </CardContent>
      </Card>

      {/* Recent Actions Log */}
      <Card className="bg-gray-900 border-gray-800/70 card-hover glass-card-depth">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              Recent Actions
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]">
              Latest
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <RecentActionsLog />
        </CardContent>
      </Card>
    </div>
  );
}
