import { ethers, Contract } from "ethers";
import { PULSECHAIN_CONFIG, CONTRACTS, ABIS } from "./contracts";

// ERC20 ABI - minimal for balance/name/symbol/decimals/allowance/approve
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
];

// Uniswap V2 Pair ABI for LP reads
const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
];

// PulseChain network params for MetaMask
const PULSECHAIN_NETWORK_PARAMS = {
  chainId: PULSECHAIN_CONFIG.chainIdHex,
  chainName: "PulseChain",
  nativeCurrency: {
    name: "Pulse",
    symbol: "PLS",
    decimals: 18,
  },
  rpcUrls: [PULSECHAIN_CONFIG.rpcUrl],
  blockExplorerUrls: [PULSECHAIN_CONFIG.blockExplorer],
};

// Read-only provider (no wallet needed)
let readOnlyProvider: ethers.providers.JsonRpcProvider | null = null;

export function getProvider(): ethers.providers.JsonRpcProvider {
  if (!readOnlyProvider) {
    readOnlyProvider = new ethers.providers.JsonRpcProvider(
      PULSECHAIN_CONFIG.rpcUrl
    );
  }
  return readOnlyProvider;
}

// Get signer from MetaMask (wallet needed)
export async function getSigner(): Promise<ethers.providers.JsonRpcSigner> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider.getSigner();
}

// Get MetaMask provider
export function getWeb3Provider(): ethers.providers.Web3Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  return new ethers.providers.Web3Provider(window.ethereum);
}

// Get connected wallet address
export async function getAddress(): Promise<string> {
  const accounts = await window.ethereum!.request({
    method: "eth_requestAccounts",
  });
  return accounts[0];
}

// Get PLS balance for an address
export async function getPLSBalance(address: string): Promise<string> {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

// Get ERC20 token balance
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  const provider = getProvider();
  const token = new Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await token.balanceOf(walletAddress);
  const decimals = await token.decimals().catch(() => 18);
  return ethers.utils.formatUnits(balance, decimals);
}

// Get token info (name, symbol, decimals)
export async function getTokenInfo(tokenAddress: string): Promise<{
  name: string;
  symbol: string;
  decimals: number;
}> {
  const provider = getProvider();
  const token = new Contract(tokenAddress, ERC20_ABI, provider);
  try {
    const [name, symbol, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
    ]);
    return { name, symbol, decimals };
  } catch {
    return { name: "Unknown", symbol: "???", decimals: 18 };
  }
}

// Add PulseChain to MetaMask
export async function addPulseChainToWallet(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [PULSECHAIN_NETWORK_PARAMS],
    });
    return true;
  } catch (error) {
    console.error("Failed to add PulseChain:", error);
    return false;
  }
}

// Switch to PulseChain network
export async function switchToPulseChain(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: PULSECHAIN_CONFIG.chainIdHex }],
    });
    return true;
  } catch (error: any) {
    // Chain not added yet, try adding it
    if (error.code === 4902) {
      return addPulseChainToWallet();
    }
    console.error("Failed to switch to PulseChain:", error);
    return false;
  }
}

// Get current chain ID from MetaMask
export async function getChainId(): Promise<number> {
  if (typeof window === "undefined" || !window.ethereum) return 0;
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  return parseInt(chainId, 16);
}

// Check if PulseChain is connected
export function isPulseChain(chainId: number): boolean {
  return chainId === PULSECHAIN_CONFIG.chainId;
}

