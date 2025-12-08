// Enhanced Service Worker with Cache Strategies for Core Web Vitals optimization
// Implements: Cache-First, Network-First, Stale-While-Revalidate strategies

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Resources to precache for offline support and faster LCP
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Cache size limits
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 100,
  [API_CACHE]: 30,
};

// Trim cache to limit
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// Install event - precache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static resources');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating enhanced Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && 
                             name !== DYNAMIC_CACHE && 
                             name !== IMAGE_CACHE && 
                             name !== API_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => clients.claim())
  );
});

// Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests - Network First with cache fallback
  if (url.pathname.startsWith('/api') || 
      url.hostname.includes('supabase') ||
      url.pathname.includes('/rest/') ||
      url.pathname.includes('/functions/')) {
    return 'network-first';
  }
  
  // Images - Cache First
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    return 'cache-first';
  }
  
  // Fonts - Cache First
  if (request.destination === 'font' ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return 'cache-first';
  }
  
  // CSS/JS - Stale While Revalidate
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      /\.(css|js)$/i.test(url.pathname)) {
    return 'stale-while-revalidate';
  }
  
  // HTML pages - Network First
  if (request.destination === 'document' ||
      request.headers.get('accept')?.includes('text/html')) {
    return 'network-first';
  }
  
  // Default - Network First
  return 'network-first';
}

// Cache First strategy - best for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      trimCache(cacheName, CACHE_LIMITS[cacheName] || 50);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    throw error;
  }
}

// Network First strategy - best for API and HTML
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      trimCache(cacheName, CACHE_LIMITS[cacheName] || 50);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate - best for CSS/JS
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => {
          c.put(request, networkResponse.clone());
          trimCache(cacheName, CACHE_LIMITS[cacheName] || 50);
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Revalidation failed:', error);
      return null;
    });
  
  return cachedResponse || networkPromise;
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  const strategy = getCacheStrategy(request);
  
  let responsePromise;
  
  switch (strategy) {
    case 'cache-first':
      responsePromise = cacheFirst(request, IMAGE_CACHE);
      break;
    case 'network-first':
      responsePromise = networkFirst(request, 
        request.url.includes('supabase') || request.url.includes('/api') 
          ? API_CACHE 
          : DYNAMIC_CACHE
      );
      break;
    case 'stale-while-revalidate':
      responsePromise = staleWhileRevalidate(request, STATIC_CACHE);
      break;
    default:
      responsePromise = fetch(request);
  }
  
  event.respondWith(
    responsePromise.catch((error) => {
      console.error('[SW] Fetch handler error:', error);
      // Return offline fallback for navigation requests
      if (request.destination === 'document') {
        return caches.match('/');
      }
      throw error;
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received:', event);
  
  let data = {
    title: 'Nova Notificació',
    body: 'Has rebut una nova notificació',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Obrir' },
      { action: 'close', title: 'Tancar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-visits') {
    event.waitUntil(syncVisits());
  }
});

async function syncVisits() {
  // Placeholder for syncing offline visits when back online
  console.log('[SW] Syncing visits...');
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
});
