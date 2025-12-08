import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App.tsx";
import "./index.css";

// Register service worker for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('SW registration failed:', error);
    });
  });
}

// Performance monitoring for Core Web Vitals
if (typeof window !== 'undefined') {
  // Report Web Vitals in development
  if (import.meta.env.DEV) {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const reportVital = (metric: { name: string; value: number; rating: string }) => {
        console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
      };
      onCLS(reportVital);
      onFCP(reportVital);
      onLCP(reportVital);
      onTTFB(reportVital);
      onINP(reportVital);
    }).catch(() => {});
  }

  // Long Task monitoring for INP optimization
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.debug(`[Long Task] Duration: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported
    }
  }

  // Resource timing for slow resources
  if ('PerformanceObserver' in window && import.meta.env.DEV) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          if (entry.duration > 1000) {
            console.warn(`[Slow Resource] ${entry.name}: ${entry.duration.toFixed(0)}ms`);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource observer not supported
    }
  }
}

// Preload critical data after initial render
const preloadCriticalData = () => {
  // Schedule non-critical work during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload common fonts
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = 'https://fonts.gstatic.com';
      document.head.appendChild(link);
    }, { timeout: 2000 });
  }
};

// Execute after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(preloadCriticalData);
});

// Use concurrent features from React 19
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
