# AMM Formulas — Full Derivations

## 1. Constant Product (x * y = k) — Full Derivation

### Swap Output

Given reserves `(x, y)` and input `dx`:
```
k = x * y                          (invariant before swap)
k = (x + dx) * (y - dy)           (invariant after swap)

Solving for dy:
  y - dy = k / (x + dx)
  dy = y - k / (x + dx)
  dy = y - (x * y) / (x + dx)
  dy = y * (1 - x/(x + dx))
  dy = y * dx / (x + dx)          ← output before fee
```

With fee (e.g. 0.3%):
```
dx_effective = dx * (1 - fee_rate)
dy = y * dx_effective / (x + dx_effective)
```

### Liquidity Units (V2)

When adding liquidity `(dx, dy)` to pool with existing `(x, y, L)`:
```
LP_shares_issued = min(dx/x, dy/y) * total_supply
```

First deposit (L=0):
```
LP_shares = sqrt(dx * dy)
```

### Pool Price After Large Trade

```
P_before = y / x
P_after  = (y - dy) / (x + dx)
         = y*(x + dx - x*(y-dy)/y) / ... [simplifies to:]
         = y^2 / (x * (x + dx) * (y/x))  [rearranged]

Simpler: P_after = (y - dy) / (x + dx)
```

---

## 2. Uniswap V3 / Concentrated Liquidity — Full Math

### SqrtPrice Representation

V3 stores price as `sqrtPriceX96 = sqrt(P) * 2^96` for precision.

In our notation, we use `sqrt_P` directly.

### Liquidity L

`L` is the "liquidity" scalar — determines how much of `x` and `y` is held per unit of sqrt-price movement.

```
dx = -L * d(1/sqrt_P) = L * (1/sqrt_Pa - 1/sqrt_P)   [token A for P in range]
dy = L * d(sqrt_P)    = L * (sqrt_P - sqrt_Pa)         [token B for P in range]
```

### Mint: Computing L from token amounts

```python
def compute_liquidity(amount_a, amount_b, P, Pa, Pb):
    """
    Given amounts of token A and B to deposit, compute L.
    """
    sqrt_P  = math.sqrt(P)
    sqrt_Pa = math.sqrt(Pa)
    sqrt_Pb = math.sqrt(Pb)

    if P <= Pa:
        # Only token A used (price below range)
        L = amount_a / (1/sqrt_Pa - 1/sqrt_Pb)
    elif P >= Pb:
        # Only token B used (price above range)
        L = amount_b / (sqrt_Pb - sqrt_Pa)
    else:
        # Both tokens, limited by whichever is binding
        La = amount_a / (1/sqrt_P - 1/sqrt_Pb)
        Lb = amount_b / (sqrt_P - sqrt_Pa)
        L = min(La, Lb)

    return L
```

### Fee Growth Tracking (per-liquidity)

V3 tracks fees per unit of liquidity using `feeGrowthGlobal`:
```
fee_per_liquidity = total_fees_collected / L_total

At harvest:
  fees_earned = (fee_per_liquidity_now - fee_per_liquidity_at_deposit) * L_position
```

---

## 3. Tick System (V3)

Ticks are discrete price points. Each tick `i` corresponds to price:
```
P(i) = 1.0001^i
```

```python
def tick_to_price(tick):
    return 1.0001 ** tick

def price_to_tick(price):
    return math.floor(math.log(price) / math.log(1.0001))

def tick_spacing(fee_tier):
    """
    Tick spacing by fee tier (Uniswap V3 standard):
    """
    return {
        100:   1,    # 0.01%
        500:   10,   # 0.05%
        3000:  60,   # 0.30%
        10000: 200   # 1.00%
    }.get(fee_tier, 60)
```

### Common Tick Values

| Price | Tick (approx) |
|---|---|
| 1.0 | 0 |
| 0.9 (−10%) | −1054 |
| 1.1 (+10%) | +953 |
| 0.5 (−50%) | −6932 |
| 2.0 (+100%) | +6932 |

---

## 4. StableSwap Invariant (Curve)

### 2-token StableSwap

```
A * (x + y) + xy * (x + y) / D = A * D + D^3 / (4 * x * y)
```

Simplified for implementation (Newton-Raphson solve for D):

```python
def get_D(xp, amp, n=2):
    """
    Compute D (total balance invariant) for given balances xp.
    xp: list of [x, y] balances (scaled to same precision)
    amp: amplification coefficient A
    """
    S = sum(xp)
    if S == 0:
        return 0

    D = S
    Ann = amp * n
    for _ in range(255):
        D_P = D
        for x in xp:
            D_P = D_P * D // (x * n)
        D_prev = D
        D = (Ann * S + D_P * n) * D // ((Ann - 1) * D + (n + 1) * D_P)
        if abs(D - D_prev) <= 1:
            return D
    raise ValueError("D did not converge")
```

### Price for Stable Pool

The "price" in a StableSwap pool is determined by the derivative of the invariant.
Near peg (x ≈ y ≈ D/n), the effective price is very close to 1.0.
As one token depletes, price moves more aggressively (Curve kicks into CPMM-like behavior).

---

## 5. Balancer Weighted Pool

### Invariant

```
V = Π (xi ^ wi)    where Σwi = 1
```

### Swap Formula

```python
def balancer_swap(balance_in, balance_out, weight_in, weight_out, amount_in):
    """
    Balancer weighted pool swap.
    """
    amount_out = balance_out * (
        1 - (balance_in / (balance_in + amount_in)) ** (weight_in / weight_out)
    )
    return amount_out
```

### Spot Price

```
SP = (balance_in / weight_in) / (balance_out / weight_out)
```

---

## 6. Price Impact Formulas Comparison

| AMM | Price Impact Formula |
|---|---|
| Constant Product | `impact = dx / (x + dx)` |
| StableSwap | Much lower near peg, increases at extremes |
| Concentrated (in-range) | Same as constant product but with virtual reserves |
| Balancer | `impact = 1 - (x/(x+dx))^(wi/wo)` |

---

## 7. Arbitrage Profit Formula

For a two-pool arbitrage (pool A and pool B with different prices):

```python
def optimal_arb_amount(x_a, y_a, x_b, y_b, fee_a=0.003, fee_b=0.003):
    """
    Optimal input amount for constant product arbitrage between two pools.
    Pool A: x_a, y_a (buying token B here)
    Pool B: x_b, y_b (selling token B here)
    Returns optimal dx to maximize profit.
    """
    # Using closed-form solution for 2-pool CPMM arb
    # Optimal when marginal cost of buying = marginal revenue of selling
    fa = 1 - fee_a
    fb = 1 - fee_b

    # Effective k values
    ka = x_a * y_a
    kb = x_b * y_b

    # Price in each pool
    pa = y_a / x_a  # price of token A in terms of B in pool A
    pb = y_b / x_b  # price of token A in terms of B in pool B

    if pa >= pb:
        return 0, "No arbitrage opportunity (prices equal or inverted)"

    # Optimal arb input (approximation):
    optimal_dx = math.sqrt(ka * kb * fb / fa) / (x_b + math.sqrt(kb / (pa * fb))) - x_a

    return max(0, optimal_dx)
```
