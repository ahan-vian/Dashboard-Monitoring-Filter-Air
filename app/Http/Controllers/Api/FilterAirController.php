<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FilterAirLog;
use Illuminate\Http\Request;

class FilterAirController extends Controller
{
    public function window(Request $request)
    {
        $limit = (int) $request->query('limit', 15);
        $limit = max(1, min($limit, 200));

        $rows = FilterAirLog::orderBy('measured_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($r) => [
                'tds_in' => (float) $r->tds_in,
                'tds_out' => (float) $r->tds_out,
                'waktu' => $r->measured_at->toISOString(),
            ]);

        return response()->json([
            'status' => 'ok',
            'data' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tds_in' => 'required|numeric',
            'tds_out' => 'required|numeric',
            'measured_at' => 'required|date',
        ]);

        $row = FilterAirLog::create($data);

        return response()->json([
            'status' => 'ok',
            'message' => 'inserted',
            'id' => $row->id,
        ], 201);
    }
    public function exportCsv(Request $request)
    {
        $limit = (int) $request->query('limit', 200);
        $limit = max(1, min($limit, 5000));

        $rows = FilterAirLog::orderBy('measured_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        $filename = 'filter-air-log_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($rows) {
            $out = fopen('php://output', 'w');

            // BOM biar Excel kebaca UTF-8
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($out, ['no', 'measured_at', 'tds_in', 'tds_out', 'delta_tds']);

            $no = 1;
            foreach ($rows as $r) {
                $delta = (float) $r->tds_in - (float) $r->tds_out;
                fputcsv($out, [
                    $no++,
                    $r->measured_at?->toDateTimeString(),
                    (float) $r->tds_in,
                    (float) $r->tds_out,
                    $delta,
                ]);
            }

            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }

}
