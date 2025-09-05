import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'path', 'fs', 'os', 'crypto', 'stream', 'assert', 'url', 'http', 'https', 'querystring'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'webview-ui/index.tsx'),
      output: {
        entryFileNames: 'webview.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    sourcemap: true,
    target: ['es2020']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env': JSON.stringify({}),
    'process.version': JSON.stringify('v16.0.0'),
    'process.platform': JSON.stringify('browser'),
    'process.argv': JSON.stringify([]),
    'process.cwd': JSON.stringify(() => '/'),
    'process.browser': JSON.stringify(true),
    'global': 'globalThis'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
});
