"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Activity,
  Zap,
  Gem,
  Wallet,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  Shield,
  TrendingUp,
  Bot,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Treasury Minter",
    description: "Your gateway to PulseChain token minting",
  },
  {
    id: "how-it-works",
    title: "How Minting Works",
    description: "Understand V3 and V4 token mechanics",
  },
  {
    id: "get-started",
    title: "Get Started",
    description: "Connect your wallet and begin",
  },
] as const;

// ─── Step 1: Welcome ────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="space-y-6 py-2">
      {/* Hero illustration */}
      <div className="relative mx-auto w-32 h-32">
        {/* Background glow rings */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-emerald-500/10 animate-pulse [animation-delay:500ms]" />
        <div className="absolute inset-4 rounded-full bg-emerald-500/15 animate-pulse [animation-delay:1000ms]" />
        {/* Central icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center glow-emerald-animated shadow-2xl shadow-emerald-500/10">
            <Activity className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gradient-animated">
          Treasury Minter Engine
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
          The most advanced token minting dashboard for PulseChain V3 & V4
          treasury tokens.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 gap-3">
        {[
          {
            icon: Zap,
            title: "V3 Minter",
            desc: "Create and mint V3 treasury tokens with multiplier tracking",
            color: "emerald" as const,
          },
          {
            icon: Gem,
            title: "V4 Minter",
            desc: "Advanced V4 tokens with GAI staking and reward claiming",
            color: "amber" as const,
          },
          {
            icon: GitBranch,
            title: "MultiHop",
            desc: "Chain minting with automated discovery and preview",
            color: "violet" as const,
          },
          {
            icon: Bot,
            title: "Bot Mode",
            desc: "Automated minting with configurable profit thresholds",
            color: "amber" as const,
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800 hover:border-gray-700 transition-colors border-rotate"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border",
                feature.color === "emerald" &&
                  "bg-emerald-500/10 border-emerald-500/15",
                feature.color === "amber" &&
                  "bg-amber-500/10 border-amber-500/15",
                feature.color === "violet" &&
                  "bg-violet-500/10 border-violet-500/15"
              )}
            >
              <feature.icon
                className={cn(
                  "h-4 w-4",
                  feature.color === "emerald" && "text-emerald-400",
                  feature.color === "amber" && "text-amber-400",
                  feature.color === "violet" && "text-violet-400"
                )}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {feature.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: How Minting Works ─────────────────────────────────────────────

function StepHowItWorks() {
  return (
    <div className="space-y-5 py-2">
      <div className="text-center space-y-1">
        <p className="text-xs text-gray-500">
          PulseChain Treasury System supports two token versions
        </p>
      </div>

      {/* V3 Section */}
      <div className="rounded-xl border border-emerald-500/20 overflow-hidden glass-card-depth">
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">V3 Tokens</p>
            <p className="text-[10px] text-emerald-400/60">
              Standard Treasury Minter
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-gray-900/50">
          {[
            {
              step: "1",
              text: "Create a new token with a name and symbol",
            },
            {
              step: "2",
              text: "Mint tokens by sending PLS to the treasury",
            },
            {
              step: "3",
              text: "Each mint increases the token multiplier",
            },
            {
              step: "4",
              text: "Profit ratio = Multiplier × Price ratio",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-emerald-400">
                  {item.step}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <Separator className="flex-1 bg-gray-800" />
        <span className="text-[10px] text-gray-600 uppercase tracking-widest">
          vs
        </span>
        <Separator className="flex-1 bg-gray-800" />
      </div>

      {/* V4 Section */}
      <div className="rounded-xl border border-amber-500/20 overflow-hidden glass-card-depth">
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Gem className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400">V4 Tokens</p>
            <p className="text-[10px] text-amber-400/60">
              Advanced Personal Minter
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-gray-900/50">
          {[
            {
              step: "1",
              text: "Create V4 tokens with BBC/NINE/SKILLS/NOTS variants",
            },
            {
              step: "2",
              text: "Mint tokens and earn GAI staking rewards",
            },
            {
              step: "3",
              text: "Claim accumulated rewards from the treasury",
            },
            {
              step: "4",
              text: "Withdraw liquidity when profitable",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-amber-400">
                  {item.step}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-emerald-400">Pro Tip</p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
            Use the Bot Mode to automatically monitor tokens and mint when
            profit ratios exceed your threshold. The dashboard tracks everything
            in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Get Started ───────────────────────────────────────────────────

function StepGetStarted({ onClose }: { onClose: () => void }) {
  const { connected, setActiveTab } = useAppStore();

  return (
    <div className="space-y-6 py-2">
      {/* Illustration */}
      <div className="relative mx-auto w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse" />
        <div className="absolute inset-3 rounded-full bg-emerald-500/10 animate-pulse [animation-delay:300ms]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center glow-emerald-animated shadow-2xl shadow-emerald-500/10">
            <Wallet className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-white">Ready to Start?</h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
          {connected
            ? "Your wallet is connected! Start exploring the dashboard."
            : "Connect your MetaMask wallet to access all features and start minting tokens."}
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-2.5">
        {[
          {
            icon: Shield,
            text: "Connect to PulseChain network",
            done: connected,
          },
          {
            icon: Wallet,
            text: "Link your MetaMask wallet",
            done: connected,
          },
          {
            icon: TrendingUp,
            text: "Track token performance",
            done: false,
          },
          {
            icon: Zap,
            text: "Execute your first mint",
            done: false,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              item.done
                ? "bg-emerald-500/5 border-emerald-500/15"
                : "bg-gray-800/40 border-gray-800"
            )}
          >
            {item.done ? (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
            <p
              className={cn(
                "text-xs font-medium transition-colors",
                item.done ? "text-emerald-400" : "text-gray-400"
              )}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <Button
        onClick={onClose}
        className={cn(
          "w-full h-12 text-sm font-semibold btn-hover-scale gap-2 gradient-border-active",
          connected
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
        )}
      >
        {connected ? (
          <>
            <Activity className="h-4 w-4" />
            Go to Dashboard
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Connect Wallet & Start
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Main Onboarding Modal ─────────────────────────────────────────────────

export function OnboardingModal() {
  const { onboardingOpen, setOnboardingOpen, setHasSeenOnboarding } =
    useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Always mark as seen when closing (Skip or any dismiss action)
    setHasSeenOnboarding(true);
    setOnboardingOpen(false);
  };

  const stepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepWelcome />;
      case 1:
        return <StepHowItWorks />;
      case 2:
        return <StepGetStarted onClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={onboardingOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-lg p-0 gap-0 overflow-hidden rounded-xl">
        {/* Header with step indicator */}
        <div className="bg-gradient-to-b from-gray-800/50 to-transparent p-6 pb-4">
          <DialogHeader className="text-center space-y-3">
            {/* Step dots */}
            <div className="flex items-center justify-center gap-2">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                      idx === currentStep
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : idx < currentStep
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600"
                    )}
                  >
                    {idx < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-8 h-0.5 rounded-full transition-all",
                        idx < currentStep ? "bg-emerald-500/40" : "bg-gray-800"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {STEPS[currentStep].title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-1">
                {STEPS[currentStep].description}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        {/* Step content */}
        <div className="px-6 max-h-[400px] overflow-y-auto">
          {stepContent()}
        </div>

        {/* Footer: Navigation + Don't show again */}
        <div className="border-t border-gray-800 p-4 space-y-3 bg-gray-900/80">
          {/* Don't show again */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) =>
                setDontShowAgain(checked === true)
              }
              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-gray-600"
            />
            <Label
              htmlFor="dont-show-again"
              className="text-[11px] text-gray-400 cursor-pointer"
            >
              Don&apos;t show this again
            </Label>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-700 btn-hover-scale gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}

            {!isLastStep && (
              <Button
                onClick={handleNext}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-1.5"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {isFirstStep && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-300 hover:bg-gray-800 ml-auto text-xs"
              >
                Skip
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
