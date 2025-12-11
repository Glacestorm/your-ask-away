/**
 * Partytown Configuration
 * Offloads third-party scripts to web workers for improved main thread performance
 * 
 * Note: Partytown requires specific setup for each third-party script.
 * This configuration provides the foundation for script offloading.
 */

export interface PartytownConfig {
  debug?: boolean;
  forward?: string[];
  lib?: string;
  loadScriptsOnMainThread?: string[];
  resolveUrl?: (url: URL, location: Location, type: string) => URL | undefined;
}

// Scripts that should run on the main thread (cannot be moved to workers)
export const MAIN_THREAD_SCRIPTS = [
  // Critical scripts that need DOM access
  /maps\.googleapis\.com/,
  /supabase\.co/,
];

// Scripts that can safely run in web workers
export const WORKER_SAFE_SCRIPTS = [
  'plausible.io',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'twitter.com',
  'linkedin.com',
];

// Partytown configuration
export const partytownConfig: PartytownConfig = {
  debug: process.env.NODE_ENV === 'development',
  
  // Forward specific function calls to main thread
  forward: [
    'dataLayer.push',
    'gtag',
    'fbq',
    'plausible',
  ],
  
  // Library path (served from public folder)
  lib: '/~partytown/',
  
  // Scripts that must stay on main thread
  loadScriptsOnMainThread: MAIN_THREAD_SCRIPTS.map(r => r.source),
};

/**
 * Check if a script URL can be safely moved to a web worker
 */
export function canOffloadScript(url: string): boolean {
  // Check if script is in the main thread list
  for (const pattern of MAIN_THREAD_SCRIPTS) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Check if script is in the worker-safe list
  for (const domain of WORKER_SAFE_SCRIPTS) {
    if (url.includes(domain)) {
      return true;
    }
  }
  
  // Default: keep on main thread for safety
  return false;
}

/**
 * Generate script tag with Partytown type attribute
 */
export function getPartytownScriptType(url: string): string {
  return canOffloadScript(url) ? 'text/partytown' : 'text/javascript';
}

/**
 * Performance metrics for Partytown
 */
export interface PartytownMetrics {
  scriptsOffloaded: number;
  mainThreadTime: number;
  workerTime: number;
  totalScripts: number;
}

let metrics: PartytownMetrics = {
  scriptsOffloaded: 0,
  mainThreadTime: 0,
  workerTime: 0,
  totalScripts: 0,
};

export function trackScriptLoad(offloaded: boolean, loadTime: number): void {
  metrics.totalScripts++;
  if (offloaded) {
    metrics.scriptsOffloaded++;
    metrics.workerTime += loadTime;
  } else {
    metrics.mainThreadTime += loadTime;
  }
}

export function getPartytownMetrics(): PartytownMetrics {
  return { ...metrics };
}

export function resetPartytownMetrics(): void {
  metrics = {
    scriptsOffloaded: 0,
    mainThreadTime: 0,
    workerTime: 0,
    totalScripts: 0,
  };
}

/**
 * Partytown initialization snippet
 * This should be added to the HTML head before any third-party scripts
 */
export const PARTYTOWN_SNIPPET = `
/* Partytown Configuration */
partytown = {
  debug: ${process.env.NODE_ENV === 'development'},
  forward: ['dataLayer.push', 'gtag', 'fbq', 'plausible'],
  lib: '/~partytown/'
};
`;

/**
 * Create a script element with Partytown configuration
 */
export function createPartytownScript(
  src: string, 
  options: { 
    async?: boolean; 
    defer?: boolean; 
    id?: string;
    onLoad?: () => void;
  } = {}
): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = src;
  script.type = getPartytownScriptType(src);
  
  if (options.async) script.async = true;
  if (options.defer) script.defer = true;
  if (options.id) script.id = options.id;
  if (options.onLoad) script.onload = options.onLoad;
  
  return script;
}

/**
 * Initialize Partytown for analytics scripts
 */
export function initializePartytown(): void {
  // Check if Partytown is supported
  if (typeof Worker === 'undefined') {
    console.warn('[Partytown] Web Workers not supported, scripts will run on main thread');
    return;
  }

  // Add configuration to window
  if (typeof window !== 'undefined') {
    (window as any).partytown = partytownConfig;
  }

  console.log('[Partytown] Initialized with config:', partytownConfig);
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initializePartytown();
}
