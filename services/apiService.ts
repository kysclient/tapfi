// API 관련 실제 데이터 서비스
export interface PaymentRequest {
  id: string
  walletAddress: string
  amount: string
  token: string
  message?: string
  recipientName?: string
  createdAt: Date
  expiresAt: Date
  status: "active" | "completed" | "expired"
}

export interface PaymentStats {
  totalReceived: number
  totalTransactions: number
  topToken: string
  monthlyGrowth: number
}

class ApiService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api"
  private readonly USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

  // 결제 요청 생성
  async createPaymentRequest(
    data: Omit<PaymentRequest, "id" | "createdAt" | "expiresAt" | "status">,
  ): Promise<PaymentRequest> {
    if (this.USE_MOCK_DATA) {
      return {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
        status: "active",
      }
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/payment-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment request")
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating payment request:", error)
      throw error
    }
  }

  // 결제 요청 조회
  async getPaymentRequest(id: string): Promise<PaymentRequest | null> {
    if (this.USE_MOCK_DATA) {
      return {
        id,
        walletAddress: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
        amount: "0.1",
        token: "ETH",
        message: "Payment for services",
        recipientName: "John Doe",
        createdAt: new Date(Date.now() - 3600000),
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
        status: "active",
      }
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/payment-requests/${id}`)

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching payment request:", error)
      return null
    }
  }

  // 사용자 결제 통계 조회
  async getPaymentStats(walletAddress: string): Promise<PaymentStats> {
    if (this.USE_MOCK_DATA) {
      return {
        totalReceived: 1250.75,
        totalTransactions: 23,
        topToken: "ETH",
        monthlyGrowth: 15.2,
      }
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/stats/${walletAddress}`)

      if (!response.ok) {
        throw new Error("Failed to fetch payment stats")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching payment stats:", error)
      return {
        totalReceived: 0,
        totalTransactions: 0,
        topToken: "ETH",
        monthlyGrowth: 0,
      }
    }
  }

  // 결제 완료 처리
  async completePayment(paymentId: string, txHash: string): Promise<boolean> {
    if (this.USE_MOCK_DATA) {
      return true
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/payment-requests/${paymentId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      })

      return response.ok
    } catch (error) {
      console.error("Error completing payment:", error)
      return false
    }
  }

  // 사용자 프로필 조회/생성
  async getUserProfile(walletAddress: string): Promise<{
    walletAddress: string
    displayName?: string
    avatar?: string
    preferences: {
      defaultToken: string
      theme: string
      notifications: boolean
    }
  }> {
    if (this.USE_MOCK_DATA) {
      return {
        walletAddress,
        displayName: "Anonymous User",
        preferences: {
          defaultToken: "ETH",
          theme: "system",
          notifications: true,
        },
      }
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/users/${walletAddress}`)

      if (!response.ok) {
        // 사용자가 없으면 기본 프로필 생성
        return this.createUserProfile(walletAddress)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }
  }

  private async createUserProfile(walletAddress: string) {
    const defaultProfile = {
      walletAddress,
      preferences: {
        defaultToken: "ETH",
        theme: "system",
        notifications: true,
      },
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultProfile),
      })

      if (!response.ok) {
        throw new Error("Failed to create user profile")
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating user profile:", error)
      return defaultProfile
    }
  }
}

export const apiService = new ApiService()
