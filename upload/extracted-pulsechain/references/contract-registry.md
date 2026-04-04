# PulseChain Contract Registry

## Core Protocol Contracts

### Native / System
| Contract | Address | Notes |
|---|---|---|
| WPLS (Wrapped PLS) | `0xA1077a294dDE1B09bB078844df40758a5D0f9a27` | ERC-20 wrapper for native PLS |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` | Standard Multicall3 (same address as ETH) |

### PulseX V1 (Uniswap V2 Fork)
| Contract | Address |
|---|---|
| Factory | `0x1715a3E4A142d8b698131108995174F37aEBA10D` |
| Router02 | `0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02` |
| PLSX Token | `0x95B303987A60C71504D99Aa1b13B4DA07b0790ab` |

### PulseX V2 (Concentrated Liquidity)
| Contract | Address |
|---|---|
| Factory | Verify at: `https://scan.pulsechain.com` |
| PositionManager | Verify at: `https://scan.pulsechain.com` |

> Note: Verify V2 addresses on-chain — PulseX does not always publish them prominently.

### Bridged / State-Copy Tokens
| Token | Address | Type |
|---|---|---|
| pHEX | `0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39` | State copy from ETH HEX |
| pDAI | `0xefD766cCb38EaF1dfd701853BFCe31359239F305` | State copy from ETH DAI |
| pUSDC | `0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07` | State copy from ETH USDC |
| pUSDT | `0x0Cb6F5a34ad42ec934882a05265A7d5F59b51A2f` | State copy from ETH USDT |
| pWBTC | `0x408B4A955E3a8B1c5F41b4Bd8Dd1D4e4a22Fc8f` | State copy from ETH WBTC |

> State copy tokens: same contract bytecode + state as Ethereum equivalents. NOT bridged tokens.
> Bridged tokens from the PulseChain bridge will have different addresses.

### Bridge
| Contract | Address | Network |
|---|---|---|
| Bridge (Ethereum side) | `0x4fD0aaa7506f3d9cB8274bdB946Ec42A1b8751EF` | Ethereum |
| Bridge (PulseChain side) | Verify via bridge UI | PulseChain |

## Project-Specific Contracts (Guning's Projects)

### PRVX (ProveX)
- Query live address from BlockScout or GeckoTerminal — token contract deployed post-mainnet
- Primary pools: PulseX V1 and V2
- Data source: BlockScout transfers + GeckoTerminal price

### PTGC (The Grays Currency)
- Staking contract: verify current address from project docs
- WalletConnect project ID (Guning's): `fe9c5a65ad417ee342286b69e7817757`
- Network: PulseChain (Chain ID: 369)

### UFO
- Staking contract: query from BlockScout
- Calculator uses BlockScout v2 live endpoints

## Chain Parameters

```json
{
  "chainId": 369,
  "chainName": "PulseChain",
  "nativeCurrency": {
    "name": "Pulse",
    "symbol": "PLS",
    "decimals": 18
  },
  "rpcUrls": ["https://rpc.pulsechain.com"],
  "blockExplorerUrls": ["https://scan.pulsechain.com"]
}
```

## Adding PulseChain to MetaMask (programmatic)

```js
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x171',  // 369 in hex
    chainName: 'PulseChain',
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    rpcUrls: ['https://rpc.pulsechain.com'],
    blockExplorerUrls: ['https://scan.pulsechain.com']
  }]
})
```
