import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  mode: 'none',
  target: 'node',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      name: 'extension',
      fileName: 'extension',
      formats: ['cjs']
    },
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: false,
    rollupOptions: {
      external: ['vscode'],
      output: {
        entryFileNames: 'extension.js'
      }
    },
    minify: false
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
});
