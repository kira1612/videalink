<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->string('tagline', 180)->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price_monthly')->default(0);
            $table->unsignedBigInteger('price_yearly')->default(0);
            $table->string('currency', 10)->default('IDR');
            $table->unsignedInteger('max_devices')->nullable();
            $table->unsignedInteger('max_buckets')->nullable();
            $table->unsignedInteger('max_rooms')->nullable();
            $table->unsignedInteger('max_endpoints')->nullable();
            $table->unsignedInteger('retention_days')->default(7);
            $table->json('features')->nullable();
            $table->string('badge', 60)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->string('billing_cycle', 20)->default('monthly'); // monthly, yearly
            $table->string('status', 30)->default('active'); // active, superseded, expired
            $table->unsignedBigInteger('price_paid')->default(0);
            $table->string('currency', 10)->default('IDR');
            $table->string('payment_method', 50)->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('superseded_at')->nullable();
            $table->string('cancel_reason', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'ends_at']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 60)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->string('plan_name', 100);
            $table->string('billing_cycle', 20);
            $table->unsignedBigInteger('amount')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->string('currency', 10)->default('IDR');
            $table->string('status', 30)->default('paid'); // paid, pending, failed, refunded
            $table->string('payment_method', 50);
            $table->string('payment_channel_label', 120)->nullable();
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};

