"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import {
  createV3Token,
  mintV3,
  getMultiplier,
  getTokenPrice,
  getTokenBalance,
  getTokenInfo,
  getMintCost,
  getExplorerTxUrl,
  shortenAddress,
  formatUSD,
  formatLargeNumber,
} from "@/lib/ethereum";
import { CONTRACTS } from "@/lib/contracts";
import { ProfitIndicator } from "@/components/profit-indicator";
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import { WatchlistButton } from "@/components/token-watchlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Sparkles,
  Trash2,
  Loader2,
  Search,
  Eye,
  ChevronDown,
  Info,
  BookOpen,
  Calculator,
  HelpCircle,
  AlertCircle,
  Shield,
  FileCode,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ────────────────────────────────────────────────────────────────
const V3_INDEX_MINTER = "0x0c4F73328dFCECfbecf235C9F78A4494a7EC5ddC";

const PARENT_TOKEN_OPTIONS = [
  { address: CONTRACTS.tbill, symbol: "T-BILL", name: "Treasury Bill", icon: "🏛️" },
  { address: CONTRACTS.fed, symbol: "FED", name: "Federal Reserve Note", icon: "🏦" },
  { address: CONTRACTS.eDAI, symbol: "eDAI", name: "Electronic DAI", icon: "💵" },
  { address: CONTRACTS.wPLS, symbol: "WPLS", name: "Wrapped PLS", icon: "⛓️" },
  { address: CONTRACTS.mvToken, symbol: "MV", name: "Market Vault", icon: "📊" },
] as const;

// ── Parent Token Info Types (fetched from /api/token-data) ──────────────────
interface ParentTokenInfo {
  totalSupply: number;
  totalSupplyFormatted: string;
  priceUSD: number;
  pricePLS: number;
  plsPriceUSD: number;
  isLive: boolean;
  source: string;
  symbol: string;
  name: string;
}

// ── Token Validation States ─────────────────────────────────────────────────
type ValidationState = "idle" | "checking" | "valid" | "invalid";

// ── Added Token Success Info ────────────────────────────────────────────────
interface AddedTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  priceUSD: number;
  multiplier: number;
  balance: string;
}

