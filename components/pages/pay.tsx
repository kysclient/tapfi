"use client"

import { useState, useEffect, ComponentType } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, Loader2, ExternalLink, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, parseUnits } from "viem"
import { PaymentData, WalletAndTapTokenProps, withWalletAndTapToken } from "../hoc/with-wallet-and-taptoken"

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const

interface ServerPaymentPageProps {
  paymentData: PaymentData | null
}

function PaymentPageContent({
  isWalletConnected,
  walletAddress,
  connectWallet,
  chainId,
  paymentData,
  getTokenInfo,
}: WalletAndTapTokenProps) {
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "confirmed" | "failed">("idle")
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const { toast } = useToast()
  const { writeContractAsync } = useWriteContract()
  const { sendTransactionAsync } = useSendTransaction()
  const { data: receipt, isLoading: isReceiptLoading } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (receipt) {
      setPaymentStatus(receipt.status === "success" ? "confirmed" : "failed")
      toast({
        title: receipt.status === "success" ? "Payment successful" : "Payment failed",
        description:
          receipt.status === "success"
            ? "Your payment has been processed successfully"
            : "The transaction was not confirmed",
        variant: receipt.status === "success" ? "default" : "destructive",
      })
    }
  }, [receipt, toast])

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
    )
  }

  const processPayment = async () => {
    if (!isWalletConnected) {
      await connectWallet()
      return
    }

    if (paymentData.chainId !== 73571) {
      toast({
        title: "Wrong network",
        description: "Please switch to Virtual Sepolia Testnet",
        variant: "destructive",
      })
      return
    }

    setPaymentStatus("pending")
    try {
      let hash: `0x${string}`
      if (paymentData.token === "ETH") {
        hash = await sendTransactionAsync({
          to: paymentData.to as `0x${string}`,
          value: parseEther(paymentData.amount),
        })
      } else {
        const tokenInfo = getTokenInfo(paymentData.token)
        if (!tokenInfo) {
          throw new Error(`Token ${paymentData.token} is not supported`)
        }
        hash = await writeContractAsync({
          address: tokenInfo.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [paymentData.to as `0x${string}`, parseUnits(paymentData.amount, tokenInfo.decimals)],
        })
      }
      setTxHash(hash)
    } catch (error: any) {
      setPaymentStatus("failed")
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred while processing the payment",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {paymentStatus === "confirmed" ? (
          <Card className="shadow-lg border-0 bg-card">
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">Your payment has been processed successfully</p>
              {txHash && (
                <div className="bg-muted rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Transaction Hash</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://dashboard.tenderly.co/explorer/vnet/6a6910ba-5831-4758-9d89-1f8e3169433f/tx/${txHash}`, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                  <p className="font-mono text-xs text-foreground break-all">{txHash}</p>
                </div>
              )}
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
                {paymentData.recipientName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{paymentData.recipientName}</span>
                  </div>
                )}
                {paymentData.message && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Message</span>
                    <span className="font-medium">{paymentData.message}</span>
                  </div>
                )}
              </div>
              <Link href="/">
                <Button className="w-full text-white">Return</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-foreground">Payment Request</CardTitle>
              {paymentData.recipientName && (
                <CardDescription className="text-lg text-muted-foreground">
                  from {paymentData.recipientName}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {paymentData.amount} {paymentData.token}
                </div>
              </div>
              {paymentData.message && (
                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-2">Message</h4>
                  <p className="text-muted-foreground text-sm italic">"{paymentData.message}"</p>
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
                    <span className="font-medium">Virtual Sepolia Testnet</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                {!isWalletConnected ? (
                  <Button
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
                  >
                    Connect Wallet
                  </Button>
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
                      disabled={paymentStatus === "pending" || isReceiptLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                    >
                      {paymentStatus === "pending" || isReceiptLoading ? (
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
                <p className="text-xs text-muted-foreground text-center">Powered by Web3 • Secure Payments</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

const WrappedPaymentPageContent: ComponentType<ServerPaymentPageProps> = withWalletAndTapToken(
  PaymentPageContent
) as ComponentType<ServerPaymentPageProps>

export default WrappedPaymentPageContent