// Get token price in USD via LP pair reserves
// Pipeline: token/WPLS LP -> reserves -> price in PLS -> convert to USD
export async function getTokenPrice(tokenAddress: string): Promise<{
  priceUSD: number;
  pricePLS: number;
  reserves?: { reserve0: string; reserve1: string };
}> {
  try {
    const provider = getProvider();

    // Get eDAI/WPLS pair for PLS/USD conversion
    const plsPriceUSD = await getPLSPriceInUSD();
    if (plsPriceUSD === 0) {
      return { priceUSD: 0, pricePLS: 0 };
    }

    // Try to find the token/WPLS LP pair
    // We'll use a known factory pair address calculation approach
    // For now, we'll try direct pair address discovery

    // Check if this is WPLS itself
    if (tokenAddress.toLowerCase() === CONTRACTS.wPLS.toLowerCase()) {
      return { priceUSD: plsPriceUSD, pricePLS: 1 };
    }

    // Try to get the token price from the Uniswap V2 router/factory
    // Using a simplified approach: try common pair addresses
    const pairAddress = await findPairAddress(tokenAddress, CONTRACTS.wPLS);

    if (!pairAddress || pairAddress === ethers.constants.AddressZero) {
      return { priceUSD: 0, pricePLS: 0 };
    }

    const pair = new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    const [token0, reserves] = await Promise.all([
      pair.token0(),
      pair.getReserves(),
    ]);

    const reserve0 = reserves[0];
    const reserve1 = reserves[1];

    let tokenReserve: ethers.BigNumber;
    let wplsReserve: ethers.BigNumber;

    if (token0.toLowerCase() === CONTRACTS.wPLS.toLowerCase()) {
      wplsReserve = reserve0;
      tokenReserve = reserve1;
    } else {
      tokenReserve = reserve0;
      wplsReserve = reserve1;
    }

    if (tokenReserve.isZero()) {
      return { priceUSD: 0, pricePLS: 0 };
    }

    // pricePLS = wplsReserve / tokenReserve
    const pricePLS = parseFloat(ethers.utils.formatUnits(wplsReserve, 18)) /
      parseFloat(ethers.utils.formatUnits(tokenReserve, 18));

    const priceUSD = pricePLS * plsPriceUSD;

    return {
      priceUSD,
      pricePLS,
      reserves: {
        reserve0: ethers.utils.formatUnits(reserve0, 18),
        reserve1: ethers.utils.formatUnits(reserve1, 18),
      },
    };
  } catch (error) {
    console.error("Error getting token price:", error);
    return { priceUSD: 0, pricePLS: 0 };
  }
}

// Get PLS price in USD using eDAI peg
export async function getPLSPriceInUSD(): Promise<number> {
  try {
    const provider = getProvider();

    // eDAI is pegged to ~$1, so we read eDAI/WPLS reserves
    const pairAddress = await findPairAddress(CONTRACTS.eDAI, CONTRACTS.wPLS);

    if (!pairAddress || pairAddress === ethers.constants.AddressZero) {
      return 0.000028; // fallback PLS price estimate
    }

    const pair = new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    const [token0, reserves] = await Promise.all([
      pair.token0(),
      pair.getReserves(),
    ]);

    const reserve0 = reserves[0];
    const reserve1 = reserves[1];

    let edaiReserve: ethers.BigNumber;
    let wplsReserve: ethers.BigNumber;

    if (token0.toLowerCase() === CONTRACTS.eDAI.toLowerCase()) {
      edaiReserve = reserve0;
      wplsReserve = reserve1;
    } else {
      wplsReserve = reserve0;
      edaiReserve = reserve1;
    }

    if (edaiReserve.isZero()) {
      return 0.000028;
    }

    // PLS per eDAI = wplsReserve / edaiReserve
    const plsPerEdai = parseFloat(ethers.utils.formatUnits(wplsReserve, 18)) /
      parseFloat(ethers.utils.formatUnits(edaiReserve, 18));

    // Since eDAI ~ $1, PLS price = 1 / plsPerEdai
    return 1 / plsPerEdai;
  } catch (error) {
    console.error("Error getting PLS price:", error);
    return 0.000028; // fallback
  }
}

// Find Uniswap V2 pair address using CREATE2 (simplified)
export async function findPairAddress(
  tokenA: string,
  tokenB: string
): Promise<string> {
  try {
    const provider = getProvider();

    // PulseChain Uniswap V2 Factory (known address)
    const factoryAddress = "0x9F571dC1301972f95ACa8e05F3a4E5f2360a3f26";

    const factoryABI = [
      "function getPair(address tokenA, address tokenB) view returns (address)",
    ];

    const factory = new Contract(factoryAddress, factoryABI, provider);

    // Sort addresses (Uniswap requires sorted pair)
    const [addr1, addr2] =
      tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

    const pairAddress = await factory.getPair(addr1, addr2);
    return pairAddress;
  } catch (error) {
    console.error("Error finding pair:", error);
    return ethers.constants.AddressZero;
  }
}

// Get mint cost in USD
export async function getMintCost(): Promise<number> {
  // Mint cost is pegged to ~$0.00006972 (tied to eDAI peg)
  return 0.00006972;
}

// Get multiplier for a V3 token
export async function getMultiplier(
  tokenAddress: string,
  amount: number = 1
): Promise<number> {
  try {
    const provider = getProvider();

    // Combine the minter ABIs for the contract interaction
    const combinedABI = [...ABIS.V3Minterabi2, ...ABIS.v3MinterABI];

    const contract = new Contract(tokenAddress, combinedABI, provider);
    const multiplier = await contract.Multiplier(amount);

    return parseFloat(ethers.utils.formatUnits(multiplier, 0));
  } catch (error) {
    console.error("Error getting multiplier:", error);
    return 0;
  }
}

