<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use DatabaseTransactions;

    public function test_plans_endpoint_returns_seeded_tiers(): void
    {
        $response = $this->getJson('/api/v1/billing/plans');

        $response->assertOk()
            ->assertJsonCount(5, 'plans')
            ->assertJsonPath('plans.0.code', 'starter')
            ->assertJsonPath('plans.0.limits.devices', 1)
            ->assertJsonPath('plans.0.limits.buckets', 1)
            ->assertJsonPath('plans.0.limits.rooms', 0)
            ->assertJsonPath('plans.0.limits.retention_days', 7)
            ->assertJsonPath('plans.1.code', 'basic')
            ->assertJsonPath('plans.1.price_monthly', 30000)
            ->assertJsonPath('plans.1.limits.devices', 3)
            ->assertJsonPath('plans.1.limits.buckets', 4)
            ->assertJsonPath('plans.1.limits.rooms', 1)
            ->assertJsonPath('plans.1.limits.endpoints', 2)
            ->assertJsonPath('plans.1.limits.retention_days', 14)
            ->assertJsonPath('plans.2.code', 'plus')
            ->assertJsonPath('plans.2.price_monthly', 70000)
            ->assertJsonPath('plans.2.limits.devices', 5)
            ->assertJsonPath('plans.2.limits.buckets', 8)
            ->assertJsonPath('plans.2.limits.rooms', 3)
            ->assertJsonPath('plans.2.limits.endpoints', 5)
            ->assertJsonPath('plans.2.limits.retention_days', 30)
            ->assertJsonPath('plans.3.code', 'pro')
            ->assertJsonPath('plans.4.code', 'enterprise');
    }

    public function test_user_can_subscribe_replay_idempotently_cancel_resume_and_upgrade(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Default implicit starter entitlement
        $this->getJson('/api/v1/billing/current')
            ->assertOk()
            ->assertJsonPath('plan.code', 'starter')
            ->assertJsonPath('is_default_free', true)
            ->assertJsonPath('usage.devices.limit', 1)
            ->assertJsonPath('usage.buckets.limit', 1)
            ->assertJsonPath('usage.rooms.limit', 0);

        // Subscribe to Pro monthly (attempts to pass tampered price should be ignored server-side)
        $idemKey = 'test_idem_' . uniqid('', true);
        $subRes = $this->postJson('/api/v1/billing/subscribe', [
            'plan_code' => 'pro',
            'billing_cycle' => 'monthly',
            'payment_method' => 'qris',
            'idempotency_key' => $idemKey,
            'price_paid' => 1,
            'total_amount' => 1,
        ]);

        $subRes->assertCreated()
            ->assertJsonPath('idempotent_replay', false)
            ->assertJsonPath('invoice.total_amount', 149000)
            ->assertJsonPath('summary.plan.code', 'pro')
            ->assertJsonPath('summary.usage.devices.limit', 25);

        // Same idempotency key replays cleanly without creating a second invoice
        $this->postJson('/api/v1/billing/subscribe', [
            'plan_code' => 'pro',
            'billing_cycle' => 'monthly',
            'payment_method' => 'qris',
            'idempotency_key' => $idemKey,
        ])
            ->assertOk()
            ->assertJsonPath('idempotent_replay', true);

        $this->assertSame(1, Invoice::where('user_id', $user->id)->count());

        // Duplicate checkout without idempotency key on exact same active plan+cycle returns 409
        $this->postJson('/api/v1/billing/subscribe', [
            'plan_code' => 'pro',
            'billing_cycle' => 'monthly',
            'payment_method' => 'va_bca',
        ])->assertStatus(409);

        // Cancel auto-renew at period end
        $this->postJson('/api/v1/billing/cancel', ['reason' => 'Testing cancel'])
            ->assertOk()
            ->assertJsonPath('summary.subscription.is_canceled_at_period_end', true)
            ->assertJsonPath('summary.subscription.auto_renew', false);

        // Resume subscription
        $this->postJson('/api/v1/billing/resume')
            ->assertOk()
            ->assertJsonPath('summary.subscription.is_canceled_at_period_end', false)
            ->assertJsonPath('summary.subscription.auto_renew', true);

        // Upgrade to Enterprise yearly supersedes previous active subscription
        $this->postJson('/api/v1/billing/subscribe', [
            'plan_code' => 'enterprise',
            'billing_cycle' => 'yearly',
            'payment_method' => 'va_mandiri',
        ])
            ->assertCreated()
            ->assertJsonPath('invoice.total_amount', 4790000)
            ->assertJsonPath('summary.plan.code', 'enterprise')
            ->assertJsonPath('summary.usage.devices.unlimited', true);

        $this->assertSame(
            1,
            Subscription::where('user_id', $user->id)->where('status', 'active')->count()
        );
        $this->assertSame(
            1,
            Subscription::where('user_id', $user->id)->where('status', 'superseded')->count()
        );

        // Invoice list & cross-user isolation check
        $invoicesRes = $this->getJson('/api/v1/billing/invoices')->assertOk();
        $this->assertCount(2, $invoicesRes->json('invoices'));
        $firstInvoiceId = $invoicesRes->json('invoices.0.id');

        $otherUser = User::factory()->create();
        Sanctum::actingAs($otherUser);
        $this->getJson("/api/v1/billing/invoices/{$firstInvoiceId}")->assertForbidden();
    }

    public function test_room_and_device_quotas_across_starter_basic_and_plus(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Free/Starter gets 0 3D rooms
        $this->postJson('/api/v1/rooms', [
            'name' => 'Ruang Tamu',
        ])
            ->assertStatus(402)
            ->assertJsonPath('error_code', 'QUOTA_EXCEEDED')
            ->assertJsonPath('resource', 'rooms')
            ->assertJsonPath('limit', 0);

        // Free/Starter allows 1 device, blocks 2nd
        Device::create([
            'user_id' => $user->id,
            'name' => 'Sensor 1',
            'type' => 'ESP32',
            'protocol' => 'http',
            'status' => 'offline',
            'credentials' => str_repeat('1', 32),
        ]);

        $this->postJson('/api/v1/devices', [
            'name' => 'Sensor Ke-2',
            'type' => 'ESP32',
            'protocol' => 'http',
        ])
            ->assertStatus(402)
            ->assertJsonPath('error_code', 'QUOTA_EXCEEDED')
            ->assertJsonPath('resource', 'devices')
            ->assertJsonPath('limit', 1);

        // Basic (Rp 30.000/bulan) unlocks 1 3D room and 3 devices
        $this->postJson('/api/v1/billing/subscribe', [
            'plan_code' => 'basic',
            'billing_cycle' => 'monthly',
            'payment_method' => 'qris',
        ])
            ->assertCreated()
            ->assertJsonPath('invoice.total_amount', 30000)
            ->assertJsonPath('summary.usage.rooms.limit', 1)
            ->assertJsonPath('summary.usage.devices.limit', 3);

        $this->postJson('/api/v1/rooms', ['name' => 'Ruang Tamu'])->assertCreated();
        $this->postJson('/api/v1/rooms', ['name' => 'Ruang Kerja'])
            ->assertStatus(402)
            ->assertJsonPath('limit', 1);

        // Plus (Rp 70.000/bulan) unlocks 3 3D rooms and 5 devices
        $this->postJson('/api/v1/billing/subscribe', [
            'plan_code' => 'plus',
            'billing_cycle' => 'monthly',
            'payment_method' => 'va_bca',
        ])
            ->assertCreated()
            ->assertJsonPath('invoice.total_amount', 70000)
            ->assertJsonPath('summary.usage.rooms.limit', 3)
            ->assertJsonPath('summary.usage.devices.limit', 5)
            ->assertJsonPath('summary.usage.buckets.limit', 8)
            ->assertJsonPath('summary.usage.endpoints.limit', 5);

        $this->postJson('/api/v1/rooms', ['name' => 'Ruang Kerja'])->assertCreated();
    }
}
