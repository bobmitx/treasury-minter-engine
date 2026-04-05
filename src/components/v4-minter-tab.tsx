"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import {
  createV4Token,
  mintV4,
  claimV4Rewards,
  createGaiToken,
  getV4Multiplier,
  getV4SystemInfo,
  getTokenPrice,
  getTokenBalance,
  getTokenInfo,
  getExplorerTxUrl,
  shortenAddress,
  formatUSD,
  formatLargeNumber,
} from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";
import { StatsCard } from "@/components/stats-card";
import { ProfitIndicator } from "@/components/profit-indicator";
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import { WatchlistButton } from "@/components/token-watchlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  Zap,
  Plus,
  Coins,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Gem,
  Gift,
  Server,
  Shield,
  Sparkles,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  BookOpen,
  Calculator,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

// ── Multiplier Calculator Helper ─────────────────────────────────────────────
function calculateV4Multiplier(
  totalSupply: number,
  addition: number
): number {
  if (totalSupply <= 0) return 1;
  if (addition <= 0) return 0;
  return totalSupply / (totalSupply + addition);
}

// ── Minter Purpose Info Card ─────────────────────────────────────────────────
function MinterPurposeCard({
  systemInfo,
  loadingMultiplier,
  currentMultiplier,
}: {
  systemInfo: {
    bbc: string;
    indexMinter: string;
    nine: string;
    nots: string;
    skills: string;
  } | null;
  loadingMultiplier: boolean;
  currentMultiplier: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const activeSpecialContracts = systemInfo
    ? [systemInfo.nine, systemInfo.nots, systemInfo.skills].filter(
        (a) => a !== "0x0000000000000000000000000000000000000000" && a !== ""
      ).length
    : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gray-900 border-gray-800/70 card-hover">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center">
                  <Info className="h-4 w-4 text-amber-400" />
                </div>
                What is the V4 Personal Minter?
              </CardTitle>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-gray-400 leading-relaxed">
              The V4 Personal Minter is an advanced factory contract that creates
              personal treasury tokens with enhanced features like GAI staking
              tokens, reward claiming, and multi-contract architecture (BBC, NINE,
              NOTS, SKILLS). Unlike V3, V4 tokens support reward accumulation
              and withdrawal features.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  V4 Multiplier
                </p>
                <p className="text-sm font-semibold text-amber-400 font-mono number-animate">
                  {loadingMultiplier
                    ? "..."
                    : `${formatLargeNumber(currentMultiplier)}x`}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  BBC Contract
                </p>
                <p className="text-xs font-mono text-white truncate">
                  {systemInfo
                    ? shortenAddress(systemInfo.bbc, 8)
                    : "..."}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  Index Minter
                </p>
                <p className="text-xs font-mono text-white truncate">
                  {systemInfo
                    ? shortenAddress(systemInfo.indexMinter, 8)
                    : "..."}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  Active Contracts
                </p>
                <p className="text-sm font-semibold text-amber-400">
                  {systemInfo ? `${activeSpecialContracts} active` : "..."}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Multiplier Elaboration Card ──────────────────────────────────────────────
function MultiplierCard() {
  const [calcAmount, setCalcAmount] = useState("10000");
  const [estimatedSupply, setEstimatedSupply] = useState(1000000);

  const presets = [
    { label: "1K", value: "1000" },
    { label: "10K", value: "10000" },
    { label: "100K", value: "100000" },
    { label: "1M", value: "1000000" },
  ];

  const addition = parseFloat(calcAmount) || 0;

  const multiplierResult = useMemo(() => {
    if (addition <= 0) return { multiplier: 0, cost: 0 };
    const mult = calculateV4Multiplier(estimatedSupply, addition);
    return { multiplier: mult, cost: mult };
  }, [addition, estimatedSupply]);

  const progressPercent = useMemo(() => {
    if (estimatedSupply <= 0) return 0;
    return Math.min((addition / estimatedSupply) * 100, 100);
  }, [addition, estimatedSupply]);

  return (
    <Card className="bg-gradient-to-br from-amber-950/40 via-gray-900 to-gray-900 border border-amber-500/10 card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-amber-400" />
          </div>
          V4 Multiplier Function
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
            Interactive
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formula */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Formula
          </p>
          <code className="text-sm text-amber-300 font-mono block leading-relaxed">
            Multiplier(addition) = TotalSupply / (TotalSupply + Addition)
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Returns the cost multiplier for minting a given amount of tokens.
            Lower multiplier = cheaper minting cost.
          </p>
        </div>

        {/* Interactive Calculator */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Mint Amount</Label>
              <Input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
                placeholder="Enter amount..."
              />
              <div className="flex gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setCalcAmount(preset.value)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded border transition-all duration-200 btn-hover-scale",
                      calcAmount === preset.value
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">
                Estimated Supply (sim.)
              </Label>
              <Input
                type="number"
                value={estimatedSupply.toString()}
                onChange={(e) =>
                  setEstimatedSupply(parseFloat(e.target.value) || 1)
                }
                className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
              />
            </div>
          </div>

          {/* Results */}
          {addition > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 animate-fade-in-up">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">
                    Multiplier
                  </p>
                  <p className="text-lg font-bold font-mono text-amber-400 number-animate">
                    {multiplierResult.multiplier.toFixed(6)}x
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">
                    Cost Factor
                  </p>
                  <p className="text-lg font-bold font-mono text-white number-animate">
                    {multiplierResult.cost.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">
                    Supply Impact
                  </p>
                  <p className="text-lg font-bold font-mono text-white number-animate">
                    +{progressPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500">
                    Mint amount vs. estimated supply
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatLargeNumber(addition)} / {formatLargeNumber(estimatedSupply)}
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* V3 vs V4 Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">V3 Index Context</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Shared multiplier curve across all V3 tokens. All tokens minted
              from the same Index Minter affect each other&apos;s multiplier.
            </p>
          </div>
          <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400 font-medium">V4 Personal Context</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Each V4 token has its own independent multiplier curve. Minting
              one token does not affect the multiplier of another.
            </p>
          </div>
        </div>

        {/* Key Insight */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <span className="font-semibold text-amber-300">Key Insight:</span>{" "}
            V4 tokens have independent multiplier curves — each token&apos;s
            multiplier depends on its own total supply, not the global supply.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── V4 Feature Cards ─────────────────────────────────────────────────────────
function V4FeatureCards() {
  const features = [
    {
      icon: Gem,
      title: "GAI Tokens",
      description:
        "Create GAI staking tokens with special properties. GAI tokens enable yield generation within the V4 ecosystem.",
      color: "amber",
    },
    {
      icon: Gift,
      title: "Claim Rewards",
      description:
        "Claim accumulated rewards from your V4 tokens. Rewards are calculated based on your token holdings.",
      color: "amber",
    },
    {
      icon: ArrowRight,
      title: "Withdraw",
      description:
        "Withdraw tokens from the V4 system. Supports withdrawal of any ERC20 token held by the minter.",
      color: "amber",
    },
    {
      icon: Shield,
      title: "Multi-Contract",
      description:
        "V4 uses multiple contract references (BBC, NINE, NOTS, SKILLS) for advanced treasury management.",
      color: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature) => (
        <Card
          key={feature.title}
          className="bg-gray-900 border-gray-800/70 card-hover group"
        >
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <feature.icon className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── How-To Guides Accordion ─────────────────────────────────────────────────
function HowToGuides() {
  return (
    <Card className="bg-gray-900 border-gray-800/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-amber-400" />
          </div>
          V4 Guides & Tutorials
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* How to Create a V4 Token */}
          <AccordionItem
            value="create-token"
            className="border-gray-800/70"
          >
            <AccordionTrigger className="text-gray-300 hover:text-white text-sm py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                How to Create a V4 Token
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2.5 ml-6">
                {[
                  "Enter a name and symbol for your personal token",
                  "Set initial mint amount (how many tokens to create initially)",
                  "Select parent token (defaults to T-BILL)",
                  'Click "Create V4 Token" — deploys a new personal treasury token',
                  "Wait for transaction confirmation on PulseChain",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* How to Create GAI Tokens */}
          <AccordionItem value="create-gai" className="border-gray-800/70">
            <AccordionTrigger className="text-gray-300 hover:text-white text-sm py-3">
              <div className="flex items-center gap-2">
                <Gem className="h-4 w-4 text-amber-400" />
                How to Create GAI Tokens
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2.5 ml-6">
                {[
                  "Enter a name and symbol for your GAI token",
                  'Click "Create GAI Token" — calls NewGai() function',
                  "GAI tokens have special staking and reward properties",
                  "Track your GAI tokens in the portfolio tab",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* How to Claim Rewards */}
          <AccordionItem value="claim" className="border-gray-800/70">
            <AccordionTrigger className="text-gray-300 hover:text-white text-sm py-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400" />
                How to Claim Rewards
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2.5 ml-6">
                {[
                  "Ensure you hold V4 tokens that have accumulated rewards",
                  "Enter the amount you wish to claim",
                  'Click "Claim Rewards" — calls Claim() on the V4 minter',
                  "Rewards are sent to your wallet",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* How V4 Multipliers Work */}
          <AccordionItem
            value="multipliers"
            className="border-gray-800/70"
          >
            <AccordionTrigger className="text-gray-300 hover:text-white text-sm py-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-amber-400" />
                How V4 Multipliers Work
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                    Core Formula
                  </p>
                  <code className="text-sm text-amber-300 font-mono block">
                    Multiplier(addition) = TotalSupply / (TotalSupply + Addition)
                  </code>
                </div>
                <ul className="space-y-2 ml-1">
                  {[
                    "Each V4 token has its own independent multiplier curve",
                    "GAI tokens may have different multiplier behavior",
                    "The cost is denominated in the parent token (T-BILL)",
                    "Larger additions result in lower multipliers (more expensive)",
                    "As supply grows, minting becomes proportionally more costly",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-amber-500/60 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ── Main V4 Minter Tab Component ─────────────────────────────────────────────
export function V4MinterTab() {
  const {
    connected,
    address,
    mintCostUSD,
    tokens,
    addToken,
    removeToken,
    addTransaction,
  } = useAppStore();

  // Create token form
  const [createName, setCreateName] = useState("");
  const [createSymbol, setCreateSymbol] = useState("");
  const [createInitialMint, setCreateInitialMint] = useState("1000");
  const [createParent, setCreateParent] = useState(CONTRACTS.tbill);
  const [creating, setCreating] = useState(false);

  // GAI form
  const [gaiName, setGaiName] = useState("");
  const [gaiSymbol, setGaiSymbol] = useState("");
  const [creatingGai, setCreatingGai] = useState(false);

  // Mint form
  const [mintToken, setMintToken] = useState("");
  const [mintAmount, setMintAmount] = useState("1000");
  const [minting, setMinting] = useState(false);

  // Claim form
  const [claimAmount, setClaimAmount] = useState("0");
  const [claiming, setClaiming] = useState(false);

  // System info
  const [systemInfo, setSystemInfo] = useState<{
    bbc: string;
    indexMinter: string;
    nine: string;
    nots: string;
    skills: string;
  } | null>(null);

  // Multiplier display
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [loadingMultiplier, setLoadingMultiplier] = useState(false);

  // Token list refresh
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Add custom token
  const [addTokenAddress, setAddTokenAddress] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");

  // Token creation animation state
  const [createdTokenKey, setCreatedTokenKey] = useState(0);
  const [createdGaiKey, setCreatedGaiKey] = useState(0);

  const fetchSystemData = useCallback(async () => {
    setLoadingMultiplier(true);
    try {
      const [mult, info] = await Promise.all([
        getV4Multiplier(CONTRACTS.v4PersonalMinter, 1),
        getV4SystemInfo(CONTRACTS.v4PersonalMinter),
      ]);
      setCurrentMultiplier(mult);
      setSystemInfo(info);
    } catch (error) {
      console.error("Error fetching V4 data:", error);
    } finally {
      setLoadingMultiplier(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 15000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  // Token address validation effect
  useEffect(() => {
    if (!addTokenAddress.trim()) {
      setTokenValidation("idle");
      return;
    }
    if (
      !addTokenAddress.startsWith("0x") ||
      addTokenAddress.length !== 42
    ) {
      setTokenValidation("invalid");
      return;
    }
    if (
      tokens.find(
        (t) => t.address.toLowerCase() === addTokenAddress.toLowerCase()
      )
    ) {
      setTokenValidation("invalid");
      return;
    }
    // Valid format — show as checking until user clicks Add
    setTokenValidation("valid");
  }, [addTokenAddress, tokens]);

  const handleCreateToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!createName.trim() || !createSymbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }

    setCreating(true);
    try {
      const result = await createV4Token(
        createName.trim(),
        createSymbol.trim().toUpperCase(),
        parseFloat(createInitialMint) || 1000,
        createParent
      );

      toast.success(
        <div className="space-y-1">
          <p>V4 Token created successfully!</p>
          <a
            href={getExplorerTxUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      addTransaction({
        id: `tx-${Date.now()}`,
        type: "create",
        version: "V4",
        tokenAddress: result.tokenAddress,
        tokenSymbol: createSymbol.trim().toUpperCase(),
        amount: createInitialMint,
        txHash: result.txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      setCreateName("");
      setCreateSymbol("");
      setCreatedTokenKey((k) => k + 1);
      fetchSystemData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create V4 token");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGai = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!gaiName.trim() || !gaiSymbol.trim()) {
      toast.error("Name and symbol are required for GAI token");
      return;
    }

    setCreatingGai(true);
    try {
      const result = await createGaiToken(
        CONTRACTS.v4PersonalMinter,
        gaiName.trim(),
        gaiSymbol.trim().toUpperCase()
      );

      toast.success(
        <div className="space-y-1">
          <p>GAI Token created successfully!</p>
          <a
            href={getExplorerTxUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      addTransaction({
        id: `tx-${Date.now()}`,
        type: "create",
        version: "V4",
        tokenAddress: result.tokenAddress,
        tokenSymbol: `GAI-${gaiSymbol.trim().toUpperCase()}`,
        txHash: result.txHash,
        status: "confirmed",
        timestamp: Date.now(),
        details: "GAI Token",
      });

      setGaiName("");
      setGaiSymbol("");
      setCreatedGaiKey((k) => k + 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to create GAI token");
    } finally {
      setCreatingGai(false);
    }
  };

  const handleMint = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!mintToken || !mintAmount) {
      toast.error("Token and amount are required");
      return;
    }

    setMinting(true);
    try {
      const txHash = await mintV4(mintToken, parseFloat(mintAmount));

      toast.success(
        <div className="space-y-1">
          <p>V4 Minted {mintAmount} tokens!</p>
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      const tokenData = tokens.find((t) => t.address === mintToken);
      addTransaction({
        id: `tx-${Date.now()}`,
        type: "mint",
        version: "V4",
        tokenAddress: mintToken,
        tokenSymbol: tokenData?.symbol,
        amount: mintAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      fetchSystemData();
    } catch (error: any) {
      toast.error(error.message || "Failed to mint V4 tokens");
    } finally {
      setMinting(false);
    }
  };

  const handleClaim = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!claimAmount || parseFloat(claimAmount) <= 0) {
      toast.error("Claim amount must be positive");
      return;
    }

    setClaiming(true);
    try {
      const txHash = await claimV4Rewards(
        CONTRACTS.v4PersonalMinter,
        parseFloat(claimAmount)
      );

      toast.success(
        <div className="space-y-1">
          <p>Claimed rewards successfully!</p>
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      addTransaction({
        id: `tx-${Date.now()}`,
        type: "claim",
        version: "V4",
        amount: claimAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to claim rewards");
    } finally {
      setClaiming(false);
    }
  };

  const handleAddToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!addTokenAddress.trim()) {
      toast.error("Please enter a token address");
      return;
    }
    if (
      !addTokenAddress.startsWith("0x") ||
      addTokenAddress.length !== 42
    ) {
      toast.error("Invalid token address format");
      return;
    }
    if (
      tokens.find(
        (t) => t.address.toLowerCase() === addTokenAddress.toLowerCase()
      )
    ) {
      toast.error("Token is already being tracked");
      return;
    }

    setAddingToken(true);
    setTokenValidation("checking");
    try {
      const [info, price, balance, mult] = await Promise.all([
        getTokenInfo(addTokenAddress),
        getTokenPrice(addTokenAddress),
        address
          ? getTokenBalance(addTokenAddress, address)
          : Promise.resolve("0"),
        getV4Multiplier(addTokenAddress, 1),
      ]);

      addToken({
        address: addTokenAddress,
        name: info.name,
        symbol: info.symbol,
        decimals: info.decimals,
        balance,
        priceUSD: price.priceUSD,
        pricePLS: price.pricePLS,
        multiplier: mult,
        profitRatio: mintCostUSD > 0 ? price.priceUSD / mintCostUSD : 0,
        version: "V4",
        lastUpdated: Date.now(),
      });

      setAddTokenAddress("");
      setShowAddToken(false);
      setTokenValidation("idle");
      toast.success(`${info.symbol} added to tracking`);
    } catch (error: any) {
      setTokenValidation("invalid");
      toast.error(error.message || "Failed to fetch token info");
    } finally {
      setAddingToken(false);
    }
  };

  const refreshTokenList = async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const v4Tokens = tokens.filter((t) => t.version === "V4");
      for (const token of v4Tokens) {
        try {
          const [price, balance, mult] = await Promise.all([
            getTokenPrice(token.address),
            getTokenBalance(token.address, address),
            getV4Multiplier(token.address, 1),
          ]);
          addToken({
            ...token,
            balance,
            priceUSD: price.priceUSD,
            pricePLS: price.pricePLS,
            multiplier: mult,
            profitRatio: mintCostUSD > 0 ? price.priceUSD / mintCostUSD : 0,
            lastUpdated: Date.now(),
          });
        } catch {
          // skip
        }
      }
      toast.success("V4 token list refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    toast.success("Address copied");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleRemoveToken = (tokenAddress: string) => {
    const token = tokens.find((t) => t.address === tokenAddress);
    removeToken(tokenAddress);
    if (mintToken === tokenAddress) setMintToken("");
    toast.success(`${token?.symbol || "Token"} removed from tracking`);
  };

  const v4Tokens = tokens.filter((t) => t.version === "V4");

  const activeSpecialContracts = systemInfo
    ? [systemInfo.nine, systemInfo.nots, systemInfo.skills].filter(
        (a) =>
          a !== "0x0000000000000000000000000000000000000000" && a !== ""
      ).length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── 1. Minter Purpose Info Card (Collapsible) ─────────────────────── */}
      <MinterPurposeCard
        systemInfo={systemInfo}
        loadingMultiplier={loadingMultiplier}
        currentMultiplier={currentMultiplier}
      />

      {/* ── 2. V4 System Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="V4 Multiplier"
          value={
            loadingMultiplier
              ? "..."
              : `${formatLargeNumber(currentMultiplier)}x`
          }
          icon={Zap}
          subtitle="Current"
          accent="amber"
        />
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">BBC</span>
            </div>
            <p className="text-xs font-mono text-white mt-1 truncate">
              {systemInfo ? shortenAddress(systemInfo.bbc, 6) : "..."}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">Index Minter</span>
            </div>
            <p className="text-xs font-mono text-white mt-1 truncate">
              {systemInfo
                ? shortenAddress(systemInfo.indexMinter, 6)
                : "..."}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">Contracts</span>
            </div>
            <p className="text-xs text-white mt-1">
              {systemInfo
                ? `${activeSpecialContracts} active`
                : "..."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Multiplier Function Elaboration Card ──────────────────────── */}
      <MultiplierCard />

      {/* ── 4. V4 Feature Cards Section ──────────────────────────────────── */}
      <V4FeatureCards />

      {/* ── 5. V4 Actions Tabs ───────────────────────────────────────────── */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="bg-gray-900 border border-gray-800/70">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </TabsTrigger>
          <TabsTrigger
            value="gai"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Gem className="h-3 w-3 mr-1" />
            GAI
          </TabsTrigger>
          <TabsTrigger
            value="mint"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Coins className="h-3 w-3 mr-1" />
            Mint
          </TabsTrigger>
          <TabsTrigger
            value="claim"
            className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 btn-hover-scale"
          >
            <Gift className="h-3 w-3 mr-1" />
            Claim
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create">
          <Card
            key={createdTokenKey}
            className={cn(
              "bg-gray-900 border-gray-800/70 card-hover",
              createdTokenKey > 0 && "animate-expand-in"
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Create New V4 Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Token Name</Label>
                  <Input
                    placeholder="My Token"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                    disabled={!connected}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Symbol</Label>
                  <Input
                    placeholder="MTK"
                    value={createSymbol}
                    onChange={(e) =>
                      setCreateSymbol(e.target.value.toUpperCase())
                    }
                    className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
                    maxLength={10}
                    disabled={!connected}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">
                    Initial Mint Amount
                  </Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={createInitialMint}
                    onChange={(e) => setCreateInitialMint(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                    disabled={!connected}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">
                    Parent Token
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={createParent}
                      onChange={(e) => setCreateParent(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white font-mono text-xs flex-1 input-focus-ring"
                      disabled={!connected}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-400 hover:bg-gray-800 text-xs flex-shrink-0 btn-hover-scale"
                      onClick={() => setCreateParent(CONTRACTS.tbill)}
                    >
                      T-BILL
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCreateToken}
                disabled={creating || !connected}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {creating ? "Creating..." : "Create V4 Token"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GAI Tab */}
        <TabsContent value="gai">
          <Card
            key={createdGaiKey}
            className={cn(
              "bg-gray-900 border-gray-800/70 card-hover border-amber-500/10",
              createdGaiKey > 0 && "animate-expand-in"
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Gem className="h-4 w-4 text-amber-400" />
                Create GAI Token
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                  Special
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                GAI tokens are special V4 tokens created through the GAI
                mechanism. They have unique properties within the V4 ecosystem.
              </p>
              {/* GAI feature cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-center">
                  <Shield className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">
                    Staking
                  </p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-center">
                  <Gift className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">
                    Rewards
                  </p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-center">
                  <TrendingUp className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">
                    Yield
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">
                    GAI Token Name
                  </Label>
                  <Input
                    placeholder="My GAI"
                    value={gaiName}
                    onChange={(e) => setGaiName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                    disabled={!connected}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Symbol</Label>
                  <Input
                    placeholder="GAI"
                    value={gaiSymbol}
                    onChange={(e) =>
                      setGaiSymbol(e.target.value.toUpperCase())
                    }
                    className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
                    maxLength={10}
                    disabled={!connected}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateGai}
                disabled={creatingGai || !connected}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {creatingGai ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gem className="h-4 w-4 mr-2" />
                )}
                {creatingGai ? "Creating..." : "Create GAI Token"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mint Tab */}
        <TabsContent value="mint">
          <Card className="bg-gray-900 border-gray-800/70 card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                Mint V4 Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Token Address</Label>
                <Input
                  value={mintToken}
                  onChange={(e) => setMintToken(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-xs input-focus-ring"
                  placeholder="0x..."
                  disabled={!connected}
                />
                {v4Tokens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {v4Tokens.slice(0, 5).map((t) => (
                      <button
                        key={t.address}
                        onClick={() => setMintToken(t.address)}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded border transition-all duration-200 btn-hover-scale",
                          mintToken === t.address
                            ? "bg-gray-800 border-gray-700 text-gray-400 selected-amber-glow"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                        )}
                      >
                        {t.symbol}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Mint Amount</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                  disabled={!connected}
                />
              </div>
              <Button
                onClick={handleMint}
                disabled={minting || !connected || !mintToken}
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {minting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {minting ? "Minting..." : "Mint V4 Tokens"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claim Tab */}
        <TabsContent value="claim">
          <Card className="bg-gray-900 border-gray-800/70 card-hover claim-preview-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400" />
                Claim V4 Rewards
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                  Rewards
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                Claim accumulated rewards from the V4 system. Enter the amount
                you wish to claim.
              </p>
              {/* Reward estimation preview */}
              {claimAmount && parseFloat(claimAmount) > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 animate-slide-in-right">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs text-amber-300 font-medium">
                      Estimated Reward Preview
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Claim Amount
                      </p>
                      <p className="text-sm font-mono text-white">
                        {parseFloat(claimAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Est. Gas Cost
                      </p>
                      <p className="text-sm font-mono text-gray-400">
                        ~0.001 PLS
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Claim Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white input-focus-ring"
                  disabled={!connected}
                />
              </div>
              <Button
                onClick={handleClaim}
                disabled={
                  claiming ||
                  !connected ||
                  !claimAmount ||
                  parseFloat(claimAmount) <= 0
                }
                className="bg-amber-600 hover:bg-amber-700 text-white btn-hover-scale"
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                {claiming ? "Claiming..." : "Claim Rewards"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── 6. How-To Dropdown Guides ────────────────────────────────────── */}
      <HowToGuides />

      {/* ── 7. Add Custom Token (Improved) ───────────────────────────────── */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardContent className="p-4">
          {!showAddToken ? (
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5 btn-hover-scale gap-2"
              onClick={() => setShowAddToken(true)}
            >
              <Search className="h-4 w-4" />
              Add Custom V4 Token by Address
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-gray-500" />
                <p className="text-xs text-gray-500">
                  Add any V4 treasury token by its contract address
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Paste V4 token address (0x...)"
                    value={addTokenAddress}
                    onChange={(e) => setAddTokenAddress(e.target.value)}
                    className={cn(
                      "bg-gray-800 border-gray-700 text-white font-mono text-xs w-full input-focus-ring pr-8",
                      tokenValidation === "valid" &&
                        "border-emerald-500/50 focus-visible:ring-emerald-500/20",
                      tokenValidation === "invalid" &&
                        "border-rose-500/50 focus-visible:ring-rose-500/20",
                      tokenValidation === "checking" &&
                        "border-amber-500/50 focus-visible:ring-amber-500/20"
                    )}
                    disabled={addingToken}
                  />
                  {/* Validation indicator */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {tokenValidation === "checking" && (
                      <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                    )}
                    {tokenValidation === "valid" && (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {tokenValidation === "invalid" && addTokenAddress.length > 0 && (
                      <span className="text-rose-400 text-xs">✕</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToken}
                    disabled={
                      addingToken ||
                      !addTokenAddress.trim() ||
                      !connected ||
                      tokenValidation === "invalid"
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-1.5"
                  >
                    {addingToken ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Add Token
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-400 hover:bg-gray-800 btn-hover-scale"
                    onClick={() => {
                      setShowAddToken(false);
                      setAddTokenAddress("");
                      setTokenValidation("idle");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              {/* Validation status text */}
              {tokenValidation === "valid" && addTokenAddress.length > 0 && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Valid address format — ready to add
                </p>
              )}
              {tokenValidation === "invalid" && addTokenAddress.length > 0 && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <span className="text-xs">✕</span>
                  {!addTokenAddress.startsWith("0x")
                    ? "Address must start with 0x"
                    : addTokenAddress.length !== 42
                      ? "Address must be 42 characters"
                      : "Token is already being tracked"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 8. Active V4 Tokens ──────────────────────────────────────────── */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              Active V4 Tokens
              {v4Tokens.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-gray-700 text-gray-400 text-xs ml-2"
                >
                  {v4Tokens.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshTokenList}
              disabled={refreshing || !connected}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs btn-hover-scale"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {v4Tokens.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">
                No V4 tokens tracked yet
              </p>
              <p className="text-xs mt-1 text-gray-600">
                Create a V4 token above or add a custom address to start
                tracking
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {v4Tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .map((token) => (
                    <TokenDetailDialog
                      key={token.address}
                      tokenAddress={token.address}
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-700/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                              {token.name || token.symbol}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono">
                                {token.symbol}
                              </span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500 font-mono">
                                {shortenAddress(token.address)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">
                              {formatUSD(token.priceUSD)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatLargeNumber(token.multiplier)}x mult.
                            </p>
                          </div>
                          {/* Watchlist quick action */}
                          <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <WatchlistButton
                              tokenAddress={token.address}
                              size="sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-rose-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveToken(token.address);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAddress(token.address);
                            }}
                          >
                            {copiedAddress === token.address ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity btn-hover-scale"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMintToken(token.address);
                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }}
                          >
                            Mint <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          <ProfitIndicator
                            ratio={token.profitRatio}
                            size="sm"
                            animated={token.profitRatio > 1.5}
                          />
                        </div>
                      </div>
                    </TokenDetailDialog>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
