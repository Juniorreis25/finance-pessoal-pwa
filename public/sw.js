const CACHE_NAME = 'finance-pessoal-pwa-static-v1'
const STATIC_ASSETS = [
    '/offline.html',
    '/manifest.webmanifest',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/icon-maskable-512x512.png',
    '/apple-touch-icon.png',
]

const isSupabaseRequest = (url) => url.hostname.endsWith('.supabase.co')
const isProtectedPath = (pathname) => (
    pathname.startsWith('/api/')
    || pathname.startsWith('/auth/')
    || pathname.startsWith('/_next/data/')
)
const isStaticAsset = (request, url) => (
    url.origin === self.location.origin
    && (
        url.pathname.startsWith('/_next/static/')
        || STATIC_ASSETS.includes(url.pathname)
    )
    && request.destination !== 'document'
)

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key.startsWith('finance-pessoal-pwa-') && key !== CACHE_NAME)
                    .map((key) => caches.delete(key)),
            ))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})

self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.method !== 'GET') return

    const url = new URL(request.url)
    if (url.origin !== self.location.origin || isSupabaseRequest(url) || isProtectedPath(url.pathname)) {
        return
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/offline.html')),
        )
        return
    }

    if (!isStaticAsset(request, url)) return

    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            if (!response.ok) return response
            const responseCopy = response.clone()
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
            return response
        })),
    )
})
