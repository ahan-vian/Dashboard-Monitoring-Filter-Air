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
            ->map(fn ($r) => [
                'tds_in'  => (float) $r->tds_in,
                'tds_out' => (float) $r->tds_out,
                'waktu'   => $r->measured_at->toISOString(),
            ]);

        return response()->json([
            'status' => 'ok',
            'data'   => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tds_in'      => 'required|numeric',
            'tds_out'     => 'required|numeric',
            'measured_at' => 'required|date',
        ]);

        $row = FilterAirLog::create($data);

        return response()->json([
            'status'  => 'ok',
            'message' => 'inserted',
            'id'      => $row->id,
        ], 201);
    }
}
