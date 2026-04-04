"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

/**
 * Play a pleasant 3-tone chime using the Web Audio API.
 * No external audio files needed — generates tones programmatically.
 *
 * Tone sequence: C5 → E5 → G5 (major chord arpeggio), ~200ms total
 */
export function playAlertChime() {
  if (typeof window === "undefined") return;

  try {
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.08; // 80ms per note
    const gapBetweenNotes = 0.02; // 20ms gap
    const totalPerNote = noteDuration + gapBetweenNotes;

    notes.forEach((freq, i) => {
      const startTime = ctx.currentTime + i * totalPerNote;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, startTime);

      // Smooth envelope: quick attack, gentle decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });

    // Auto-close the context after all notes finish
    const totalTime = notes.length * totalPerNote + 0.1;
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, totalTime * 1000);
  } catch {
    // Silently fail — audio is non-critical
  }
}

/**
 * Dispatch a visual notification event for alert-triggered listeners.
 */
function dispatchAlertEvent(alertData: {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  threshold: number;
  direction: "above" | "below";
  profitRatio: number;
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("treasury-alert-triggered", {
      detail: alertData,
    })
  );
}

export function useProfitAlertChecker() {
  const { connected, tokens, profitAlerts, updateProfitAlert, notificationSoundEnabled } = useAppStore();
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

          // Play chime sound if enabled
          if (notificationSoundEnabled) {
            playAlertChime();
          }

          // Dispatch visual notification event
          dispatchAlertEvent({
            id: alert.id,
            tokenSymbol: alert.tokenSymbol,
            tokenAddress: alert.tokenAddress,
            threshold: alert.threshold,
            direction: alert.direction,
            profitRatio: token.profitRatio,
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
  }, [connected, tokens, profitAlerts, updateProfitAlert, notificationSoundEnabled]);
}
