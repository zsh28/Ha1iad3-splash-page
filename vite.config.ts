import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
      }),
    ],
    define: {
      'process.env.VITE_HELIUS_RPC': JSON.stringify(env.VITE_HELIUS_RPC),
      'process.env.VITE_PUBLIC_PARA_API_KEY': JSON.stringify(env.VITE_PUBLIC_PARA_API_KEY),
    },
  };
});
