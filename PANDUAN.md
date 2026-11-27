# Panduan Deploy IP Overtime PWA

## 1. Backend (Apps Script)
1. Ganti isi `Code.gs` dengan file terbaru (sudah ada `doPost` sebagai API).
2. Jalankan fungsi `setupInitialSheets` sekali dan izinkan permission.
3. **Deploy → Manage deployments → Edit → New version → Deploy**
   (Execute as: Me, Who has access: Anyone). Salin URL `/exec`.

## 2. Frontend (hosting statis, HTTPS wajib)
1. Buka `index.html`, isi: `const API_URL = "URL_EXEC_ANDA";`
2. Upload SELURUH isi folder ini (index.html, manifest.webmanifest, sw.js, folder icons)
   ke salah satu: GitHub Pages, Netlify (drag & drop folder), Cloudflare Pages, atau Firebase Hosting.
3. Buka URL hasil hosting di Chrome/Safari.

## 3. Hubungkan balik (opsional, disarankan)
Di `Code.gs` isi `const PWA_URL = "https://url-pwa-anda/";` lalu deploy New version,
agar tombol "Buka Dashboard" di halaman approval email mengarah ke PWA.

## 4. Install
- Android/Desktop Chrome/Edge: tombol **Install** muncul di header (atau menu ⋮ → Install app).
- iPhone/iPad: Safari → Bagikan → Tambahkan ke Layar Utama (tombol Install menampilkan langkahnya).

## 5. Update aplikasi
Setiap mengubah index.html, naikkan `VERSION` di `sw.js` (mis. ip-overtime-v2)
supaya semua perangkat mengambil versi baru.
