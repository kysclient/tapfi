import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, sepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { vTestnet } from '@/app/tenderly.config'
import { cookieStorage, createStorage, http } from 'wagmi'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694" // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [mainnet, arbitrum, vTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  transports: {
    [vTestnet.id]: http(process.env.TENDERLY_VIRTUAL_TESTNET_RPC!)
  },
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig