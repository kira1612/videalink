<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('automations', function (Blueprint $table) {
            $table->unsignedBigInteger('trigger_count')->default(0)->after('is_active');
            $table->timestamp('last_triggered_at')->nullable()->after('trigger_count');
        });
    }

    public function down(): void
    {
        Schema::table('automations', function (Blueprint $table) {
            $table->dropColumn(['trigger_count', 'last_triggered_at']);
        });
    }
};

