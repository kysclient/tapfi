"use client";

import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";
import { createWeb3Modal } from "@web3modal/wagmi/react";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

if (!projectId) {
  throw new Error("WalletConnect Project ID is not defined");
}

const metadata = {
  name: "TapFi",
  description: "Web3 QR Payment Service",
  url: "http://localhost", // 실제 도메인으로 변경
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: "metaMask" }),
    walletConnect({ projectId, metadata }),
  ],
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
  },
});

// Web3Modal 초기화
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#007bff",
  },
});