// ── Main Component ──────────────────────────────────────────────────────────
export function V3MinterTab() {
  const {
    connected,
    address,
    mintCostUSD,
    tokens,
    addToken,
    removeToken,
    addTransaction,
  } = useAppStore();

  // ── Info collapsible state ──────────────────────────────────────────────
  const [infoOpen, setInfoOpen] = useState(true);

  // ── Parent token on-chain data (dynamic, fetched via /api/token-data) ──
  const [parentInfo, setParentInfo] = useState<ParentTokenInfo>({
    totalSupply: 0,
    totalSupplyFormatted: "0",
    priceUSD: 0,
    pricePLS: 0,
    plsPriceUSD: 0,
    isLive: false,
    source: "",
    symbol: "",
    name: "",
  });
  const [loadingParent, setLoadingParent] = useState(false);

  // ── Multiplier calculator state ─────────────────────────────────────────
  const [calcMintAmount, setCalcMintAmount] = useState("10000");
  const [calcParentToken, setCalcParentToken] = useState(CONTRACTS.tbill);
  const [calcParentSupply, setCalcParentSupply] = useState<number>(0);

  const [calcResult, setCalcResult] = useState<{
    multiplier: number;
    costInParent: number;
    costUSD: number;
    percentageOfSupply: number;
  } | null>(null);

  // ── Create token form ───────────────────────────────────────────────────
  const [createName, setCreateName] = useState("");
  const [createSymbol, setCreateSymbol] = useState("");
  const [createInitialMint, setCreateInitialMint] = useState("1000");
  const [createParent, setCreateParent] = useState(CONTRACTS.tbill);
  const [creating, setCreating] = useState(false);
  const [createdTokenKey, setCreatedTokenKey] = useState(0);
  // Custom parent token validation for create form
  const [createParentMode, setCreateParentMode] = useState<"preset" | "custom">("preset");
  const [customParentAddr, setCustomParentAddr] = useState("");
  const [customParentInfo, setCustomParentInfo] = useState<{ name: string; symbol: string; decimals: number; totalSupply: string } | null>(null);
  const [customParentChecking, setCustomParentChecking] = useState(false);
  const [customParentValid, setCustomParentValid] = useState(false);

  // ── Mint form ───────────────────────────────────────────────────────────
  const [mintToken, setMintToken] = useState("");
  const [mintAmount, setMintAmount] = useState("1000");
  const [minting, setMinting] = useState(false);
  // Mint token info preview
  const [mintTokenInfo, setMintTokenInfo] = useState<{ name: string; symbol: string } | null>(null);
  const [mintTokenChecking, setMintTokenChecking] = useState(false);
  // Mint token parent info (fetched dynamically when needed)

  // ── Multiplier display ──────────────────────────────────────────────────
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [loadingMultiplier, setLoadingMultiplier] = useState(false);

  // ── Token preview ───────────────────────────────────────────────────────
  const [mintPreview, setMintPreview] = useState<{
    cost: number;
    ratio: number;
  } | null>(null);

  // ── Token list refresh ──────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // ── Add custom token (improved) ─────────────────────────────────────────
  const [addTokenAddress, setAddTokenAddress] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [addedTokenInfo, setAddedTokenInfo] = useState<AddedTokenInfo | null>(null);

  // ── Fetch parent token info from /api/token-data ───────────────────────
  const fetchParentInfo = useCallback(async (tokenAddress: string) => {
    if (!tokenAddress || !tokenAddress.startsWith("0x")) return;
    setLoadingParent(true);
    try {
      const res = await fetch(`/api/token-data?address=${tokenAddress}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setParentInfo({
            totalSupply: data.totalSupply,
            totalSupplyFormatted: data.totalSupplyFormatted,
            priceUSD: data.priceUSD,
            pricePLS: data.pricePLS,
            plsPriceUSD: data.plsPriceUSD,
            isLive: data.isLive,
            source: data.source,
            symbol: data.symbol,
            name: data.name,
          });
          setCalcParentSupply(data.totalSupply);
        }
      }
    } catch {
      // silent — keep previous defaults
    } finally {
      setLoadingParent(false);
    }
  }, []);

  // ── Fetch parent info whenever calculator parent token changes ─────────
  useEffect(() => {
    fetchParentInfo(calcParentToken);
  }, [calcParentToken, fetchParentInfo]);

  // ── Periodic refresh of parent info (every 60s) ───────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchParentInfo(calcParentToken);
    }, 60000);
    return () => clearInterval(interval);
  }, [calcParentToken, fetchParentInfo]);

  // ── Compute multiplier calculator result ────────────────────────────────
  useEffect(() => {
    const amount = parseFloat(calcMintAmount);
    if (!amount || amount <= 0) {
      setCalcResult(null);
      return;
    }

    const totalSupply = calcParentSupply > 0 ? calcParentSupply : 0;
    if (totalSupply <= 0) {
      setCalcResult(null);
      return;
    }

    // Multiplier formula: totalSupply / (totalSupply + addition)
    const multiplier = totalSupply / (totalSupply + amount);
    const costInParent = multiplier * amount;
    const costUSD = costInParent * parentInfo.priceUSD;
    const percentageOfSupply = (amount / totalSupply) * 100;

    setCalcResult({
      multiplier,
      costInParent,
      costUSD,
      percentageOfSupply,
    });
  }, [calcMintAmount, calcParentSupply, parentInfo.priceUSD]);

  // ── Determine the display label for the selected calculator parent ──────
  const calcParentLabel = useMemo(() => {
    const opt = PARENT_TOKEN_OPTIONS.find((o) => o.address === calcParentToken);
    if (opt) return `${opt.icon} ${opt.symbol}`;
    if (parentInfo.symbol) return parentInfo.symbol;
    return calcParentToken.slice(0, 6) + "..." + calcParentToken.slice(-4);
  }, [calcParentToken, parentInfo.symbol]);

  // ── Display total supply (from fetched data) ───────────────────────────
  const displayTotalSupply = useMemo(() => {
    if (calcParentSupply > 0) return calcParentSupply;
    if (parentInfo.totalSupply > 0) return parentInfo.totalSupply;
    return 0;
  }, [calcParentSupply, parentInfo.totalSupply]);

  // ── Fetch multiplier for selected mint token ────────────────────────────
  const fetchMultiplier = useCallback(async () => {
    if (!mintToken) {
      setCurrentMultiplier(0);
      setLoadingMultiplier(false);
      return;
    }
    setLoadingMultiplier(true);
    try {
      const mult = await getMultiplier(mintToken, 1);
      setCurrentMultiplier(mult);
    } catch {
      setCurrentMultiplier(0);
    } finally {
      setLoadingMultiplier(false);
    }
  }, [mintToken]);

  // ── Fetch mint preview ──────────────────────────────────────────────────
  const fetchMintPreview = useCallback(async () => {
    if (!mintToken || !mintAmount) {
      setMintPreview(null);
      return;
    }
    try {
      const [price, costResult] = await Promise.all([
        getTokenPrice(mintToken),
        getMintCost(),
      ]);
      const ratio = costResult.price > 0 ? price.priceUSD / costResult.price : 0;
      setMintPreview({ cost: costResult.price, ratio });
    } catch {
      setMintPreview(null);
    }
  }, [mintToken, mintAmount]);

  useEffect(() => {
    if (!mintToken) {
      setCurrentMultiplier(0);
      return;
    }
    fetchMultiplier();
    const interval = setInterval(fetchMultiplier, 15000);
    return () => clearInterval(interval);
  }, [fetchMultiplier, mintToken]);

  useEffect(() => {
    const timer = setTimeout(fetchMintPreview, 300);
    return () => clearTimeout(timer);
  }, [fetchMintPreview]);

  // ── Handle create token ─────────────────────────────────────────────────
  const handleCreateToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!createName.trim() || !createSymbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }
    if (!createInitialMint || parseFloat(createInitialMint) <= 0) {
      toast.error("Initial mint amount must be positive");
      return;
    }

    setCreating(true);
    try {
      const result = await createV3Token(
        createName.trim(),
        createSymbol.trim().toUpperCase(),
        parseFloat(createInitialMint),
        createParent
      );

      toast.success(
        <div className="space-y-1">
          <p>Token created successfully!</p>
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
        version: "V3",
        tokenAddress: result.tokenAddress,
        tokenSymbol: createSymbol.trim().toUpperCase(),
        amount: createInitialMint,
        txHash: result.txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      setCreateName("");
      setCreateSymbol("");
      setCreateInitialMint("1000");
      setCreatedTokenKey((k) => k + 1);
      fetchMultiplier();
    } catch (error: any) {
      toast.error(error.message || "Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  // ── Handle mint ─────────────────────────────────────────────────────────
  const handleMint = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!mintToken) {
      toast.error("Please select a token to mint");
      return;
    }
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast.error("Mint amount must be positive");
      return;
    }

    setMinting(true);
    try {
      const txHash = await mintV3(mintToken, parseFloat(mintAmount));

      toast.success(
        <div className="space-y-1">
          <p>Minted {mintAmount} tokens successfully!</p>
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
        version: "V3",
        tokenAddress: mintToken,
        tokenSymbol: tokenData?.symbol,
        amount: mintAmount,
        txHash,
        status: "confirmed",
        timestamp: Date.now(),
      });

      fetchMultiplier();
    } catch (error: any) {
      toast.error(error.message || "Failed to mint tokens");
    } finally {
      setMinting(false);
    }
  };

  // ── Handle add custom token (improved with validation) ──────────────────
  const handleValidateAddress = async (addr: string) => {
    if (!addr.trim()) {
      setValidationState("idle");
      setValidationMessage("");
      return;
    }

    // Basic format check
    if (!addr.startsWith("0x") || addr.length !== 42) {
      setValidationState("invalid");
      setValidationMessage("Invalid address format. Must be 0x... (42 characters).");
      return;
    }

    // Duplicate check
    if (
      tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())
    ) {
      setValidationState("invalid");
      setValidationMessage("This token is already being tracked.");
      return;
    }

    setValidationState("checking");
    setValidationMessage("Checking contract...");

    try {
      const info = await getTokenInfo(addr);
      if (info.symbol === "???" && info.name === "Unknown") {
        setValidationState("invalid");
        setValidationMessage("Could not read contract data. This may not be a valid ERC20 token.");
        return;
      }
      setValidationState("valid");
      setValidationMessage(`Found: ${info.name} (${info.symbol}) — Ready to add.`);
    } catch {
      setValidationState("invalid");
      setValidationMessage("Failed to read contract. Ensure this is a valid PulseChain address.");
    }
  };

  // Debounced validation
  useEffect(() => {
    if (!showAddToken) return;
    const timer = setTimeout(() => {
      handleValidateAddress(addTokenAddress);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTokenAddress, showAddToken]);

  const handleAddToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!addTokenAddress.trim()) {
      toast.error("Please enter a token address");
      return;
    }

    setAddingToken(true);
    try {
      const [info, price, balance, mult] = await Promise.all([
        getTokenInfo(addTokenAddress),
        getTokenPrice(addTokenAddress),
        address ? getTokenBalance(addTokenAddress, address) : Promise.resolve("0"),
        getMultiplier(addTokenAddress, 1),
      ]);

      const tokenData = {
        address: addTokenAddress,
        name: info.name,
        symbol: info.symbol,
        decimals: info.decimals,
        balance,
        priceUSD: price.priceUSD,
        pricePLS: price.pricePLS,
        multiplier: mult,
        profitRatio: mintCostUSD > 0 ? price.priceUSD / mintCostUSD : 0,
        version: "V3" as const,
        lastUpdated: Date.now(),
      };

      addToken(tokenData);
      setAddedTokenInfo({ ...tokenData });
      setAddTokenAddress("");
      setValidationState("idle");
      setValidationMessage("");
      toast.success(`${info.symbol} added to tracking`);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch token info");
    } finally {
      setAddingToken(false);
    }
  };

  // ── Refresh token list ──────────────────────────────────────────────────
  const refreshTokenList = async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const v3Tokens = tokens.filter((t) => t.version === "V3");
      for (const token of v3Tokens) {
        try {
          const [price, balance, mult] = await Promise.all([
            getTokenPrice(token.address),
            getTokenBalance(token.address, address),
            getMultiplier(token.address, 1),
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
          // skip failed tokens
        }
      }
      toast.success("Token list refreshed");
    } catch {
      toast.error("Failed to refresh tokens");
    } finally {
      setRefreshing(false);
    }
  };

  // ── Utility handlers ────────────────────────────────────────────────────
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

  const v3Tokens = tokens.filter((t) => t.version === "V3");

  // ── Validate custom parent token address (create form) ───────────────
  useEffect(() => {
    if (createParentMode !== "custom") {
      setCustomParentInfo(null);
      setCustomParentValid(false);
      return;
    }
    const addr = customParentAddr.trim();
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
      setCustomParentInfo(null);
      setCustomParentValid(false);
      return;
    }
    let cancelled = false;
    setCustomParentChecking(true);
    const validate = async () => {
      try {
        const info = await getTokenInfo(addr);
        if (cancelled) return;
        if (info.symbol === "???" && info.name === "Unknown") {
          setCustomParentInfo(null);
          setCustomParentValid(false);
        } else {
          setCustomParentInfo({ name: info.name, symbol: info.symbol, decimals: info.decimals, totalSupply: "" });
          setCustomParentValid(true);
          setCreateParent(addr);
        }
      } catch {
        if (!cancelled) {
          setCustomParentInfo(null);
          setCustomParentValid(false);
        }
      } finally {
        if (!cancelled) setCustomParentChecking(false);
      }
    };
    const timer = setTimeout(validate, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [customParentAddr, createParentMode]);

  // ── When preset parent is selected, sync to createParent ─────────────
  useEffect(() => {
    if (createParentMode === "preset") {
      setCreateParent(PARENT_TOKEN_OPTIONS.find(o => o.address === createParent)?.address || CONTRACTS.tbill);
    }
  }, [createParentMode, createParent]);

  // ── Validate mint token address (mint form) ──────────────────────────
  useEffect(() => {
    const addr = mintToken.trim();
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
      setMintTokenInfo(null);
      return;
    }
    let cancelled = false;
    setMintTokenChecking(true);
    const validate = async () => {
      try {
        const info = await getTokenInfo(addr);
        if (cancelled) return;
        if (info.symbol !== "???" && info.name !== "Unknown") {
          setMintTokenInfo({ name: info.name, symbol: info.symbol });
        } else {
          setMintTokenInfo(null);
        }
      } catch {
        if (!cancelled) setMintTokenInfo(null);
      } finally {
        if (!cancelled) setMintTokenChecking(false);
      }
    };
    const timer = setTimeout(validate, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mintToken]);

  // ── Compute create form cost preview ─────────────────────────────────
  const createCostPreview = useMemo(() => {
    const amount = parseFloat(createInitialMint);
    if (!amount || amount <= 0) return null;
    const supply = calcParentSupply > 0 ? calcParentSupply : 0;
    if (supply <= 0) return null;
    const mult = supply / (supply + amount);
    const cost = mult * amount;
    const costUSD = cost * parentInfo.priceUSD;
    return { multiplier: mult, cost, costUSD };
  }, [createInitialMint, calcParentSupply, parentInfo.priceUSD]);

  // ── Create form parent label ──────────────────────────────────────────
  const createParentLabel = useMemo(() => {
    if (createParentMode === "custom" && customParentInfo) {
      return `${customParentInfo.name} (${customParentInfo.symbol})`;
    }
    const opt = PARENT_TOKEN_OPTIONS.find(o => o.address === createParent);
    if (opt) return `${opt.name} (${opt.symbol})`;
    return createParent ? `${createParent.slice(0, 6)}...${createParent.slice(-4)}` : "Select parent token";
  }, [createParent, createParentMode, customParentInfo]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ================================================================
          SECTION 1: Minter Purpose Info Card (Collapsible)
          ================================================================ */}
      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <Card className="bg-gray-900 border-gray-800/70 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full text-left">
              <CardContent className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                      <Info className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        What is the V3 Index Minter?
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]"
                        >
                          Guide
                        </Badge>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Learn how the V3 treasury-backed token factory works
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-300",
                      infoOpen && "rotate-180"
                    )}
                  />
                </div>
              </CardContent>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-800">
                <p className="text-sm text-gray-300 leading-relaxed">
                  The <span className="text-emerald-400 font-semibold">V3 Index Minter</span> is a factory contract
                  on PulseChain that creates treasury-backed tokens. Each token is backed by a{" "}
                  <span className="text-emerald-400 font-semibold">parent token</span> of your choice — any ERC20 token on PulseChain.
                  When you mint, you pay in the parent token and receive the new token. The{" "}
                  <span className="text-emerald-400 font-semibold">multiplier</span> is derived from the parent token&apos;s total supply,
                  rewarding early adopters with lower mint costs.
                </p>
              </div>

              {/* Key Stats — dynamic based on selected calculator parent token */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Parent Token Supply */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Parent Token Supply</p>
                    {parentInfo.symbol && (
                      <Badge variant="outline" className="border-gray-700 text-gray-500 text-[9px] px-1.5 py-0">
                        {parentInfo.symbol}
                      </Badge>
                    )}
                  </div>
                  {loadingParent ? (
                    <Skeleton className="h-5 w-20 shimmer rounded" />
                  ) : (
                    <p className="text-sm font-bold font-mono text-white number-animate">
                      {parentInfo.totalSupplyFormatted || "—"}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Fetched from /api/token-data
                  </p>
                </div>

                {/* Current Parent Token Price */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Parent Token Price</p>
                    {!loadingParent && parentInfo.priceUSD > 0 && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-medium",
                        parentInfo.isLive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      )}>
                        {parentInfo.isLive ? "● Live" : "⚠ No Price"}
                      </span>
                    )}
                  </div>
                  {loadingParent ? (
                    <Skeleton className="h-5 w-20 shimmer rounded" />
                  ) : (
                    <p className={cn(
                      "text-sm font-bold font-mono number-animate",
                      parentInfo.priceUSD > 0 ? "text-emerald-400" : "text-gray-500"
                    )}>
                      {parentInfo.priceUSD > 0
                        ? formatUSD(parentInfo.priceUSD)
                        : "No price data"}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {parentInfo.isLive && parentInfo.source ? `via ${parentInfo.source}` : "Per minted token"}
                  </p>
                </div>

                {/* PLS Price */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">PLS Price</p>
                  {loadingParent ? (
                    <Skeleton className="h-5 w-20 shimmer rounded" />
                  ) : (
                    <p className={cn(
                      "text-sm font-bold font-mono number-animate",
                      parentInfo.plsPriceUSD > 0 ? "text-white" : "text-gray-500"
                    )}>
                      {parentInfo.plsPriceUSD > 0 ? formatUSD(parentInfo.plsPriceUSD) : "—"}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">PulseChain native token</p>
                </div>
              </div>

              {/* Contract References */}
              <div className="flex flex-wrap gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 bg-gray-800/40 rounded-md px-2.5 py-1.5 border border-gray-800">
                  <FileCode className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-500">V3 Minter:</span>
                  <span className="text-gray-300 font-mono">{V3_INDEX_MINTER.slice(0, 6)}...{V3_INDEX_MINTER.slice(-4)}</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ================================================================
          SECTION 2: Multiplier Math Visualization Card
          ================================================================ */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20 border-gray-800/70 border-emerald-500/10 card-hover overflow-hidden relative">
        {/* Subtle glow overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-5 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Multiplier Math Calculator
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Understand how the multiplier formula works — select a parent token to see its supply curve
              </p>
            </div>
          </div>

          {/* Parent Token Selector for Calculator */}
          <div className="mb-4">
            <Label className="text-gray-400 text-xs mb-2 block">Reference Parent Token</Label>
            <div className="flex flex-wrap gap-1.5">
              {PARENT_TOKEN_OPTIONS.map((opt) => (
                <button
                  key={opt.address}
                  onClick={() => setCalcParentToken(opt.address)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 btn-hover-scale flex items-center gap-1.5",
                    calcParentToken === opt.address
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_oklch(0.7_0.17_162/15%)]"
                      : "bg-gray-800/70 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 hover:bg-gray-800"
                  )}
                >
                  <span>{opt.icon}</span>
                  <span className="font-medium">{opt.symbol}</span>
                </button>
              ))}
            </div>
            {/* Loading indicator when switching parent */}
            {loadingParent && (
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Fetching {calcParentLabel} on-chain data...</span>
              </div>
            )}
          </div>

          {/* Formula Display */}
          <div className="bg-gray-800/60 rounded-lg p-3 border border-emerald-500/10 mb-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Multiplier Formula</p>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-emerald-400 font-semibold">Multiplier</span>
              <span className="text-gray-500">=</span>
              <span className="text-amber-400">TotalSupply</span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">(</span>
              <span className="text-amber-400">TotalSupply</span>
              <span className="text-gray-500">+</span>
              <span className="text-cyan-400">Addition</span>
              <span className="text-gray-300">)</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">
              The multiplier approaches 0 as the addition grows relative to total supply.
              Early mints get a multiplier close to 1.0x (cheaper), while large mints reduce it.
            </p>
          </div>

          {/* No supply data warning */}
          {!loadingParent && calcParentSupply <= 0 && (
            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Could not fetch on-chain supply data for the selected parent token. The calculator needs a valid total supply to compute the multiplier. Please ensure the token address is a valid ERC20 contract on PulseChain.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Calculator */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-gray-400 text-xs">
                  How many tokens do you want to mint?
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 10000"
                  value={calcMintAmount}
                  onChange={(e) => setCalcMintAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono input-focus-ring"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pb-0.5">
                {[1000, 10000, 100000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCalcMintAmount(preset.toString())}
                    className={cn(
                      "text-[10px] px-2 py-1.5 rounded border transition-all duration-200 btn-hover-scale",
                      calcMintAmount === preset.toString()
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                    )}
                  >
                    {preset >= 1e6 ? `${preset / 1e6}M` : `${preset / 1e3}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculator Result */}
            {calcResult && (
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Multiplier */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Multiplier</p>
                    <p className="text-lg font-bold font-mono text-emerald-400 text-glow-emerald-animated number-animate">
                      {calcResult.multiplier.toFixed(6)}x
                    </p>
                  </div>

                  {/* Cost in Parent Token */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cost (Parent Token)</p>
                    <p className="text-lg font-bold font-mono text-amber-400 number-animate">
                      {formatLargeNumber(calcResult.costInParent)}
                    </p>
                  </div>

                  {/* Cost in USD */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cost (USD)</p>
                    <p className="text-lg font-bold font-mono text-white number-animate">
                      {parentInfo.priceUSD > 0 ? formatUSD(calcResult.costUSD) : "—"}
                    </p>
                    {parentInfo.priceUSD <= 0 && (
                      <p className="text-[9px] text-amber-400/70">No price data for parent token</p>
                    )}
                  </div>

                  {/* % of Total Supply */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">% of Supply</p>
                    <p className="text-lg font-bold font-mono text-cyan-400 number-animate">
                      {calcResult.percentageOfSupply < 0.01
                        ? "<0.01"
                        : calcResult.percentageOfSupply.toFixed(4)}
                      %
                    </p>
                  </div>
                </div>

                {/* Progress Bar Visualization */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Mint amount relative to total supply ({formatLargeNumber(displayTotalSupply) || "unknown"})</span>
                    <span className="font-mono text-gray-400">
                      {calcResult.percentageOfSupply < 0.01
                        ? "<0.01"
                        : calcResult.percentageOfSupply.toFixed(3)}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{
                        width: `${Math.min(Math.max(calcResult.percentageOfSupply * 100, 0.5), 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                    <span>0</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Key Insight */}
                <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Using <span className="text-emerald-400 font-semibold">{calcParentLabel}</span>
                      {displayTotalSupply > 0 ? (
                        <> ({formatLargeNumber(displayTotalSupply)} supply)</>
                      ) : (
                        <> (supply unknown)</>
                      )}
                      : If you mint{" "}
                      <span className="text-white font-semibold">{parseFloat(calcMintAmount).toLocaleString()}</span> tokens,
                      you need <span className="text-amber-400 font-semibold">{formatLargeNumber(calcResult.costInParent)} parent tokens</span>
                      {parentInfo.priceUSD > 0 && (
                        <> (cost: <span className="text-white font-semibold">{formatUSD(calcResult.costUSD)}</span>)</>
                      )}
                      . The multiplier of <span className="text-emerald-400 font-semibold">{calcResult.multiplier.toFixed(6)}x</span> means
                      each minted token costs approximately{" "}
                      <span className="text-white font-semibold">{formatLargeNumber(calcResult.costInParent / parseFloat(calcMintAmount))} parent tokens</span> on average.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          SECTION 3: How-To Dropdown Guides (Accordion)
          ================================================================ */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            How-To Guides
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            {/* Guide 1: How to Create a Token */}
            <AccordionItem value="create-token" className="border-gray-800">
              <AccordionTrigger className="text-sm text-gray-300 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span>How to Create a Token</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm pb-3">
                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-800 space-y-3">
                  {[
                    { step: 1, text: "Enter a name and symbol for your token" },
                    { step: 2, text: "Set initial mint amount (how many tokens to create)" },
                    { step: 3, text: "Select a parent token — T-BILL, FED, eDAI, WPLS, or paste any ERC20 address" },
                    { step: 4, text: 'Click "Create Token" — this deploys a new contract' },
                    { step: 5, text: "Wait for transaction confirmation on PulseChain" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">{item.step}</span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 pt-1">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                      <span className="text-amber-400 font-medium">Pro Tip:</span> The initial mint amount determines the starting
                      supply of your token. A larger initial mint means a higher multiplier for subsequent mints.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Guide 2: How to Mint */}
            <AccordionItem value="how-to-mint" className="border-gray-800">
              <AccordionTrigger className="text-sm text-gray-300 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Coins className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span>How to Mint</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm pb-3">
                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-800 space-y-3">
                  {[
                    { step: 1, text: "Select a token from your tracked list or paste an address" },
                    { step: 2, text: "Enter the amount you want to mint" },
                    { step: 3, text: "Review the multiplier and cost preview" },
                    { step: 4, text: 'Click "Mint Tokens" — this calls the mint() function on-chain' },
                    { step: 5, text: "Tokens are transferred to your wallet after confirmation" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">{item.step}</span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 pt-1">
                    <Wallet className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                      <span className="text-amber-400 font-medium">Important:</span> You need the parent token in your wallet to pay
                      for the mint. The cost depends on the current multiplier and the parent token&apos;s total supply.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Guide 3: How Multipliers Work */}
            <AccordionItem value="multipliers" className="border-gray-800">
              <AccordionTrigger className="text-sm text-gray-300 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span>How Multipliers Work</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm pb-3">
                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-800 space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The multiplier determines how many parent tokens you pay per minted token. It&apos;s
                      calculated from the parent token&apos;s total supply using the formula: Multiplier = TotalSupply / (TotalSupply + Addition).
                      This rewards early adopters with lower costs.
                    </p>

                    {/* Formula Card */}
                    <div className="bg-gray-900/60 rounded-lg p-3 border border-emerald-500/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Cost Formula</p>
                      <p className="font-mono text-sm text-emerald-400">
                        Cost = Multiplier(addition) &times; addition / 1e18
                      </p>
                    </div>

                    {/* Explanation Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Zap className="h-3.5 w-3.5 text-emerald-400" />
                          <p className="text-xs font-semibold text-emerald-400">Early Mints</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          Lower multiplier = cheaper minting. When the parent token&apos;s total supply is large relative
                          to your addition, the multiplier is close to 1.0x, meaning you pay
                          approximately 1 parent token per minted token.
                        </p>
                      </div>

                      <div className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          <p className="text-xs font-semibold text-rose-400">Late Mints</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          Higher multiplier = more expensive. As the token&apos;s supply grows,
                          new mints become proportionally more expensive, rewarding those
                          who minted early.
                        </p>
                      </div>
                    </div>

                    {/* Profit Formula */}
                    <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Profit Calculation</p>
                      <p className="font-mono text-sm text-gray-300">
                        Profit = (Token DEX Price &minus; Mint Cost) &times; Amount
                      </p>
                    </div>

                    {/* Real Example */}
                    <div className="flex items-start gap-2">
                      <Shield className="h-3.5 w-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        <span className="text-cyan-400 font-medium">Example: Minting 10,000 tokens</span> with a parent
                        token that has 1.1B supply yields a multiplier of ~0.999991x (nearly free).
                        Minting 100M tokens yields ~0.917x. Each parent token has its own supply, which changes the multiplier curve.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* ================================================================
          SECTION 4: Multiplier Display with Progress Ring
          ================================================================ */}
      <Card className="bg-gray-900 border-gray-800/70 card-hover">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Progress ring around multiplier value */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="oklch(0.22 0 0)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="oklch(0.7 0.17 162)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={loadingMultiplier ? "0 100" : `${Math.min(currentMultiplier * 5, 100)} 100`}
                    className={cn(!loadingMultiplier && "animate-ring-fill")}
                    style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {loadingMultiplier ? (
                    <Skeleton className="h-8 w-16 shimmer rounded" />
                  ) : (
                    <span className="text-lg font-bold font-mono text-white text-glow-emerald-animated">
                      {formatLargeNumber(currentMultiplier)}x
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {mintToken ? "Token Multiplier" : "V3 Index Multiplier"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  >
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {mintToken
                    ? "Multiplier for the selected mint token"
                    : "Select a token to view its multiplier"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMultiplier}
              disabled={loadingMultiplier}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 btn-hover-scale"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${loadingMultiplier ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          SECTION 5: Action Tabs (Create / Mint / Track)
          ================================================================ */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="bg-gray-900 border border-gray-800/70">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 btn-hover-scale"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </TabsTrigger>
          <TabsTrigger
            value="mint"
            className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 btn-hover-scale"
          >
            <Coins className="h-3 w-3 mr-1" />
            Mint
          </TabsTrigger>
          <TabsTrigger
            value="track"
            className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 btn-hover-scale"
          >
            <Search className="h-3 w-3 mr-1" />
            Track
          </TabsTrigger>
        </TabsList>

        {/* ── Create Tab ── */}
        <TabsContent value="create">
        {/* Create New Token */}
        <Card key={createdTokenKey} className={cn(
          "bg-gray-900 border-gray-800/70 card-hover",
          createdTokenKey > 0 && "animate-expand-in"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Create New V3 Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token Name */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">Token Name</Label>
              <Input
                placeholder="e.g. My Treasury Token"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white w-full input-focus-ring"
              />
            </div>

            {/* Symbol */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">Symbol</Label>
              <Input
                placeholder="e.g. MTK"
                value={createSymbol}
                onChange={(e) => setCreateSymbol(e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 text-white font-mono w-full input-focus-ring"
                maxLength={10}
              />
            </div>

            {/* Initial Mint Amount with presets */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">Initial Mint Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="1000"
                  value={createInitialMint}
                  onChange={(e) => setCreateInitialMint(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono w-full input-focus-ring"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[100, 1000, 10000, 100000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCreateInitialMint(preset.toString())}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded border transition-all duration-200 btn-hover-scale",
                      createInitialMint === preset.toString()
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                    )}
                  >
                    {preset >= 1e6 ? `${preset / 1e6}M` : `${preset >= 1e3 ? preset / 1e3 + "K" : preset}`}
                  </button>
                ))}
              </div>
              {/* Cost preview for create */}
              {createCostPreview && (
                <div className="bg-gray-800/40 rounded-md p-2.5 border border-gray-800 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Multiplier</span>
                    <span className="text-emerald-400 font-mono">{createCostPreview.multiplier.toFixed(6)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. Cost ({PARENT_TOKEN_OPTIONS.find(o => o.address === createParent)?.symbol || "parent"})</span>
                    <span className="text-amber-400 font-mono">{formatLargeNumber(createCostPreview.cost)}</span>
                  </div>
                  {parentInfo.priceUSD > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Est. Cost (USD)</span>
                      <span className="text-white font-mono">{formatUSD(createCostPreview.costUSD)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Parent Token — preset vs custom mode toggle */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs">Parent Token (backing asset)</Label>

              {/* Mode toggle: Preset or Custom */}
              <div className="flex gap-1.5 mb-2">
                <button
                  onClick={() => { setCreateParentMode("preset"); setCustomParentAddr(""); setCustomParentInfo(null); }}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md border transition-all duration-200",
                    createParentMode === "preset"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                  )}
                >
                  Quick Select
                </button>
                <button
                  onClick={() => setCreateParentMode("custom")}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md border transition-all duration-200",
                    createParentMode === "custom"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                  )}
                >
                  Custom ERC20 Address
                </button>
              </div>

              {createParentMode === "preset" ? (
                <>
                  {/* Preset token buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {PARENT_TOKEN_OPTIONS.map((opt) => (
                      <button
                        key={opt.address}
                        onClick={() => { setCreateParent(opt.address); setCreateParentMode("preset"); }}
                        className={cn(
                          "text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 btn-hover-scale flex items-center gap-1.5",
                          createParent === opt.address && createParentMode === "preset"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_oklch(0.7_0.17_162/15%)]"
                            : "bg-gray-800/70 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 hover:bg-gray-800"
                        )}
                      >
                        <span>{opt.icon}</span>
                        <span className="font-medium">{opt.symbol}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600">
                    Selected: <span className="text-gray-400 font-medium">{createParentLabel}</span>
                  </p>
                </>
              ) : (
                <>
                  {/* Custom ERC20 address input */}
                  <div className="relative">
                    <Input
                      value={customParentAddr}
                      onChange={(e) => setCustomParentAddr(e.target.value)}
                      className={cn(
                        "bg-gray-800 border-gray-700 text-white font-mono text-xs w-full input-focus-ring pr-8",
                        customParentValid && "border-emerald-500/40",
                        customParentAddr && !customParentValid && !customParentChecking && "border-rose-500/40"
                      )}
                      placeholder="Paste any ERC20 token address (0x...)"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {customParentChecking && <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                      {customParentValid && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      {customParentAddr && !customParentValid && !customParentChecking && <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
                    </div>
                  </div>
                  {/* Custom token info preview */}
                  {customParentInfo && customParentValid && (
                    <div className="bg-emerald-500/5 rounded-md p-2.5 border border-emerald-500/10 animate-fade-in-up">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-emerald-400">
                            {customParentInfo.name} ({customParentInfo.symbol})
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {customParentAddr}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {customParentAddr && !customParentValid && !customParentChecking && (
                    <p className="text-[10px] text-rose-400">
                      {customParentAddr.length !== 42 ? "Address must be 42 characters" : "Could not read ERC20 data. Ensure this is a valid PulseChain token."}
                    </p>
                  )}
                </>
              )}

              <p className="text-[10px] text-gray-600 leading-relaxed">
                The parent token is the backing asset. Any ERC20 token on PulseChain can be used. It determines the multiplier curve for minting.
              </p>
            </div>

            <Button
              onClick={handleCreateToken}
              disabled={creating || !connected || !createName.trim() || !createSymbol.trim() || !createInitialMint || parseFloat(createInitialMint) <= 0 || (createParentMode === "custom" && !customParentValid)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {creating ? "Creating..." : "Create Token"}
            </Button>
            {!connected && (
              <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1.5">
                <Wallet className="h-3 w-3" />
                Connect your wallet to create tokens on PulseChain
              </p>
            )}
            {connected && !createName.trim() && (
              <p className="text-xs text-amber-400/70 text-center mt-2">
                Enter a token name to continue
              </p>
            )}
            {connected && createName.trim() && !createSymbol.trim() && (
              <p className="text-xs text-amber-400/70 text-center mt-2">
                Enter a symbol to continue
              </p>
            )}
            {connected && createName.trim() && createSymbol.trim() && (!createInitialMint || parseFloat(createInitialMint) <= 0) && (
              <p className="text-xs text-amber-400/70 text-center mt-2">
                Set a positive initial mint amount
              </p>
            )}
            {connected && createName.trim() && createSymbol.trim() && createInitialMint && parseFloat(createInitialMint) > 0 && createParentMode === "custom" && !customParentValid && (
              <p className="text-xs text-amber-400/70 text-center mt-2">
                Enter a valid ERC20 parent token address
              </p>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* ── Mint Tab ── */}
        <TabsContent value="mint">
        {/* Mint Panel */}
        <Card className="bg-gray-900 border-gray-800/70 card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              Mint V3 Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token Address with validation */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">V3 Token Address</Label>
              <div className="relative">
                <Input
                  value={mintToken}
                  onChange={(e) => setMintToken(e.target.value)}
                  className={cn(
                    "bg-gray-800 border-gray-700 text-white font-mono text-xs w-full input-focus-ring pr-8",
                    mintTokenInfo && "border-emerald-500/40"
                  )}
                  placeholder="Paste V3 token contract address (0x...)"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {mintTokenChecking && <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                  {mintTokenInfo && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              </div>
              {/* Token info preview */}
              {mintTokenInfo && (
                <div className="flex items-center gap-1.5 bg-emerald-500/5 rounded-md px-2.5 py-1.5 border border-emerald-500/10 animate-fade-in-up">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-400 font-medium">{mintTokenInfo.name} ({mintTokenInfo.symbol})</span>
                </div>
              )}
              {/* Quick select from tracked tokens */}
              {v3Tokens.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 mb-1.5">Quick select from tracked tokens:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {v3Tokens.slice(0, 8).map((t) => (
                      <button
                        key={t.address}
                        onClick={() => setMintToken(t.address)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-lg border transition-all duration-200 btn-hover-scale flex items-center gap-1",
                          mintToken === t.address
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_oklch(0.7_0.17_162/15%)]"
                            : "bg-gray-800/70 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 hover:bg-gray-800"
                        )}
                      >
                        <span className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-[8px] font-bold text-emerald-400">
                          {t.symbol.slice(0, 2)}
                        </span>
                        <span className="font-medium">{t.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mint Amount with presets */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">Mint Amount</Label>
              <Input
                type="number"
                placeholder="1000"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono w-full input-focus-ring"
              />
              <div className="flex flex-wrap gap-1.5">
                {[100, 1000, 5000, 10000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMintAmount(preset.toString())}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded border transition-all duration-200 btn-hover-scale",
                      mintAmount === preset.toString()
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                    )}
                  >
                    {preset >= 1e6 ? `${preset / 1e6}M` : `${preset >= 1e3 ? preset / 1e3 + "K" : preset}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplier display for selected mint token */}
            {mintToken && currentMultiplier > 0 && (
              <div className="bg-gray-800/40 rounded-md p-2.5 border border-gray-800">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Current Multiplier</span>
                  <span className="text-emerald-400 font-mono font-medium">{formatLargeNumber(currentMultiplier)}x</span>
                </div>
              </div>
            )}

            {/* Mint Preview */}
            {mintPreview && (
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mint Cost</span>
                  <span className="text-white">
                    {formatUSD(mintPreview.cost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Profit Ratio</span>
                  <ProfitIndicator ratio={mintPreview.ratio} size="sm" animated={mintPreview.ratio > 1.5} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Action</span>
                  <span
                    className={`font-medium ${
                      mintPreview.ratio > 1.0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {mintPreview.ratio > 1.0
                      ? `${mintPreview.ratio.toFixed(2)}x Mint for profit`
                      : "Below profit threshold"}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleMint}
              disabled={minting || !connected || !mintToken}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale"
            >
              {minting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {minting ? "Minting..." : "Mint Tokens"}
            </Button>
            {!connected && (
              <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1.5">
                <Wallet className="h-3 w-3" />
                Connect your wallet to mint tokens on PulseChain
              </p>
            )}
            {connected && !mintToken && (
              <p className="text-xs text-amber-400/70 text-center mt-2">
                Enter or select a V3 token address to mint
              </p>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* ── Track Tab ── */}
        <TabsContent value="track">
          <div className="space-y-6">

      {/* ================================================================
          Add Custom Token (Improved with Validation)
          ================================================================ */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardContent className="p-4">
          {/* Info banner */}
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-3.5 w-3.5 text-gray-500" />
            <p className="text-xs text-gray-500">
              Paste any V3 token contract address to fetch its on-chain data, multiplier, and start tracking it.
            </p>
          </div>

          {!showAddToken ? (
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 btn-hover-scale gap-2"
              onClick={() => setShowAddToken(true)}
            >
              <Plus className="h-4 w-4" />
              Add Custom Token by Address
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Address Input with validation feedback */}
              <div className="relative">
                <Input
                  placeholder="Paste token contract address (0x...)"
                  value={addTokenAddress}
                  onChange={(e) => setAddTokenAddress(e.target.value)}
                  className={cn(
                    "bg-gray-800 border-gray-700 text-white font-mono text-xs flex-1 input-focus-ring pr-10",
                    validationState === "valid" && "border-emerald-500/40",
                    validationState === "invalid" && "border-rose-500/40",
                    validationState === "checking" && "border-amber-500/40"
                  )}
                  disabled={addingToken}
                />
                {/* Validation indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validationState === "checking" && (
                    <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  )}
                  {validationState === "valid" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {validationState === "invalid" && (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Validation message */}
              {validationMessage && validationState !== "idle" && (
                <div className={cn(
                  "flex items-center gap-2 text-xs rounded-md px-3 py-2 border",
                  validationState === "valid" && "bg-emerald-500/5 border-emerald-500/10 text-emerald-400",
                  validationState === "invalid" && "bg-rose-500/5 border-rose-500/10 text-rose-400",
                  validationState === "checking" && "bg-amber-500/5 border-amber-500/10 text-amber-400"
                )}>
                  {validationState === "checking" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {validationState === "valid" && <CheckCircle2 className="h-3 w-3" />}
                  {validationState === "invalid" && <AlertCircle className="h-3 w-3" />}
                  <span>{validationMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToken}
                  disabled={addingToken || !addTokenAddress.trim() || !connected || validationState === "checking" || validationState === "invalid"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover-scale gap-1.5 flex-1"
                >
                  {addingToken ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {addingToken ? "Adding..." : "Add Token"}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 btn-hover-scale"
                  onClick={() => {
                    setShowAddToken(false);
                    setAddTokenAddress("");
                    setValidationState("idle");
                    setValidationMessage("");
                    setAddedTokenInfo(null);
                  }}
                >
                  Cancel
                </Button>
              </div>

              {/* Disabled state message */}
              {!connected && addTokenAddress.trim() && (validationState === "valid") && (
                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
                  <Wallet className="h-3 w-3" />
                  Connect your wallet to add this token
                </p>
              )}

              {/* Success card after adding */}
              {addedTokenInfo && (
                <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/15 animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-400">
                        {addedTokenInfo.name} ({addedTokenInfo.symbol})
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {addedTokenInfo.address}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
                        <span className="text-gray-500">
                          Price: <span className="text-white">{formatUSD(addedTokenInfo.priceUSD)}</span>
                        </span>
                        <span className="text-gray-500">
                          Multiplier: <span className="text-emerald-400">{formatLargeNumber(addedTokenInfo.multiplier)}x</span>
                        </span>
                        <span className="text-gray-500">
                          Balance: <span className="text-white">{addedTokenInfo.balance}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          Active V3 Tokens List
          ================================================================ */}
      <Card className="bg-gray-900 border-gray-800/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Active V3 Tokens
              {v3Tokens.length > 0 && (
                <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs ml-2">
                  {v3Tokens.length}
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
          {v3Tokens.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">No V3 tokens tracked yet</p>
              <p className="text-xs mt-1 text-gray-600">
                Create a token above or add a custom address to start tracking
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96 scroll-shadow-bottom">
              <div className="space-y-2">
                {v3Tokens
                  .sort((a, b) => b.profitRatio - a.profitRatio)
                  .map((token, index) => (
                    <div
                      key={token.address}
                      className="animate-stagger-slide-up"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <TokenDetailDialog tokenAddress={token.address}>
                        <div
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all duration-300 cursor-pointer group border border-transparent hover:border-emerald-500/20 hover:shadow-[0_0_12px_oklch(0.7_0.17_162/8%)]"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                              {token.symbol.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
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

                          {/* Quick actions: revealed on hover with staggered fade */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="text-right hidden sm:block mr-2">
                              <p className="text-sm font-medium text-white">
                                {formatUSD(token.priceUSD)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatLargeNumber(token.multiplier)}x mult.
                              </p>
                            </div>

                            {/* Watchlist quick action */}
                            <div
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                              style={{ transitionDelay: "0ms" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <WatchlistButton tokenAddress={token.address} size="sm" />
                            </div>

                            {/* Mint quick action */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 btn-hover-scale"
                              style={{ transitionDelay: "50ms" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMintToken(token.address);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Zap className="h-3 w-3 mr-0.5" />
                              Mint
                            </Button>

                            {/* Details quick action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-700"
                              style={{ transitionDelay: "100ms" }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>

                            {/* Copy quick action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200"
                              style={{ transitionDelay: "150ms" }}
                              onClick={(e) => { e.stopPropagation(); copyAddress(token.address); }}
                            >
                              {copiedAddress === token.address ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-400" />
                              )}
                            </Button>

                            {/* Remove quick action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                              style={{ transitionDelay: "200ms" }}
                              onClick={(e) => { e.stopPropagation(); handleRemoveToken(token.address); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>

                            <ProfitIndicator ratio={token.profitRatio} size="sm" animated={token.profitRatio > 1.5} />
                          </div>
                        </div>
                      </TokenDetailDialog>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
