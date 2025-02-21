/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIUS_RPC: string;
  readonly VITE_TESTNET_RPC: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
