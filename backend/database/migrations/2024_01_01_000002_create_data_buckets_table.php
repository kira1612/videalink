<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_buckets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(true);
            $table->json('fields')->nullable();
            $table->timestamps();
        });

        Schema::create('bucket_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_bucket_id')->constrained()->onDelete('cascade');
            $table->json('data');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bucket_records');
        Schema::dropIfExists('data_buckets');
    }
};