// Get multiplier for V4 token using V4 Minter contract
export async function getV4Multiplier(
  tokenAddress: string,
  amount: number = 1
): Promise<number> {
  try {
    const provider = getProvider();
    const contract = new Contract(tokenAddress, ABIS.V4MinterABI2, provider);
    const multiplier = await contract.Multiplier(amount);
    return parseFloat(ethers.utils.formatUnits(multiplier, 0));
  } catch (error) {
    console.error("Error getting V4 multiplier:", error);
    return 0;
  }
}

// Create a new V3 token via Index Minter
export async function createV3Token(
  name: string,
  symbol: string,
  initialMint: number,
  parentAddress: string
): Promise<{ txHash: string; tokenAddress: string }> {
  const signer = await getSigner();
  const contract = new Contract(
    CONTRACTS.v3IndexMinter,
    ABIS.indexMinterABI,
    signer
  );

  const initialMintWei = ethers.utils.parseUnits(
    initialMint.toString(),
    18
  );

  const tx = await contract.New(name, symbol, initialMintWei, parentAddress);
  const receipt = await tx.wait();

  // The New event should emit the token address
  let tokenAddress = ethers.constants.AddressZero;
  if (receipt.events && receipt.events.length > 0) {
    for (const event of receipt.events) {
      if (event.args && event.args.length > 0) {
        tokenAddress = event.args[event.args.length - 1];
        if (ethers.utils.isAddress(tokenAddress)) break;
      }
    }
  }

  return { txHash: receipt.transactionHash, tokenAddress };
}

// Mint V3 tokens
export async function mintV3(
  tokenAddress: string,
  amount: number
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(tokenAddress, ABIS.v3MinterABI, signer);
  const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
  const tx = await contract.mint(amountWei);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// Create a new V4 token via Personal Minter
export async function createV4Token(
  name: string,
  symbol: string,
  initialMint: number,
  parentAddress: string
): Promise<{ txHash: string; tokenAddress: string }> {
  const signer = await getSigner();
  const contract = new Contract(
    CONTRACTS.v4PersonalMinter,
    ABIS.V4MinterABI,
    signer
  );

  const initialMintWei = ethers.utils.parseUnits(
    initialMint.toString(),
    18
  );

  const tx = await contract.New(name, symbol, initialMintWei, parentAddress);
  const receipt = await tx.wait();

  let tokenAddress = ethers.constants.AddressZero;
  if (receipt.events && receipt.events.length > 0) {
    for (const event of receipt.events) {
      if (event.args && event.args.length > 0) {
        tokenAddress = event.args[event.args.length - 1];
        if (ethers.utils.isAddress(tokenAddress)) break;
      }
    }
  }

  return { txHash: receipt.transactionHash, tokenAddress };
}

// Mint V4 tokens
export async function mintV4(
  tokenAddress: string,
  amount: number
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(tokenAddress, ABIS.V4MinterABI2, signer);
  const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
  const tx = await contract.mint(amountWei);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// Claim V4 rewards
export async function claimV4Rewards(
  minterAddress: string,
  amount: number
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(minterAddress, ABIS.V4MinterABI, signer);
  const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
  const tx = await contract.Claim(amountWei);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// Create GAI token via V4 minter
export async function createGaiToken(
  minterAddress: string,
  name: string,
  symbol: string
): Promise<{ txHash: string; tokenAddress: string }> {
  const signer = await getSigner();
  const contract = new Contract(minterAddress, ABIS.V4MinterABI, signer);
  const tx = await contract.NewGai(name, symbol);
  const receipt = await tx.wait();

  let tokenAddress = ethers.constants.AddressZero;
  if (receipt.events && receipt.events.length > 0) {
    for (const event of receipt.events) {
      if (event.args && event.args.length > 0) {
        tokenAddress = event.args[event.args.length - 1];
        if (ethers.utils.isAddress(tokenAddress)) break;
      }
    }
  }

  return { txHash: receipt.transactionHash, tokenAddress };
}

// MultiHop: Preview a multihop mint
export async function previewMultiHop(
  targetToken: string,
  targetAmount: number,
  sourceToken: string
): Promise<{
  sourceCost: string;
  mintingChain: string[];
  steps: Array<{
    token: string;
    amountToMint: string;
    parentCost: string;
    multiplier: string;
  }>;
}> {
  const provider = getProvider();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    provider
  );

  const targetAmountWei = ethers.utils.parseUnits(
    targetAmount.toString(),
    18
  );

  const result = await contract.previewMultiHopMint(
    targetToken,
    targetAmountWei,
    sourceToken
  );

  return {
    sourceCost: ethers.utils.formatUnits(result.sourceCost, 18),
    mintingChain: result.mintingChain,
    steps: result.steps.map((step: any) => ({
      token: step.token,
      amountToMint: ethers.utils.formatUnits(step.amountToMint, 18),
      parentCost: ethers.utils.formatUnits(step.parentCost, 18),
      multiplier: step.multiplier.toString(),
    })),
  };
}

// MultiHop: Discover minting chain
export async function discoverMintingChain(
  sourceToken: string,
  targetToken: string
): Promise<string[]> {
  const provider = getProvider();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    provider
  );

  const chain = await contract.discoverMintingChain(sourceToken, targetToken);
  return chain;
}

// MultiHop: Discover and preview
export async function discoverAndPreview(
  sourceToken: string,
  targetToken: string,
  targetAmount: number
): Promise<{
  chainPath: string[];
  sourceCost: string;
  steps: Array<{
    token: string;
    amountToMint: string;
    parentCost: string;
    multiplier: string;
  }>;
}> {
  const provider = getProvider();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    provider
  );

  const targetAmountWei = ethers.utils.parseUnits(
    targetAmount.toString(),
    18
  );

  const result = await contract.discoverAndPreview(
    sourceToken,
    targetToken,
    targetAmountWei
  );

  return {
    chainPath: result.chainPath,
    sourceCost: ethers.utils.formatUnits(result.sourceCost, 18),
    steps: result.steps.map((step: any) => ({
      token: step.token,
      amountToMint: ethers.utils.formatUnits(step.amountToMint, 18),
      parentCost: ethers.utils.formatUnits(step.parentCost, 18),
      multiplier: step.multiplier.toString(),
    })),
  };
}

