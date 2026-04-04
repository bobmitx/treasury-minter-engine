---
name: lp-algorithms
description: >
  Expert reference for LP mathematics and AMM algorithms. Use whenever the user works with AMM math (constant product, concentrated liquidity, stableswap), impermanent loss, LP fee modeling, tick-based liquidity, pool rebalancing, arbitrage detection, LP position management, liquidity depth, price impact, slippage, or any LP strategy on PulseX, Uniswap, or any AMM.
  Trigger for: "impermanent loss", "AMM formula", "x*y=k", "concentrated liquidity", "tick range", "LP position", "pool depth", "price impact", "slippage", "fee APY", "LP strategy", "rebalance LP", "stableswap", "Uniswap V3 math", "TWAP", "LP profitability", "virtual reserves".

---

# LP Algorithms Skill

Complete reference for liquidity provider mathematics, AMM mechanics, and algorithmic LP strategies.
Tuned for PulseChain/PulseX context but universally applicable to any EVM AMM.

---

## 1. AMM Models Overview

| Model | Formula | Used By | Best For |
|---|---|---|---|
| Constant Product | `x * y = k` | Uniswap V2, PulseX V1 | General token pairs |
| Concentrated Liquidity | Virtual reserves within tick range | Uniswap V3, PulseX V2 | Capital efficiency |
| StableSwap (Curve) | Hybrid amplified invariant | Curve, Ellipsis | Pegged assets (stables) |
| CPMM Weighted | `x^w1 * y^w2 = k` | Balancer | Asymmetric weight pools |

---

## 2. Constant Product AMM (x * y = k)

### Core Invariant

```
x * y = k

Where:
  x = reserve of token A
  y = reserve of token B
  k = constant (never changes, except on fee collection/liquidity add)
```

### Price Calculation

```python
# Spot price of token A in terms of token B
spot_price = y / x

# After a swap of dx token A in:
dy = (y * dx) / (x + dx)   # token B received (before fee)
dy_with_fee = dy * (1 - fee_rate)

# New reserves after swap
x_new = x + dx
y_new = y - dy_with_fee
```

### Price Impact

```python
def price_impact(x, y, dx):
    """
    Returns price impact percentage for swapping dx of token A.
    x, y: current reserves
    dx: amount in
    """
    spot_before = y / x
    dy = (y * dx) / (x + dx)
    spot_after = (y - dy) / (x + dx)
    impact = abs(spot_after - spot_before) / spot_before
    return impact * 100  # as percentage

# Rule of thumb:
# dx/x < 1%  → impact < ~1%
# dx/x = 10% → impact ≈ 9.09%
# dx/x = 50% → impact = 33.3%
```

### Slippage vs Price Impact

```python
# Slippage = difference between expected price and execution price
expected_out = dx * (y / x)        # no slippage (spot price)
actual_out = (y * dx) / (x + dx)   # actual AMM output
slippage = (expected_out - actual_out) / expected_out  # as fraction
```

---

## 3. Impermanent Loss (IL)

IL is the opportunity cost of providing liquidity vs. simply holding the tokens.

### Formula

```python
import math

def impermanent_loss(price_ratio_change):
    """
    price_ratio_change: current_price / initial_price
    Returns IL as a negative percentage (loss relative to HODL).
    """
    r = price_ratio_change
    il = (2 * math.sqrt(r) / (1 + r)) - 1
    return il * 100  # negative = loss

# Examples:
# 1.25x price move → IL = -0.6%
# 1.5x price move  → IL = -2.0%
# 2x price move    → IL = -5.7%
# 4x price move    → IL = -20.0%
# 5x price move    → IL = -25.5%
# 10x price move   → IL = -42.5%
```

### Full IL Calculation with Fees

