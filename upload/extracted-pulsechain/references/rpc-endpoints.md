# PulseChain RPC Endpoints & Data Sources

## Public RPC Nodes

| Provider | URL | Notes |
|---|---|---|
| PulseChain Official | `https://rpc.pulsechain.com` | Primary, rate-limited |
| PulseChain Backup | `https://pulsechain.publicnode.com` | More generous limits |
| PulseChain G4MM4 | `https://rpc-pulsechain.g4mm4.io` | Community node |
| Ankr | `https://rpc.ankr.com/pulse` | Paid tiers available |

## WebSocket RPCs

```
wss://ws.pulsechain.com
wss://pulsechain.publicnode.com
```

## Archive Nodes

For historical state queries (eth_getBalance at old blocks, trace_* calls):
- PulseChain does not have widely available public archive nodes
- Use BlockScout API as proxy for historical data
- Consider self-hosted archive node (requires ~8TB+ disk)

## BlockScout API

Base: `https://scan.pulsechain.com/api/v2`

```
Rate limit: ~10 req/s (unauthenticated)
Auth: No API key required (free tier)
```

Useful endpoints:
```
GET /blocks?type=block                    # Recent blocks
GET /blocks/{blockNumber}                 # Block by number
GET /transactions/{hash}                  # Transaction detail
GET /tokens/{address}                     # Token info
GET /tokens/{address}/holders             # Token holders (paginated)
GET /tokens/{address}/transfers           # Token transfers
GET /addresses/{address}                  # Address summary
GET /addresses/{address}/transactions     # Address tx history
GET /addresses/{address}/token-balances   # All token balances
GET /stats                                # Chain stats (TPS, gas price, etc.)
```

## The Graph / Subgraph Nodes

PulseChain The Graph node: `https://graph.pulsechain.com`

Available subgraphs:
```
PulseX V1:     /subgraphs/name/pulsechain/pulsex
PulseX V2:     /subgraphs/name/pulsechain/pulsex-v2
Phiat:         /subgraphs/name/pulsechain/phiat    (verify availability)
```

## GeckoTerminal

Base: `https://api.geckoterminal.com/api/v2`
Network slug: `pulsechain`

```
Rate limit: 30 req/min (free, no key)
CORS: Blocked in browser — use proxy
```

Key endpoints:
```
GET /networks/pulsechain/pools/{address}              # Pool stats
GET /networks/pulsechain/pools/{address}/ohlcv/day    # Daily OHLCV
GET /networks/pulsechain/pools/{address}/ohlcv/hour   # Hourly OHLCV
GET /networks/pulsechain/tokens/{address}             # Token info
GET /simple/networks/pulsechain/token_price/{address} # Price
GET /networks/pulsechain/dexes                        # All DEXes on chain
```
