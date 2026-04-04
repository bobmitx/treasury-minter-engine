---
name: pulsechain-history
description: >
  Complete historical knowledge base for PulseChain blockchain. Use whenever the user asks about PulseChain history, launch timeline, sacrifice phase, HEX fork, PLS tokenomics, PulseX DEX, Richard Heart, Ethereum state copy, validators, chain ID 369, mainnet launch, testnet phases, PulseChain vs Ethereum, ecosystem events, or any historical context about PulseChain.
  Trigger for: "when did PulseChain launch", "sacrifice phase", "PulseChain fork history", "PLS emission", "PulseX V1 vs V2", "PulseChain validators", "what happened to HEX on PulseChain", "PulseChain genesis block", "PLSX", "pHEX", "PulseChain bridge".

---

# PulseChain History Skill

Authoritative reference for PulseChain's complete history, architecture decisions, and ecosystem evolution.
Designed for Guning's DeFi tooling work — informing data pipelines, historical price context, and protocol-aware queries.

---

## 1. Origins & Concept

**Conceptual Announcement**: Richard Heart (founder of HEX) announced PulseChain in 2021 as an Ethereum
system state fork — a full copy of Ethereum's state (accounts, balances, ERC-20 tokens) at a specific
block height, transplanted onto a new Proof-of-Stake chain.