```python
def lp_vs_hodl(
    initial_price,    # price of token A in token B at deposit
    final_price,      # price at withdrawal
    initial_a,        # amount of token A deposited
    initial_b,        # amount of token B deposited
    fee_rate,         # e.g. 0.003 for 0.3%
    volume_usd,       # total volume through pool during holding period
    pool_liquidity,   # average pool TVL during holding period
):
    # HODL value
    hodl_value = initial_a * final_price + initial_b

    # LP value (constant product)
    k = initial_a * initial_b
    # At final price: x_lp = sqrt(k / final_price), y_lp = sqrt(k * final_price)
    x_lp = math.sqrt(k / final_price)
    y_lp = math.sqrt(k * final_price)
    lp_value_no_fees = x_lp * final_price + y_lp

    # Fee revenue (proportional share of fees)
    lp_share = (initial_a * initial_price + initial_b) / pool_liquidity
    fee_revenue = volume_usd * fee_rate * lp_share

    lp_total = lp_value_no_fees + fee_revenue
    net_pnl = lp_total - hodl_value

    return {
        "hodl_value": hodl_value,
        "lp_value_with_fees": lp_total,
        "impermanent_loss": lp_value_no_fees - hodl_value,
        "fee_revenue": fee_revenue,
        "net_pnl": net_pnl,
        "is_profitable": net_pnl > 0
    }
```

---

## 4. Concentrated Liquidity (Uniswap V3 / PulseX V2)

### Concept

Instead of providing liquidity across the entire price curve (0 to ∞), LPs select a price range `[Pa, Pb]`.
Capital is only active (earning fees) when the current price is within the range.

### Virtual Reserves

```python
# For a position with liquidity L in range [Pa, Pb]:
# Current price P (in terms of token B per token A)

import math

def virtual_reserves(L, P, Pa, Pb):
    """
    L: liquidity amount (raw L value from contract)
    P, Pa, Pb: prices in sqrt form for gas efficiency; here we use raw prices
    Returns (x_virtual, y_virtual) — effective reserves for this position
    """
    sqrt_P  = math.sqrt(P)
    sqrt_Pa = math.sqrt(Pa)
    sqrt_Pb = math.sqrt(Pb)

    if P <= Pa:
        # Out of range (below), all in token A
        x = L * (1/sqrt_Pa - 1/sqrt_Pb)
        y = 0
    elif P >= Pb:
        # Out of range (above), all in token B
        x = 0
        y = L * (sqrt_Pb - sqrt_Pa)
    else:
        # In range — both tokens
        x = L * (1/sqrt_P - 1/sqrt_Pb)
        y = L * (sqrt_P - sqrt_Pa)

    return x, y
```

### Capital Efficiency vs V2

```python
def capital_efficiency_ratio(Pa, Pb, P_center=None):
    """
    How much more capital-efficient is a concentrated position
    vs a full-range V2 position, given the price stays in [Pa, Pb].
    """
    if P_center is None:
        P_center = math.sqrt(Pa * Pb)  # geometric mean (midpoint)

    sqrt_Pa = math.sqrt(Pa)
    sqrt_Pb = math.sqrt(Pb)
    sqrt_Pc = math.sqrt(P_center)

    efficiency = sqrt_Pc / (sqrt_Pc - sqrt_Pa)
    return efficiency
    # Tighter range → higher efficiency ratio
    # ±1% range → ~100x efficiency
    # ±10% range → ~11x efficiency
    # ±50% range → ~3x efficiency
    # Full range → 1x efficiency (same as V2)
```

### Fee Tier Selection

| Fee Tier | Typical Use Case |
|---|---|
| 0.01% (1 bps) | Stable pairs (USDC/USDT, DAI/USDC) |
| 0.05% (5 bps) | Correlated pairs (ETH/WBTC) |
| 0.30% (30 bps) | Standard pairs (ETH/USDC) |
| 1.00% (100 bps) | Exotic/volatile pairs |

---

## 5. TWAP (Time-Weighted Average Price)

TWAP is the primary manipulation-resistant oracle on AMMs.

```python
def calculate_twap(observations, period_seconds):
    """
    observations: list of (timestamp, cumulative_price) tuples
    Returns average price over the period.
    Uniswap V2 stores cumulative price in UQ112x112 fixed point.
    """
    if len(observations) < 2:
        raise ValueError("Need at least 2 observations")

    t0, cp0 = observations[0]
    t1, cp1 = observations[-1]

    time_elapsed = t1 - t0
    if time_elapsed == 0:
        raise ValueError("No time elapsed")

    twap = (cp1 - cp0) / time_elapsed
    return twap
```

