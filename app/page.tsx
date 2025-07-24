'use client'
import { Loading } from '@/components/Loading';
import dynamic from 'next/dynamic';

const DynamicHomePage = dynamic(() => import('@/components/pages/home'), {
  ssr: false,
  loading: () => <Loading />
});

export default function Page() {
  return <DynamicHomePage
    isWalletConnected={false}
    walletAddress="0x123...456"
    connectWallet={async () => console.log('Connecting wallet...')}
    disconnectWallet={() => console.log('Disconnecting wallet...')}
    tapBalance={1000}
    isPremiumUser={false}
  />
}