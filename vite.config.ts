import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Vite 6: Improved HMR
    hmr: {
      overlay: true,
    },
    // HTTP/3 preparation headers
    headers: {
      'Alt-Svc': 'h3=":443"; ma=86400',
      'Link': '</src/main.tsx>; rel=preload; as=script',
    },
  },
  plugins: [
    react({
      // SWC optimizations
      jsxImportSource: undefined,
    }), 
    mode === "development" && componentTagger(),
    // Brotli Compression Level 11 - Maximum compression for static assets
    mode === "production" && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024, // Only compress files > 1KB
      compressionOptions: {
        params: {
          // Brotli quality level 11 (maximum compression)
          0: 11, // BROTLI_PARAM_QUALITY = 11
        },
      },
      deleteOriginFile: false, // Keep original files
      verbose: true,
      filter: /\.(js|mjs|json|css|html|svg|xml|woff|woff2|ttf|eot)$/i,
    }),
    // Gzip fallback for older browsers
    mode === "production" && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      compressionOptions: {
        level: 9, // Maximum gzip compression
      },
      deleteOriginFile: false,
      verbose: true,
      filter: /\.(js|mjs|json|css|html|svg|xml)$/i,
    }),
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
        // Aggressive tree-shaking configuration (Priority 5)
        compact: true,
        generatedCode: {
          arrowFunctions: true,
          constBindings: true,
          objectShorthand: true,
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ?? '';
          if (facadeModuleId.includes('node_modules')) {
            return 'vendor/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split('.').pop() ?? '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(ext)) {
            return 'images/[name]-[hash][extname]';
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
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
    // Report compressed sizes
    reportCompressedSize: true,
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
    // Exclude large dependencies from pre-bundling for tree-shaking
    exclude: [],
    // Vite 6: Better dependency discovery
    esbuildOptions: {
      target: 'esnext',
      // Tree-shaking for esbuild
      treeShaking: true,
      // Drop console in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      // Minify identifiers
      minifyIdentifiers: mode === 'production',
      minifySyntax: mode === 'production',
      minifyWhitespace: mode === 'production',
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
  // Vite 6: Improved preview server with HTTP/3 hints
  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      'Alt-Svc': 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  // Vite 6: JSON handling
  json: {
    stringify: true,
  },
  // Vite 6: Environment handling
  envPrefix: 'VITE_',
  // esbuild optimization for tree-shaking
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
    target: 'esnext',
    // Remove dead code paths
    pure: mode === 'production' ? ['console.log', 'console.debug', 'console.trace'] : [],
  },
}));
