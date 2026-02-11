<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\FilterAirController;

Route::get('/filter-air/window', [FilterAirController::class, 'window']);
Route::post('/filter-air/log', [FilterAirController::class, 'store']);
Route::get('/filter-air/export', [FilterAirController::class, 'exportCsv']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
