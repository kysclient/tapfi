// components/pages/pay.tsx
"use client";

import { useState, useEffect, ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { web3Service } from "@/services/web3Service";
import Link from "next/link";
import { WalletProps, withWallet } from "@/components/hoc/withWallet";
import { TapTokenProps, withTapToken } from "@/components/hoc/withTapToken";

interface PaymentData {
  to: string;
  amount: string;
  token: string;
  message: string;
  recipient: string;
  broadcastLink: string;
}

// PaymentPageContent가 기대하는 전체 props
interface PaymentPageProps extends WalletProps, TapTokenProps {
  paymentData: PaymentData | null;
}

// 서버에서 전달받는 props
interface ServerPaymentPageProps {
  paymentData: PaymentData | null;
}



// interface PaymentPageProps {
//   isWalletConnected: boolean;
//   walletAddress: string;
//   connectWallet: (useWalletConnect?: boolean) => Promise<void>;
//   chainId: number | null;
//   tapBalance: number;
//   isPremiumUser: boolean;
//   premiumTier: "basic" | "premium" | "vip";
//   refreshTapBalance: () => Promise<void>;
//   paymentData: PaymentData | null
// }

function PaymentPageContent({
  isWalletConnected,
  walletAddress,
  connectWallet,
  chainId,
  tapBalance,
  isPremiumUser,
  premiumTier,
  refreshTapBalance,
  paymentData,
}: PaymentPageProps) {
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "confirmed" | "failed">('idle');
  const [txHash, setTxHash] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (txHash && paymentStatus === "pending") {
      const interval = setInterval(async () => {
        const tx = await web3Service.pollTransactionStatus(txHash, walletAddress);
        setPaymentStatus(tx.status);
        if (tx.status !== "pending") {
          clearInterval(interval);
          if (tx.status === "confirmed") {
            toast({
              title: "Payment successful",
              description: "Your payment has been processed successfully",
            });
            refreshTapBalance();
          } else {
            toast({
              title: "Payment failed",
              description: "The transaction was not confirmed",
              variant: "destructive",
            });
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [txHash, paymentStatus, toast, refreshTapBalance, walletAddress]);

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Invalid Payment Link</h3>
            <p className="text-muted-foreground text-sm mb-4">The payment link is missing or corrupted</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const processPayment = async () => {
    if (!isWalletConnected) {
      await connectWallet();
      return;
    }

    try {
      await web3Service.switchToSepolia(); // Sepolia 네트워크로 전환 또는 지갑 선택 UI 표시
    } catch (error: any) {
      toast({
        title: "Network switch failed",
        description: error.message || "Please switch to Sepolia Testnet or select a wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentData) {
      toast({
        title: "Invalid payment data",
        description: "Payment data is missing",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus("pending");

    try {
      const txHash = await web3Service.sendPayment({
        to: paymentData.to,
        amount: paymentData.amount,
        token: paymentData.token,
        message: paymentData.message,
        from: walletAddress,
      });
      setTxHash(txHash);
    } catch (error: any) {
      setPaymentStatus("failed");
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred while processing the payment",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to TapFi
          </Link>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Payment Request
          </Badge>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {paymentStatus === "confirmed" ? (
          <Card className="shadow-lg border-0 bg-card">
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">Your payment has been processed successfully</p>
              <div className="bg-muted rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Transaction Hash</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="font-mono text-xs text-foreground break-all">{txHash}</p>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {paymentData.amount} {paymentData.token}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono text-sm">
                    {paymentData.to.slice(0, 6)}...{paymentData.to.slice(-4)}
                  </span>
                </div>
                {paymentData.recipient && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{paymentData.recipient}</span>
                  </div>
                )}
                {paymentData.broadcastLink && premiumTier === "vip" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Broadcast Link</span>
                    <a
                      href={paymentData.broadcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      {paymentData.broadcastLink}
                    </a>
                  </div>
                )}
              </div>
              <Link href="/">
                <Button className="w-full text-white">Return to TapFi</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-foreground">Payment Request</CardTitle>
              {paymentData.recipient && (
                <CardDescription className="text-lg text-muted-foreground">
                  from {paymentData.recipient}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {paymentData.amount} {paymentData.token}
                </div>
                <div className="text-sm text-muted-foreground">
                  ≈ ${(Number.parseFloat(paymentData.amount) * (paymentData.token === "ETH" ? 2000 : 1)).toLocaleString()} USD
                </div>
              </div>
              {paymentData.message && (
                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-2">Message</h4>
                  <p className="text-muted-foreground text-sm italic">"{paymentData.message}"</p>
                </div>
              )}
              {paymentData.broadcastLink && premiumTier === "vip" && (
                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-2">Broadcast Link</h4>
                  <a
                    href={paymentData.broadcastLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    {paymentData.broadcastLink}
                  </a>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token</span>
                    <span className="font-medium">{paymentData.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Address</span>
                    <span className="font-mono text-xs">
                      {paymentData.to.slice(0, 10)}...{paymentData.to.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">Sepolia Testnet</span>
                  </div>
                  {tapBalance >= 1000 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee Discount</span>
                      <span className="font-medium text-green-600">Free (Premium User)</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                {!isWalletConnected ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => connectWallet(false)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
                    >
                      Connect MetaMask
                    </Button>
                    <Button
                      onClick={() => connectWallet(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-medium py-3"
                    >
                      Connect WalletConnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/20 dark:bg-green-400/10 dark:border-green-400/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={processPayment}
                      disabled={paymentStatus === "pending"}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                    >
                      {paymentStatus === "pending" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        `Pay ${paymentData.amount} ${paymentData.token}`
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">Powered by TapFi • Secure Web3 Payments</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
const WrappedPaymentPageContent: ComponentType<ServerPaymentPageProps> = withWallet(
  withTapToken(PaymentPageContent)
) as ComponentType<ServerPaymentPageProps>;

export default WrappedPaymentPageContent;