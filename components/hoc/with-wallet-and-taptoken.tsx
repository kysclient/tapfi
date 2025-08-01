"use client"

import { useState, useEffect, ComponentType } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useDisconnect,
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useWalletInfo,
  useAppKitNetwork,
} from "@reown/appkit/react"
import { useSwitchChain } from "wagmi"
import { createPublicClient, formatEther, http } from "viem"
import { useClientMounted } from "@/hooks/use-client-mout"
import { networks } from "@/lib/web3/config"

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  address: string
  icon: string
}

export interface TransactionData {
  hash: string
  from: string
  to: string
  value: string
  token: string
  timestamp: number
  status: "pending" | "confirmed" | "failed"
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  type?: "sent" | "received"
  id?: string
  message?: string
}

export interface PaymentData {
  amount: string
  token: string
  recipientName?: string
  message: string | undefined
  to: string
  chainId?: number
  tokenInfo?: TokenInfo
}

export interface WalletAndTapTokenProps {
  isWalletConnected: boolean
  walletAddress: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  chainId: number | null
  paymentData: PaymentData | null
  getTransactionHistory: (walletAddress: string) => Promise<TransactionData[]>
  getTokenInfo: (tokenSymbol: string) => TokenInfo | null
}

const publicClient = createPublicClient({
  chain: {
    id: 73571,
    name: "Virtual Sepolia",
    nativeCurrency: { name: "vSepolia", symbol: "vETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://virtual.mainnet.eu.rpc.tenderly.co/cf10b11d-e205-46fc-9bf5-e502c9fee978"] } },
    blockExplorers: { default: { name: "Tenderly", url: "https://dashboard.tenderly.co/explorer/vnet/6a6910ba-5831-4758-9d89-1f8e3169433f" } },
  },
  transport: http("https://virtual.mainnet.eu.rpc.tenderly.co/cf10b11d-e205-46fc-9bf5-e502c9fee978"),
})

export function withWalletAndTapToken<P extends object>(
  WrappedComponent: ComponentType<P & WalletAndTapTokenProps>
) {
  return function WalletAndTapTokenWrapper(props: P) {
    const { toast } = useToast()
    const { disconnect } = useDisconnect()
    const { open } = useAppKit()
    const { address, isConnected } = useAppKitAccount()
    const { selectedNetworkId } = useAppKitState()
    const { walletInfo } = useWalletInfo()
    const mounted = useClientMounted()
    const { switchNetwork } = useAppKitNetwork()

    const chainId = selectedNetworkId ? Number(selectedNetworkId) : null

    const connectWallet = async () => {
      try {
        await open()
        if (isConnected && address) {
          if (chainId !== 73571) {
            try {
              await switchNetwork(networks[2])
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                if (!window.ethereum) {
                  toast({
                    title: "Wallet not detected",
                    description: "Please install MetaMask or another compatible wallet",
                    variant: "destructive",
                  });
                  return;
                }

                if (!window.ethereum) {
                  toast({
                    title: "Wallet not detected",
                    description: "Please install MetaMask or another compatible wallet",
                    variant: "destructive",
                  });
                  return;
                }

                const ethereum = window.ethereum as any
                await ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: "0x11f87", // 73571 in hex
                      chainName: "Virtual Sepolia",
                      nativeCurrency: { name: "vSepolia", symbol: "vETH", decimals: 18 },
                      rpcUrls: ["https://virtual.mainnet.eu.rpc.tenderly.co/cf10b11d-e205-46fc-9bf5-e502c9fee978"],
                      blockExplorerUrls: ["https://dashboard.tenderly.co/explorer/vnet/6a6910ba-5831-4758-9d89-1f8e3169433f"],
                    },
                  ],
                })
                await switchNetwork(networks[2])
              } else {
                toast({
                  title: "Network switch failed",
                  description: switchError.message || "Failed to switch to Virtual Sepolia network",
                  variant: "destructive",
                })
                return
              }
            }
          }
          toast({
            title: "Wallet connected",
            description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} via ${walletInfo?.name || "Wallet"}`,
          })
        }
      } catch (error: any) {
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        })
      }
    }

    const disconnectWallet = () => {
      disconnect()
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      })
    }

    const getTransactionHistory = async (walletAddress: string): Promise<TransactionData[]> => {
      try {
        const response = await fetch(
          `https://api.tenderly.co/v1/account/me/project/virtual-testnets/vnet/6a6910ba-5831-4758-9d89-1f8e3169433f/transactions?address=${walletAddress}`,
          {
            headers: {
              "X-Access-Key": process.env.TENDERLY_ACCESS_KEY || "",
            },
          }
        )
        if (!response.ok) throw new Error("Failed to fetch transaction history")
        const data = await response.json()
        return data.transactions.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: formatEther(BigInt(tx.value || "0")),
          token: "ETH", // Note: ERC-20 transactions require contract event parsing
          timestamp: new Date(tx.timestamp).getTime(),
          status: tx.status ? "confirmed" : "failed",
          blockNumber: Number(tx.block_number),
          gasUsed: tx.gas_used?.toString(),
          gasPrice: tx.gas_price?.toString(),
          type: tx.to.toLowerCase() === walletAddress.toLowerCase() ? "received" : "sent",
          id: tx.hash,
        }))
      } catch (error) {
        console.error("Error fetching transaction history:", error)
        return []
      }
    }

    const getTokenInfo = (tokenSymbol: string): TokenInfo | null => {
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
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet USDC (Virtual TestNet is Mainnet fork)
          icon: "💵",
        },
        USDT: {
          symbol: "USDT",
          name: "Tether USD",
          decimals: 6,
          address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet USDT
          icon: "💰",
        },
      }
      return tokenMap[tokenSymbol] || null
    }

    if (!mounted) return null

    return (
      <WrappedComponent
        {...props}
        isWalletConnected={isConnected}
        walletAddress={address || ""}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        chainId={chainId}
        paymentData={(props as any).paymentData}
        getTransactionHistory={getTransactionHistory}
        getTokenInfo={getTokenInfo}
      />
    )
  }
}