<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('filter_air_logs', function (Blueprint $table) {
            $table->id();
            $table->decimal('tds_in', 10, 2);
            $table->decimal('tds_out', 10, 2);
            $table->timestamp('measured_at')->index();
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('filter_air_logs');
    }
};
