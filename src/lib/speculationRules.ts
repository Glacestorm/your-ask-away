/**
 * Speculation Rules API for Prefetch/Prerender
 * Priority 4 - Navigation Performance Optimization
 * 
 * Implements the Speculation Rules API for intelligent prefetching
 * https://developer.chrome.com/docs/web-platform/prerender-pages
 */

export interface SpeculationRule {
  source: 'list' | 'document';
  urls?: string[];
  where?: {
    and?: SpeculationCondition[];
    or?: SpeculationCondition[];
    not?: SpeculationCondition;
    href_matches?: string;
    selector_matches?: string;
  };
  eagerness?: 'immediate' | 'eager' | 'moderate' | 'conservative';
  requires?: ('anonymous-client-ip-when-cross-origin')[];
}

export interface SpeculationCondition {
  href_matches?: string;
  selector_matches?: string;
  and?: SpeculationCondition[];
  or?: SpeculationCondition[];
  not?: SpeculationCondition;
}

export interface SpeculationRulesConfig {
  prefetch?: SpeculationRule[];
  prerender?: SpeculationRule[];
}

// Check if Speculation Rules API is supported
export const supportsSpeculationRules = (): boolean => {
  if (typeof HTMLScriptElement === 'undefined') return false;
  return HTMLScriptElement.supports?.('speculationrules') ?? false;
};

// Add speculation rules to the document
export const addSpeculationRules = (config: SpeculationRulesConfig): void => {
  if (!supportsSpeculationRules()) {
    console.log('[SpeculationRules] API not supported, using fallback prefetch');
    addFallbackPrefetch(config);
    return;
  }

  // Remove existing speculation rules
  const existingRules = document.querySelectorAll('script[type="speculationrules"]');
  existingRules.forEach(el => el.remove());

  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify(config);
  document.head.appendChild(script);
  
  console.log('[SpeculationRules] Rules added:', config);
};

// Fallback prefetch for browsers without Speculation Rules API
const addFallbackPrefetch = (config: SpeculationRulesConfig): void => {
  const urls = new Set<string>();
  
  // Collect URLs from prefetch rules
  config.prefetch?.forEach(rule => {
    if (rule.urls) {
      rule.urls.forEach(url => urls.add(url));
    }
  });
  
  // Add prefetch links
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Default app routes for prefetching
export const getAppRoutes = (): string[] => [
  '/home',
  '/admin',
  '/dashboard',
  '/map',
  '/profile',
  '/visit-sheets',
  '/auth'
];

// Initialize default speculation rules for the app
export const initDefaultSpeculationRules = (): void => {
  const appRoutes = getAppRoutes();
  
  addSpeculationRules({
    prefetch: [
      // Prefetch main app routes with moderate eagerness
      {
        source: 'list',
        urls: appRoutes,
        eagerness: 'moderate'
      },
      // Prefetch links on hover/focus
      {
        source: 'document',
        where: {
          and: [
            { href_matches: '/*' },
            { not: { href_matches: '/api/*' } },
            { not: { href_matches: '*.pdf' } },
            { not: { selector_matches: '[data-no-prefetch]' } }
          ]
        },
        eagerness: 'moderate'
      }
    ],
    prerender: [
      // Prerender high-priority pages on strong intent
      {
        source: 'document',
        where: {
          selector_matches: 'a[data-prerender]'
        },
        eagerness: 'eager'
      },
      // Conservative prerender for navigation links
      {
        source: 'document',
        where: {
          and: [
            { selector_matches: 'nav a, [role="navigation"] a' },
            { not: { href_matches: '/api/*' } }
          ]
        },
        eagerness: 'conservative'
      }
    ]
  });
};

// Programmatic prefetch for specific URLs
export const prefetchUrl = (url: string, prerender: boolean = false): void => {
  if (supportsSpeculationRules()) {
    addSpeculationRules({
      [prerender ? 'prerender' : 'prefetch']: [
        {
          source: 'list',
          urls: [url],
          eagerness: 'immediate'
        }
      ]
    });
  } else {
    // Fallback
    const link = document.createElement('link');
    link.rel = prerender ? 'prerender' : 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
};

// Prefetch on link hover with debouncing
export const setupHoverPrefetch = (
  selector: string = 'a[href^="/"]',
  delay: number = 100
): (() => void) => {
  const prefetchedUrls = new Set<string>();
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const handleMouseEnter = (event: Event) => {
    const target = event.target as HTMLAnchorElement;
    const href = target.getAttribute('href');
    
    if (!href || prefetchedUrls.has(href)) return;
    
    hoverTimeout = setTimeout(() => {
      prefetchUrl(href);
      prefetchedUrls.add(href);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  };
  
  const links = document.querySelectorAll(selector);
  links.forEach(link => {
    link.addEventListener('mouseenter', handleMouseEnter);
    link.addEventListener('mouseleave', handleMouseLeave);
  });
  
  // Return cleanup function
  return () => {
    links.forEach(link => {
      link.removeEventListener('mouseenter', handleMouseEnter);
      link.removeEventListener('mouseleave', handleMouseLeave);
    });
  };
};

// Priority hints for navigation
export const setPriorityHints = (): void => {
  // Add fetchpriority to critical navigation links
  const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
  navLinks.forEach(link => {
    link.setAttribute('fetchpriority', 'high');
  });
};

export default {
  supportsSpeculationRules,
  addSpeculationRules,
  initDefaultSpeculationRules,
  prefetchUrl,
  setupHoverPrefetch,
  setPriorityHints,
  getAppRoutes
};