### Subgraph TWAP Query (PulseX V1)

```graphql
{
  pair(id: "0x...") {
    token0Price
    token1Price
    token0 { symbol }
    token1 { symbol }
  }
  pairHourDatas(
    first: 24
    orderBy: hourStartUnix
    orderDirection: desc
    where: { pair: "0x..." }
  ) {
    hourStartUnix
    reserve0
    reserve1
    hourlyVolumeToken0
    hourlyVolumeToken1
  }
}
```

---

## 6. Fee Revenue Estimation

```python
def daily_fee_revenue(
    tvl_usd,           # total TVL in pool
    daily_volume_usd,  # 24h trading volume
    fee_rate,          # e.g. 0.003
    position_tvl_usd,  # your position size
):
    """
    Estimate daily fee revenue for a LP position.
    Assumes position earns pro-rata fees based on share of pool.
    """
    pool_fees = daily_volume_usd * fee_rate
    position_share = position_tvl_usd / tvl_usd
    daily_revenue = pool_fees * position_share
    annual_fee_apr = (daily_revenue * 365) / position_tvl_usd * 100

    return {
        "daily_fees_pool": pool_fees,
        "position_share_pct": position_share * 100,
        "daily_revenue": daily_revenue,
        "annual_fee_apr": annual_fee_apr
    }

# For concentrated liquidity:
# fee revenue only accrues when price is in-range
# adjust: revenue * (hours_in_range / total_hours)
def concentrated_fee_apr(base_apr, in_range_fraction):
    return base_apr * in_range_fraction
```

---

## 7. LP Rebalancing Strategies

### Range Rebalancing (V3-style)

When price exits the LP range, the position holds only one token (out-of-range).

```python
def should_rebalance(current_price, lower_tick_price, upper_tick_price, buffer_pct=0.05):
    """
    Returns True if price is within buffer_pct of range boundaries.
    Proactive rebalancing before going fully out of range.
    """
    range_width = upper_tick_price - lower_tick_price
    buffer = range_width * buffer_pct

    near_lower = current_price < (lower_tick_price + buffer)
    near_upper = current_price > (upper_tick_price - buffer)
    out_of_range = current_price <= lower_tick_price or current_price >= upper_tick_price

    return near_lower or near_upper or out_of_range, {
        "out_of_range": out_of_range,
        "near_lower": near_lower,
        "near_upper": near_upper
    }
```

### Optimal Range Width

```python
def optimal_range(current_price, volatility_daily, days_to_rebalance=7, confidence=0.95):
    """
    Calculate optimal LP range given historical volatility.
    Uses log-normal price distribution assumption.
    Returns (lower_price, upper_price).
    """
    import scipy.stats as stats

    # Annualize volatility
    vol_period = volatility_daily * math.sqrt(days_to_rebalance)

    z = stats.norm.ppf((1 + confidence) / 2)  # ~1.96 for 95%

    lower = current_price * math.exp(-z * vol_period)
    upper = current_price * math.exp( z * vol_period)

    return lower, upper
```

---

## 8. Arbitrage Detection

```python
def cross_pool_arbitrage(price_pool_a, price_pool_b, fee_a, fee_b, gas_cost_usd):
    """
    Check if price discrepancy between two pools exceeds combined fees + gas.
    Returns profit per unit if profitable, None otherwise.
    """
    higher, lower = max(price_pool_a, price_pool_b), min(price_pool_a, price_pool_b)
    spread = (higher - lower) / lower

    total_fees = fee_a + fee_b  # combined round-trip fees
    profit_before_gas = spread - total_fees

    # Minimum trade size to cover gas
    min_trade_size = gas_cost_usd / profit_before_gas if profit_before_gas > 0 else None

    return {
        "spread_pct": spread * 100,
        "profitable": profit_before_gas > 0,
        "profit_per_unit": profit_before_gas,
        "min_trade_size_usd": min_trade_size
    }
```

---

## 9. StableSwap (Curve) Algorithm

For stablecoin pairs where prices should be near 1:1.

