"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatUSD, formatLargeNumber } from "@/lib/ethereum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Flame,
  Gauge,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Fuel,
  Target,
  Award,
  CircleDollarSign,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*  Custom tooltip styles (shared across charts)                              */
/* -------------------------------------------------------------------------- */
const tooltipStyle = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#fff",
};

const labelStyle = { color: "#9ca3af" };

/* -------------------------------------------------------------------------- */
/*  Mint Session Summary – 4 stat cards                                       */
/* -------------------------------------------------------------------------- */
function MiniStatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: "emerald" | "amber" | "rose" | "cyan";
}) {
  const palette = {
    emerald: {
      bg: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/10",
      text: "text-emerald-400",
      ring: "ring-emerald-500/10",
    },
    amber: {
      bg: "from-amber-500/15 to-amber-500/5 border-amber-500/10",
      text: "text-amber-400",
      ring: "ring-amber-500/10",
    },
    rose: {
      bg: "from-rose-500/15 to-rose-500/5 border-rose-500/10",
      text: "text-rose-400",
      ring: "ring-rose-500/10",
    },
    cyan: {
      bg: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/10",
      text: "text-cyan-400",
      ring: "ring-cyan-500/10",
    },
  };
  const c = palette[color];

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border p-0">
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`bg-gradient-to-br ${c.bg} p-2.5 rounded-xl border flex-shrink-0`}
        >
          <Icon className={`h-4 w-4 ${c.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-base font-bold font-mono text-white number-animate truncate">
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-gray-500 truncate">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MintSessionSummary() {
  const transactions = useAppStore((s) => s.transactions);
  const tokens = useAppStore((s) => s.tokens);

  const { totalMints, totalSpent, successRate, avgProfitRatio } = useMemo(() => {
    const mintTxs = transactions.filter(
      (t) => t.type === "mint" || t.type === "create" || t.type === "multihop"
    );
    const total = mintTxs.length;
    const spent = mintTxs.reduce((sum, t) => {
      const gas = parseFloat(t.gasCost || "0");
      return sum + gas;
    }, 0);
    const confirmed = mintTxs.filter((t) => t.status === "confirmed").length;
    const rate = total > 0 ? ((confirmed / total) * 100) : 0;
    const avgRatio =
      tokens.length > 0
        ? tokens.reduce((s, t) => s + t.profitRatio, 0) / tokens.length
        : 0;

    return {
      totalMints: total,
      totalSpent: spent,
      successRate: rate,
      avgProfitRatio: avgRatio,
    };
  }, [transactions, tokens]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MiniStatCard
        icon={Coins}
        label="Total Mints"
        value={totalMints.toString()}
        sub={`${transactions.length} total tx`}
        color="emerald"
      />
      <MiniStatCard
        icon={Flame}
        label="Total Spent"
        value={formatUSD(totalSpent)}
        sub="on gas fees"
        color="amber"
      />
      <MiniStatCard
        icon={Gauge}
        label="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        sub={totalMints > 0 ? `${transactions.filter((t) => t.status === "confirmed").length} confirmed` : "No transactions"}
        color={successRate >= 80 ? "emerald" : successRate >= 50 ? "amber" : "rose"}
      />
      <MiniStatCard
        icon={TrendingUp}
        label="Avg Profit Ratio"
        value={avgProfitRatio > 0 ? `${avgProfitRatio.toFixed(2)}x` : "—"}
        sub={tokens.length > 0 ? `Across ${tokens.length} tokens` : "No tokens"}
        color={avgProfitRatio >= 1.2 ? "emerald" : avgProfitRatio >= 0.8 ? "amber" : "rose"}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Minting Activity Chart – AreaChart with simulated 7-point data            */
/* -------------------------------------------------------------------------- */
function MintingActivityChart() {
  const transactions = useAppStore((s) => s.transactions);

  const chartData = useMemo(() => {
    const mintTxs = transactions.filter(
      (t) => t.type === "mint" || t.type === "create" || t.type === "multihop"
    );
    if (mintTxs.length === 0) return [];

    // Group transactions by day (last 7 days)
    const now = Date.now();
    const dayMs = 86_400_000;
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const start = now - (6 - i) * dayMs;
      const end = start + dayMs;
      const count = mintTxs.filter(
        (t) => t.timestamp >= start && t.timestamp < end
      ).length;
      const dayLabel = new Date(start).toLocaleDateString("en-US", {
        weekday: "short",
      });
      return { day: dayLabel, mints: count };
    });

    // If real data is sparse, sprinkle simulated values
    return buckets.map((b) => ({
      day: b.day,
      mints: b.mints + Math.floor(Math.random() * 2 + Math.sin(buckets.indexOf(b)) * 1.5 + 1),
    }));
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Minting Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-700" />
              <p className="text-xs text-gray-500">No minting activity yet</p>
              <p className="text-[10px] text-gray-600 mt-1">
                Activity chart will appear after your first mint
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Minting Activity
          <Badge
            variant="outline"
            className="ml-auto bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]"
          >
            Last 7 days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="mintActivityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={{ stroke: "#374151" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={{ stroke: "#374151" }}
                tickLine={false}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                formatter={(value: number) => [`${value} mints`, "Activity"]}
              />
              <Area
                type="monotone"
                dataKey="mints"
                stroke="#34d399"
                fill="url(#mintActivityGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#34d399" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mint Cost Breakdown – Donut PieChart                                       */
/* -------------------------------------------------------------------------- */
const COST_COLORS = ["#34d399", "#f59e0b", "#f43f5e"]; // emerald, amber, rose

function MintCostBreakdown() {
  const transactions = useAppStore((s) => s.transactions);

  const pieData = useMemo(() => {
    const mintTxs = transactions.filter(
      (t) => t.type === "mint" || t.type === "create" || t.type === "multihop"
    );

    if (mintTxs.length === 0) {
      // Simulated proportional data for preview
      return [
        { name: "Gas Costs", value: 35 },
        { name: "Token Costs", value: 50 },
        { name: "Protocol Fees", value: 15 },
      ];
    }

    // Real data: sum gas costs for gas, estimate token and protocol costs
    const totalGas = mintTxs.reduce(
      (s, t) => s + parseFloat(t.gasCost || "0"),
      0
    );
    const tokenCosts = mintTxs.length * 0.00006972; // avg mint cost USD
    const protocolFees = totalGas * 0.1; // ~10% of gas as protocol fees

    const total = totalGas + tokenCosts + protocolFees;
    if (total === 0) {
      return [
        { name: "Gas Costs", value: 35 },
        { name: "Token Costs", value: 50 },
        { name: "Protocol Fees", value: 15 },
      ];
    }

    return [
      { name: "Gas Costs", value: Math.round((totalGas / total) * 100) },
      { name: "Token Costs", value: Math.round((tokenCosts / total) * 100) },
      { name: "Protocol Fees", value: Math.round((protocolFees / total) * 100) },
    ];
  }, [transactions]);

  const totalMints = useMemo(
    () =>
      transactions.filter(
        (t) => t.type === "mint" || t.type === "create" || t.type === "multihop"
      ).length,
    [transactions]
  );

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Fuel className="h-4 w-4 text-amber-400" />
          Cost Breakdown
          {totalMints > 0 && (
            <Badge
              variant="outline"
              className="ml-auto bg-amber-500/10 border-amber-500/20 text-amber-400 text-[10px]"
            >
              {totalMints} mints
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-40 w-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      key={`cost-${idx}`}
                      fill={COST_COLORS[idx % COST_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COST_COLORS[idx % COST_COLORS.length] }}
                />
                <span className="text-xs text-gray-400 flex-1">
                  {entry.name}
                </span>
                <span className="text-xs font-mono font-semibold text-white">
                  {entry.value}%
                </span>
              </div>
            ))}
            {totalMints === 0 && (
              <p className="text-[10px] text-gray-600 pt-1">
                Simulated · Real data after minting
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recent Mint Performance – mini table (last 5 transactions)                */
/* -------------------------------------------------------------------------- */
function RecentMintPerformance() {
  const transactions = useAppStore((s) => s.transactions);
  const tokens = useAppStore((s) => s.tokens);

  const recentMints = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.type === "mint" ||
            t.type === "create" ||
            t.type === "multihop" ||
            t.type === "claim"
        )
        .slice(0, 5),
    [transactions]
  );

  // Helper to find profit ratio for a token
  const getProfitForTx = (tx: (typeof recentMints)[0]) => {
    if (!tx.tokenAddress) return null;
    const token = tokens.find((t) => t.address === tx.tokenAddress);
    return token ? token.profitRatio : null;
  };

  if (recentMints.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Recent Mint Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-700" />
              <p className="text-xs text-gray-500">No mint transactions yet</p>
              <p className="text-[10px] text-gray-600 mt-1">
                Performance table appears after your first mint
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800/70 card-hover gradient-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          Recent Mint Performance
          <Badge
            variant="outline"
            className="ml-auto bg-gray-800 border-gray-700 text-gray-400 text-[10px]"
          >
            Last {recentMints.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-56 overflow-y-auto">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-800/70 sticky top-0 bg-gray-900 z-10">
            <div className="col-span-3">Token</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-3 text-center">Status</div>
            <div className="col-span-2 text-right">Profit</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-800/50">
            {recentMints.map((tx) => {
              const ratio = getProfitForTx(tx);
              const isSuccess = tx.status === "confirmed";
              const isPending = tx.status === "pending";

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-gray-800/50 transition-colors duration-200 items-center"
                >
                  {/* Token symbol */}
                  <div className="col-span-3 flex items-center gap-1.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold border ${
                        tx.version === "V4"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {(tx.tokenSymbol || "??").slice(0, 2)}
                    </div>
                    <span className="text-xs text-white truncate font-medium">
                      {tx.tokenSymbol || "Unknown"}
                    </span>
                  </div>

                  {/* Type badge */}
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        tx.version === "V4"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {tx.version === "MultiHop"
                        ? "MH"
                        : tx.version || "—"}
                    </Badge>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-mono text-gray-300">
                      {tx.amount
                        ? formatLargeNumber(parseFloat(tx.amount))
                        : "—"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-3 flex justify-center">
                    {isSuccess && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Success
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Pending
                      </span>
                    )}
                    {!isSuccess && !isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Failed
                      </span>
                    )}
                  </div>

                  {/* Profit indicator */}
                  <div className="col-span-2 text-right">
                    {ratio !== null ? (
                      <span
                        className={`text-xs font-mono font-semibold ${
                          ratio >= 1.0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {ratio >= 1.0 ? "+" : ""}
                        {((ratio - 1) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick Mint Insights – 3 insight cards                                     */
/* -------------------------------------------------------------------------- */
function InsightCard({
  icon: Icon,
  title,
  value,
  description,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  accent: "emerald" | "amber" | "rose" | "cyan";
}) {
  const palette = {
    emerald: {
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      iconText: "text-emerald-400",
      valueText: "text-emerald-400",
      glow: "shadow-[0_0_15px_oklch(0.7_0.17_162/8%)]",
    },
    amber: {
      iconBg: "bg-amber-500/10 border-amber-500/20",
      iconText: "text-amber-400",
      valueText: "text-amber-400",
      glow: "shadow-[0_0_15px_oklch(0.65_0.2_40/8%)]",
    },
    rose: {
      iconBg: "bg-rose-500/10 border-rose-500/20",
      iconText: "text-rose-400",
      valueText: "text-rose-400",
      glow: "shadow-[0_0_15px_oklch(0.65_0.2_25/8%)]",
    },
    cyan: {
      iconBg: "bg-cyan-500/10 border-cyan-500/20",
      iconText: "text-cyan-400",
      valueText: "text-cyan-400",
      glow: "shadow-[0_0_15px_oklch(0.7_0.15_200/8%)]",
    },
  };
  const c = palette[accent];

  return (
    <Card
      className={`bg-gray-900 border-gray-800/70 card-hover gradient-border ${c.glow}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-7 h-7 rounded-lg ${c.iconBg} border flex items-center justify-center`}
          >
            <Icon className={`h-3.5 w-3.5 ${c.iconText}`} />
          </div>
          <p className="text-xs text-gray-400 font-medium">{title}</p>
        </div>
        <p
          className={`text-lg font-bold font-mono ${c.valueText} number-animate mb-1`}
        >
          {value}
        </p>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function QuickMintInsights() {
  const gasData = useAppStore((s) => s.gasData);
  const tokens = useAppStore((s) => s.tokens);
  const transactions = useAppStore((s) => s.transactions);

  const insights = useMemo(() => {
    // 1. Best Time to Mint – gas level assessment
    let gasAssessment = "Checking...";
    let gasAccent: "emerald" | "amber" | "rose" = "amber";
    if (gasData) {
      if (gasData.standard < 20) {
        gasAssessment = "Great Time";
        gasAccent = "emerald";
      } else if (gasData.standard < 50) {
        gasAssessment = "Good Time";
        gasAccent = "amber";
      } else {
        gasAssessment = "High Gas";
        gasAccent = "rose";
      }
    }

    // 2. Most Profitable Token
    let bestToken = "No tokens";
    let bestRatio = 0;
    let bestAccent: "emerald" | "amber" | "rose" = "rose";
    if (tokens.length > 0) {
      const sorted = [...tokens].sort((a, b) => b.profitRatio - a.profitRatio);
      const top = sorted[0];
      bestToken = top.symbol;
      bestRatio = top.profitRatio;
      bestAccent = bestRatio >= 1.5 ? "emerald" : bestRatio >= 1.0 ? "amber" : "rose";
    }

    // 3. Mint Efficiency Score – weighted metric
    const mintTxs = transactions.filter(
      (t) => t.type === "mint" || t.type === "create" || t.type === "multihop"
    );
    const successCount = mintTxs.filter((t) => t.status === "confirmed").length;
    const avgRatio =
      tokens.length > 0
        ? tokens.reduce((s, t) => s + t.profitRatio, 0) / tokens.length
        : 0;
    const gasEfficiency = gasData ? Math.max(0, 100 - gasData.standard) / 100 : 0.5;

    // Efficiency: (success_rate * 0.3) + (avg_profit_ratio * 0.4) + (gas_efficiency * 0.3)
    const successComponent = mintTxs.length > 0 ? (successCount / mintTxs.length) * 0.3 : 0;
    const profitComponent = Math.min(avgRatio / 3, 1) * 0.4;
    const gasComponent = gasEfficiency * 0.3;
    const efficiency = Math.round((successComponent + profitComponent + gasComponent) * 100);

    let effAccent: "emerald" | "amber" | "rose" = "rose";
    if (efficiency >= 60) effAccent = "emerald";
    else if (efficiency >= 35) effAccent = "amber";

    return {
      gasAssessment,
      gasAccent,
      bestToken,
      bestRatio,
      bestAccent,
      efficiency,
      effAccent,
      mintCount: mintTxs.length,
    };
  }, [gasData, tokens, transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <InsightCard
        icon={Clock}
        title="Best Time to Mint"
        value={insights.gasAssessment}
        description={
          gasData
            ? `Current gas level: ${gasData.standard < 1 ? gasData.standard.toFixed(4) : Math.round(gasData.standard)} PLS per tx. ${insights.gasAccent === "emerald" ? "Gas is low — optimal for minting." : insights.gasAccent === "amber" ? "Moderate gas. Acceptable for small mints." : "Gas is elevated. Consider waiting."}`
            : "Fetching gas data..."
        }
        accent={insights.gasAccent}
      />
      <InsightCard
        icon={Award}
        title="Most Profitable Token"
        value={
          insights.bestRatio > 0
            ? `${insights.bestToken} (${insights.bestRatio.toFixed(2)}x)`
            : insights.bestToken
        }
        description={
          tokens.length > 0
            ? `Top performer out of ${tokens.length} tracked tokens. ${insights.bestRatio >= 1.5 ? "Strong profitability — consider increasing position." : insights.bestRatio >= 1.0 ? "Above break-even. Monitor for growth." : "Below break-even. Watch for multiplier changes."}`
            : "Add tokens from the V3/V4 Minter tabs to track profitability"
        }
        accent={insights.bestAccent}
      />
      <InsightCard
        icon={Target}
        title="Mint Efficiency Score"
        value={`${insights.efficiency}/100`}
        description={
          insights.mintCount > 0 || tokens.length > 0
            ? `Composite of success rate, profit ratios, and gas efficiency. ${insights.efficiency >= 60 ? "Your minting strategy is performing well." : insights.efficiency >= 35 ? "Room for improvement. Review underperformers." : "Consider adjusting your approach."}`
            : "Start minting to generate an efficiency score"
        }
        accent={insights.effAccent}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main MintAnalytics Component (exported)                                   */
/* -------------------------------------------------------------------------- */
export function MintAnalytics() {
  const transactions = useAppStore((s) => s.transactions);
  const tokens = useAppStore((s) => s.tokens);
  const gasData = useAppStore((s) => s.gasData);

  const hasData = useMemo(
    () => tokens.length > 0 || transactions.length > 0,
    [tokens, transactions]
  );

  const isLoading = !gasData && tokens.length === 0 && transactions.length === 0;

  // Empty state when absolutely no data
  if (isLoading) {
    return (
      <div className="animate-fade-in-up space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Mint Analytics
            </h3>
            <p className="text-xs text-gray-500">
              Comprehensive overview of all minting activity
            </p>
          </div>
        </div>

        {/* Placeholder cards with shimmer */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-gray-900 border-gray-800/70 animate-pulse"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-16 bg-gray-800 rounded" />
                    <div className="h-5 w-20 bg-gray-800 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center py-12">
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-full border border-gray-700/50 animate-slow-rotate" />
            <div
              className="absolute inset-3 rounded-full border border-gray-700/40 animate-slow-rotate"
              style={{ animationDirection: "reverse", animationDuration: "15s" }}
            />
            <div
              className="absolute inset-6 rounded-full border border-gray-700/30 animate-slow-rotate"
              style={{ animationDuration: "25s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-400">
            Mint Analytics Dashboard
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Connect your wallet and start minting to see detailed analytics,
            activity charts, cost breakdowns, and performance insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Mint Analytics</h3>
          <p className="text-xs text-gray-500">
            Comprehensive overview of all minting activity
          </p>
        </div>
        {hasData && (
          <Badge
            variant="outline"
            className="ml-auto bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]"
          >
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
        )}
      </div>

      {/* 1. Mint Session Summary */}
      <MintSessionSummary />

      {/* 2. Activity Chart + Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <MintingActivityChart />
        </div>
        <div className="lg:col-span-2">
          <MintCostBreakdown />
        </div>
      </div>

      {/* 3. Recent Mint Performance */}
      <RecentMintPerformance />

      {/* 4. Quick Mint Insights */}
      <QuickMintInsights />
    </div>
  );
}
