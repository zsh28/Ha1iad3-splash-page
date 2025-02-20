/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIUS_RPC: string;
  readonly VITE_QN_RPC_URL: string;
  readonly VITE_PUBLIC_PARA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
