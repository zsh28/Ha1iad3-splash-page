import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'util', 'process'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        protocolImports: true,
      }),
    ],
    define: {
      // for testnet
      // 'process.env.VITE_TESTNET_RPC': JSON.stringify(env.VITE_TESTNET_RPC),

      // main net turbin3 rpc
      // 'process.env.VITE_MAINNET_RPC': JSON.stringify(env.VITE_MAINNET_TURBIN3_RPC),

      // personal helius rpc main net
      'process.env.VITE_HELIUS_RPC': JSON.stringify(env.VITE_HELIUS_RPC),
      global: 'globalThis',
    },
    resolve: {
      alias: {
        'buffer': 'buffer/',
        process: 'process/browser',
        stream: 'stream-browserify',
        zlib: 'browserify-zlib',
        util: 'util',
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
      include: ['buffer', 'process'],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [],
      },
    },
  };
}); 