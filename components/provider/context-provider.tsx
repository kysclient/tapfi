'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { networks, projectId, wagmiAdapter } from '@/lib/web3/config'

// Set up queryClient
const queryClient = new QueryClient()

// Set up metadata
const metadata = {
    name: 'Tapfi',
    description: 'Web3 QR Payment',
    url: '', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
export const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    metadata,
    themeMode: 'light',
    features: {
        analytics: true // Optional - defaults to your Cloud configuration
    },
    themeVariables: {
        '--w3m-accent': '#000000',
    }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
