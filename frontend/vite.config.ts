import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['cmdk'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy data libraries — lazy-loaded on first grid / export use
          'ag-grid': ['ag-grid-community', '@ag-grid-community/react'],
          'xlsx': ['xlsx'],
          // React core — changes infrequently, long-lived cache
          'react-vendor': ['react', 'react-dom'],
          // Router + query — updated together
          'query': ['@tanstack/react-query', '@tanstack/react-router'],
          // Radix UI primitives — large but stable
          'ui-primitives': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
})
