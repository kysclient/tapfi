import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/provider/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { headers } from "next/headers"
import ContextProvider from "@/components/provider/context-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TapFi - Web3 QR Payment Service",
  description:
    "Generate QR codes for seamless Web3 token payments. Connect your wallet and receive payments instantly.",
  keywords: ["Web3", "QR Code", "Payment", "Cryptocurrency", "Blockchain", "TAP Token"],
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" enableSystem={true} disableTransitionOnChange>
          <ContextProvider cookies={cookies}>
            {children}
          </ContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
