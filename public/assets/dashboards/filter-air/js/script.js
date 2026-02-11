/* ============================================================
   KONFIGURASI UTAMA
============================================================ */
console.log("FILTER AIR SCRIPT v2 LOADED", new Date().toISOString());

const API_URL = "/api/filter-air/window";



// Interval Refresh Dashboard (5 detik biar kelihatan gerak)
const REFRESH_MS = 5000;

// Variabel Global
let chartComparison = null;
let chartDelta = null;

/* ============================================================
   1. FUNGSI GENERATOR WAKTU (INTI PERUBAHAN)
   Fungsi ini membuat Array jam mundur 15 menit dari SEKARANG
============================================================ */
function generateTimeLabels(totalData) {
    const labels = [];
    const now = new Date();

    // 1. Bulatkan waktu sekarang ke kelipatan 15 menit terdekat (ke bawah)
    // Contoh: 10:17 -> 10:15, 10:40 -> 10:30
    const minutes = now.getMinutes();
    const snappedMinutes = minutes - (minutes % 15);
    now.setMinutes(snappedMinutes);
    now.setSeconds(0); // Detik jadi 00

    // 2. Loop untuk membuat label mundur ke belakang
    // Kita butuh array urut dari LAMA -> BARU (Index 0 s/d 14)
    // Index 14 (Terakhir) = Waktu Sekarang (Snapped)
    // Index 0 (Awal) = Waktu Sekarang - (14 * 15 menit)

    for (let i = 0; i < totalData; i++) {
        // Hitung selisih waktu
        // Rumus: Waktu_Target = Waktu_Sekarang - ((TotalData - 1 - i) * 15 menit)
        const diffMinutes = (totalData - 1 - i) * 15;

        const t = new Date(now.getTime() - (diffMinutes * 60000));

        // Format ke HH:mm (Contoh: 22:30)
        const jamStr = t.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace('.', ':'); // Kadang locale ID pakai titik, kita ganti titik dua

        labels.push(jamStr);
    }

    return labels; // Mengembalikan array ["19:00", "19:15", ..., "22:30"]
}

/* ============================================================
   2. INIT CHART
============================================================ */
function initCharts() {
    // Chart 1: Perbandingan
    const ctx1 = document.getElementById('chartComparison').getContext('2d');
    chartComparison = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'TDS IN',
                    data: [],
                    borderColor: '#9932CC',
                    backgroundColor: 'rgba(153, 50, 204, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'TDS OUT',
                    data: [],
                    borderColor: '#00BFFF',
                    backgroundColor: 'rgba(0, 191, 255, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { ticks: { maxRotation: 0, autoSkip: true } },
                y: { beginAtZero: false } // ✅ jangan di-overwrite lagi di updateDashboard
            }
        }
    });

    // Chart 2: Delta
    const ctx2 = document.getElementById('chartDelta').getContext('2d');
    chartDelta = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'ΔTDS',
                data: [],
                borderColor: '#FF8C00',
                backgroundColor: 'rgba(255, 140, 0, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { maxRotation: 0, autoSkip: true } },
                y: { beginAtZero: false } // ✅
            }
        }
    });
}


/* ============================================================
   3. FETCH DATA
============================================================ */
async function fetchData() {
    try {
        const response = await fetch(`${API_URL}?limit=15&t=${Date.now()}`, { cache: "no-store" });
        const result = await response.json();

        if (result.status === "ok" && Array.isArray(result.data)) {
            updateDashboard(result.data);
        } else {
            console.error("Format API tidak sesuai:", result);
        }
    } catch (error) {
        console.error("Gagal fetch:", error);
    }
}


