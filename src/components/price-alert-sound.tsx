"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { playAlertChime } from "@/hooks/use-profit-alert-checker";
import { Bell, BellOff, Volume2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * PriceAlertSoundToggle — compact icon button to enable/disable
 * notification chime sounds for profit alerts.
 *
 * - Bell + Volume2 icon when sound is on
 * - BellOff icon when sound is off
 * - Plays a test chime when toggled on
 * - Tooltip shows current state
 */
export function PriceAlertSoundToggle() {
  const { notificationSoundEnabled, setNotificationSoundEnabled } = useAppStore();

  const handleToggle = useCallback(() => {
    const nextEnabled = !notificationSoundEnabled;
    setNotificationSoundEnabled(nextEnabled);

    // Play a test chime when turning sound on
    if (nextEnabled) {
      // Small delay so the state update is processed first
      setTimeout(() => {
        playAlertChime();
      }, 50);
    }
  }, [notificationSoundEnabled, setNotificationSoundEnabled]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleToggle}
          aria-label={notificationSoundEnabled ? "Mute alert sounds" : "Enable alert sounds"}
          className={cn(
            "relative flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200 btn-hover-scale",
            notificationSoundEnabled
              ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          {notificationSoundEnabled ? (
            <div className="relative">
              <Bell className="h-4 w-4" />
              <Volume2 className="h-2.5 w-2.5 absolute -top-1.5 -right-1.5 text-emerald-400" />
            </div>
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-gray-900 border-gray-800 text-xs">
        {notificationSoundEnabled ? "Alert sounds on · Click to mute" : "Alert sounds off · Click to enable"}
      </TooltipContent>
    </Tooltip>
  );
}
