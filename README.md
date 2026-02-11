# Dashboard Monitoring Kualitas Air & Efektivitas Filter (Asrama Putra Telkom University)

Dashboard berbasis **Laravel** untuk memantau **kualitas air (TDS)** sebelum dan sesudah filter, menghitung **ΔTDS (IN–OUT)** sebagai indikator efektivitas filter, menampilkan **grafik time-series**, serta menyediakan **riwayat data** dan **export CSV**.

---

## Fitur Utama

- **KPI Real-time**
  - **TDS IN** (sebelum filter)
  - **TDS OUT** (sesudah filter)
  - **ΔTDS = TDS IN − TDS OUT**
  - **Status efektivitas filter** (NORMAL / WARNING) berdasarkan ambang ΔTDS
- **Grafik interaktif (Chart.js)**
  - Grafik perbandingan TDS IN vs TDS OUT
  - Grafik ΔTDS
- **Riwayat data (15 data terakhir)**
  - Ditampilkan dalam tabel, data terbaru di bagian atas
- **Export CSV (backend Laravel)**
  - Download log dalam format CSV yang kompatibel untuk Excel
- **Polling data otomatis**
  - Refresh data setiap interval tertentu (default: 5 detik)

---

## Arsitektur Singkat

**Frontend:**
- Blade (Laravel view) + CSS statis
- JavaScript (Fetch API) untuk:
  - mengambil data JSON dari backend
  - update KPI, grafik, tabel

**Backend:**
- Laravel API endpoint:
  - `GET /api/filter-air/window` → window data untuk dashboard
  - `GET /api/filter-air/export` → export CSV dari data log
- Database menyimpan log pengukuran: `tds_in`, `tds_out`, `measured_at`

---

## Struktur Folder (yang relevan)

> Struktur lengkap mengikuti standar Laravel, bagian di bawah adalah yang penting untuk dashboard ini.

```
monitoring-filter-air/
├─ app/
│  ├─ Http/Controllers/
│  │  └─ Api/
│  │     └─ FilterAirController.php
│  └─ Models/
│     └─ FilterAirLog.php
├─ database/
│  ├─ migrations/
│  │  └─ xxxx_xx_xx_create_filter_air_logs_table.php
│  └─ seeders/ (opsional)
├─ public/
│  └─ assets/
│     └─ dashboards/
│        └─ filter-air/
│           ├─ css/
│           │  └─ style.css
│           └─ js/
│              └─ script.js
├─ resources/
│  └─ views/
│     └─ dashboards/
│        └─ filter-air/
│           └─ index.blade.php
├─ routes/
│  ├─ web.php
│  └─ api.php
└─ README.md
```

---

## Prasyarat

- PHP **8.1+**
- Composer
- MySQL/MariaDB (atau DB lain yang didukung Laravel)
- Node.js (opsional, **tidak wajib** untuk dashboard ini karena asset statis)
- Laragon/XAMPP/WAMP (opsional, untuk lokal di Windows)

---

## Instalasi & Menjalankan di Lokal

### 1) Clone repository
```bash
git clone <repo_url>
cd monitoring-filter-air
```

### 2) Install dependency
```bash
composer install
```

### 3) Setup environment
Copy `.env.example` menjadi `.env`, lalu set konfigurasi database.

```bash
copy .env.example .env
php artisan key:generate
```

Edit `.env` (contoh MySQL):
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=monitoring_filter_air
DB_USERNAME=root
DB_PASSWORD=
```

### 4) Migrasi database
```bash
php artisan migrate
```

### 5) Jalankan server
```bash
php artisan serve
```
Akses dashboard:
- `http://127.0.0.1:8000/dashboards/filter-air`

---

## Database

### Tabel `filter_air_logs`
Kolom yang digunakan:
- `id` (PK)
- `tds_in` (decimal/float)
- `tds_out` (decimal/float)
- `measured_at` (datetime) → waktu pengukuran
- timestamps (`created_at`, `updated_at`)