/* ============================================================
   4. UPDATE DASHBOARD
============================================================ */
function updateDashboard(data) {
    console.log("updateDashboard rows:", data.length, data[0], data[data.length - 1]);

    if (!data || data.length === 0) return;
    if (!chartComparison || !chartDelta) return;

    // Labels sintetis 15 menit (urut lama -> baru)
    const timeLabels = generateTimeLabels(data.length);
    const latestTimeLabel = timeLabels[timeLabels.length - 1]; // ✅ FIX: sekarang ada

    // Data terbaru (paling kanan)
    const latestData = data[data.length - 1];

    // Pastikan angka valid
    const vIn = Number.parseFloat(latestData.tds_in);
    const vOut = Number.parseFloat(latestData.tds_out);

    if (!Number.isFinite(vIn) || !Number.isFinite(vOut)) {
        console.error("Data TDS invalid:", latestData);
        return;
    }

    const deltaVal = vIn - vOut;

    // --- A. KPI ---
    const kpiIn = document.getElementById("kpi-in");
    const kpiOut = document.getElementById("kpi-out");
    const kpiDelta = document.getElementById("kpi-delta");
    const statusEl = document.getElementById("kpi-status");
    const iconEl = document.getElementById("kpi-icon");

    if (kpiIn) kpiIn.textContent = vIn.toFixed(2);
    if (kpiOut) kpiOut.textContent = vOut.toFixed(2);
    if (kpiDelta) kpiDelta.textContent = deltaVal.toFixed(2);

    if (statusEl && iconEl) {
        if (deltaVal < 200) {
            statusEl.textContent = "WARNING";
            statusEl.style.color = "orange";
            iconEl.textContent = "!";
        } else {
            statusEl.textContent = "NORMAL";
            statusEl.style.color = "white";
            iconEl.textContent = "✓";
        }
    }

    // Last update dari timestamp DB (bukan grid)
    const t = new Date(latestData.waktu);
    const jam = t.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const lastIn = document.getElementById("last-update-in");
    const lastOut = document.getElementById("last-update-out");
    if (lastIn) lastIn.textContent = `Terakhir update: ${jam} WIB`;
    if (lastOut) lastOut.textContent = `Terakhir update: ${jam} WIB`;

    // --- B. GRAFIK ---
    const dIn = data.map(r => Number.parseFloat(r.tds_in));
    const dOut = data.map(r => Number.parseFloat(r.tds_out));
    const dDelta = data.map(r => Number.parseFloat(r.tds_in) - Number.parseFloat(r.tds_out));

    // Filter NaN biar chart gak jadi 0-1
    if ([...dIn, ...dOut, ...dDelta].some(v => !Number.isFinite(v))) {
        console.error("Ada nilai NaN di data chart:", { dIn, dOut, dDelta });
        return;
    }

    chartComparison.data.labels = timeLabels;
    chartComparison.data.datasets[0].data = dIn;
    chartComparison.data.datasets[1].data = dOut;

    // Auto scaling yang masuk akal
    const all = dIn.concat(dOut);
    const minY = Math.floor(Math.min(...all) / 10) * 10;
    const maxY = Math.ceil(Math.max(...all) / 10) * 10;


    chartComparison.update();

    chartDelta.data.labels = timeLabels;
    chartDelta.data.datasets[0].data = dDelta;

    const minD = Math.floor(Math.min(...dDelta) / 10) * 10;
    const maxD = Math.ceil(Math.max(...dDelta) / 10) * 10;

    

    chartDelta.update();

    // --- C. TABEL (DINAMIS) ---
    const tbody = document.getElementById("historyBody");
    if (tbody) {
        tbody.innerHTML = "";

        // Terbaru di atas
        for (let i = data.length - 1; i >= 0; i--) {
            const row = data[i];
            const jamRapi = timeLabels[i];

            const inVal = Number.parseFloat(row.tds_in);
            const outVal = Number.parseFloat(row.tds_out);
            const diff = inVal - outVal;

            const statusRow = diff < 200
                ? '<span class="status-warning">Menurun</span>'
                : '<span class="status-normal">Normal</span>';

            const bgStyle = (i === data.length - 1) ? 'style="background-color: rgba(0,0,0,0.05);"' : "";

            tbody.innerHTML += `
        <tr ${bgStyle}>
          <td>${data.length - i}</td>
          <td>${jamRapi}</td>
          <td>${inVal.toFixed(2)}</td>
          <td>${outVal.toFixed(2)}</td>
          <td>${diff.toFixed(2)}</td>
          <td>${statusRow}</td>
        </tr>
      `;
        }
    }
}


/* ============================================================
   5. START
============================================================ */
window.addEventListener('load', () => {
    initCharts();
    fetchData();
    setInterval(fetchData, REFRESH_MS);
});