<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilterAirLog extends Model
{
    protected $fillable = ['tds_in', 'tds_out', 'measured_at'];

    protected $casts = [
        'measured_at' => 'datetime',
    ];
}
