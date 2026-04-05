"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  X,
  TrendingUp,
  AlertTriangle,
  Bot,
  Activity,
  Clock,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  DollarSign,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { NotificationItem } from "@/lib/store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const typeColorMap: Record<
  NotificationItem["type"],
  { dot: string; bg: string; icon: string; defaultColor: NotificationItem["color"] }
> = {
  profit_alert: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    icon: "TrendingUp",
    defaultColor: "emerald",
  },
  tx_success: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    icon: "CheckCircle2",
    defaultColor: "emerald",
  },
  tx_failed: {
    dot: "bg-rose-400",
    bg: "bg-rose-500/10",
    icon: "XCircle",
    defaultColor: "rose",
  },
  bot_event: {
    dot: "bg-violet-400",
    bg: "bg-violet-500/10",
    icon: "Bot",
    defaultColor: "violet",
  },
  system: {
    dot: "bg-cyan-400",
    bg: "bg-cyan-500/10",
    icon: "Info",
    defaultColor: "cyan",
  },
  price_change: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    icon: "DollarSign",
    defaultColor: "amber",
  },
};

const colorIconMap: Record<string, { ring: string; text: string }> = {
  emerald: { ring: "ring-emerald-500/20", text: "text-emerald-400" },
  amber: { ring: "ring-amber-500/20", text: "text-amber-400" },
  rose: { ring: "ring-rose-500/20", text: "text-rose-400" },
  cyan: { ring: "ring-cyan-500/20", text: "text-cyan-400" },
  violet: { ring: "ring-violet-500/20", text: "text-violet-400" },
};

const iconComponentMap: Record<string, React.ElementType> = {
  TrendingUp,
  AlertTriangle,
  Bot,
  Activity,
  Clock,
  Info,
  CheckCircle2,
  XCircle,
  DollarSign,
};

function NotificationIcon({ name, className }: { name: string; className?: string }) {
  const Comp = iconComponentMap[name] || Activity;
  return <Comp className={className} />;
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

type FilterType = "all" | "alerts" | "transactions" | "bot" | "system";

const filterConfig: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alerts", label: "Alerts" },
  { key: "transactions", label: "Transactions" },
  { key: "bot", label: "Bot" },
  { key: "system", label: "System" },
];

function matchFilter(type: NotificationItem["type"], filter: FilterType): boolean {
  switch (filter) {
    case "all":
      return true;
    case "alerts":
      return type === "profit_alert" || type === "price_change";
    case "transactions":
      return type === "tx_success" || type === "tx_failed";
    case "bot":
      return type === "bot_event";
    case "system":
      return type === "system";
    default:
      return true;
  }
}

// ─── Notification Row ────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onDismiss,
}: {
  notification: NotificationItem;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const typeInfo = typeColorMap[notification.type];
  const colorInfo = colorIconMap[notification.color || typeInfo.defaultColor] || colorIconMap.cyan;
  const iconName = notification.icon || typeInfo.icon;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg px-3 py-3 transition-all duration-200 cursor-pointer",
        "hover:bg-gray-800/50",
        !notification.read && "bg-gray-800/30"
      )}
      onClick={() => {
        if (!notification.read) onRead(notification.id);
      }}
    >
      {/* Left: Colored icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1",
          typeInfo.bg,
          colorInfo.ring,
          colorInfo.text
        )}
      >
        <NotificationIcon name={iconName} className="h-4 w-4" />
      </div>

      {/* Center: Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm font-medium",
              notification.read ? "text-gray-400" : "text-white"
            )}
          >
            {notification.title}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 leading-relaxed">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-gray-600">
          {getRelativeTime(notification.timestamp)}
        </p>
      </div>

      {/* Right: Unread dot + dismiss */}
      <div className="flex shrink-0 items-center gap-1">
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-blue-500 transition-all" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-gray-600 opacity-0 transition-all hover:bg-gray-700 hover:text-gray-300",
            "group-hover:opacity-100"
          )}
          aria-label="Dismiss notification"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function NotificationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800/60 ring-1 ring-gray-700/50">
        <BellOff className="h-6 w-6 text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-400">No notifications yet</p>
      <p className="mt-1 text-xs text-gray-600 text-center max-w-[200px]">
        Activity alerts, profit updates, and system events will appear here
      </p>
    </div>
  );
}

