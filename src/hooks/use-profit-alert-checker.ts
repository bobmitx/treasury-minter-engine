"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export function useProfitAlertChecker() {
  const { connected, tokens, profitAlerts, updateProfitAlert } = useAppStore();
  const checkedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!connected || tokens.length === 0 || profitAlerts.length === 0) return;

    const checkAlerts = () => {
      for (const alert of profitAlerts) {
        // Skip already triggered alerts (unless reset)
        if (alert.triggered) continue;

        const token = tokens.find(
          (t) => t.address.toLowerCase() === alert.tokenAddress.toLowerCase()
        );

        if (!token) continue;

        let shouldTrigger = false;

        if (alert.direction === "above" && token.profitRatio >= alert.threshold) {
          shouldTrigger = true;
        } else if (alert.direction === "below" && token.profitRatio <= alert.threshold) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Avoid duplicate toasts for the same alert
          const dedupeKey = `${alert.id}-${alert.direction}`;
          if (checkedRef.current.has(dedupeKey)) continue;

          checkedRef.current.add(dedupeKey);

          updateProfitAlert(alert.id, {
            triggered: true,
            lastTriggered: Date.now(),
          });

          toast.success(
            `🔔 ${alert.tokenSymbol} profit ratio ${alert.direction === "above" ? "rose above" : "dropped below"} ${alert.threshold.toFixed(2)}x (now ${token.profitRatio.toFixed(2)}x)`,
            { duration: 6000 }
          );
        }
      }
    };

    // Check immediately
    checkAlerts();

    // Check every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [connected, tokens, profitAlerts, updateProfitAlert]);
}
