<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type')->default('ESP32');
            $table->enum('status', ['online', 'offline', 'warning'])->default('offline');
            $table->string('ip')->nullable();
            $table->string('location')->nullable();
            $table->string('firmware')->default('v1.0.0');
            $table->integer('signal')->default(-60);
            $table->string('uptime')->default('-');
            $table->json('tags')->nullable();
            $table->json('resources')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
