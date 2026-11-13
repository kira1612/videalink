<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('activity_logs', 'user_id')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });

            // Backfill existing activity logs with user_id from devices if available, or fallback to first user
            try {
                DB::statement("UPDATE activity_logs al JOIN devices d ON al.device_id = d.id SET al.user_id = d.user_id WHERE al.device_id IS NOT NULL");
                $firstUser = DB::table('users')->first();
                if ($firstUser) {
                    DB::table('activity_logs')->whereNull('user_id')->update(['user_id' => $firstUser->id]);
                }
            } catch (\Throwable $e) {
                // Ignore if tables are empty
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('activity_logs', 'user_id')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }
    }
};

