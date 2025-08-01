"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Copy, Download, Share2, Palette, MessageSquare, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { isAddress } from "viem";
import { debounce } from "lodash";
import { TokenManager } from "@/lib/web3/token-manager";
import { networks } from "@/lib/web3/config";
import React from "react";
import { PaymentData } from "./hoc/with-wallet-and-taptoken";


interface TokenInfo {
  value: string;
  label: string;
  icon: string;
  address?: string;
  decimals: number;
  balance?: string;
}

interface QRGeneratorProps {
  paymentData: PaymentData;
  setPaymentData: any;
  onGenerate: () => void;
  isWalletConnected: boolean;
  walletAddress: string;
}

const QRGenerator = ({
  paymentData,
  setPaymentData,
  onGenerate,
  isWalletConnected,
  walletAddress,
}: QRGeneratorProps) => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrTheme, setQrTheme] = useState("default");
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTokenDetails, setSelectedTokenDetails] = useState<TokenInfo | null>(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [qrValue, setQrValue] = useState("");
  const { toast } = useToast();
  const tokenManager = useMemo(() => new TokenManager(), []);

  const currentChainId = paymentData.chainId || 1;

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      !!paymentData.amount &&
      parseFloat(paymentData.amount) > 0 &&
      !!paymentData.token &&
      !!paymentData.chainId &&
      isAddress(walletAddress)
    );
  }, [paymentData, walletAddress]);

  // Load tokens
  const loadTokens = useCallback(async (chainId: number) => {
    setLoading(true);
    setNetworkError(null);
    try {
      const fetchedTokens = await tokenManager.getTokens(chainId);
      setTokens(fetchedTokens);
    } catch (error) {
      setNetworkError("Failed to load tokens. Please try again.");
      toast({ variant: "destructive", title: "토큰 목록을 불러오지 못했습니다" });
    }
    setLoading(false);
  }, [tokenManager, toast]);

  // Search tokens
  const filteredTokens = useMemo(() => {
    return tokenManager.searchTokens(currentChainId, searchQuery, tokens);
  }, [currentChainId, searchQuery, tokens, tokenManager]);

  // Initialize tokens on network change
  useEffect(() => {
    const initializeTokens = async () => {
      setLoading(true);
      await loadTokens(currentChainId);
      setLoading(false);
    };
    initializeTokens();
  }, [currentChainId, loadTokens]);

  // Update selected token details
  useEffect(() => {
    if (paymentData.token && filteredTokens.length) {
      const tokenInfo = filteredTokens.find((t) => t.value === paymentData.token);
      setSelectedTokenDetails(tokenInfo || null);
    } else {
      setSelectedTokenDetails(null);
    }
  }, [paymentData.token, filteredTokens]);

  // Refresh balance with debounce
  const refreshBalance = useCallback(
    debounce(async () => {
      if (!paymentData.token || !isWalletConnected) return;
      setRefreshingBalance(true);
      try {
        const updatedToken = await tokenManager.refreshTokenBalance(
          currentChainId,
          paymentData.token,
          walletAddress
        );
        if (updatedToken) {
          setSelectedTokenDetails(updatedToken);
          setTokens((prev) =>
            prev.map((t) => (t.value === updatedToken.value ? updatedToken : t))
          );
          setPaymentData((prev: PaymentData) => ({
            ...prev,
            tokenInfo: updatedToken,
          }));
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error!", description: 'Something went wrong' });
      }
      setRefreshingBalance(false);
    }, 500),
    [paymentData.token, currentChainId, walletAddress, isWalletConnected, tokenManager, toast]
  );

  // Trigger balance refresh
  useEffect(() => {
    if (paymentData.chainId && paymentData.token && isWalletConnected) {
      refreshBalance();
    }
  }, [paymentData.chainId, paymentData.token, isWalletConnected, refreshBalance]);

  const qrThemes = [
    { value: "default", label: "Default" },
    { value: "gradient", label: "Gradient" },
    { value: "neon", label: "Neon" },
    { value: "minimal", label: "Minimal" },
  ];

  const qrStyle = {
    default: { background: "#ffffff", foreground: "#000000" },
    gradient: { background: "#ffffff", foreground: "url(#gradient)" },
    neon: { background: "#000000", foreground: "#00ff00" },
    minimal: { background: "#ffffff", foreground: "#333333" },
  };

  const handleInputChange = useCallback(
    (field: keyof PaymentData, value: string | number) => {
      setPaymentData({ ...paymentData, [field]: value });
    },
    [paymentData, setPaymentData]
  );

  const handleNetworkChange = async (chainId: string) => {
    const newChainId = parseInt(chainId, 10);
    setPaymentData({ ...paymentData, chainId: newChainId, token: "" });
    setSearchQuery("");
    setSelectedTokenDetails(null);
  };

  const generateQR = async () => {
    if (!isFormValid) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please fill in amount, token, network, and connect a valid wallet",
      });
      return;
    }

    const selectedToken = tokens.find((t) => t.value === paymentData.token);
    if (!selectedToken) {
      toast({
        variant: "destructive",
        title: "Invalid token",
        description: "Selected token is not available",
      });
      return;
    }

    // Generate QR code pointing to /pay page
    const qrData = {
      to: walletAddress,
      amount: paymentData.amount,
      token: paymentData.token,
      tokenAddress: selectedToken.address || "",
      chainId: paymentData.chainId,
      message: paymentData.message || "",
      recipient: paymentData.recipientName || "",
      timestamp: Date.now(),
    };

    const qrUrl = `${window.location.origin}/pay?data=${encodeURIComponent(JSON.stringify(qrData))}`;
    setQrValue(qrUrl);
    setQrGenerated(true);
    // onGenerate();
  };

  const copyQRLink = async () => {
    if (!qrValue) return;
    try {
      await navigator.clipboard.writeText(qrValue);
      toast({ title: "Payment link copied to clipboard!" });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({ variant: "destructive", title: "Failed to copy link" });
    }
  };

  const downloadQRCode = async () => {
    try {
      if (!qrRef.current) throw new Error("QR code canvas not found");
      const canvas = qrRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `payment-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "QR Code downloaded successfully!" });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({ variant: "destructive", title: "Failed to download QR code" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">Create Payment QR Code</CardTitle>
          <CardDescription className="text-muted-foreground">
            Generate a QR code for receiving Web3 payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              className="text-right border-border focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="network" className="text-sm font-medium text-foreground">
                Network *
              </Label>
              <Select
                value={paymentData.chainId?.toString() || ""}
                onValueChange={handleNetworkChange}
              >
                <SelectTrigger className="border-border focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((network) => (
                    <SelectItem key={network.id} value={network.id.toString()}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {networkError && (
                <p className="text-sm text-red-500">{networkError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                Token * {loading && <span className="text-xs text-muted-foreground">(Loading...)</span>}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-border focus:border-primary focus:ring-primary"
                />
              </div>
              <Select
                value={paymentData.token}
                onValueChange={(value) => handleInputChange("token", value)}
                disabled={loading || !filteredTokens?.length}
              >
                <SelectTrigger className="border-border focus:border-primary focus:ring-primary">
                  <SelectValue placeholder={loading ? "Loading tokens..." : "Select token"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTokens.map((token) => (
                    <SelectItem key={token.value} value={token.value}>
                      <span className="flex items-center gap-2 w-full">
                        <img src={token.icon} alt={token.value} className="w-4 h-4" />
                        <span className="flex-1">{token.label}</span>
                        {token.balance && (
                          <span className="text-xs text-muted-foreground ml-2">{token.balance}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* {selectedTokenDetails && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={selectedTokenDetails.icon} alt={selectedTokenDetails.value} className="w-6 h-6" onError={(e) => (e.currentTarget.src = "/images/fallback-token.png")} />
                    <div>
                      <div className="font-medium text-sm">{selectedTokenDetails.value}</div>
                      <div className="text-xs text-muted-foreground">
                        Balance: {refreshingBalance ? "Loading..." : selectedTokenDetails.balance || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              )} */}
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
              </Label>
              <Textarea
                id="message"
                placeholder="Add a custom message for the payment"
                value={paymentData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                className="border-border focus:border-primary focus:ring-primary resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4" />
              QR Theme
            </Label>
            <Select value={qrTheme} onValueChange={setQrTheme}>
              <SelectTrigger className="border-border focus:border-primary focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qrThemes.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={generateQR}
            disabled={!isWalletConnected || !isFormValid || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
          >
            {loading || refreshingBalance ? (
              <span>Loading...</span>
            ) : isWalletConnected ? (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Connect Wallet First
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">QR Preview</CardTitle>
          <CardDescription className="text-muted-foreground">Your generated payment QR code</CardDescription>
        </CardHeader>
        <CardContent>
          {qrGenerated ? (
            <div className="space-y-6">
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
                    value={qrValue}
                    size={180}
                    bgColor={qrTheme === "gradient" ? "#ffffff" : qrStyle[qrTheme as keyof typeof qrStyle].background}
                    fgColor={qrTheme === "gradient" ? "#3B82F6" : qrStyle[qrTheme as keyof typeof qrStyle].foreground}
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
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    {paymentData.amount} {paymentData.token}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="font-medium text-foreground">
                    {networks.find((n) => n.id === (paymentData.chainId || 1))?.name || "Unknown"}
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
                {paymentData.message && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Message</span>
                    <p className="text-sm text-foreground mt-1">{paymentData.message}</p>
                  </div>
                )}
              </div>
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
  );
};

export default React.memo(QRGenerator);