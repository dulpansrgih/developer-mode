// public/service-worker.js

const CACHE_NAME = 'finman-pro-v1';
const urlsToCache = [
    // Aset Statis (Akses dari root "/")
    '/',
    '/index.html',
    '/public/manifest.json', 
    '/public/service-worker.js',
    // Skrip Logika
    '/source/app.js', 
    '/source/main.js',
    '/conf/auth.js',
    // Aset Eksternal (CDN dan Firebase SDK)
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
    'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js'
    // TODO: Tambahkan ikon Anda di sini, misalnya: '/icons/icon-192x192.png'
];

// 1. FASE INSTALL: Caching aset statis
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching App Shell');
                return cache.addAll(urlsToCache).catch(err => {
                    console.error('Gagal caching aset:', err);
                });
            })
    );
});

// 2. FASE ACTIVATE: Membersihkan cache lama
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. FASE FETCH: Melayani aset dari cache atau network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});