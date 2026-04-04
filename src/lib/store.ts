import { create } from "zustand";

export type TabType =
  | "dashboard"
  | "v3-minter"
  | "v4-minter"
  | "multihop"
  | "portfolio"
  | "history";

export type TxStatus = "pending" | "confirmed" | "failed";

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  priceUSD: number;
  pricePLS: number;
  multiplier: number;
  profitRatio: number;
  version: "V3" | "V4";
  lastUpdated: number;
}

export interface TransactionRecord {
  id: string;
  type: "create" | "mint" | "claim" | "multihop" | "withdraw";
  version: "V3" | "V4" | "MultiHop";
  tokenAddress?: string;
  tokenSymbol?: string;
  amount?: string;
  txHash: string;
  status: TxStatus;
  gasCost?: string;
  timestamp: number;
  details?: string;
}

export interface MultiHopPreview {
  sourceCost: string;
  mintingChain: string[];
  steps: Array<{
    token: string;
    amountToMint: string;
    parentCost: string;
    multiplier: string;
  }>;
}

interface AppState {
  // Wallet state
  address: string | null;
  balance: string;
  chainId: number;
  connected: boolean;

  // UI state
  activeTab: TabType;
  isLoading: boolean;
  settingsOpen: boolean;

  // Market data
  plsPriceUSD: number;
  mintCostUSD: number;
  lastPriceUpdate: number;

  // Token data
  tokens: TokenData[];
  selectedToken: TokenData | null;

  // MultiHop
  multihopPreview: MultiHopPreview | null;
  multihopLoading: boolean;

  // Transaction history
  transactions: TransactionRecord[];

  // Portfolio
  totalPortfolioValue: number;
  totalPnL: number;

  // Settings
  autoRefreshInterval: number;

  // Actions
  setAddress: (address: string | null) => void;
  setBalance: (balance: string) => void;
  setChainId: (chainId: number) => void;
  setConnected: (connected: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  setIsLoading: (loading: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setPlsPriceUSD: (price: number) => void;
  setMintCostUSD: (cost: number) => void;
  setLastPriceUpdate: (timestamp: number) => void;
  setTokens: (tokens: TokenData[]) => void;
  addToken: (token: TokenData) => void;
  updateToken: (address: string, data: Partial<TokenData>) => void;
  removeToken: (address: string) => void;
  setSelectedToken: (token: TokenData | null) => void;
  setMultihopPreview: (preview: MultiHopPreview | null) => void;
  setMultihopLoading: (loading: boolean) => void;
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (id: string, data: Partial<TransactionRecord>) => void;
  setTotalPortfolioValue: (value: number) => void;
  setTotalPnL: (pnl: number) => void;
  setAutoRefreshInterval: (interval: number) => void;
  clearAll: () => void;
}

const initialState = {
  // Wallet
  address: null,
  balance: "0",
  chainId: 0,
  connected: false,

  // UI
  activeTab: "dashboard" as TabType,
  isLoading: false,
  settingsOpen: false,

  // Market
  plsPriceUSD: 0.000028,
  mintCostUSD: 0.00006972,
  lastPriceUpdate: 0,

  // Tokens
  tokens: [],
  selectedToken: null,

  // MultiHop
  multihopPreview: null,
  multihopLoading: false,

  // Transactions
  transactions: [],

  // Portfolio
  totalPortfolioValue: 0,
  totalPnL: 0,

  // Settings
  autoRefreshInterval: 15000,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  // Wallet actions
  setAddress: (address) => set({ address, connected: !!address }),
  setBalance: (balance) => set({ balance }),
  setChainId: (chainId) => set({ chainId }),
  setConnected: (connected) => set({ connected }),

  // UI actions
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  // Market actions
  setPlsPriceUSD: (plsPriceUSD) => set({ plsPriceUSD }),
  setMintCostUSD: (mintCostUSD) => set({ mintCostUSD }),
  setLastPriceUpdate: (lastPriceUpdate) => set({ lastPriceUpdate }),

  // Token actions
  setTokens: (tokens) => set({ tokens }),
  addToken: (token) =>
    set((state) => ({
      tokens: [
        ...state.tokens.filter((t) => t.address !== token.address),
        token,
      ],
    })),
  updateToken: (address, data) =>
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.address === address ? { ...t, ...data } : t
      ),
    })),
  removeToken: (address) =>
    set((state) => ({
      tokens: state.tokens.filter((t) => t.address !== address),
    })),
  setSelectedToken: (selectedToken) => set({ selectedToken }),

  // MultiHop actions
  setMultihopPreview: (multihopPreview) => set({ multihopPreview }),
  setMultihopLoading: (multihopLoading) => set({ multihopLoading }),

  // Transaction actions
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions].slice(0, 100),
    })),
  updateTransaction: (id, data) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),

  // Portfolio actions
  setTotalPortfolioValue: (totalPortfolioValue) =>
    set({ totalPortfolioValue }),
  setTotalPnL: (totalPnL) => set({ totalPnL }),

  // Settings
  setAutoRefreshInterval: (autoRefreshInterval) =>
    set({ autoRefreshInterval }),

  // Clear
  clearAll: () => set(initialState),
}));