**Core value proposition**:
- Ethereum state copy = everyone who held ETH/ERC-20s at fork block received equivalent PulseChain tokens
- Lower gas fees than Ethereum
- Faster block times (~10s vs Ethereum's ~12s)
- PLS as native gas token (replacing ETH)
- HEX on PulseChain = `pHEX` (same contract, different chain)

---

## 2. Sacrifice Phase

**Purpose**: Community funding mechanism to bootstrap the chain — participants "sacrificed" crypto assets
(sent to a burn address / charity) to earn "sacrifice points" qualifying for future PLS allocation.

| Phase | Period | Details |
|---|---|---|
| Sacrifice Phase | ~July 2021 – Aug 2021 | Participants sent BTC, ETH, HEX, and other assets to designated addresses |
| Assets accepted | BTC, ETH, ERC-20s, BNB, TRON, etc. | Each had a different points multiplier |
| Total raised | Reported >$27M USD equivalent | One of largest crypto sacrifice events at the time |
| Legal framing | "Sacrifice for a good cause" | Positioned as not an investment, purely a donation |

> ⚠️ Controversial: SEC scrutiny on the legal framing; Richard Heart was sued by the SEC in 2023.

---

## 3. Testnet Timeline

| Testnet | Period | Key Events |
|---|---|---|
| **Testnet v1** (PulseChain Testnet) | Late 2021 | Initial validator onboarding, basic EVM compatibility |
| **Testnet v2** | Early-Mid 2022 | Bridge testing, PulseX DEX alpha, expanded validator set |
| **Testnet v2b** | Mid 2022 | Stability improvements, gas tuning |
| **Testnet v3** | Late 2022 – Early 2023 | Near-mainnet parity, full Ethereum state copy simulation, audits |
| **Testnet v4** | Early 2023 | Final pre-launch hardening, validator rehearsal |

---

## 4. Mainnet Launch

**Mainnet Launch Date**: **May 13, 2023** (Block 0 / Genesis)

| Parameter | Value |
|---|---|
| Chain ID | 369 |
| Native token | PLS (PulseChain) |
| Consensus | Proof of Stake (Ethereum-forked consensus layer) |
| Fork block (ETH state copy) | Ethereum block ~16,492,600 (Jan 2023 snapshot) |
| Genesis validators | ~100,000+ validators (Ethereum validator set forked + new entrants) |
| Block time | ~10 seconds |
| EVM compatible | Yes — full EVM, same opcodes as Ethereum |

**Day-1 events**:
- Ethereum state fully copied: all ETH holders received equivalent PLS
- All ERC-20 tokens on Ethereum at fork block duplicated on PulseChain
- HEX contract copied → `pHEX` went live
- PulseX V1 DEX deployed same day

---

## 5. PLS Tokenomics

| Parameter | Details |
|---|---|
| Initial supply | ~135 trillion PLS (inherited from Ethereum state copy scale) |
| Emission | Validator staking rewards (~0.4% annual inflation rate target) |
| Burn mechanism | 25% of gas fees burned (EIP-1559 style) |
| Validator rewards | ~4-6% APY on staked PLS (variable) |
| Minimum stake | 500,000 PLS to run a validator |
| Delegated staking | Supported via liquid staking protocols |

---

## 6. PulseX DEX History

### V1 (May 2023)
- Launched simultaneously with mainnet
- Uniswap V2 fork — constant product AMM `x * y = k`
- Sacrifice participants received `PLSX` token airdrop
- Immediate liquidity from Ethereum state copy (users had pHEX, pDAI, pUSDC, etc.)

### V2 (Late 2023)
- Concentrated liquidity model (Uniswap V3-style)
- Improved capital efficiency
- New PLSX staking mechanisms
- V1 remained live — many tokens kept V1 liquidity (notably PRVX, PTGC, UFO)

**Key subgraph endpoints**:
```
V1: https://graph.pulsechain.com/subgraphs/name/pulsechain/pulsex
V2: https://graph.pulsechain.com/subgraphs/name/pulsechain/pulsex-v2
```

---

## 7. HEX on PulseChain (pHEX)

HEX was Richard Heart's first project (launched Oct 2019 on Ethereum). The PulseChain fork copied the
entire HEX contract state, giving all HEX stakers an equal position on PulseChain.

| Item | Details |
|---|---|
| Contract address (pHEX) | `0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39` (same as ETH HEX) |
| T-shares | Copied 1:1 from Ethereum HEX stakers |
| Inflation | HEX mints 3.69% annually to stakers |
| Impact | pHEX became one of the highest liquidity tokens on PulseChain |

---

## 8. Bridge

**PulseChain Bridge**: Canonical bridge between Ethereum and PulseChain.

- Deployed alongside mainnet (May 2023)
- Omnibridge-style architecture (xDai/Gnosis-inspired)
- Supports ERC-20 transfers both directions
- Bridge address (ETH side): `0x4fD0aaa7506f3d9cB8274bdB946Ec42A1b8751EF`
- Wrapped tokens on PulseChain use `w` prefix convention (e.g., wETH from bridge ≠ native pETH from state copy)

> **Gotcha for devs**: Two versions of most tokens exist on PulseChain:
> 1. State copy version (from Ethereum fork — pure pToken)
> 2. Bridged version (from bridge — wrapped token)
> Always confirm which version a user/contract is referencing.

---

## 9. Major Ecosystem Events (Chronological)

| Date | Event |
|---|---|
| Jul 2021 | Sacrifice phase announced and begins |
| Aug 2021 | Sacrifice phase ends |
| Q4 2021 | Testnet v1 launches |
| Q1 2022 | Testnet v2 with PulseX alpha |
| Q3 2022 | Testnet v2b stability release |
| Q4 2022 | Testnet v3 — Ethereum state copy simulation |
| Q1 2023 | Testnet v4 — final hardening |
| **May 13, 2023** | **PulseChain Mainnet Launch** |
| **May 13, 2023** | **PulseX V1 DEX live** |
| May 2023 | HEX price on PulseChain diverges from Ethereum HEX |
| Jun 2023 | PLSX sacrifice airdrop claims open |
| Jul 2023 | Richard Heart (SEC lawsuit filed) |
| Q4 2023 | PulseX V2 (concentrated liquidity) deployed |
| 2024 | Multiple liquid staking protocols launch |
| 2024-2025 | NFT ecosystem, GameFi projects expand on PulseChain |

---

## 10. Divergence from Ethereum

PulseChain intentionally differs from Ethereum in these ways:

| Feature | Ethereum | PulseChain |
|---|---|---|
| Native token | ETH | PLS |
| Chain ID | 1 | 369 |
| Block time | ~12s | ~10s |
| Consensus | PoS (Beacon chain) | PoS (forked Beacon) |
| Gas burn | EIP-1559, variable | 25% burn, similar model |
| EVM | Standard | Fork-identical |
| State | Independent (2009+) | Copied from ETH at fork block |
| Validator minimum | 32 ETH | 500,000 PLS |
| Staking APY (approx) | ~3-4% | ~4-6% (variable) |

---

## 11. Key Contracts & Addresses

```
PulseX V1 Factory:   0x1715a3E4A142d8b698131108995174F37aEBA10D
PulseX V2 Factory:   0xad1EEe6aA6b0B4B8EE9eeBf9c0f7D9e26Fb9b0A (verify on-chain)
WPLS (Wrapped PLS):  0xA1077a294dDE1B09bB078844df40758a5D0f9a27
pHEX:                0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39
pDAI:                0xefD766cCb38EaF1dfd701853BFCe31359239F305
pUSDC:               0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07
Bridge (ETH side):   0x4fD0aaa7506f3d9cB8274bdB946Ec42A1b8751EF
BlockScout Explorer: https://scan.pulsechain.com
```

---

## 12. Data Sources for Historical Queries

| Need | Source |
|---|---|
| Historical tx / blocks | BlockScout v2 API: `https://scan.pulsechain.com/api/v2` |
| Historical token prices | GeckoTerminal OHLCV: `https://api.geckoterminal.com/api/v2/networks/pulsechain/...` |
| Liquidity history | PulseX V1/V2 subgraphs (tokenDayDatas, poolDayDatas) |
| Validator history | PulseChain beacon explorer |
| Bridge volume | Omnibridge subgraph or BlockScout bridge endpoints |

**Historical subgraph query pattern (tokenDayDatas)**:
```graphql
{
  tokenDayDatas(
    first: 365
    orderBy: date
    orderDirection: desc
    where: { token: "0x..." }
  ) {
    date
    priceUSD
    dailyVolumeUSD
    totalLiquidityUSD
  }
}
```

---

## 13. Ecosystem Projects (Key Ones)

| Project | Type | Notes |
|---|---|---|
| PulseX | DEX (V1+V2) | Primary DEX, highest volume |
| HEX (pHEX) | CD Staking | Highest market cap token |
| PLSX | DEX governance | PulseX governance/staking token |
| INC | Incentive token | PulseX incentive token from sacrifice |
| PRVX (ProveX) | Utility | Guning's tracked token — whale tracker project |
| PTGC (The Grays Currency) | Staking/utility | Guning's staking app project |
| UFO | Utility/staking | Guning's staking calculator project |
| Phiat | Lending | Aave-fork lending protocol |
| Liquid Loans | Lending/stablecoin | USDL stablecoin collateralized by PLS |

---

## Reference Files

- `references/rpc-endpoints.md` — RPC URLs, archive nodes, rate limits
- `references/contract-registry.md` — Verified contract addresses by token/protocol
