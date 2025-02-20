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
  // for main net
  // const endpoint =
  //   import.meta.env.VITE_HELIUS_RPC || import.meta.env.VITE_QN_RPC_URL;

  // for testnet
  const endpoint = import.meta.env.VITE_TESTNET_RPC;

  if (!endpoint) {
    throw new Error("RPC environment variable is not set");
  }

  const network = WalletAdapterNetwork.Testnet;

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