### Invariant

```
A * n^n * Σxi + D = A * D * n^n + D^(n+1) / (n^n * Πxi)

Where:
  A = amplification coefficient (e.g. 100)
  n = number of assets
  xi = balance of each asset
  D = total liquidity invariant
```

```python
def stableswap_y(x, D, A, n=2):
    """
    Solve for y given x in a 2-token StableSwap pool.
    Iterative Newton's method (as used in Curve contracts).
    """
    Ann = A * n**n
    c = D
    b = x + D / Ann
    for _ in range(255):
        y_prev = c
        c = c * D / (2 * c)  # simplified; full impl needs all xi
        if abs(c - y_prev) < 1:
            break
    return c
```

> For production: use exact Curve implementation from Vyper contracts.

---

## 10. Pool Data Fetching (PulseX)

### V1 Pool Stats via Subgraph

```js
const PULSEX_V1 = "https://graph.pulsechain.com/subgraphs/name/pulsechain/pulsex"

async function getPoolStats(pairAddress) {
  const query = `{
    pair(id: "${pairAddress.toLowerCase()}") {
      reserve0
      reserve1
      token0Price
      token1Price
      token0 { symbol decimals }
      token1 { symbol decimals }
      volumeUSD
      reserveUSD
      txCount
    }
    pairDayDatas(
      first: 30
      orderBy: date
      orderDirection: desc
      where: { pairAddress: "${pairAddress.toLowerCase()}" }
    ) {
      date
      dailyVolumeUSD
      reserveUSD
      dailyTxns
    }
  }`

  const res = await fetch(PULSEX_V1, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  return res.json()
}
```

### Calculate Live APR from Subgraph Data

```js
function calculateLpApr(poolData) {
  const { pairDayDatas, pair } = poolData.data

  // Average daily volume over last 30 days
  const avgDailyVolume = pairDayDatas.reduce((s, d) => s + parseFloat(d.dailyVolumeUSD), 0)
    / pairDayDatas.length

  const tvl = parseFloat(pair.reserveUSD)
  const feeRate = 0.003  // PulseX V1 = 0.3%

  const dailyFees = avgDailyVolume * feeRate
  const apr = (dailyFees * 365) / tvl * 100

  return { apr, tvl, avgDailyVolume, dailyFees }
}
```

---

## 11. Position Entry/Exit Optimization

```python
def optimal_entry_split(price, Pa, Pb, capital_usd):
    """
    For V3-style concentrated liquidity:
    Calculate optimal token split at deposit for a given range.
    Returns (amount_token_a, amount_token_b) in USD terms.
    """
    sqrt_P  = math.sqrt(price)
    sqrt_Pa = math.sqrt(Pa)
    sqrt_Pb = math.sqrt(Pb)

    # Ratio of token A to token B value in the position at current price
    # From virtual reserves formula
    x_val = (1/sqrt_P - 1/sqrt_Pb)  # per unit L, in token A
    y_val = (sqrt_P - sqrt_Pa)       # per unit L, in token B (priced at P)

    x_usd = x_val * price
    total = x_usd + y_val

    ratio_a = x_usd / total
    ratio_b = y_val / total

    return capital_usd * ratio_a, capital_usd * ratio_b
```

---

## 12. Key Metrics to Track Per Pool

| Metric | Formula | Interpretation |
|---|---|---|
| **Fee APR** | `(daily_vol × fee_rate × 365) / TVL` | Revenue from fees only |
| **IL risk** | `2√r/(1+r) - 1` where r = price change | Cost of holding LP vs HODL |
| **Break-even volume** | `IL_usd / fee_rate` | Volume needed to offset IL |
| **Depth** | `TVL × 2 / (upper - lower)` | Liquidity density in range |
| **Volume/TVL ratio** | `daily_volume / TVL` | Capital utilization |
| **In-range time %** | Time price in range / total time | For concentrated LP efficiency |

---

## Reference Files

- `references/amm-formulas.md` — Full derivations of all AMM math
- `references/il-tables.md` — Pre-computed IL tables for common price moves
- `references/pulsex-pools.md` — Known PulseX pool addresses and fee tiers
