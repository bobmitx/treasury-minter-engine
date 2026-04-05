"use client";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Zap,
  Gem,
  Calculator,
  Bot,
  TrendingUp,
  Globe,
  FileCode,
  Info,
  Coins,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Layers,
  Settings,
  Play,
  DollarSign,
  BarChart3,
  Database,
  RefreshCw,
  Link2,
  Shield,
  Target,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  HelpCircle,
  GitCompare,
  Users,
} from "lucide-react";

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono bg-gray-800 rounded px-2 py-1 text-xs text-emerald-300 inline-block">
      {children}
    </code>
  );
}

function FormulaBlock({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="bg-gray-800/70 rounded-lg p-3 border border-gray-700/50">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <code className="font-mono text-xs text-emerald-300">{formula}</code>
    </div>
  );
}

function HighlightBox({
  children,
  variant = "emerald",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "gray";
}) {
  const colors = {
    emerald:
      "bg-emerald-500/5 border-emerald-500/20 text-emerald-300",
    amber:
      "bg-amber-500/5 border-amber-500/20 text-amber-300",
    gray:
      "bg-gray-800/50 border-gray-700/50 text-gray-300",
  };

  return (
    <div className={cn("rounded-lg p-3 border text-xs", colors[variant])}>
      {children}
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
  accent = "emerald",
}: {
  number: number;
  title: string;
  description: string;
  accent?: "emerald" | "amber";
}) {
  const ringColor =
    accent === "emerald"
      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
      : "border-amber-500/40 text-amber-400 bg-amber-500/10";

  return (
    <div className="flex gap-3 items-start">
      <div
        className={cn(
          "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
          ringColor
        )}
      >
        {number}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

export function AppGuide() {
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border border-emerald-500/20 glow-emerald mb-2">
          <BookOpen className="h-6 w-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Treasury Minter Engine Guide
        </h2>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Everything you need to know about creating, minting, and profiting
          with PulseChain V3 and V4 treasury tokens.
        </p>
      </div>

      {/* Accordion Sections */}
      <Accordion
        type="multiple"
        defaultValue={["section-1", "section-8"]}
        className="space-y-2"
      >
        {/* Section 1: What is the Treasury Minter Engine? */}
        <AccordionItem
          value="section-1"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Info className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">What is the Treasury Minter Engine?</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  Overview of the platform and token systems
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              <p className="text-sm text-gray-300 leading-relaxed">
                The Treasury Minter Engine is a <span className="text-emerald-400 font-medium">decentralized application (dApp)</span> for creating, minting, and tracking treasury-backed tokens on the PulseChain network. It provides two distinct token systems — each with unique minting mechanics and profit opportunities.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <Card className="bg-gray-800/50 border-emerald-500/20 p-4 card-hover">
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-emerald-400">V3 — Index Minter</div>
                        <div className="text-[10px] text-gray-500">System-wide treasury tokens</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Creates tokens that inherit from a parent (T-BILL). Each mint burns parent tokens as cost. Multiplier grows with each mint, increasing profitability. All tokens share the same Index Minter contract.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-amber-500/20 p-4 card-hover">
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Gem className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-amber-400">V4 — Personal Minter</div>
                        <div className="text-[10px] text-gray-500">Personal tokens with rewards</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Personal minter contract with additional features: GAI token creation, staking rewards, claim system, and sub-contracts (BBC, NINE, NOTS, SKILLS). Includes a withdraw function unique to V4.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <HighlightBox variant="gray">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Bot Engine:</span>{" "}
                    The platform includes an automated bot that monitors token profit ratios and can execute mints when conditions are met. Configure your thresholds in{" "}
                    <span className="text-gray-300">Settings → Bot Mode</span>.
                  </div>
                </div>
              </HighlightBox>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: How V3 Minter Works */}
        <AccordionItem
          value="section-2"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">How V3 Minter Works</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  Index Minter contract mechanics
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] ml-auto mr-2">
                V3
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              {/* Create Token */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5" />
                  1. Create Token
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  You call the V3 Index Minter contract to create a new token. You specify a name, symbol, initial mint amount, and a <span className="text-emerald-400 font-medium">Parent Token</span> address.
                </p>
                <HighlightBox variant="emerald">
                  <div className="space-y-1">
                    <div className="text-[10px] text-emerald-500/70 uppercase tracking-wider font-medium">V3 Index Minter Contract</div>
                    <code className="font-mono text-xs text-emerald-300 break-all">
                      0x0c4F73328dFCECfbecf235C9F78A4494a7EC5ddC
                    </code>
                  </div>
                </HighlightBox>
              </div>

              {/* Why T-BILL is the Parent */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5" />
                  2. Why T-BILL is the Parent Token
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  The Parent token field defaults to <span className="text-emerald-400 font-medium">T-BILL</span> because it is the foundational &ldquo;parent&rdquo; token in the PulseChain Treasury system.
                </p>
                <HighlightBox variant="emerald">
                  <div className="space-y-1">
                    <div className="text-[10px] text-emerald-500/70 uppercase tracking-wider font-medium">T-BILL Contract</div>
                    <code className="font-mono text-xs text-emerald-300 break-all">
                      0x463413c579D29c26D59a65312657DFCe30D545A1
                    </code>
                  </div>
                </HighlightBox>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 space-y-2 text-xs text-gray-400">
                  <p>
                    When you create a V3 token with T-BILL as parent, the new token inherits properties from T-BILL and becomes part of the minting hierarchy. The parent token determines the <span className="text-white">cost basis</span> and the <span className="text-white">multiplier mechanics</span>.
                  </p>
                  <p>
                    T-BILL is pegged at <span className="text-emerald-400 font-medium">~$1.00</span>, making it a stable reference for calculating mint costs. You <span className="text-amber-400 font-medium">CAN</span> change this to any other valid parent token, but T-BILL is the safest default.
                  </p>
                </div>
              </div>

              {/* Minting */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  3. Minting
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  After creating a token, you can mint more by calling <CodeBlock>mint(amount)</CodeBlock> on the token contract. Minting <span className="text-rose-400 font-medium">burns parent tokens</span> (T-BILL) as the cost — the T-BILL is consumed and new tokens are created in your wallet.
                </p>
              </div>

              {/* Multiplier */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  4. Multiplier
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Each token has a <CodeBlock>Multiplier(addition)</CodeBlock> function that returns a value. This multiplier affects profitability — more mints generally increase the multiplier with <span className="text-amber-400 font-medium">diminishing returns at 8% decay per step</span>.
                </p>
                <FormulaBlock
                  label="Multiplier Growth (per additional mint)"
                  formula="Multiplier(n) = BaseMultiplier × (1 + 0.08 × 0.7^n)"
                />
              </div>

              {/* Profit Ratio */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  5. Profit Ratio
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  The profit ratio determines if minting is worthwhile. If ratio <span className="text-emerald-400 font-medium">&gt; 1.0</span>, minting is profitable.
                </p>
                <FormulaBlock
                  label="Profit Ratio"
                  formula="Profit Ratio = Token Price / Mint Cost"
                />
                <HighlightBox variant="gray">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      The mint cost is approximately <span className="text-emerald-400 font-mono font-medium">dynamic (live from DexScreener)</span> per token, reflecting the real-time T-BILL market price.
                    </span>
                  </div>
                </HighlightBox>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: How V4 Minter Works */}
        <AccordionItem
          value="section-3"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-amber-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Gem className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">How V4 Minter Works</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  Personal Minter contract with rewards system
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] ml-auto mr-2">
                V4
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              {/* Personal Minter Contract */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5" />
                  Personal Minter Contract
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  V4 uses a different contract — the <span className="text-amber-400 font-medium">V4 Personal Minter</span>. Each user interacts with their own instance, enabling personal token creation and a rewards system not available in V3.
                </p>
                <HighlightBox variant="amber">
                  <div className="space-y-1">
                    <div className="text-[10px] text-amber-500/70 uppercase tracking-wider font-medium">V4 Personal Minter Contract</div>
                    <code className="font-mono text-xs text-amber-300 break-all">
                      0x394c3D5990cEfC7Be36B82FDB07a7251ACe61cc7
                    </code>
                  </div>
                </HighlightBox>
              </div>

              {/* Create Token */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5" />
                  Create Token
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Same pattern as V3 — specify a name, symbol, initial mint amount, and parent token. Also defaults to <span className="text-amber-400 font-medium">T-BILL</span> for the same cost-stability reasons explained in the V3 section.
                </p>
              </div>

              {/* GAI Tokens */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  GAI Tokens (V4 Exclusive)
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  V4 has a special feature to create <span className="text-amber-400 font-medium">&ldquo;GAI&rdquo; tokens</span> via the <CodeBlock>NewGai()</CodeBlock> function. GAI tokens are unique to V4 and have built-in staking, rewards, and yield properties.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Staking", desc: "Lock GAI to earn rewards" },
                    { label: "Rewards", desc: "Claim accumulated yield" },
                    { label: "Yield", desc: "Passive income generation" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5 text-center"
                    >
                      <div className="text-xs font-medium text-amber-400">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minting & Claiming */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  Minting &amp; Claiming Rewards
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Minting follows the same <CodeBlock>mint(amount)</CodeBlock> pattern but uses the V4 ABI. In addition, V4 has a <CodeBlock>Claim(amount)</CodeBlock> function to withdraw accumulated rewards from the system.
                </p>
              </div>

              {/* System Contracts */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-3.5 w-3.5" />
                  V4 System Sub-Contracts
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  V4 has several sub-contracts that extend functionality beyond basic minting. These are displayed in the V4 Minter tab&rsquo;s system info cards.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "BBC", desc: "Bot Broadcasting Contract", color: "border-amber-500/20 text-amber-400" },
                    { name: "NINE", desc: "Nine-token system", color: "border-emerald-500/20 text-emerald-400" },
                    { name: "NOTS", desc: "Notification system", color: "border-violet-500/20 text-violet-400" },
                    { name: "SKILLS", desc: "Skill tree mechanics", color: "border-cyan-500/20 text-cyan-400" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={cn(
                        "bg-gray-800/50 border rounded-lg p-2.5",
                        item.color
                      )}
                    >
                      <div className="text-xs font-bold font-mono">{item.name}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: How the Calculator Works */}
        <AccordionItem
          value="section-4"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">How the Calculator Works</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  Cost, revenue, profit &amp; multiplier formulas
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              <p className="text-sm text-gray-300 leading-relaxed">
                The Calculator tab helps you estimate whether minting a specific token will be profitable. It uses live token prices and the fixed mint cost to project potential returns.
              </p>

              <div className="space-y-3">
                <FormulaBlock
                  label="Mint Cost"
                  formula="Mint Cost = amount × live T-BILL price"
                />
                <p className="text-xs text-gray-500 ml-1">
                  This is the fixed cost per token, pegged to the T-BILL/eDAI system.
                </p>

                <FormulaBlock
                  label="Revenue"
                  formula="Revenue = amount × token_price"
                />
                <p className="text-xs text-gray-500 ml-1">
                  The token&rsquo;s market price from PulseX DEX LP pairs.
                </p>

                <FormulaBlock
                  label="Profit"
                  formula="Profit = Revenue − Cost  (positive = profitable)"
                />

                <FormulaBlock
                  label="ROI"
                  formula="ROI = (Profit / Cost) × 100%"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-emerald-400" />
                    Break-Even Analysis
                  </h4>
                  <p className="text-xs text-gray-400">
                    Shows how many tokens you need to sell at the current market price to cover your mint costs. If break-even &lt; your mint amount, you&rsquo;re profitable.
                  </p>
                  <FormulaBlock
                    label="Break-Even Tokens"
                    formula="Break-Even = Mint Cost / Token Price"
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
                    Multiplier Projections
                  </h4>
                  <p className="text-xs text-gray-400">
                    Each additional mint increases the multiplier by ~8% with a 0.7^n decay factor. The calculator projects your final multiplier after N mints.
                  </p>
                  <FormulaBlock
                    label="Projected Multiplier"
                    formula="Final = Current × Σ(1 + 0.08 × 0.7^i) for i=0..N"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-violet-400" />
                  MultiHop Estimator
                </h4>
                <p className="text-xs text-gray-400">
                  For complex multi-step minting chains, the MultiHop estimator calculates total source token cost vs. target token revenue across the entire chain. It accounts for each hop&rsquo;s mint cost and the cumulative multiplier effect.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: How to Run the Bot */}
        <AccordionItem
          value="section-5"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">How to Run the Bot</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  Automated minting with configurable thresholds
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              <p className="text-sm text-gray-300 leading-relaxed">
                The Bot Mode automates the process of monitoring token profit ratios and executing mints when conditions are favorable. Follow these steps to get started:
              </p>

              <div className="space-y-3">
                <StepItem
                  number={1}
                  title="Enable Bot Mode"
                  description="Go to Settings (gear icon in the header) → Toggle the Bot Mode switch ON"
                  accent="amber"
                />
                <StepItem
                  number={2}
                  title="Configure Parameters"
                  description="Set your Profit Threshold (1.0x–5.0x), Max Gas Price, Default Mint Amount, and Check Interval"
                  accent="amber"
                />
                <StepItem
                  number={3}
                  title="Select Target Tokens"
                  description="In the Bot Mode tab, check the tokens you want the bot to monitor"
                  accent="amber"
                />
                <StepItem
                  number={4}
                  title="Start the Bot"
                  description="Click the Start button in the Bot Mode tab. The bot will begin checking at the configured interval"
                  accent="amber"
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 space-y-3">
                <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-amber-400" />
                  Bot Configuration Parameters
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { param: "Profit Threshold", range: "1.0x – 5.0x", desc: "Minimum ratio to trigger mint" },
                    { param: "Max Gas Price", range: "1 – 500 Gwei", desc: "Skip if gas exceeds this" },
                    { param: "Mint Amount", range: "Any positive number", desc: "Tokens per mint TX" },
                    { param: "Check Interval", range: "5s – 120s", desc: "Time between checks" },
                  ].map((item) => (
                    <div key={item.param} className="bg-gray-900/60 rounded p-2">
                      <div className="font-medium text-gray-300">{item.param}</div>
                      <div className="text-gray-500">
                        {item.range} — <span className="text-gray-400">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <HighlightBox variant="amber">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Currently Simulated:</span>{" "}
                    The bot currently runs in simulation mode. Real blockchain integration (actual mint transactions) is planned for a future update. All logs and metrics shown are for demonstration purposes.
                  </div>
                </div>
              </HighlightBox>

              <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bot auto-claims V4 rewards when the Auto-Claim toggle is enabled</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>View real-time activity logs in the Bot Mode tab</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: When is it Profitable to Mint? */}
        <AccordionItem
          value="section-6"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">When is it Profitable to Mint?</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  The golden rule and key factors
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              <HighlightBox variant="emerald">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-sm">The Golden Rule</div>
                    <div className="mt-1 font-mono text-emerald-300 text-sm">
                      Mint when Token Price &gt; Mint Cost (profit ratio &gt; 1.0x)
                    </div>
                  </div>
                </div>
              </HighlightBox>

              <div className="space-y-3">
                {[
                  {
                    icon: DollarSign,
                    title: "Fixed Mint Cost",
                    desc: "The mint cost is dynamic and follows the live T-BILL market price on PulseChain (via DexScreener/GeckoTerminal). It updates every 15 seconds.",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                  {
                    icon: Globe,
                    title: "Token Price = DEX LP Reserves",
                    desc: "Token prices are determined by PulseX DEX LP pair reserves (token/WPLS → PLS price → USD). As LP reserves shift, so does your token's price.",
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                  },
                  {
                    icon: BarChart3,
                    title: "Higher Multiplier = More Value",
                    desc: "Higher multipliers mean the token is more valuable relative to cost. More mints on a token increase its multiplier (with diminishing returns).",
                    color: "text-violet-400",
                    bg: "bg-violet-500/10",
                  },
                  {
                    icon: Shield,
                    title: "Minimal Gas on PulseChain",
                    desc: "Gas costs are extremely low — ~18 PLS for a standard transaction, ~126 PLS for a mint transaction. This makes frequent minting economically viable.",
                    color: "text-cyan-400",
                    bg: "bg-cyan-500/10",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        item.bg
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-2">
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-center">
                  <Calculator className="h-5 w-5 text-emerald-400 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-white">Use Calculator</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Simulate scenarios before spending real PLS
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-center">
                  <ExternalLink className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-white">Set Alerts</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Get notified when a ratio crosses your threshold
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-center">
                  <Bot className="h-5 w-5 text-violet-400 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-white">Bot Mode</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Automates profitability checking for you
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 7: Price Pipeline Explained */}
        <AccordionItem
          value="section-7"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Price Pipeline Explained</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  How token prices are fetched and calculated
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              <p className="text-sm text-gray-300 leading-relaxed">
                Token prices are fetched via LP pair reserves on the PulseX V1 Factory. The pipeline follows a deterministic process to convert on-chain data into USD prices.
              </p>

              <HighlightBox variant="gray">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">PulseX V1 Factory</div>
                  <code className="font-mono text-xs text-gray-300 break-all">
                    0x1715a3E4A142d8b698131108995174F37aEBA10D
                  </code>
                </div>
              </HighlightBox>

              {/* Pipeline Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                  Price Calculation Pipeline
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      step: "1",
                      label: "Find LP Pair",
                      desc: "findPairAddress(token, WPLS) on PulseX Factory",
                      color: "border-emerald-500/30 bg-emerald-500/5",
                    },
                    {
                      step: "2",
                      label: "Read Reserves",
                      desc: "Call getReserves() on the LP pair contract",
                      color: "border-amber-500/30 bg-amber-500/5",
                    },
                    {
                      step: "3",
                      label: "Calculate Ratio",
                      desc: "token/PLS ratio = tokenReserve / plsReserve",
                      color: "border-violet-500/30 bg-violet-500/5",
                    },
                    {
                      step: "4",
                      label: "Convert to USD",
                      desc: "Multiply by PLS/USD price for final USD value",
                      color: "border-cyan-500/30 bg-cyan-500/5",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border",
                        item.color
                      )}
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {item.step}
                      </div>
                      <div className="text-xs text-gray-300">
                        <span className="font-medium text-white">{item.label}</span>
                        <span className="text-gray-500 ml-2">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PLS/USD Sources */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-amber-400" />
                  PLS/USD Price Resolution (3-tier fallback)
                </h4>
                <div className="space-y-1.5">
                  {[
                    {
                      priority: "Primary",
                      source: "CoinGecko API",
                      status: "emerald",
                    },
                    {
                      priority: "Fallback",
                      source: "DexScreener API",
                      status: "amber",
                    },
                    {
                      priority: "Final",
                      source: "Live PLS price from DexScreener/CoinGecko",
                      status: "gray",
                    },
                  ].map((item) => (
                    <div
                      key={item.source}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.status === "emerald"
                            ? "bg-emerald-400"
                            : item.status === "amber"
                            ? "bg-amber-400"
                            : "bg-gray-500"
                        )}
                      />
                      <span className="text-gray-500 w-16">
                        {item.priority}:
                      </span>
                      <span className="text-gray-300 font-mono">
                        {item.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <HighlightBox variant="gray">
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Refresh Rate:</span>{" "}
                    Prices refresh every <span className="text-emerald-400 font-mono">15 seconds</span> by default. You can configure this interval in Settings (5s – 120s range).
                  </div>
                </div>
              </HighlightBox>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 8: V3 Index vs V4 Personal — Deep Comparison */}
        <AccordionItem
          value="section-8"
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 gradient-border card-hover"
        >
          <AccordionTrigger className="text-white hover:no-underline hover:text-emerald-400 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border border-emerald-500/20 flex items-center justify-center">
                <GitCompare className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold flex items-center gap-2">
                  V3 Index vs V4 Personal
                  <Badge className="bg-emerald-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                    Deep Dive
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  Shared vs independent multiplier economies explained
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4 pt-1">
              {/* The Core Difference */}
              <p className="text-sm text-gray-300 leading-relaxed">
                The words <span className="text-emerald-400 font-medium">&ldquo;Index&rdquo;</span> and <span className="text-amber-400 font-medium">&ldquo;Personal&rdquo;</span> describe fundamentally different economic models for how minting costs are calculated. Understanding this difference is key to choosing the right minter for your use case.
              </p>

              {/* Side-by-side visual comparison */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">V3 Index Context</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="text-white font-medium">Shared multiplier curve</span> across all V3 tokens. All tokens created from the same parent token (e.g., T-BILL) share the same underlying total supply for multiplier calculations.
                  </p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-amber-400 font-semibold">V4 Personal Context</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="text-white font-medium">Independent multiplier curve</span> per token. Each V4 token has its own supply that only changes when <em>that specific token</em> is minted.
                  </p>
                </div>
              </div>

              {/* Shared vs Independent - Deep Explanation */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  The Core Difference: Shared vs Independent
                </h4>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 space-y-3">
                  {/* V3 explanation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <h5 className="text-sm font-semibold text-emerald-400">V3: Shared Multiplier Economy</h5>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      In V3, when you pick a parent token (e.g., T-BILL, FED, WPLS, or any custom ERC20), the factory creates a new token backed by that parent. The <span className="text-white font-medium">multiplier curve depends on the parent token&apos;s total supply</span>. If 1,000 people all create V3 tokens backed by T-BILL, they all share the same T-BILL supply. When Person A mints a large amount, it pushes the multiplier curve for <span className="text-emerald-400 font-medium">everyone</span> using T-BILL as a parent.
                    </p>
                    <HighlightBox variant="emerald">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <span className="font-medium text-emerald-300">Analogy:</span> Like a shared swimming pool — everyone draws from the same source. The more people draw, the more expensive it becomes for the next person, regardless of which token they&apos;re creating.
                        </span>
                      </div>
                    </HighlightBox>
                  </div>

                  <div className="border-t border-gray-700/50 my-3" />

                  {/* V4 explanation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Gem className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <h5 className="text-sm font-semibold text-amber-400">V4: Independent Multiplier Economy</h5>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      In V4, each token has its own <span className="text-white font-medium">isolated multiplier curve</span>. The multiplier depends on the token&apos;s own total supply, not the parent&apos;s. If Alice creates ALICE-V4 and Bob creates BOB-V4, they have completely independent multiplier curves. Alice minting 1M ALICE-V4 tokens does <span className="text-amber-400 font-medium">not</span> affect Bob&apos;s minting cost at all.
                    </p>
                    <HighlightBox variant="amber">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <span className="font-medium text-amber-300">Analogy:</span> Each person gets their own private well. What you pump from your well doesn&apos;t affect your neighbor&apos;s well.
                        </span>
                      </div>
                    </HighlightBox>
                  </div>
                </div>
              </div>

              {/* Multiplier Formulas */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-emerald-400" />
                  Multiplier Formulas
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <FormulaBlock
                    label="V3 — Parent-Based Multiplier"
                    formula="M = ParentSupply / (ParentSupply + Addition)"
                  />
                  <FormulaBlock
                    label="V4 — Token-Based Multiplier"
                    formula="M = TokenSupply / (TokenSupply + Addition)"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  In both cases, the multiplier approaches 0 as the addition grows relative to the reference supply. Early mints get a multiplier close to 1.0x (cheaper), while large mints reduce it.
                </p>
              </div>

              {/* Concrete Example */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  Concrete Example
                </h4>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 space-y-3">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Suppose T-BILL has a total supply of <span className="text-emerald-400 font-mono font-medium">21,000,000</span>. Alice creates <span className="text-emerald-400 font-medium">ALICE-TOKEN</span> (V3) and Bob creates <span className="text-emerald-400 font-medium">BOB-V4</span> (V4), both backed by T-BILL with 1,000 initial supply:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 space-y-2">
                      <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider font-medium">V3 — Alice Mints</p>
                      <ul className="space-y-1 text-xs text-gray-400">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <span>Multiplier based on T-BILL supply (21M)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <span>If she mints 1M → multiplier drops to ~0.955</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <span>Cost paid <span className="text-white">in T-BILL tokens</span></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 mt-0.5">&#x2022;</span>
                          <span className="text-rose-300">Affects ALL other T-BILL-backed tokens</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 space-y-2">
                      <p className="text-[10px] text-amber-500/70 uppercase tracking-wider font-medium">V4 — Bob Mints</p>
                      <ul className="space-y-1 text-xs text-gray-400">
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">&#x2022;</span>
                          <span>Multiplier based on BOB-V4 supply (1K)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">&#x2022;</span>
                          <span>If he mints 1M → multiplier drops to ~0.001</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">&#x2022;</span>
                          <span>Cost paid <span className="text-white">in T-BILL tokens</span></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <span className="text-emerald-300">Does NOT affect Alice or anyone else</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* V4 Multi-Contract Architecture */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-amber-400" />
                  V4 Multi-Contract Architecture
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  V4&apos;s &ldquo;Personal&rdquo; minter is architecturally more complex with several sub-contracts that enable advanced features like reward claiming and GAI token creation.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: "BBC", desc: "Base treasury contract", color: "border-amber-500/20 text-amber-400 bg-amber-500/5" },
                    { name: "Index Minter", desc: "V3 cross-compat link", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" },
                    { name: "NINE", desc: "Active / Zero", color: "border-gray-500/20 text-gray-400 bg-gray-800/50" },
                    { name: "NOTS", desc: "Active / Zero", color: "border-gray-500/20 text-gray-400 bg-gray-800/50" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={cn("border rounded-lg p-2.5", item.color)}
                    >
                      <div className="text-xs font-bold font-mono">{item.name}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Comparison Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <GitCompare className="h-3.5 w-3.5 text-emerald-400" />
                  Feature Comparison Table
                </h4>
                <div className="bg-gray-800/30 rounded-lg border border-gray-700/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="text-left py-2.5 px-3 text-gray-400 font-medium">Feature</th>
                          <th className="text-center py-2.5 px-3 text-emerald-400 font-medium">V3 Index</th>
                          <th className="text-center py-2.5 px-3 text-amber-400 font-medium">V4 Personal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { feature: "Create standard token", v3: true, v4: true },
                          { feature: "Mint tokens", v3: true, v4: true },
                          { feature: "Custom ERC20 parent", v3: true, v4: true },
                          { feature: "Shared multiplier curve", v3: true, v4: false },
                          { feature: "Independent multiplier", v3: false, v4: true },
                          { feature: "GAI token creation", v3: false, v4: true },
                          { feature: "Claim rewards", v3: false, v4: true },
                          { feature: "Withdraw tokens", v3: false, v4: true },
                          { feature: "Transfer ownership", v3: false, v4: true },
                          { feature: "Multi-contract system", v3: false, v4: true },
                          { feature: "Single factory contract", v3: true, v4: false },
                        ].map((row, i) => (
                          <tr key={row.feature} className={cn("border-b border-gray-700/30 last:border-b-0", i % 2 === 0 && "bg-gray-800/20")}>
                            <td className="py-2 px-3 text-gray-300">{row.feature}</td>
                            <td className="py-2 px-3 text-center">
                              {row.v3 ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline" />
                              ) : (
                                <span className="text-gray-600">&mdash;</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.v4 ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 inline" />
                              ) : (
                                <span className="text-gray-600">&mdash;</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* When to Use Which */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  When to Use Which?
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      <h5 className="text-sm font-semibold text-emerald-400">Choose V3 When...</h5>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>You want a community-wide token economy</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>All participants should share the same cost curve</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>You prefer simplicity with fewer moving parts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Using a well-known parent (T-BILL, FED, etc.)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-amber-400" />
                      <h5 className="text-sm font-semibold text-amber-400">Choose V4 When...</h5>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>You want full control over your token&apos;s economics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>You need GAI staking tokens or reward claiming</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>Other token creators shouldn&apos;t affect your costs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>You need token ownership transfer or withdrawals</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Key Insight */}
              <HighlightBox variant="gray">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Key Insight:</span>{" "}
                    V4 tokens have independent multiplier curves &mdash; each token&apos;s multiplier depends on its own total supply, not a shared parent&apos;s supply. This means your minting costs are predictable and unaffected by other users&apos; behavior. The trade-off is more complex contract architecture.
                  </div>
                </div>
              </HighlightBox>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer hint */}
      <div className="text-center pt-2 pb-4">
        <p className="text-xs text-gray-600">
          Need more help? Click the{" "}
          <HelpCircle className="inline h-3 w-3 text-gray-500" /> icon in the
          header for the Getting Started walkthrough.
        </p>
      </div>
    </div>
  );
}
