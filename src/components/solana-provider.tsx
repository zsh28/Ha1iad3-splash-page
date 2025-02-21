import { WalletError, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { ReactNode, useCallback, useMemo } from "react";
import React from "react";
import {
  KeystoneWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrezorWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletButton = WalletMultiButton;

export default function SolanaProvider({ children }: { children: ReactNode }) {
  // Use private RPC for development, public RPC for production
  // const endpoint = import.meta.env.NODE_ENV === 'production'
  //   ? import.meta.env.VITE_HELIUS_RPC  // Public RPC for production
  //   : import.meta.env.VITE_MAINNET_TURBIN3_RPC;  // Private RPC for development
  const endpoint = import.meta.env.VITE_HELIUS_RPC;

  const network = WalletAdapterNetwork.Mainnet;

  // for testnet
  // const endpoint = import.meta.env.VITE_TESTNET_RPC;
  // const network = WalletAdapterNetwork.Testnet;

  if (!endpoint) {
    throw new Error("RPC environment variable is not set");
  }

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new TrezorWalletAdapter(),
      new KeystoneWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
      }}
    >
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
