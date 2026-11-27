/* Service Worker - IP Overtime PWA
 * - App shell & library CDN di-cache (aplikasi tetap terbuka saat offline)
 * - Panggilan API (Apps Script) selalu langsung ke jaringan, tidak pernah di-cache
 * Naikkan VERSION setiap kali index.html diubah supaya semua HP mengambil versi baru.
 */
const VERSION = 'ip-overtime-v37';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API Apps Script & Proxy Vercel (/api/*): jangan pernah di-cache
  if (url.pathname.startsWith('/api/') || url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  // Navigasi halaman: network-first, fallback ke cache saat offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Aset lain (CSS/JS/font/CDN/ikon): stale-while-revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const fetching = fetch(req)
        .then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetching;
    })
  );
});