> **Catatan:** dashboard mengambil **15 data terakhir** berdasarkan `measured_at` (desc), lalu dibalik agar chart berurutan dari lama → baru.

---

## Endpoint API

### 1) Window data (untuk dashboard)
**GET** `/api/filter-air/window?limit=15`

**Response (contoh):**
```json
{
  "status": "ok",
  "data": [
    {
      "tds_in": 987.4,
      "tds_out": 243.77,
      "waktu": "2026-02-11T07:04:43.000000Z"
    }
  ]
}
```

**Catatan:**
- `waktu` adalah representasi ISO dari `measured_at`
- `limit` default 15

---

### 2) Export CSV
**GET** `/api/filter-air/export?limit=200`

**Output:**
- File `.csv` ter-download (stream response)
- Sudah include UTF-8 BOM agar aman dibuka di Excel

Kolom CSV:
- `no`
- `measured_at`
- `tds_in`
- `tds_out`
- `delta_tds`

---

## Cara Kerja Dashboard (Frontend)

### 1) Polling data
JavaScript melakukan fetch ke endpoint window:

```js
const API_URL = "/api/filter-air/window";
setInterval(fetchData, 5000);
```

### 2) Update KPI
- Ambil data terakhir (paling baru)
- Hitung ΔTDS
- Render ke elemen dengan id:
  - `kpi-in`, `kpi-out`, `kpi-delta`, `kpi-status`, `kpi-icon`
- Last update ditampilkan dari timestamp `waktu`

### 3) Status efektivitas filter
Aturan sederhana (bisa kamu ubah):
- Jika `ΔTDS < 200` → `WARNING`
- Selain itu → `NORMAL`

### 4) Grafik
- Chart 1: `TDS IN` vs `TDS OUT`
- Chart 2: `ΔTDS`
- Label waktu dibuat sintetis per 15 menit (grid rapi), agar tampilan konsisten di dashboard

### 5) Tabel riwayat
- Menampilkan data terbaru di baris paling atas
- Warna status:
  - Hijau: Normal
  - Oranye: Menurun/Warning

---

## Export CSV dari Tombol

Di Blade, tombol export memiliki id:

```html
<button id="btnExportCsv" class="btn-export">Export CSV</button>
```

Lalu di JS:

```js
btn.addEventListener("click", () => {
  window.location.href = "/api/filter-air/export?limit=5000";
});
```

---

## Troubleshooting

### 1) Grafik tidak muncul / skala aneh (0–1)
Penyebab umum:
- Konfigurasi `options.scales` diubah setelah chart dibuat → bisa memicu error resolver Chart.js v4

Solusi:
- Set `options.scales` sejak `initCharts()`
- Hindari overwrite `options.scales.y` dengan object baru setelah chart dibuat

---

### 2) Asset (CSS/JS) 404
Pastikan:
- File berada di `public/assets/...`
- Blade memanggil asset via helper Laravel:

```html
<link rel="stylesheet" href="{{ asset('assets/dashboards/filter-air/css/style.css') }}">
<script src="{{ asset('assets/dashboards/filter-air/js/script.js') }}"></script>
```

---

### 3) Data kosong di dashboard
Cek:
- Endpoint: `GET /api/filter-air/window`
- DB: tabel `filter_air_logs` berisi data
- Migrasi sudah jalan: `php artisan migrate`

---

## Roadmap Pengembangan (Opsional)

- Endpoint ingest untuk ESP32:
  - `POST /api/filter-air/log`
- Auth untuk dashboard (login)
- Filter range tanggal untuk tabel & export
- Multi-stasiun (Asrama Putra, Asrama Putri, Gedung lain)
- Alert threshold bertingkat (Normal/Warning/Critical)
- Monitoring parameter lain (pH, Turbidity, Flow, Pressure)

---

## Kontributor
- Farhan Oktavian (Telkom University)

---

## Lisensi
Tentukan lisensi yang kamu gunakan (MIT/Apache-2.0/Proprietary). Jika belum, isi bagian ini sesuai kebutuhan.
