/**
 * Service Worker for Vibe Recipes
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'vibe-recipes-v1';
const STATIC_CACHE_NAME = 'vibe-recipes-static-v1';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/components.css',
    '/js/app.js',
    '/js/ui.js',
    '/js/storage.js',
    '/js/recipe-parser.js',
    '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle different types of requests
    if (request.method === 'GET') {
        // For navigation requests (HTML pages)
        if (request.mode === 'navigate') {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        // If online, return the response and update cache
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone);
                            });
                        return response;
                    })
                    .catch(() => {
                        // If offline, serve from cache or fallback to index.html
                        return caches.match(request)
                            .then((cachedResponse) => {
                                return cachedResponse || caches.match('/index.html');
                            });
                    })
            );
            return;
        }

        // For static assets (CSS, JS, images)
        if (STATIC_FILES.some(file => request.url.includes(file))) {
            event.respondWith(
                caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        return fetch(request)
                            .then((response) => {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseClone);
                                    });
                                return response;
                            });
                    })
            );
            return;
        }

        // For external resources (recipe URLs, images)
        if (url.origin !== self.location.origin) {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        // Cache successful external requests
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // If offline, try to serve from cache
                        return caches.match(request);
                    })
            );
            return;
        }

        // For other same-origin requests
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseClone);
                        });
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
    }
});

// Background sync for future features
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'recipe-sync') {
        event.waitUntil(
            // Could implement recipe syncing here in the future
            Promise.resolve()
        );
    }
});

// Push notifications for future features
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New recipe available!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Recipe',
                icon: '/icons/view-icon.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/close-icon.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Vibe Recipes', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => {
                            return caches.delete(cacheName);
                        })
                    );
                })
                .then(() => {
                    event.ports[0].postMessage({
                        success: true
                    });
                })
                .catch((error) => {
                    event.ports[0].postMessage({
                        success: false,
                        error: error.message
                    });
                })
        );
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Loaded successfully');