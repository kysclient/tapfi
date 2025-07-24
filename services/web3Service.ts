import { ethers } from "ethers";
import { connect, disconnect, getAccount } from "@wagmi/core";
import { getAddress } from "ethers";
import { config } from "@/lib/web3/config";
import { formatUnits } from "viem";

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  icon: string;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  type?: "sent" | "received"; // 추가
  id?: string; // 추가
  message?: string; // 추가 (PaymentHistory에서 사용)
}
export class Web3Service {
  private readonly RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;
  private readonly WS_URL = process.env.NEXT_PUBLIC_WS_URL || `wss://sepolia.infura.io/ws/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;
  private readonly TAP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TAP_TOKEN_ADDRESS || "";
  private readonly USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null = null;

  constructor() {
    if (!process.env.NEXT_PUBLIC_INFURA_API_KEY) {
      throw new Error("Infura API key is missing");
    }
    if (this.USE_MOCK_DATA) {
      this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    } else if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async connectWallet(): Promise<string> {
    try {
      const account = getAccount(config);
      if (account.isConnected && account.address) {
        return getAddress(account.address);
      }

      // Web3Modal을 통해 지갑 연결 시도
      const result = await connect(config, {
        connector: config.connectors[0], // 첫 번째 커넥터 사용 (예: MetaMask)
      });

      if (result.accounts && result.accounts[0]) {
        return getAddress(result.accounts[0]);
      }

      throw new Error("Failed to connect wallet via Web3Modal.");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw new Error("Failed to connect wallet. Please try again.");
    }
  }

  async disconnectWallet() {
    try {
      const account = getAccount(config);
      if (account.isConnected) {
        await disconnect(config);
      }
      this.provider = null;
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }

  async getTapBalance(walletAddress: string): Promise<number> {
    if (this.USE_MOCK_DATA) {
      return Math.floor(Math.random() * 10000) + 100;
    }

    if (!this.provider) throw new Error("Provider not initialized");
    if (!this.TAP_TOKEN_ADDRESS) throw new Error("TAP token address not configured");

    try {
      const contract = new ethers.Contract(
        this.TAP_TOKEN_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        this.provider
      );
      const balance = await contract.balanceOf(walletAddress);
      return Number(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Error fetching TAP balance:", error);
      return 0;
    }
  }

  async getTransactionHistory(walletAddress: string): Promise<TransactionData[]> {
    // if (this.USE_MOCK_DATA) {
    //   return this.getMockTransactions(walletAddress);
    // }

    try {
      const response = await fetch(
        `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
      );
      if (!response.ok) throw new Error("Failed to fetch transaction history");
      const data = await response.json();
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: formatUnits(BigInt(tx.value), 18), // ethers.formatEther → formatUnits
        token: "ETH",
        timestamp: Number.parseInt(tx.timeStamp) * 1000,
        status: tx.txreceipt_status === "1" ? "confirmed" : "failed",
        blockNumber: Number.parseInt(tx.blockNumber),
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        type: tx.to.toLowerCase() === walletAddress.toLowerCase() ? "received" : "sent", // 추가
        id: tx.hash, // 추가
      }));
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return [];
    }
  }

  async pollTransactionStatus(txHash: string, walletAddress: string): Promise<TransactionData> {
    if (this.USE_MOCK_DATA) {
      return {
        hash: txHash,
        from: "0xmock",
        to: "0xmock",
        value: "0.1",
        token: "ETH",
        timestamp: Date.now(),
        status: Math.random() > 0.2 ? "confirmed" : "failed",
        id: ''
      };
    }

    if (!this.provider) throw new Error("Provider not initialized");

    try {
      const provider = new ethers.WebSocketProvider(this.WS_URL);
      const tx = await provider.getTransactionReceipt(txHash);
      const txInfo = await provider.getTransaction(txHash);
      return {
        hash: txHash,
        from: txInfo?.from || "",
        to: txInfo?.to || "",
        value: txInfo ? ethers.formatEther(txInfo.value) : "0",
        token: "ETH",
        timestamp: Date.now(),
        status: tx ? (tx.status === 1 ? "confirmed" : "failed") : "pending",
        blockNumber: tx?.blockNumber,
        gasUsed: tx?.gasUsed.toString(),
        gasPrice: txInfo?.gasPrice?.toString(),
        type: txInfo?.to?.toLowerCase() === walletAddress.toLowerCase() ? "received" : "sent",
        id: txHash
      };
    } catch (error) {
      console.error("Error polling transaction status:", error);
      return {
        hash: txHash, status: "pending", from: "", to: "", value: "0", token: "ETH", timestamp: Date.now(), id: ''
      };
    }
  }

  async sendPayment(params: {
    to: string;
    amount: string;
    token: string;
    message?: string;
    from: string;
  }): Promise<string> {
    console.log('params : ', params)
    if (this.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return "0x" + Math.random().toString(16).substr(2, 64);
    }
    console.log('test ? ')

    if (!this.provider) throw new Error("Provider not initialized");

    try {
      const signer = await (this.provider as ethers.BrowserProvider).getSigner();
      const tapBalance = await this.getTapBalance(params.from);
      const feeRate = tapBalance >= 1000 ? 0 : 0.01; // $TAP 1000 이상 보유 시 수수료 면제
      const amount = Number.parseFloat(params.amount);
      const fee = amount * feeRate;

      let txParams: any;
      if (params.token === "ETH") {
        txParams = {
          to: params.to,
          value: ethers.parseEther((amount - fee).toString()),
          gasLimit: 21000,
        };
      } else {
        const tokenInfo = await this.getTokenInfo(params.token);
        if (!tokenInfo) throw new Error("Invalid token");
        const contract = new ethers.Contract(
          tokenInfo.address,
          ["function transfer(address to, uint256 amount) returns (bool)"],
          signer
        );
        const amountInUnits = ethers.parseUnits(params.amount, tokenInfo.decimals);
        txParams = await contract.transfer.populateTransaction(params.to, amountInUnits);
        txParams.gasLimit = 50000;
      }

      const tx = await signer.sendTransaction(txParams);
      if (fee > 0) {
        await this.handleFee(fee, params.token, params.from);
      }
      return tx.hash;
    } catch (error: any) {
      console.error("Error sending payment:", error);
      throw new Error(error.message || "Payment failed");
    }
  }

  private async handleFee(fee: number, token: string, from: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/burn-tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee, token, from }),
      });
      if (!response.ok) throw new Error("Failed to process fee");
    } catch (error) {
      console.error("Error handling fee:", error);
    }
  }

  async burnTap(amount: string): Promise<string> {
    if (this.USE_MOCK_DATA) {
      return "0x" + Math.random().toString(16).substr(2, 64);
    }

    if (!this.provider) throw new Error("Provider not initialized");
    if (!this.TAP_TOKEN_ADDRESS) throw new Error("TAP token address not configured");

    try {
      const signer = await (this.provider as ethers.BrowserProvider).getSigner();
      const contract = new ethers.Contract(
        this.TAP_TOKEN_ADDRESS,
        ["function burn(uint256 amount) returns (bool)"],
        signer
      );
      const tx = await contract.burn(ethers.parseUnits(amount, 18));
      return tx.hash;
    } catch (error: any) {
      console.error("Error burning TAP:", error);
      throw new Error(error.message || "Burn failed");
    }
  }

  async getTokenInfo(tokenSymbol: string): Promise<TokenInfo | null> {
    const tokenMap: Record<string, TokenInfo> = {
      ETH: {
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        address: "0x0000000000000000000000000000000000000000",
        icon: "⟠",
      },
      USDC: {
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        address: "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505",
        icon: "💵",
      },
      USDT: {
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        icon: "💰",
      },
      TAP: {
        symbol: "TAP",
        name: "TAP Token",
        decimals: 18,
        address: this.TAP_TOKEN_ADDRESS,
        icon: "⚡",
      },
    };
    return tokenMap[tokenSymbol] || null;
  }

  async switchToSepolia(): Promise<void> {
    if (this.USE_MOCK_DATA) {
      return; // Mock 데이터 사용 시 네트워크 전환 무시
    }

    if (!this.provider) {
      // 지갑이 연결되지 않은 경우, 지갑 연결 시도
      await this.connectWallet();
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    try {
      const provider = this.provider as ethers.BrowserProvider;
      await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }]);
    } catch (error: any) {
      if (error.code === 4902) {
        // 네트워크가 추가되지 않은 경우, Sepolia 네트워크 추가
        try {
          const provider = this.provider as ethers.BrowserProvider;
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              rpcUrls: [this.RPC_URL],
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ]);
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          // 네트워크 추가 실패 시 WalletConnect로 지갑 선택 UI 표시
          await this.connectWallet();
          throw new Error("Failed to add Sepolia Testnet. Please select a wallet.");
        }
      } else {
        console.error("Failed to switch to Sepolia network:", error);
        // 네트워크 전환 실패 시 WalletConnect로 지갑 선택 UI 표시
        await this.connectWallet();
        throw new Error("Failed to switch to Sepolia Testnet. Please select a wallet.");
      }
    }
  }

  private getMockTransactions(walletAddress: string): TransactionData[] {
    return [
      {
        hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        from: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
        to: walletAddress,
        value: "0.5",
        token: "ETH",
        timestamp: Date.now() - 3600000,
        status: "confirmed",
        blockNumber: 18500000,
      },
      {
        hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        from: "0x8ba1f109551bD432803012645ac136c22C57592",
        to: walletAddress,
        value: "100",
        token: "USDC",
        timestamp: Date.now() - 7200000,
        status: "confirmed",
        blockNumber: 18499500,
      },
      {
        hash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
        from: "0x9876543210fedcba9876543210fedcba98765432",
        to: walletAddress,
        value: "50",
        token: "TAP",
        timestamp: Date.now() - 86400000,
        status: "pending",
      },
    ];
  }
}

export const web3Service = new Web3Service();