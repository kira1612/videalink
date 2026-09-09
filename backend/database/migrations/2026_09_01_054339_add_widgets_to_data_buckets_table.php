<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('data_buckets', function (Blueprint $table) {
            $table->json('widgets')->nullable()->after('fields');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_buckets', function (Blueprint $table) {
            $table->dropColumn('widgets');
        });
    }
};
