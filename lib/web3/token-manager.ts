import { networks } from "./config";

interface TokenInfo {
    value: string;
    label: string;
    icon: string;
    address?: string;
    decimals: number;
    balance?: string;
    category?: string;
    rank?: number;
}

export class TokenManager {
    private balanceCache = new Map<string, { data: TokenInfo; timestamp: number }>();
    private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache

    async getTokens(chainId: number): Promise<TokenInfo[]> {
        try {
            const network = networks.find((n) => n.id === chainId);
            if (!network) throw new Error(`Network not found for chainId: ${chainId}`);

            // Map chainId to Trust Wallet's blockchain folder
            const chainFolder: Record<number, string> = {
                1: "ethereum",
                137: "polygon",
                42161: "arbitrum",
                10: "optimism",
                8453: "base",
                43114: "avalanchec",
                56: "smartchain",
                250: "fantom",
                100: "xdai",
                42220: "celo",
                73571: "tenderly",
            };

            const chainName = chainFolder[chainId] || "ethereum";

            // Define popular token addresses per network
            const popularTokenAddresses: Record<number, { address: string; symbol: string }[]> = {
                1: [
                    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC" },
                    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT" },
                ],
                137: [
                    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC" },
                    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT" },
                ],
                42161: [
                    { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", symbol: "USDC" },
                    { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT" },
                ],
                10: [{ address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", symbol: "USDC" }],
                8453: [{ address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC" }],
                43114: [],
                56: [],
                250: [],
                100: [],
                42220: [],
                73571: [],
            };

            // Fetch native token
            const tokens: TokenInfo[] = [
                {
                    value: network.nativeCurrency.symbol,
                    label: `${network.nativeCurrency.name} (${network.nativeCurrency.symbol})`,
                    icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/info/logo.png`,
                    decimals: network.nativeCurrency.decimals || 18,
                    category: "native",
                    rank: 1,
                },
            ];

            // Fetch additional tokens from Alchemy
            const alchemyUrl = `https://${chainId === 1
                ? "eth-mainnet"
                : chainId === 137
                    ? "polygon-mainnet"
                    : chainId === 42161
                        ? "arb-mainnet"
                        : chainId === 10
                            ? "opt-mainnet"
                            : chainId === 8453
                                ? "base-mainnet"
                                : "eth-mainnet"
                }.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

            const tokenAddresses = popularTokenAddresses[chainId] || [];
            const tokenPromises = tokenAddresses.map(async ({ address, symbol }) => {
                const response = await fetch(alchemyUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "alchemy_getTokenMetadata",
                        params: [address],
                        id: 1,
                    }),
                });
                const data = await response.json();
                if (data.result) {
                    const { name, symbol: fetchedSymbol, decimals } = data.result;
                    return {
                        value: fetchedSymbol,
                        label: `${name} (${fetchedSymbol})`,
                        icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${address}/logo.png`,
                        address, // address is guaranteed to be string from popularTokenAddresses
                        decimals,
                        category: "stablecoin",
                        rank: 2,
                    } as TokenInfo; // Explicitly cast to TokenInfo to satisfy TypeScript
                }
                return null;
            });

            const fetchedTokens = (await Promise.all(tokenPromises)).filter((token): token is TokenInfo => token !== null);
            console.log('loaded tokens : ', [...tokens, ...fetchedTokens]);
            return [...tokens, ...fetchedTokens];
        } catch (error) {
            console.error("Failed to fetch tokens:", error);
            throw error;
        }
    }

    searchTokens(chainId: number, query: string, tokens: TokenInfo[]): TokenInfo[] {
        if (!query.trim()) return tokens;

        const lowerQuery = query.toLowerCase();
        return tokens.filter(
            (token) =>
                token.value.toLowerCase().includes(lowerQuery) ||
                token.label.toLowerCase().includes(lowerQuery) ||
                (token.address && token.address.toLowerCase().includes(lowerQuery))
        );
    }

    async refreshTokenBalance(chainId: number, tokenSymbol: string, userAddress: string): Promise<TokenInfo | null> {
        const cacheKey = `${chainId}-${tokenSymbol}-${userAddress}`;
        const cached = this.balanceCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }

        try {
            const network = networks.find((n) => n.id === chainId);
            if (!network) throw new Error(`Network not found for chainId: ${chainId}`);
            const chainFolder: Record<number, string> = {
                1: "ethereum",
                137: "polygon",
                42161: "arbitrum",
                10: "optimism",
                8453: "base",
                43114: "avalanchec",
                56: "smartchain",
                250: "fantom",
                100: "xdai",
                42220: "celo",
                73571: "tenderly",
            };
            const chainName = chainFolder[chainId] || "ethereum";

            const alchemyUrl = `https://${chainId === 1
                ? "eth-mainnet"
                : chainId === 137
                    ? "polygon-mainnet"
                    : chainId === 42161
                        ? "arb-mainnet"
                        : chainId === 10
                            ? "opt-mainnet"
                            : chainId === 8453
                                ? "base-mainnet"
                                : "eth-mainnet"
                }.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

            let updatedToken: TokenInfo | null = null;

            if (network.nativeCurrency.symbol === tokenSymbol) {
                const response = await fetch(alchemyUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "eth_getBalance",
                        params: [userAddress, "latest"],
                        id: 1,
                    }),
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error.message);

                const balanceWei = BigInt(data.result);
                const balance = (Number(balanceWei) / 10 ** network.nativeCurrency.decimals).toFixed(6);

                updatedToken = {
                    value: network.nativeCurrency.symbol,
                    label: `${network.nativeCurrency.name} (${network.nativeCurrency.symbol})`,
                    icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/info/logo.png`,
                    decimals: network.nativeCurrency.decimals || 18,
                    balance,
                };
            } else {
                const tokens = await this.getTokens(chainId);
                const token = tokens.find((t) => t.value === tokenSymbol);
                if (!token || !token.address) throw new Error(`Token ${tokenSymbol} not found`);

                const [balanceResponse, metadataResponse] = await Promise.all([
                    fetch(alchemyUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            method: "alchemy_getTokenBalances",
                            params: [userAddress, [token.address]],
                            id: 1,
                        }),
                    }),
                    fetch(alchemyUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            method: "alchemy_getTokenMetadata",
                            params: [token.address],
                            id: 2,
                        }),
                    }),
                ]);

                const balanceData = await balanceResponse.json();
                const metadataData = await metadataResponse.json();
                if (balanceData.error || metadataData.error) {
                    throw new Error(balanceData.error?.message || metadataData.error?.message);
                }

                const tokenBalance = balanceData.result?.tokenBalances[0]?.tokenBalance || "0x0";
                const balanceWei = BigInt(tokenBalance);
                const balance = (Number(balanceWei) / 10 ** token.decimals).toFixed(6);
                const { name, symbol, decimals } = metadataData.result;

                updatedToken = {
                    value: symbol,
                    label: `${name} (${symbol})`,
                    icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${token.address}/logo.png`,
                     decimals,
                    address: token.address,
                    balance,
                };
            }

            this.balanceCache.set(cacheKey, { data: updatedToken, timestamp: Date.now() });
            localStorage.setItem(cacheKey, JSON.stringify(updatedToken));
            return updatedToken;
        } catch (error) {
            console.error("Failed to refresh token balance:", error);
            return cached?.data || null;
        }
    }

    clearCache() {
        this.balanceCache.clear();
    }
}