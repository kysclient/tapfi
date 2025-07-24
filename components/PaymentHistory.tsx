"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, ArrowDownLeft, Search, ExternalLink, Calendar } from "lucide-react"
import { web3Service, type TransactionData } from "@/services/web3Service"

interface PaymentHistoryProps {
  isWalletConnected: boolean
  walletAddress: string
}

export function PaymentHistory({ isWalletConnected, walletAddress }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "received" | "sent">("all")
  const [filterToken, setFilterToken] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isWalletConnected && walletAddress) {
      fetchTransactionHistory()
    }
  }, [isWalletConnected, walletAddress])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, filterType, filterToken])

  const fetchTransactionHistory = async () => {
    setIsLoading(true)
    try {
      const txHistory = await web3Service.getTransactionHistory(walletAddress)
      const processedTx = txHistory.map((tx) => ({
        ...tx,
        type: tx.to.toLowerCase() === walletAddress.toLowerCase() ? ("received" as const) : ("sent" as const),
        id: tx.hash,
        message: tx.hash.includes("1234") ? "Payment for services" : undefined,
      }))
      setTransactions(processedTx)
    } catch (error) {
      console.error("Error fetching transaction history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType)
    }

    if (filterToken !== "all") {
      filtered = filtered.filter((tx) => tx.token === filterToken)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.message?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredTransactions(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp))
  }

  const openTxInExplorer = (txHash: string) => {
    window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
  }

  if (!isWalletConnected) {
    return (
      <Card className="shadow-sm border-0 bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground text-sm">Connect your wallet to view your payment history</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 필터 및 검색 */}
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">Payment History</CardTitle>
          <CardDescription className="text-muted-foreground">Track all your Web3 payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by transaction hash, address, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterToken} onValueChange={setFilterToken}>
                <SelectTrigger className="w-32 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="TAP">TAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 트랜잭션 목록 */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <Card key={tx.id} className="shadow-sm border-0 bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "received" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {tx.type === "received" ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {tx.type === "received" ? "+" : "-"}
                          {tx.value} {tx.token}
                        </span>
                        <Badge variant="outline" className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{tx.type === "received" ? "From" : "To"}:</span>
                        <span className="font-mono ml-1">
                          {(tx.type === "received" ? tx.from : tx.to).slice(0, 6)}...
                          {(tx.type === "received" ? tx.from : tx.to).slice(-4)}
                        </span>
                      </div>

                      {tx.message && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="italic">"{tx.message}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-2">{formatDate(tx.timestamp)}</div>
                    <Button variant="outline" size="sm" onClick={() => openTxInExplorer(tx.hash)} className="text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || filterType !== "all" || filterToken !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by generating a QR code to receive payments"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
