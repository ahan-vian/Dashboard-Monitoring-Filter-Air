/* ============================================================
   KONFIGURASI UTAMA
============================================================ */
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
            scales: { y: { beginAtZero: false } }
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
            plugins: { legend: { display: false } }
        }
    });
}

/* ============================================================
   3. FETCH DATA
============================================================ */
async function fetchData() {
    try {
        const response = await fetch(`${API_URL}?limit=15&t=${Date.now()}`);
        const result = await response.json();

        if (result.status === 'ok') {
            updateDashboard(result.data);
        }
    } catch (error) {
        console.error("Gagal fetch:", error);
    }
}

/* ============================================================
   4. UPDATE DASHBOARD
============================================================ */
function updateDashboard(data) {
    if (!data || data.length === 0) return;

    // --- LANGKAH PENTING: BUAT LABEL WAKTU SINTETIS ---
    // Kita abaikan waktu dari database, kita buat sendiri labelnya
    // agar rapi per 15 menit berakhir di waktu sekarang.
    const timeLabels = generateTimeLabels(data.length);

    // --- A. UPDATE KARTU (Data Terbaru / Paling Kanan) ---
    const latestData = data[data.length - 1];
    const vIn = parseFloat(latestData.tds_in);
    const vOut = parseFloat(latestData.tds_out);
    const deltaVal = vIn - vOut;

    document.getElementById("kpi-in").textContent = vIn.toFixed(2);
    document.getElementById("kpi-out").textContent = vOut.toFixed(2);
    document.getElementById("kpi-delta").textContent = deltaVal.toFixed(2);

    // Status
    const statusEl = document.getElementById("kpi-status");
    const iconEl = document.getElementById("kpi-icon");

    if (deltaVal < 200) {
        statusEl.textContent = "WARNING";
        statusEl.style.color = "orange";
        iconEl.textContent = "!";
    } else {
        statusEl.textContent = "NORMAL";
        statusEl.style.color = "white";
        iconEl.textContent = "✓";
    }

    // Last update (ambil waktu data terbaru)
    const t = new Date(latestData.waktu);
    const jam = t.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    document.getElementById("last-update-in").textContent = `Terakhir update: ${jam}`;
    document.getElementById("last-update-out").textContent = `Terakhir update: ${jam}`;


    // Update Teks "Terakhir Update" di pojok
    const subTexts = document.querySelectorAll('.sub-text');
    subTexts.forEach(el => {
        if (el.innerText.includes('update') || el.innerText.includes('Waktu')) {
            // Tampilkan label waktu sintetis yang rapi (22:30, 22:45, dst)
            el.innerText = `Waktu Grid: ${latestTimeLabel}`;
        }
    });

    // --- B. UPDATE GRAFIK ---
    const dIn = [];
    const dOut = [];
    const dDelta = [];

    // Kita map data satu per satu
    data.forEach(row => {
        dIn.push(parseFloat(row.tds_in));
        dOut.push(parseFloat(row.tds_out));
        dDelta.push(parseFloat(row.tds_in) - parseFloat(row.tds_out));
    });

    // Masukkan Label Waktu Sintetis ke Grafik
    chartComparison.data.labels = timeLabels; // Pakai array jam rapi yg kita buat
    chartComparison.data.datasets[0].data = dIn;
    chartComparison.data.datasets[1].data = dOut;
    chartComparison.update();

    chartDelta.data.labels = timeLabels;
    chartDelta.data.datasets[0].data = dDelta;
    chartDelta.update();

    // --- C. UPDATE TABEL ---
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        tbody.innerHTML = '';

        // Loop MUNDUR (Terbaru di atas)
        for (let i = data.length - 1; i >= 0; i--) {
            const row = data[i];
            const jamRapi = timeLabels[i]; // Ambil label jam yang sesuai urutan

            const diff = parseFloat(row.tds_in) - parseFloat(row.tds_out);
            const statusRow = diff < 200
                ? '<span style="color:orange;font-weight:bold">Menurun</span>'
                : '<span style="color:green;font-weight:bold">Normal</span>';

            // Highlight baris pertama
            const bgStyle = (i === data.length - 1) ? 'style="background-color: rgba(0,0,0,0.05);"' : '';

            const tr = `
                <tr ${bgStyle}>
                    <td>${data.length - i}</td> <td>${jamRapi}</td> <td>${row.tds_in}</td>
                    <td>${row.tds_out}</td>
                    <td>${diff.toFixed(2)}</td>
                    <td>${statusRow}</td>
                </tr>
            `;
            tbody.innerHTML += tr;
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