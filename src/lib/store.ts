import { create } from "zustand";

export type TabType =
  | "dashboard"
  | "v3-minter"
  | "v4-minter"
  | "multihop"
  | "portfolio"
  | "history"
  | "calculator";

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

export interface GasData {
  fast: number;
  standard: number;
  slow: number;
  lastUpdated: number;
}

export interface BotConfig {
  enabled: boolean;
  profitThreshold: number; // minimum profit ratio to auto-mint
  maxGasPrice: number; // max Gwei to spend
  mintAmount: number; // default mint amount
  interval: number; // seconds between checks
  targetTokens: string[]; // token addresses to monitor
  autoClaim: boolean; // auto-claim V4 rewards
}

export interface BotLogEntry {
  id: string;
  timestamp: number;
  type: "info" | "mint" | "error" | "claim" | "skip";
  message: string;
  tokenSymbol?: string;
  profitRatio?: number;
}

export interface ProfitAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  threshold: number; // profit ratio threshold
  direction: "above" | "below"; // alert when above or below
  triggered: boolean;
  lastTriggered?: number;
  createdAt: number;
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
  onboardingOpen: boolean;
  hasSeenOnboarding: boolean;

  // Market data
  plsPriceUSD: number;
  mintCostUSD: number;
  lastPriceUpdate: number;

  // Token data
  tokens: TokenData[];
  selectedToken: TokenData | null;

  // Token detail dialog
  tokenDetailOpen: boolean;
  tokenDetailAddress: string | null;

  // MultiHop
  multihopPreview: MultiHopPreview | null;
  multihopLoading: boolean;

  // Transaction history
  transactions: TransactionRecord[];

  // Portfolio
  totalPortfolioValue: number;
  totalPnL: number;

  // Gas tracker
  gasData: GasData | null;

  // Settings
  autoRefreshInterval: number;
  botMode: boolean;

  // Bot configuration
  botConfig: BotConfig;
  botRunning: boolean;
  botLogs: BotLogEntry[];
  botMintCount: number;
  botTotalProfit: number;

  // Profit alerts
  profitAlerts: ProfitAlert[];

  // Actions
  setAddress: (address: string | null) => void;
  setBalance: (balance: string) => void;
  setChainId: (chainId: number) => void;
  setConnected: (connected: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  setIsLoading: (loading: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setPlsPriceUSD: (price: number) => void;
  setMintCostUSD: (cost: number) => void;
  setLastPriceUpdate: (timestamp: number) => void;
  setTokens: (tokens: TokenData[]) => void;
  addToken: (token: TokenData) => void;
  updateToken: (address: string, data: Partial<TokenData>) => void;
  removeToken: (address: string) => void;
  setSelectedToken: (token: TokenData | null) => void;
  setMintToken: (address: string) => void;
  setMultihopPreview: (preview: MultiHopPreview | null) => void;
  setMultihopLoading: (loading: boolean) => void;
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (id: string, data: Partial<TransactionRecord>) => void;
  setTotalPortfolioValue: (value: number) => void;
  setTotalPnL: (pnl: number) => void;
  setAutoRefreshInterval: (interval: number) => void;
  setBotMode: (enabled: boolean) => void;
  setTokenDetailOpen: (open: boolean) => void;
  setTokenDetailAddress: (address: string | null) => void;
  setGasData: (data: GasData | null) => void;
  setBotConfig: (config: Partial<BotConfig>) => void;
  setBotRunning: (running: boolean) => void;
  addBotLog: (log: BotLogEntry) => void;
  clearBotLogs: () => void;
  setBotMintCount: (count: number) => void;
  setBotTotalProfit: (profit: number) => void;
  addProfitAlert: (alert: ProfitAlert) => void;
  removeProfitAlert: (id: string) => void;
  updateProfitAlert: (id: string, data: Partial<ProfitAlert>) => void;
  clearAll: () => void;
}

const defaultBotConfig: BotConfig = {
  enabled: false,
  profitThreshold: 1.2,
  maxGasPrice: 50,
  mintAmount: 1000,
  interval: 30,
  targetTokens: [],
  autoClaim: false,
};

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
  onboardingOpen: false,
  hasSeenOnboarding: false,

  // Market
  plsPriceUSD: 0.000028,
  mintCostUSD: 0.00006972,
  lastPriceUpdate: 0,

  // Tokens
  tokens: [],
  selectedToken: null,

  // Token detail dialog
  tokenDetailOpen: false,
  tokenDetailAddress: null,

  // MultiHop
  multihopPreview: null,
  multihopLoading: false,

  // Transactions
  transactions: [],

  // Portfolio
  totalPortfolioValue: 0,
  totalPnL: 0,

  // Gas tracker
  gasData: null,

  // Settings
  autoRefreshInterval: 15000,
  botMode: false,

  // Bot
  botConfig: defaultBotConfig,
  botRunning: false,
  botLogs: [],
  botMintCount: 0,
  botTotalProfit: 0,

  // Profit alerts
  profitAlerts: [],
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
  setOnboardingOpen: (onboardingOpen) => set({ onboardingOpen }),
  setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),

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
  setMintToken: (address) => set({ selectedToken: null }),

  // Token detail dialog actions
  setTokenDetailOpen: (tokenDetailOpen) => set({ tokenDetailOpen }),
  setTokenDetailAddress: (tokenDetailAddress) => set({ tokenDetailAddress }),

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

  // Gas data
  setGasData: (gasData) => set({ gasData }),

  // Settings
  setAutoRefreshInterval: (autoRefreshInterval) =>
    set({ autoRefreshInterval }),
  setBotMode: (botMode) => set({ botMode }),

  // Bot actions
  setBotConfig: (config) =>
    set((state) => ({
      botConfig: { ...state.botConfig, ...config },
    })),
  setBotRunning: (botRunning) => set({ botRunning }),
  addBotLog: (log) =>
    set((state) => ({
      botLogs: [log, ...state.botLogs].slice(0, 200),
    })),
  clearBotLogs: () => set({ botLogs: [] }),
  setBotMintCount: (botMintCount) => set({ botMintCount }),
  setBotTotalProfit: (botTotalProfit) => set({ botTotalProfit }),

  // Profit alerts
  addProfitAlert: (alert) =>
    set((state) => ({
      profitAlerts: [...state.profitAlerts, alert],
    })),
  removeProfitAlert: (id) =>
    set((state) => ({
      profitAlerts: state.profitAlerts.filter((a) => a.id !== id),
    })),
  updateProfitAlert: (id, data) =>
    set((state) => ({
      profitAlerts: state.profitAlerts.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    })),

  // Clear
  clearAll: () => set(initialState),
}));
