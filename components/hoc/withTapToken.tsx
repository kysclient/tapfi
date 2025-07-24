"use client"

import { useState, useEffect, type ComponentType } from "react"
import { web3Service } from "@/services/web3Service"

export interface TapTokenProps {
  tapBalance: number
  isPremiumUser: boolean
  premiumTier: "basic" | "premium" | "vip"
  refreshTapBalance: () => Promise<void>
}

export function withTapToken<P extends { walletAddress?: string; isWalletConnected?: boolean }>(
  WrappedComponent: ComponentType<P & TapTokenProps>
) {
  return function TapTokenWrapper(props: P) {
    const [tapBalance, setTapBalance] = useState(0)
    const [isPremiumUser, setIsPremiumUser] = useState(false)
    const [premiumTier, setPremiumTier] = useState<"basic" | "premium" | "vip">("basic")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
      if (props.isWalletConnected && props.walletAddress) {
        fetchTapBalance()
      } else {
        setTapBalance(0)
        setIsPremiumUser(false)
        setPremiumTier("basic")
      }
    }, [props.isWalletConnected, props.walletAddress])

    const fetchTapBalance = async () => {
      if (!props.walletAddress) return

      setIsLoading(true)
      try {
        // 실제 데이터 또는 목업 데이터 사용
        const balance = await web3Service.getTapBalance(props.walletAddress)
        setTapBalance(balance)

        // 프리미엄 티어 결정
        if (balance >= 10000) {
          setPremiumTier("vip")
          setIsPremiumUser(true)
        } else if (balance >= 1000) {
          setPremiumTier("premium")
          setIsPremiumUser(true)
        } else {
          setPremiumTier("basic")
          setIsPremiumUser(false)
        }
      } catch (error) {
        console.error("Error fetching TAP balance:", error)
        setTapBalance(0)
        setIsPremiumUser(false)
        setPremiumTier("basic")
      } finally {
        setIsLoading(false)
      }
    }

    const refreshTapBalance = async () => {
      await fetchTapBalance()
    }

    return (
      <WrappedComponent
        {...props}
        tapBalance={tapBalance}
        isPremiumUser={isPremiumUser}
        premiumTier={premiumTier}
        refreshTapBalance={refreshTapBalance}
      />
    )
  }
}
