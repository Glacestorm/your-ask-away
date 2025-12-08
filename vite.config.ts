import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Vite 6: Improved HMR
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react({
      // SWC optimizations
      jsxImportSource: undefined,
    }), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Core Web Vitals Optimizations - Vite 6 enhancements
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-map': ['maplibre-gl'],
        },
      },
    },
    // Minification for smaller bundle sizes
    minify: 'esbuild',
    // Enable source maps for debugging in development
    sourcemap: mode !== 'production',
    // Chunk size warning
    chunkSizeWarningLimit: 500,
    // CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles (ESNext for Vite 6)
    target: 'esnext',
    // Vite 6: Improved asset handling
    assetsInlineLimit: 4096,
    // Module preload polyfill disabled (not needed for modern browsers)
    modulePreload: {
      polyfill: false,
    },
  },
  // Optimize dependencies - Vite 6 improvements
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    // Vite 6: Better dependency discovery
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Enable CSS optimization
  css: {
    devSourcemap: true,
    // Vite 6: CSS modules optimization
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Vite 6: Improved preview server
  preview: {
    port: 4173,
    strictPort: true,
  },
  // Vite 6: JSON handling
  json: {
    stringify: true,
  },
  // Vite 6: Environment handling
  envPrefix: 'VITE_',
}));