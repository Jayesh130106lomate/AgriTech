// Service Worker for offline functionality
const CACHE_NAME = 'agritech-v1';
const STATIC_CACHE = 'agritech-static-v1';
const DYNAMIC_CACHE = 'agritech-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/static/css/style.css',
    '/static/js/script.js',
    '/static/js/offline.js',
    '/manifest.json',
    '/offline.html'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch(error => {
                console.log('Service Worker: Error caching static files', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API calls differently
    if (url.pathname.startsWith('/market_prices') ||
        url.pathname.startsWith('/market_intelligence')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached version if network fails
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Return offline fallback for market data
                            return new Response(JSON.stringify({
                                prices: {
                                    turmeric: { price: 180, unit: 'per kg', trend: 'stable', source: 'offline' },
                                    rice: { price: 25, unit: 'per kg', trend: 'stable', source: 'offline' }
                                },
                                last_updated: new Date().toISOString(),
                                sources: ['Offline Cache'],
                                note: 'You are currently offline. Prices may not be current.'
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                })
        );
    } else {
        // For other requests, try network first, then cache
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached version
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Return offline page for navigation requests
                            if (request.mode === 'navigate') {
                                return caches.match('/offline.html');
                            }
                        });
                })
        );
    }
});

// Background sync for offline transactions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered');
    if (event.tag === 'background-sync-transactions') {
        event.waitUntil(syncPendingTransactions());
    }
});

async function syncPendingTransactions() {
    try {
        // Get pending transactions from IndexedDB or localStorage
        const pendingTransactions = await getPendingTransactions();

        for (const transaction of pendingTransactions) {
            try {
                const response = await fetch('/transactions/new', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transaction.data)
                });

                if (response.ok) {
                    // Remove from pending transactions
                    await removePendingTransaction(transaction.id);
                    console.log('Service Worker: Synced transaction', transaction.id);
                }
            } catch (error) {
                console.log('Service Worker: Failed to sync transaction', transaction.id, error);
            }
        }
    } catch (error) {
        console.log('Service Worker: Error during background sync', error);
    }
}

// Helper functions for pending transactions
async function getPendingTransactions() {
    // In a real implementation, this would use IndexedDB
    // For now, return empty array
    return [];
}

async function removePendingTransaction(id) {
    // Remove from IndexedDB
    console.log('Service Worker: Would remove transaction', id);
}

// Push notifications for price alerts
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/static/icons/icon-192x192.png',
            badge: '/static/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});