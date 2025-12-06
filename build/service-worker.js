const CACHE_NAME = 'finman-pro-v2'; // Ganti versi agar cache lama terhapus
const urlsToCache = [
    '/',
    '/index.html',
    '/build/manifest.json', 
    '/service-worker.js', // Jalur baru
    '/source/app.js', 
    '/source/main.js',
    '/conf/auth.js',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
    'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js',
    '/assets/favicon/android-chrome-192x192.png', // Tambahkan icon agar di-cache
    '/assets/favicon/android-chrome-512x512.png'
];

// ... (Sisa kode ke bawah TETAP SAMA, tidak perlu diubah)
// Copy-paste saja logika install, activate, dan fetch dari file lama
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

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});