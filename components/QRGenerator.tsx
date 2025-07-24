"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { QrCode, Copy, Download, Share2, Palette, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeCanvas } from "qrcode.react" // QR 코드 생성 라이브러리

interface PaymentData {
  amount: string
  token: string
  message: string
  recipientName: string
}

interface QRGeneratorProps {
  paymentData: PaymentData
  setPaymentData: (data: PaymentData) => void
  onGenerate: () => void
  isWalletConnected: boolean
  isPremiumUser: boolean
  walletAddress: string
}

export function QRGenerator({
  paymentData,
  setPaymentData,
  onGenerate,
  isWalletConnected,
  isPremiumUser,
  walletAddress,
}: QRGeneratorProps) {
  const [qrGenerated, setQrGenerated] = useState(false)
  const [qrTheme, setQrTheme] = useState("default")
  const { toast } = useToast()
  const qrRef = useRef<HTMLCanvasElement>(null); // QRCodeCanvas의 캔버스 참조

  const tokens = [
    { value: "ETH", label: "Ethereum (ETH)", icon: "⟠" },
    { value: "USDC", label: "USD Coin (USDC)", icon: "💵" },
    { value: "USDT", label: "Tether (USDT)", icon: "💰" },
    { value: "TAP", label: "TAP Token", icon: "⚡" },
  ]

  const qrThemes = [
    { value: "default", label: "Default", premium: false },
    { value: "gradient", label: "Gradient", premium: true },
    { value: "neon", label: "Neon", premium: true },
    { value: "minimal", label: "Minimal", premium: true },
  ]

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setPaymentData({ ...paymentData, [field]: value })
  }

  const generateQR = () => {
    if (!paymentData.amount || !paymentData.token) {
      toast({
        title: "Missing information",
        description: "Please fill in amount and token type",
        variant: "destructive",
      })
      return
    }

    // QR 생성 로직
    setQrGenerated(true)
    toast({
      title: "QR Code generated",
      description: "Your payment QR code is ready to use",
    })
  }

  // QR 코드 테마 스타일
  const qrStyle = {
    default: { background: "#ffffff", foreground: "#000000" },
    gradient: { background: "#ffffff", foreground: "url(#gradient)" },
    neon: { background: "#000000", foreground: "#00ff00" },
    minimal: { background: "#ffffff", foreground: "#333333" },
  }

  const generateQrValue = () => {
    const qrData = {
      to: walletAddress,
      amount: paymentData.amount,
      token: paymentData.token,
      message: paymentData.message,
      recipient: paymentData.recipientName,
    }

    const qrUrl = `${window.location.origin}/pay?data=${encodeURIComponent(JSON.stringify(qrData))}`

    return qrUrl
  }

  const copyQRLink = () => {
    const qrData = {
      to: walletAddress,
      amount: paymentData.amount,
      token: paymentData.token,
      message: paymentData.message,
      recipient: paymentData.recipientName,
    }

    const qrUrl = `${window.location.origin}/pay?data=${encodeURIComponent(JSON.stringify(qrData))}`
    navigator.clipboard.writeText(qrUrl)

    toast({
      title: "Link copied",
      description: "Payment link has been copied to clipboard",
    })
  }

  const downloadQRCode = () => {
    try {
      if (!qrRef.current) {
        throw new Error("QR code canvas not found");
      }

      const qrUrl = generateQrValue(); // QR 코드 URL 생성
      const canvas = qrRef.current;
      const dataUrl = canvas.toDataURL("image/png"); // PNG 데이터 URL 생성

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `payment-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been downloaded as a PNG file.",
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* QR 생성 폼 */}
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">Create Payment QR</CardTitle>
          <CardDescription className="text-muted-foreground">
            Generate a QR code for receiving Web3 payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                  Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  className="border-border focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-medium text-foreground">
                  Token *
                </Label>
                <Select value={paymentData.token} onValueChange={(value) => handleInputChange("token", value)}>
                  <SelectTrigger className="border-border focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.value} value={token.value}>
                        <span className="flex items-center gap-2">
                          <span>{token.icon}</span>
                          {token.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName" className="text-sm font-medium text-foreground">
                Your Name
              </Label>
              <Input
                id="recipientName"
                placeholder="Enter your name or business name"
                value={paymentData.recipientName}
                onChange={(e) => handleInputChange("recipientName", e.target.value)}
                className="border-border focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message
                {isPremiumUser && (
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                )}
              </Label>
              <Textarea
                id="message"
                placeholder={
                  isPremiumUser ? "Add a custom message for the payment" : "Upgrade to Premium for custom messages"
                }
                value={paymentData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                disabled={!isPremiumUser}
                className="border-border focus:border-primary focus:ring-primary resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* 프리미엄 기능 */}
          {isPremiumUser && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4" />
                QR Theme
                <Badge variant="secondary" className="text-xs">
                  Premium
                </Badge>
              </Label>
              <Select value={qrTheme} onValueChange={setQrTheme}>
                <SelectTrigger className="border-border focus:border-primary focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qrThemes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value} disabled={theme.premium && !isPremiumUser}>
                      <span className="flex items-center gap-2">
                        {theme.label}
                        {theme.premium && (
                          <Badge variant="outline" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={generateQR}
            disabled={!isWalletConnected}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {isWalletConnected ? "Generate QR Code" : "Connect Wallet First"}
          </Button>
        </CardContent>
      </Card>

      {/* QR 코드 미리보기 */}
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">QR Preview</CardTitle>
          <CardDescription className="text-muted-foreground">Your generated payment QR code</CardDescription>
        </CardHeader>
        <CardContent>
          {qrGenerated ? (
            <div className="space-y-6">
              {/* QR 코드 영역 */}
              <div className="flex justify-center">
                <div
                  className={`p-6 rounded-2xl ${qrTheme === "gradient"
                    ? "bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10"
                    : qrTheme === "neon"
                      ? "bg-black"
                      : qrTheme === "minimal"
                        ? "bg-white"
                        : "bg-muted"
                    }`}
                >
                  <QRCodeCanvas
                    ref={qrRef}
                    id="qr-code"
                    value={generateQrValue()}
                    size={180}
                    bgColor={
                      qrTheme === "gradient" ? "#ffffff" : qrStyle[qrTheme as keyof typeof qrStyle].background
                    }
                    fgColor={
                      qrTheme === "gradient" ? "#3B82F6" : qrStyle[qrTheme as keyof typeof qrStyle].foreground
                    }
                    level="H"
                    includeMargin={true}
                  >
                    {qrTheme === "gradient" && (
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    )}
                  </QRCodeCanvas>
                </div>

              </div>

              {/* 결제 정보 */}
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    {paymentData.amount} {paymentData.token}
                  </span>
                </div>

                {paymentData.recipientName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recipient</span>
                    <span className="font-medium text-foreground">{paymentData.recipientName}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">To Address</span>
                  <span className="font-mono text-sm text-foreground">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>

                {paymentData.message && isPremiumUser && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Message</span>
                    <p className="text-sm text-foreground mt-1">{paymentData.message}</p>
                  </div>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" size="sm" onClick={copyQRLink}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
                <Button variant="outline" size="sm" onClick={downloadQRCode}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No QR Code Yet</h3>
              <p className="text-muted-foreground text-sm">Fill in the payment details and generate your QR code</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
