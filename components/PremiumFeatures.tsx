"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Crown, Zap, Palette, MessageSquare, BarChart3, Shield, Sparkles, ArrowRight } from "lucide-react"

interface PremiumFeaturesProps {
  tapBalance: number
  isPremiumUser: boolean
}

export function PremiumFeatures({ tapBalance, isPremiumUser }: PremiumFeaturesProps) {
  const premiumTiers = [
    {
      name: "Basic",
      minTap: 0,
      maxTap: 999,
      features: ["Basic QR Generation", "Standard Support", "Transaction History"],
      color: "gray",
    },
    {
      name: "Premium",
      minTap: 1000,
      maxTap: 9999,
      features: ["Custom Messages", "QR Themes", "Priority Support", "Advanced Analytics"],
      color: "blue",
    },
    {
      name: "VIP",
      minTap: 10000,
      maxTap: Number.POSITIVE_INFINITY,
      features: ["All Premium Features", "Custom Branding", "API Access", "Dedicated Support"],
      color: "gold",
    },
  ]

  const currentTier =
    premiumTiers.find((tier) => tapBalance >= tier.minTap && tapBalance <= tier.maxTap) || premiumTiers[0]
  const nextTier = premiumTiers.find((tier) => tier.minTap > tapBalance)

  const progressToNextTier = nextTier ? Math.min((tapBalance / nextTier.minTap) * 100, 100) : 100

  const premiumFeatures = [
    {
      icon: MessageSquare,
      title: "Custom Messages",
      description: "Add personalized messages to your payment requests",
      available: isPremiumUser,
      tier: "Premium",
    },
    {
      icon: Palette,
      title: "QR Themes",
      description: "Choose from beautiful QR code designs and themes",
      available: isPremiumUser,
      tier: "Premium",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights into your payment patterns",
      available: isPremiumUser,
      tier: "Premium",
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "Get faster response times for support requests",
      available: isPremiumUser,
      tier: "Premium",
    },
    {
      icon: Sparkles,
      title: "Custom Branding",
      description: "Add your logo and branding to payment pages",
      available: tapBalance >= 10000,
      tier: "VIP",
    },
    {
      icon: Zap,
      title: "API Access",
      description: "Integrate TapFi into your own applications",
      available: tapBalance >= 10000,
      tier: "VIP",
    },
  ]

  return (
    <div className="space-y-6">
      {/* 현재 상태 */}
      <Card className="shadow-sm border-0 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-600" />
                Your TAP Status
              </CardTitle>
              <CardDescription className="text-muted-foreground">Current tier and benefits</CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={`${currentTier.name === "VIP"
                  ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200"
                  : currentTier.name === "Premium"
                    ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200"
                    : "bg-muted text-foreground border-border"
                }`}
            >
              {currentTier.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{tapBalance.toLocaleString()} TAP</p>
              <p className="text-sm text-muted-foreground">Current balance</p>
            </div>

            {nextTier && (
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {(nextTier.minTap - tapBalance).toLocaleString()} TAP to {nextTier.name}
                </p>
                <p className="text-xs text-muted-foreground">Next tier upgrade</p>
              </div>
            )}
          </div>

          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                <span className="font-medium text-foreground">{Math.round(progressToNextTier)}%</span>
              </div>
              <Progress value={progressToNextTier} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 티어 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {premiumTiers.map((tier, index) => (
          <Card
            key={tier.name}
            className={`shadow-sm border-0 ${tier.name === currentTier.name ? "ring-2 ring-blue-500 bg-secondary" : "bg-card"
              }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">{tier.name}</CardTitle>
                {tier.name === currentTier.name && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Current
                  </Badge>
                )}
              </div>
              <CardDescription className="text-muted-foreground">
                {tier.minTap === 0 ? "Free" : `${tier.minTap.toLocaleString()}+ TAP`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 프리미엄 기능 상세 */}
      <Card className="shadow-sm border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Premium Features</CardTitle>
          <CardDescription className="text-muted-foreground">Unlock advanced features with TAP tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {premiumFeatures.map((feature, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 transition-all ${feature.available
                    ? "border-green-500/20 bg-green-500/10 dark:border-green-400/30 dark:bg-green-400/10"
                    : "border-border bg-muted"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.available ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                      }`}
                  >
                    <feature.icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{feature.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${feature.tier === "VIP"
                            ? "border-yellow-200 text-yellow-800 bg-yellow-50"
                            : "border-blue-200 text-blue-800 bg-blue-50"
                          }`}
                      >
                        {feature.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>

                    {feature.available ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        ✓ Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TAP 토큰 구매 */}
      {!isPremiumUser && (
        <Card className="shadow-sm border-0 bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Upgrade to Premium</h3>
                <p className="text-muted-foreground mb-4">Get access to advanced features and customization options</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom messages and QR themes</li>
                  <li>• Advanced analytics and insights</li>
                  <li>• Priority customer support</li>
                </ul>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => {
                    window.open("https://www.binance.com/en/how-to-buy/tap", "_blank")
                  }}
                  className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Buy TAP Tokens
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-gray-500 mt-2">Starting from 1,000 TAP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
