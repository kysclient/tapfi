"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useDisconnect,
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useWalletInfo,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { sepolia } from "wagmi/chains";
import { createPublicClient, http, parseEther } from "viem";
import { useClientMounted } from "@/hooks/use-client-mout";
import { networks } from "@/lib/web3/config";

// TapFi 결제 데이터 인터페이스
export interface PaymentData {
  amount: string;
  token: string;
  recipientName?: string;
  message?: string;
  to: string; // 수신자 주소
  broadcastLink?: string; // VIP 전용 브로드캐스트 링크
}

export interface WalletAndTapTokenProps {
  isWalletConnected: boolean;
  walletAddress: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
  tapBalance: number;
  isPremiumUser: boolean;
  premiumTier: "basic" | "premium" | "vip";
  refreshTapBalance: () => Promise<void>;
  paymentData: PaymentData | null;
}

// $TAP 토큰 스마트 계약 ABI (간소화된 ERC-20 ABI)
const TAP_TOKEN_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

// $TAP 토큰 스마트 계약 주소 (Sepolia 테스트넷, 예시 주소)
const TAP_TOKEN_ADDRESS = "0xYourTapTokenContractAddressHere"; // 실제 $TAP 토큰 주소로 교체

// Viem 클라이언트 설정
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org"),
});

export function withWalletAndTapToken<P extends object>(
  WrappedComponent: ComponentType<P & WalletAndTapTokenProps>
) {
  return function WalletAndTapTokenWrapper(props: P) {
    const { toast } = useToast();
    const { disconnect } = useDisconnect();
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { selectedNetworkId } = useAppKitState();
    const { walletInfo } = useWalletInfo();
    const mounted = useClientMounted();
    const [tapBalance, setTapBalance] = useState(0);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [premiumTier, setPremiumTier] = useState<"basic" | "premium" | "vip">("basic");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const { switchNetwork } = useAppKitNetwork();

    // $TAP 토큰 잔액 조회
    const fetchTapBalance = async () => {
      if (!isConnected || !address) return;

      setIsLoading(true);
      try {
        const balance = await publicClient.readContract({
          address: TAP_TOKEN_ADDRESS,
          abi: TAP_TOKEN_ABI,
          functionName: "balanceOf",
          args: [address],
        }) as bigint;
        const balanceNumber = Number(parseEther(balance.toString())) / 1e18;
        setTapBalance(balanceNumber);

        // 프리미엄 티어 결정
        if (balanceNumber >= 10000) {
          setPremiumTier("vip");
          setIsPremiumUser(true);
        } else if (balanceNumber >= 1000) {
          setPremiumTier("premium");
          setIsPremiumUser(true);
        } else {
          setPremiumTier("basic");
          setIsPremiumUser(false);
        }
      } catch (error) {
        console.error("Error fetching TAP balance:", error);
        setTapBalance(0);
        setIsPremiumUser(false);
        setPremiumTier("basic");
        toast({
          title: "Balance fetch failed",
          description: "Failed to fetch TAP token balance",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // 지갑 연결 상태 및 잔액 업데이트
    useEffect(() => {
      if (isConnected && address) {
        fetchTapBalance();
      } else {
        setTapBalance(0);
        setIsPremiumUser(false);
        setPremiumTier("basic");
      }
    }, [isConnected, address]);

    // 클라이언트 마운트 여부 확인
    if (!mounted) {
      return null;
    }

    // 지갑 연결 상태 및 체인 ID 관리
    const chainId = selectedNetworkId ? Number(selectedNetworkId) : null;

    // 지갑 연결
    const connectWallet = async () => {
      try {
        await open(); // Reown AppKit 모달 열기
        if (isConnected && address) {
          // Sepolia 네트워크로 전환
          if (chainId !== 11155111) {
            try {
              await switchNetwork(networks[2]);
            } catch (switchError: any) {
              // Sepolia 네트워크 추가 시도
              if (switchError.code === 4902) {
                try {
                  await switchNetwork(networks[2]);
                } catch (addError: any) {
                  toast({
                    title: "Network addition failed",
                    description: addError.message || "Failed to add Sepolia network",
                    variant: "destructive",
                  });
                  return;
                }
              } else {
                toast({
                  title: "Network switch failed",
                  description: switchError.message || "Failed to switch to Sepolia network",
                  variant: "destructive",
                });
                return;
              }
            }
          }
          toast({
            title: "Wallet connected",
            description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} via ${walletInfo?.name || "Wallet"}`,
          });
        }
      } catch (error: any) {
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    };

    // 지갑 연결 해제
    const disconnectWallet = () => {
      disconnect();
      setTapBalance(0);
      setIsPremiumUser(false);
      setPremiumTier("basic");
      setPaymentData(null);
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    };

    // $TAP 토큰 잔액 갱신
    const refreshTapBalance = async () => {
      await fetchTapBalance();
    };

    // QR 결제 데이터 설정 (외부 컴포넌트에서 호출)
    const updatePaymentData = (data: PaymentData) => {
      setPaymentData(data);
    };

    return (
      <WrappedComponent
        {...props}
        isWalletConnected={isConnected}
        walletAddress={address || ""}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        chainId={chainId}
        tapBalance={tapBalance}
        isPremiumUser={isPremiumUser}
        premiumTier={premiumTier}
        refreshTapBalance={refreshTapBalance}
        paymentData={paymentData || (props as any).paymentData} // 서버 props에서 paymentData 병합
      />
    );
  };
}