// ─── NotificationCenter ──────────────────────────────────────────────────────

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [now, setNow] = useState(Date.now());

  // Tick for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Generate demo notifications on first load
  const demoGenerated = useRef(false);
  useEffect(() => {
    if (demoGenerated.current || notifications.length > 0) return;
    demoGenerated.current = true;

    const now = Date.now();
    const demoNotifications = [
      {
        type: "profit_alert" as const,
        title: "Profit Alert: MV Token",
        message: "MV Token crossed 2.0x threshold — current ratio is 2.34x",
        icon: "TrendingUp",
        color: "emerald" as const,
        _ts: now - 30_000,
      },
      {
        type: "tx_success" as const,
        title: "Transaction Confirmed",
        message: "Minted 1,000 tokens of USDMV on PulseChain V3",
        icon: "CheckCircle2",
        color: "emerald" as const,
        _ts: now - 2 * 60_000,
      },
      {
        type: "bot_event" as const,
        title: "Bot Mode: Auto-mint Skipped",
        message: "Gas price too high (78 Gwei) — waiting for < 50 Gwei",
        icon: "Bot",
        color: "violet" as const,
        _ts: now - 5 * 60_000,
      },
      {
        type: "system" as const,
        title: "Market Data Refreshed",
        message: "Updated prices for 5 tracked tokens. PLS: $0.000201",
        icon: "Info",
        color: "cyan" as const,
        _ts: now - 10 * 60_000,
      },
    ];

    demoNotifications.forEach((demo) => {
      const newItem: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: demo.type,
        title: demo.title,
        message: demo.message,
        timestamp: demo._ts,
        read: false,
        icon: demo.icon,
        color: demo.color,
      };
      useAppStore.setState((state) => ({
        notifications: [...state.notifications, newItem],
        unreadCount: state.unreadCount + 1,
      }));
    });
  }, [notifications.length]);

  const filteredNotifications = notifications.filter((n) =>
    matchFilter(n.type, activeFilter)
  );

  const filterCounts: Record<FilterType, number> = {
    all: notifications.length,
    alerts: notifications.filter(
      (n) => n.type === "profit_alert" || n.type === "price_change"
    ).length,
    transactions: notifications.filter(
      (n) => n.type === "tx_success" || n.type === "tx_failed"
    ).length,
    bot: notifications.filter((n) => n.type === "bot_event").length,
    system: notifications.filter((n) => n.type === "system").length,
  };

  return (
    <div className="w-[380px] max-w-[calc(100vw-2rem)] animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-emerald-400"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="h-3 w-3" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-800 px-3 py-2 overflow-x-auto">
        {filterConfig.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
              activeFilter === f.key
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            )}
          >
            <Filter className="h-2.5 w-2.5 opacity-60" />
            {f.label}
            {filterCounts[f.key] > 0 && (
              <span
                className={cn(
                  "text-[10px]",
                  activeFilter === f.key ? "text-amber-400" : "text-gray-600"
                )}
              >
                {filterCounts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-800/50 p-2">
            {filteredNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onRead={markNotificationRead}
                onDismiss={(id) => {
                  useAppStore.setState((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                    unreadCount: state.notifications.filter(
                      (n) => n.id !== id && !n.read
                    ).length,
                  }));
                }}
              />
            ))}
          </div>
        ) : (
          <NotificationsEmptyState />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-2.5">
          <button
            onClick={clearNotifications}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-800/50 hover:text-rose-400"
          >
            <Trash2 className="h-3 w-3" />
            Clear All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

// ─── NotificationBell ────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useAppStore((s) => s.unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-[18px] w-[18px]" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 animate-[pulse-ring_1.5s_ease-out]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 glass-card-depth rounded-xl border border-gray-800 bg-gray-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl animate-slide-in-right"
        >
          <NotificationCenter />
        </div>
      )}
    </div>
  );
}