// MultiHop: Calculate total multiplier
export async function calculateTotalMultiplier(
  sourceToken: string,
  targetToken: string,
  targetAmount: number
): Promise<string> {
  const provider = getProvider();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    provider
  );

  const targetAmountWei = ethers.utils.parseUnits(
    targetAmount.toString(),
    18
  );

  const multiplier = await contract.calculateTotalMultiplier(
    sourceToken,
    targetToken,
    targetAmountWei
  );

  return multiplier.toString();
}

// MultiHop: Check if multihop minting is possible
export async function canMintFromTo(
  sourceToken: string,
  targetToken: string
): Promise<{ canMint: boolean; pathLength: number }> {
  const provider = getProvider();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    provider
  );

  const result = await contract.canMintFromTo(sourceToken, targetToken);
  return {
    canMint: result.canMint,
    pathLength: result.pathLength.toNumber(),
  };
}

// MultiHop: Execute auto multihop mint
export async function executeAutoMultiHopMint(
  sourceToken: string,
  targetToken: string,
  targetAmount: number
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    signer
  );

  const targetAmountWei = ethers.utils.parseUnits(
    targetAmount.toString(),
    18
  );

  const tx = await contract.autoMultiHopMint(
    sourceToken,
    targetToken,
    targetAmountWei
  );
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// MultiHop: Execute multihop mint with explicit chain path
export async function executeMultiHopMint(
  targetToken: string,
  targetAmount: number,
  sourceToken: string
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(
    CONTRACTS.multiHop,
    ABIS.MultiHopABI,
    signer
  );

  const targetAmountWei = ethers.utils.parseUnits(
    targetAmount.toString(),
    18
  );

  const tx = await contract.multiHopMint(
    targetToken,
    targetAmountWei,
    sourceToken
  );
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// Get V4 system info
export async function getV4SystemInfo(
  minterAddress: string
): Promise<{
  bbc: string;
  indexMinter: string;
  nine: string;
  nots: string;
  skills: string;
}> {
  try {
    const provider = getProvider();
    const contract = new Contract(
      minterAddress,
      ABIS.V4MinterABI,
      provider
    );

    const [bbc, indexMinter, nine, nots, skills] = await Promise.all([
      contract.BBC(),
      contract.IndexMinter(),
      contract.NINE(),
      contract.NOTS(),
      contract.SKILLS(),
    ]);

    return {
      bbc,
      indexMinter,
      nine,
      nots,
      skills,
    };
  } catch (error) {
    console.error("Error getting V4 system info:", error);
    return {
      bbc: ethers.constants.AddressZero,
      indexMinter: ethers.constants.AddressZero,
      nine: ethers.constants.AddressZero,
      nots: ethers.constants.AddressZero,
      skills: ethers.constants.AddressZero,
    };
  }
}

// Shorten address for display
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format large numbers with notation
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// Format USD value
export function formatUSD(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}

// Explorer URL helpers
export function getExplorerTxUrl(txHash: string): string {
  return `${PULSECHAIN_CONFIG.blockExplorer}tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${PULSECHAIN_CONFIG.blockExplorer}address/${address}`;
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: any[];
      }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export type { Contract };
