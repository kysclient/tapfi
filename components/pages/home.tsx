"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Wallet, Zap, Crown, History } from "lucide-react"
import { PaymentHistory } from "@/components/PaymentHistory"
import { PremiumFeatures } from "@/components/PremiumFeatures"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import { TransactionData, withWalletAndTapToken } from "../hoc/with-wallet-and-taptoken"
import QRGenerator from "../QRGenerator"
import { ConnectButton } from "../ConnectButton"

interface HomePageProps {
    isWalletConnected: boolean
    walletAddress: string
    connectWallet: () => Promise<void>
    disconnectWallet: () => void
    tapBalance: number
    isPremiumUser: boolean
    getTransactionHistory: (walletAddress: string) => Promise<TransactionData[]>
}

function HomePage({
    isWalletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    tapBalance,
    isPremiumUser,
    getTransactionHistory
}: HomePageProps) {
    const [activeTab, setActiveTab] = useState<"generate" | "history" | "premium">("generate")
    const [paymentData, setPaymentData] = useState({
        amount: "",
        token: "ETH",
        message: "",
        recipientName: "",
    })

    const handleGenerateQR = () => {
        if (!isWalletConnected) {
            connectWallet()
            return
        }
        // QR 생성 로직은 QRGenerator 컴포넌트에서 처리
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
            {/* Header */}
            <header className="bg-card shadow-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center"> */}
                        <Link href="/">
                            <img src={"/tap_symbol.png"} className="w-10 h-10" alt="Logo" />
                            {/* <QrCode className="w-6 h-6 text-white" /> */}
                        </Link>
                        {/* </div> */}
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-foreground">TapFi</h1>
                            <p className="text-sm text-muted-foreground">Web3 QR Payment</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block">
                            <ThemeToggle />

                        </div>

                        {isPremiumUser && (
                            <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300 dark:border-yellow-700"
                            >
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                            </Badge>
                        )}

                        {isWalletConnected ? (
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-foreground">
                                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">TAP: {tapBalance.toLocaleString()}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={disconnectWallet}>
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <>
                            <Button
                                onClick={connectWallet}
                                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                            >
                                <Wallet className="w-4 h-4 mr-2" />
                                Connect Wallet
                            </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-card border-b border-border sticky top-0">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex space-x-8 items-start justify-between sm:justify-start">
                        <button
                            onClick={() => setActiveTab("generate")}
                            className={`flex flex-col gap-2 items-center py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${activeTab === "generate"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <QrCode className="w-4 h-4 inline mr-2" />
                            Generate QR
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex flex-col gap-2 items-center py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${activeTab === "history"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <History className="w-4 h-4 inline mr-2" />
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab("premium")}
                            className={`flex flex-col gap-2 items-center py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${activeTab === "premium"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Zap className="w-4 h-4 inline mr-2" />
                            Premium
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {activeTab === "generate" && (
                    <QRGenerator
                        paymentData={paymentData}
                        setPaymentData={setPaymentData}
                        onGenerate={handleGenerateQR}
                        isWalletConnected={isWalletConnected}
                        walletAddress={walletAddress}
                    />
                )}

                {activeTab === "history" && (
                    <PaymentHistory isWalletConnected={isWalletConnected} walletAddress={walletAddress} getTransactionHistory={getTransactionHistory} />
                )}

                {activeTab === "premium" && <PremiumFeatures tapBalance={tapBalance} isPremiumUser={isPremiumUser} />}
            </main>
            <p className="text-xs text-muted-foreground text-center py-4">Powered by TapFi • Secure Web3 Payments</p>


        </div>
    )
}

export default withWalletAndTapToken(HomePage)
