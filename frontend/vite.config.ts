import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Only include dev tools in development
      jsxRuntime: 'automatic'
    }), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix lodash ES module import issues
      'lodash': 'lodash-es',
      // Force es-toolkit to use the correct export format
      'es-toolkit/compat/get': 'es-toolkit/compat/get.js',
    },
  },
  build: {
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable in production for performance
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // UI components library
          'ui-vendor': ['@radix-ui/react-slot', 'class-variance-authority', 'lucide-react'],
          // Router and state management
          'state-vendor': ['@tanstack/react-router', 'zustand'],
          // Utility libraries
          'utils-vendor': ['date-fns', 'recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // 1MB chunk size warning
    assetsInlineLimit: 4096 // 4KB inline limit for small assets
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev startup
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'lucide-react',
      '@tanstack/react-router',
      'zustand',
      'lodash-es'
    ],
    // Exclude problematic dependencies that have module resolution issues
    exclude: ['recharts', 'es-toolkit']
  },
  server: {
    // Optimize dev server
    hmr: {
      overlay: true
    },
    // Enable compression
    open: false, // Don't auto-open browser
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 4173
  }
})
