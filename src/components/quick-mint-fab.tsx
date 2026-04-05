"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gem, GitBranch, Gift, X, TrendingUp } from "lucide-react";
import { useAppStore, TabType } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** FAB action definition */
interface FabAction {
  id: string;
  label: string;
  icon: React.ElementType;
  tab: TabType;
  accent: "emerald" | "amber" | "violet";
}

/** The 4 quick-mint actions */
const FAB_ACTIONS: FabAction[] = [
  {
    id: "quick-mint-v3",
    label: "Quick Mint V3",
    icon: Zap,
    tab: "v3-minter",
    accent: "emerald",
  },
  {
    id: "quick-mint-v4",
    label: "Quick Mint V4",
    icon: Gem,
    tab: "v4-minter",
    accent: "amber",
  },
  {
    id: "multihop",
    label: "MultiHop",
    icon: GitBranch,
    tab: "multihop",
    accent: "emerald",
  },
  {
    id: "claim-rewards",
    label: "Claim Rewards",
    icon: Gift,
    tab: "v4-minter",
    accent: "amber",
  },
];

/** Accent colour mapping */
const ACCENT_STYLES: Record<string, string> = {
  emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20",
  amber: "text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20",
  violet: "text-violet-400 border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/20",
};

/** Inactivity timeout before auto-collapse (ms) */
const INACTIVITY_MS = 10_000;

/**
 * QuickMintFAB — Floating Action Button
 *
 * Shows a fixed emerald FAB at the bottom-right when a wallet is connected.
 * Expands into a vertical stack of quick-mint action buttons with staggered
 * spring animations. Auto-collapses after 10 s of inactivity.
 */
export function QuickMintFAB() {
  const { connected, setActiveTab, tokens } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------------------------------------ */
  /*  Top performer suggestion                                          */
  /* ------------------------------------------------------------------ */
  const topPerformer = useMemo(() => {
    if (tokens.length === 0) return null;
    return tokens.reduce<TokenData | null>(
      (best, t) =>
        !best || t.profitRatio > best.profitRatio ? t : best,
      null
    );
  }, [tokens]);

  /* ------------------------------------------------------------------ */
  /*  Inactivity timer                                                   */
  /* ------------------------------------------------------------------ */
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setExpanded(false);
    }, INACTIVITY_MS);
  }, []);

  /** Toggle expanded state */
  const toggle = useCallback(() => {
    setExpanded((prev) => {
      if (!prev) {
        // Opening — start inactivity timer
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
          setExpanded(false);
        }, INACTIVITY_MS);
      } else {
        // Closing — clear timer
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      }
      return !prev;
    });
  }, []);

  /** Collapse the menu */
  const collapse = useCallback(() => {
    setExpanded(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  /** Handle action click */
  const handleAction = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      collapse();
    },
    [setActiveTab, collapse]
  );

  /* ------------------------------------------------------------------ */
  /*  Escape to close                                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        collapse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, collapse]);

  /* Cleanup timer on unmount */
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  /* Don't render unless wallet is connected */
  if (!connected) return null;

  return (
    <TooltipProvider delayDuration={200}>
      {/* Backdrop overlay when expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[39] bg-black/40 backdrop-blur-[2px]"
            onClick={collapse}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Action buttons stack (above backdrop, below main FAB) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="fab-actions"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="fixed bottom-[96px] right-6 z-[41] flex flex-col-reverse gap-2 items-end"
            onMouseEnter={resetTimer}
          >
            {/* Top Performer suggestion pill */}
            {topPerformer && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
                className="glass-card-depth rounded-xl px-3 py-2 max-w-[200px] mb-1"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    Top Performer
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">
                    {topPerformer.symbol}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 ml-2">
                    {topPerformer.profitRatio.toFixed(2)}x
                  </span>
                </div>
              </motion.div>
            )}

            {/* Individual action items */}
            {FAB_ACTIONS.map((action) => (
              <motion.button
                key={action.id}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.85 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 350,
                      damping: 22,
                    },
                  },
                  exit: {
                    opacity: 0,
                    y: 12,
                    scale: 0.85,
                    transition: { duration: 0.15 },
                  },
                }}
                onClick={() => handleAction(action.tab)}
                onMouseEnter={resetTimer}
                className={cn(
                  "glass-card-depth rounded-xl px-4 py-2.5 flex items-center gap-2.5",
                  "border cursor-pointer select-none transition-colors duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                  ACCENT_STYLES[action.accent]
                )}
                aria-label={action.label}
              >
                <action.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium text-white whitespace-nowrap">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggle}
            onMouseEnter={resetTimer}
            className={cn(
              "fab rounded-full focus:outline-none",
              "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
              expanded && "rotate-45 bg-gray-700 hover:bg-gray-600"
            )}
            aria-label={expanded ? "Close quick actions" : "Open quick mint actions"}
            aria-expanded={expanded}
          >
            {/* Pulse glow ring when collapsed */}
            {!expanded && (
              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20 pointer-events-none" />
            )}
            <AnimatePresence mode="wait" initial={false}>
              {expanded ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="zap"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Zap className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-900 border-gray-800 text-xs">
          {expanded ? "Close quick actions" : "Quick Mint"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
