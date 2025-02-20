/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIUS_RPC: string;
  readonly VITE_QN_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
