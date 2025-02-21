import React, { createContext, useContext, useState } from "react";
import {
  ParaSolanaProvider,
  phantomWallet,
  backpackWallet,
  glowWallet,
} from "@getpara/solana-wallet-connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const SolanaContext = createContext({
  openModal: () => {},
  closeModal: () => {},
  isOpen: false,
});

export const useSolanaModal = () => useContext(SolanaContext);

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = new QueryClient();

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const solanaNetwork = WalletAdapterNetwork.Devnet;

  // Use the environment variables for RPC
  const endpoint =
    import.meta.env.VITE_HELIUS_RPC || import.meta.env.VITE_QN_RPC_URL;

  if (!endpoint) {
    throw new Error("RPC environment variable is not set. Ensure VITE_HELIUS_RPC or VITE_QN_RPC_URL is defined.");
  }

  return (
    <SolanaContext.Provider value={{ openModal, closeModal, isOpen }}>
      <QueryClientProvider client={queryClient}>
        <ParaSolanaProvider
          endpoint={endpoint}
          wallets={[phantomWallet, backpackWallet, glowWallet]}
          chain={solanaNetwork}
          appIdentity={{
            name: "ha1iad3",
            uri: `${location.protocol}//${location.host}`,
          }}
        >
          {children}
        </ParaSolanaProvider>
      </QueryClientProvider>
    </SolanaContext.Provider>
  );
}
