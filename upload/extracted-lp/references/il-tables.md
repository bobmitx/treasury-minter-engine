# Impermanent Loss Reference Tables

## IL vs Price Change (Constant Product AMM)

Formula: `IL = 2√r/(1+r) - 1` where `r = P_final / P_initial`

### Price Increase Table

| Price Multiplier | IL % | Notes |
|---|---|---|
| 1.01x (+1%) | -0.003% | Negligible |
| 1.05x (+5%) | -0.06% | Negligible |
| 1.10x (+10%) | -0.23% | Very low |
| 1.25x (+25%) | -0.60% | Low |
| 1.50x (+50%) | -2.02% | Moderate |
| 1.75x (+75%) | -3.81% | Moderate |
| 2.00x (+100%) | -5.72% | Significant |
| 2.50x (+150%) | -9.08% | High |
| 3.00x (+200%) | -11.80% | High |
| 4.00x (+300%) | -20.00% | Very high |
| 5.00x (+400%) | -25.46% | Very high |
| 10.0x (+900%) | -42.47% | Severe |
| 100x | -80.00% | Catastrophic |

### Price Decrease Table (same IL by symmetry at same ratio)

| Price Multiplier | IL % |
|---|---|
| 0.99x (-1%) | -0.003% |
| 0.95x (-5%) | -0.06% |
| 0.90x (-10%) | -0.23% |
| 0.80x (-20%) | -0.62% |
| 0.75x (-25%) | -1.01% |
| 0.50x (-50%) | -5.72% |
| 0.33x (-67%) | -11.80% |
| 0.25x (-75%) | -20.00% |
| 0.10x (-90%) | -42.47% |

> Note: IL is symmetric in log space. A 2x increase and a 0.5x decrease produce identical IL.

---

## Break-Even Analysis

For IL to be offset by fees, required volume:

```
Break-even volume = (IL_usd × pool_TVL) / (fee_rate × position_size)
```

### Example: $10,000 position in 0.3% fee pool

| Price Move | IL Loss | Daily Volume Needed to Break Even (30 days) |
|---|---|---|
| ±25% | $60 | $667/day |
| ±50% | $202 | $2,244/day |
| ±100% (2x) | $572 | $6,356/day |
| ±200% (3x) | $1,180 | $13,111/day |

---

## Concentrated Liquidity IL (V3-style)

IL is HIGHER in concentrated positions because:
1. Capital efficiency amplifies both gains and losses
2. When price exits range → position becomes 100% one token (max IL for that direction)

### In-Range IL (same formula as V2 but within range)

For a position in range `[Pa, Pb]` with current price `P`:
- IL accumulates identically to V2 for price movements within range
- When `P < Pa`: position is 100% token A → further drops = impermanent loss crystallizes
- When `P > Pb`: position is 100% token B → missed upside = opportunity cost

### Out-of-Range IL (approximately)

```python
def out_of_range_il(P_entry, Pa, Pb, P_exit, token_a_price_usd):
    """
    Approximate IL when position has gone fully out of range.
    """
    if P_exit < Pa:
        # All in token A. Hodlers had both, LPs now have only A.
        # IL = how much token B value was converted to A on the way down.
        # Simplified: use standard IL at Pa (price when we went OOR)
        r = Pa / P_entry
        il_at_exit = 2 * math.sqrt(r) / (1 + r) - 1
    elif P_exit > Pb:
        r = Pb / P_entry
        il_at_exit = 2 * math.sqrt(r) / (1 + r) - 1
    return il_at_exit
```

---

## Fee APR vs IL Chart (Decision Framework)

```
If annual_fee_apr > |IL_pct| for expected price move:
    → LP is profitable vs HODL
If annual_fee_apr < |IL_pct|:
    → HODL is better (assuming no staking rewards on top)
```

### Typical decision matrix for PulseX pools

| Token Type | Expected IL | Required Fee APR to Break Even |
|---|---|---|
| Stablecoin pair (USDC/DAI) | ~0% | Any positive APR works |
| Blue chip pair (HEX/PLS) | 10-30%/yr | >30% APR |
| Mid-cap pairs | 20-60%/yr | >60% APR |
| Meme/volatile tokens | 50-150%/yr | Very rare to be profitable |

---

## Price Impact Quick Reference

| Trade Size / Pool TVL | Price Impact |
|---|---|
| 0.01% (tiny) | ~0.01% |
| 0.1% | ~0.1% |
| 1% | ~0.99% |
| 5% | ~4.76% |
| 10% | ~9.09% |
| 25% | ~20.0% |
| 50% | ~33.3% |

Rule: For `x * y = k` AMM, price impact ≈ `dx / (x + dx)` where dx is the trade size vs reserve.
