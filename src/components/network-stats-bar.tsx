"use client";

import { useEffect, useState, useRef } from "react";
import {
  Blocks,
  Fuel,
  DollarSign,
  Wifi,
  Users,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NetworkStatsData {
  blockHeight: number;
  gasPrice: number;
  gasPriceGwei: number;
  plsPrice: number;
  syncStatus: boolean;
  activeAddresses: number;
  tps: number;
  blockTime: number;
  blockTimestamp: number;
  lastUpdated: number;
}

function formatGwei(gwei: number): string {
  if (gwei >= 1_000_000) return `${(gwei / 1_000_000).toFixed(1)}M`;
  if (gwei >= 1_000) return `${(gwei / 1_000).toFixed(1)}K`;
  return `${gwei}`;
}

function formatPrice(price: number): string {
  if (price <= 0) return "---";
  if (price < 0.001) return `$${price.toExponential(2)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function formatNumber(num: number): string {
  if (num <= 0) return "---";
  return num.toLocaleString();
}

export function NetworkStatsBar() {
  const [stats, setStats] = useState<NetworkStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevBlockHeight, setPrevBlockHeight] = useState<number | null>(null);
  const [blockPulse, setBlockPulse] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/network-stats");
        const data = await res.json();
        if (!mounted) return;

        if (data && data.blockHeight > 0) {
          setStats(data);
          if (
            prevBlockHeight !== null &&
            data.blockHeight !== prevBlockHeight
          ) {
            setBlockPulse(true);
            setTimeout(() => setBlockPulse(false), 800);
          }
          setPrevBlockHeight(data.blockHeight);
        }
      } catch {
        // keep stale data
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [prevBlockHeight]);

  const explorerUrl = stats
    ? `https://scan.pulsechain.com/block/${stats.blockHeight}`
    : "#";

  const statItems = [
    {
      icon: Blocks,
      label: "Block",
      value: stats ? formatNumber(stats.blockHeight) : undefined,
      href: stats ? explorerUrl : undefined,
      external: true,
      accent: "text-emerald-400",
      pulse: blockPulse,
    },
    {
      icon: Fuel,
      label: "Gas",
      value: stats ? `${formatGwei(stats.gasPriceGwei)} Gwei` : undefined,
      accent: "text-amber-400",
    },
    {
      icon: DollarSign,
      label: "PLS",
      value: stats ? formatPrice(stats.plsPrice) : undefined,
      accent: "text-emerald-400",
    },
    {
      icon: Wifi,
      label: "Network",
      value: stats
        ? stats.syncStatus
          ? "Synced"
          : "Syncing..."
        : undefined,
      accent: stats?.syncStatus ? "text-emerald-400" : "text-amber-400",
      badge: stats
        ? stats.syncStatus
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        : undefined,
    },
    {
      icon: Users,
      label: "Addresses",
      value: stats ? formatNumber(stats.activeAddresses) : undefined,
      accent: "text-gray-300",
    },
    {
      icon: Zap,
      label: "TPS",
      value: stats ? `${stats.tps}` : undefined,
      accent: stats && stats.tps > 0 ? "text-emerald-400" : "text-gray-400",
    },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
      {/* Mobile: horizontal scroll, Desktop: flex-wrap */}
      <div
        ref={scrollRef}
        className="flex md:flex-wrap items-center gap-0 md:gap-0 overflow-x-auto scrollbar-none px-3 py-2"
      >
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          const isLast = idx === statItems.length - 1;

          return (
            <div key={item.label} className="flex items-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-gray-800/50 transition-colors">
                <Icon
                  className={`h-3 w-3 flex-shrink-0 ${item.accent}`}
                />
                <span className="text-[10px] text-gray-500 hidden sm:inline">
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge
                    variant="outline"
                    className={`${item.badge} border text-[10px] px-1.5 py-0 font-mono`}
                  >
                    {item.value}
                  </Badge>
                ) : item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-mono font-semibold text-white hover:text-emerald-300 transition-colors flex items-center gap-1 ${item.pulse ? "animate-pulse" : ""}`}
                  >
                    {loading && !item.value ? (
                      <span className="inline-block w-12 h-3 bg-gray-800 rounded animate-pulse" />
                    ) : (
                      <span className="number-animate whitespace-nowrap">
                        {item.value || "---"}
                      </span>
                    )}
                    <ExternalLink className="h-2.5 w-2.5 text-gray-600" />
                  </a>
                ) : (
                  <span
                    className={`text-xs font-mono font-semibold text-white number-animate whitespace-nowrap ${item.pulse ? "animate-pulse" : ""}`}
                  >
                    {loading && !item.value ? (
                      <span className="inline-block w-12 h-3 bg-gray-800 rounded animate-pulse" />
                    ) : (
                      (item.value || "---")
                    )}
                  </span>
                )}
              </div>
              {!isLast && (
                <div className="w-px h-4 bg-gray-800 flex-shrink-0 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
