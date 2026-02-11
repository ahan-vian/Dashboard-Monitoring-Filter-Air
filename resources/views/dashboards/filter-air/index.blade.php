<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Monitoring Kualitas Air</title>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <link rel="stylesheet" href="{{ asset('assets/dashboards/filter-air/css/style.css') }}">
</head>

<body>

    <div class="container">
        <header>
            <h1>Dashboard Monitoring Kualitas Air & Efektivitas Filter</h1>
            <button class="btn-refresh" onclick="window.location.reload()">Refresh</button>
        </header>

        <div class="top-cards">
            <div class="card c-purple">
                <h3>TDS Sebelum Filter (IN)</h3>
                <div class="value"><span id="kpi-in">—</span> <span class="unit">ppm</span></div>
                <div class="sub-text" id="last-update-in">Terakhir update: —</div>
            </div>

            <div class="card c-blue">
                <h3>TDS Sesudah Filter</h3>
                <div class="value"><span id="kpi-out">—</span> <span class="unit">ppm</span></div>
                <div class="sub-text" id="last-update-out">Terakhir update: —</div>
            </div>

            <div class="card c-orange">
                <h3>ΔTDS (IN - OUT)</h3>
                <div class="value"><span id="kpi-delta">—</span> <span class="unit">ppm</span></div>
                <div class="sub-text">Semakin besar = filter semakin efektif</div>
            </div>

            <div class="card c-green">
                <h3>Status Efektivitas Filter</h3>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <span class="status-icon" id="kpi-icon">✓</span>
                    <div class="value" id="kpi-status">—</div>
                </div>
                <div class="sub-text">Ambang ΔTDS < 200 Warning</div>
                </div>
            </div>

            <div class="charts-section">
                <div class="chart-container bg-chart-red">
                    <h3>GRAFIK TDS SEBELUM DAN SESUDAH FILTER</h3>
                    <div class="canvas-wrapper">
                        <canvas id="chartComparison"></canvas>
                    </div>
                </div>

                <div class="chart-container bg-chart-yellow">
                    <h3 style="color: #333;">GRAFIK ΔTDS (IN - OUT)</h3>
                    <div class="canvas-wrapper">
                        <canvas id="chartDelta"></canvas>
                    </div>
                </div>
            </div>

            <div class="table-section">
                <div class="table-header">
                    <h3>RIWAYAT DATA MONITORING</h3>
                    <button class="btn-export">Export CSV</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Waktu</th>
                            <th>TDS IN (ppm)</th>
                            <th>TDS OUT (ppm)</th>
                            <th>ΔTDS (ppm)</th>
                            <th>Status Filter</th>
                        </tr>
                    </thead>
                    <tbody id="historyBody">
                        <!-- kosongin aja, hapus semua row dummy -->
                    </tbody>

                </table>
            </div>
        </div>

        <script src="{{ asset('assets/dashboards/filter-air/js/script.js') }}"></script>

</body>

</html>