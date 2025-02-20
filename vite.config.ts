import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // for main net
      // 'process.env.VITE_HELIUS_RPC': JSON.stringify(env.VITE_HELIUS_RPC),

      // for testnet
      'process.env.VITE_TESTNET_RPC': JSON.stringify(env.VITE_TESTNET_RPC),

    },
  };
}); 