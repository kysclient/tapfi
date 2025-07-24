"use client"

import { useState, useEffect, type ComponentType } from "react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { web3Service } from "@/services/web3Service";

export interface WalletProps {
  isWalletConnected: boolean;
  walletAddress: string;
  connectWallet: (useWalletConnect?: boolean) => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
}

export function withWallet<P extends object>(WrappedComponent: ComponentType<P & WalletProps>) {
  return function WalletWrapper(props: P) {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [chainId, setChainId] = useState<number | null>(null);
    const { toast } = useToast();

    const getProvider = () => {
      if (typeof window !== "undefined" && window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      return null;
    };

    useEffect(() => {
      checkWalletConnection();

      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      }

      return () => {
        if (typeof window !== "undefined" && window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }, []);

    const checkWalletConnection = async () => {
      const provider = getProvider();
      if (provider) {
        try {
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
            const chainId = await provider.send("eth_chainId", []);
            setChainId(Number.parseInt(chainId, 16));
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }

      // WalletConnect 세션 확인
      try {
        const address = await web3Service.connectWallet();
        if (address) {
          setWalletAddress(address);
          setIsWalletConnected(true);
          setChainId(11155111);
        }
      } catch (error) {
        console.error("No WalletConnect session found:", error);
      }
    };

    const switchToSepolia = async () => {
      const provider = getProvider();
      if (!provider) return;

      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }]);
      } catch (error: any) {
        if (error.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0xaa36a7",
            chainName: "Sepolia Testnet",
            rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }]);
        } else {
          throw error;
        }
      }
    };

    const connectWallet = async (useWalletConnect: boolean = false) => {
      if (useWalletConnect) {
        try {
          const address = await web3Service.connectWallet();
          setWalletAddress(address);
          setIsWalletConnected(true);
          setChainId(11155111);
          toast({
            title: "Wallet connected",
            description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} via WalletConnect`,
          });
        } catch (error: any) {
          toast({
            title: "Connection failed",
            description: error.message || "Failed to connect via WalletConnect",
            variant: "destructive",
          });
        }
        return;
      }

      const provider = getProvider();
      if (!provider) {
        toast({
          title: "Wallet not found",
          description: (
            <span>
              Please install MetaMask or another Web3 wallet.{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue", textDecoration: "underline" }}
              >
                Download MetaMask
              </a>
            </span>
          ),
          variant: "destructive",
        });
        return;
      }

      try {
        await switchToSepolia();
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setIsWalletConnected(true);
        const chainId = await provider.send("eth_chainId", []);
        setChainId(Number.parseInt(chainId, 16));
        toast({
          title: "Wallet connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      } catch (error: any) {
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    };

    const disconnectWallet = () => {
      web3Service.disconnectWallet();
      setIsWalletConnected(false);
      setWalletAddress("");
      setChainId(null);
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(Number.parseInt(chainId, 16));
      checkWalletConnection();
    };

    return (
      <WrappedComponent
        {...props}
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        chainId={chainId}
      />
    );
  };
}

declare global {
  interface Window {
    ethereum?: any;
  }
}