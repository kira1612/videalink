<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\DataBucket;
use App\Models\Device;
use App\Models\Endpoint;
use App\Models\Invoice;
use App\Models\Room;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BillingService
{
    public const PAYMENT_METHODS = [
        'qris' => 'QRIS (Instant)',
        'va_bca' => 'Virtual Account BCA',
        'va_mandiri' => 'Virtual Account Mandiri',
        'va_bri' => 'Virtual Account BRI',
        'ewallet_gopay' => 'GoPay E-Wallet',
        'ewallet_ovo' => 'OVO E-Wallet',
        'card' => 'Kartu Kredit / Debit',
        'free_tier' => 'Aktivasi Paket Gratis',
    ];

    public const RESOURCE_LABELS = [
        'devices' => 'Perangkat IoT',
        'buckets' => 'Data Bucket',
        'rooms' => 'Ruangan 3D',
        'endpoints' => 'Endpoint Integrasi',
    ];

    public function ensurePlansSeeded(): void
    {
        if (SubscriptionPlan::count() === 0) {
            (new SubscriptionPlanSeeder())->run();
        }
    }

    public function getPlans(): array
    {
        $this->ensurePlansSeeded();

        return SubscriptionPlan::active()
            ->get()
            ->map(function (SubscriptionPlan $plan) {
                $yearlySavings = $plan->yearlySavings();
                $annualMonthlyCost = $plan->price_monthly * 12;
                $discountPercent = $annualMonthlyCost > 0
                    ? (int) round(($yearlySavings / $annualMonthlyCost) * 100)
                    : 0;

                return [
                    'id' => $plan->id,
                    'code' => $plan->code,
                    'name' => $plan->name,
                    'tagline' => $plan->tagline,
                    'description' => $plan->description,
                    'price_monthly' => $plan->price_monthly,
                    'price_yearly' => $plan->price_yearly,
                    'yearly_savings' => $yearlySavings,
                    'yearly_discount_percent' => $discountPercent,
                    'effective_monthly_on_yearly' => $plan->price_yearly > 0
                        ? (int) round($plan->price_yearly / 12)
                        : 0,
                    'currency' => $plan->currency,
                    'limits' => [
                        'devices' => $plan->max_devices,
                        'buckets' => $plan->max_buckets,
                        'rooms' => $plan->max_rooms,
                        'endpoints' => $plan->max_endpoints,
                        'retention_days' => $plan->retention_days,
                    ],
                    'features' => $plan->features ?? [],
                    'badge' => $plan->badge,
                    'is_featured' => $plan->is_featured,
                ];
            })
            ->values()
            ->all();
    }

    public function getUsageCounts(User $user): array
    {
        $deviceIdsQuery = Device::where('user_id', $user->id)->select('id');

        return [
            'devices' => Device::where('user_id', $user->id)->count(),
            'buckets' => DataBucket::whereIn('device_id', $deviceIdsQuery)->count(),
            'rooms' => Room::where('user_id', $user->id)->count(),
            'endpoints' => Endpoint::whereIn('device_id', $deviceIdsQuery)->count(),
        ];
    }

    public function expireOverdueSubscriptions(User $user): void
    {
        Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->update([
                'status' => 'expired',
                'auto_renew' => false,
            ]);
    }

    public function resolveActiveEntitlement(User $user): array
    {
        $this->ensurePlansSeeded();
        $this->expireOverdueSubscriptions($user);

        $subscription = Subscription::with('plan')
            ->where('user_id', $user->id)
            ->currentlyValid()
            ->latest('id')
            ->first();

        $plan = $subscription?->plan;
        $isImplicitFree = false;

        if (!$plan) {
            $plan = SubscriptionPlan::where('code', 'starter')->first()
                ?? SubscriptionPlan::active()->firstOrFail();
            $isImplicitFree = true;
        }

        return [
            'subscription' => $subscription,
            'plan' => $plan,
            'is_implicit_free' => $isImplicitFree,
        ];
    }

    public function getCurrentBillingSummary(User $user): array
    {
        $entitlement = $this->resolveActiveEntitlement($user);
        /** @var Subscription|null $subscription */
        $subscription = $entitlement['subscription'];
        /** @var SubscriptionPlan $plan */
        $plan = $entitlement['plan'];

        $counts = $this->getUsageCounts($user);
        $limitsMap = [
            'devices' => $plan->max_devices,
            'buckets' => $plan->max_buckets,
            'rooms' => $plan->max_rooms,
            'endpoints' => $plan->max_endpoints,
        ];

        $usage = [];
        foreach ($limitsMap as $key => $limit) {
            $current = $counts[$key] ?? 0;
            $unlimited = $limit === null;
            $percentage = $unlimited || $limit <= 0
                ? 0
                : min(100, (int) round(($current / $limit) * 100));

            $usage[$key] = [
                'label' => self::RESOURCE_LABELS[$key],
                'current' => $current,
                'limit' => $limit,
                'unlimited' => $unlimited,
                'percentage' => $percentage,
                'exceeded' => !$unlimited && $current >= $limit,
                'over_limit' => !$unlimited && $current > $limit,
            ];
        }

        $daysRemaining = null;
        if ($subscription && $subscription->ends_at) {
            $daysRemaining = max(0, (int) now()->diffInDays($subscription->ends_at, false));
        }

        return [
            'plan' => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->name,
                'tagline' => $plan->tagline,
                'price_monthly' => $plan->price_monthly,
                'price_yearly' => $plan->price_yearly,
                'currency' => $plan->currency,
                'retention_days' => $plan->retention_days,
                'features' => $plan->features ?? [],
                'badge' => $plan->badge,
            ],
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'billing_cycle' => $subscription->billing_cycle,
                'price_paid' => $subscription->price_paid,
                'currency' => $subscription->currency,
                'payment_method' => $subscription->payment_method,
                'payment_channel_label' => self::PAYMENT_METHODS[$subscription->payment_method] ?? $subscription->payment_method,
                'auto_renew' => $subscription->auto_renew,
                'starts_at' => $subscription->starts_at?->toISOString(),
                'ends_at' => $subscription->ends_at?->toISOString(),
                'canceled_at' => $subscription->canceled_at?->toISOString(),
                'is_canceled_at_period_end' => $subscription->isCanceledAtPeriodEnd(),
                'days_remaining' => $daysRemaining,
            ] : null,
            'is_default_free' => $entitlement['is_implicit_free'],
            'usage' => $usage,
            'payment_mode' => 'sandbox',
            'payment_methods' => collect(self::PAYMENT_METHODS)
                ->except(['free_tier'])
                ->map(fn($label, $id) => ['id' => $id, 'label' => $label])
                ->values()
                ->all(),
        ];
    }

    public function subscribe(User $user, array $payload): array
    {
        $this->ensurePlansSeeded();

        return DB::transaction(function () use ($user, $payload) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();

            $idempotencyKey = $payload['idempotency_key'] ?? null;
            if ($idempotencyKey) {
                $existingInvoice = Invoice::where('idempotency_key', $idempotencyKey)
                    ->where('user_id', $user->id)
                    ->first();

                if ($existingInvoice) {
                    return [
                        'idempotent_replay' => true,
                        'invoice' => $this->formatInvoice($existingInvoice),
                        'summary' => $this->getCurrentBillingSummary($user),
                    ];
                }
            }

            $plan = SubscriptionPlan::where('code', $payload['plan_code'])
                ->where('is_active', true)
                ->first();

            if (!$plan) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Paket langganan tidak ditemukan atau sudah tidak tersedia.',
                ], 404));
            }

            $cycle = $payload['billing_cycle'];
            $price = $plan->priceForCycle($cycle);
            $paymentMethod = $price === 0 ? 'free_tier' : $payload['payment_method'];

            if (!array_key_exists($paymentMethod, self::PAYMENT_METHODS)) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Metode pembayaran tidak valid.',
                ], 422));
            }

            $this->expireOverdueSubscriptions($user);

            $currentSub = Subscription::where('user_id', $user->id)
                ->currentlyValid()
                ->latest('id')
                ->first();

            // Guard against duplicate active subscription on the exact same plan and cycle
            if ($price === 0 && !$currentSub) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Akun Anda sudah menggunakan paket Starter gratis.',
                ], 409));
            }

            if (
                $currentSub &&
                (int) $currentSub->plan_id === (int) $plan->id &&
                ($price === 0 || ($currentSub->billing_cycle === $cycle && $currentSub->canceled_at === null))
            ) {
                throw new HttpResponseException(response()->json([
                    'message' => "Anda sudah memiliki langganan aktif untuk paket {$plan->name}.",
                ], 409));
            }

            if ($currentSub) {
                $currentSub->update([
                    'status' => 'superseded',
                    'auto_renew' => false,
                    'superseded_at' => now(),
                ]);
            }

            $startsAt = now();
            $endsAt = null;
            if ($price > 0) {
                $endsAt = $cycle === 'yearly'
                    ? $startsAt->copy()->addYear()
                    : $startsAt->copy()->addMonth();
            }

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'billing_cycle' => $cycle,
                'status' => 'active',
                'price_paid' => $price,
                'currency' => $plan->currency,
                'payment_method' => $paymentMethod,
                'auto_renew' => $price > 0,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'metadata' => [
                    'checkout_mode' => 'sandbox',
                    'previous_plan_id' => $currentSub?->plan_id,
                ],
            ]);

            $invoice = Invoice::create([
                'invoice_number' => $this->generateInvoiceNumber(),
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'billing_cycle' => $cycle,
                'amount' => $price,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total_amount' => $price,
                'currency' => $plan->currency,
                'status' => 'paid',
                'payment_method' => $paymentMethod,
                'payment_channel_label' => self::PAYMENT_METHODS[$paymentMethod],
                'idempotency_key' => $idempotencyKey,
                'paid_at' => $startsAt,
                'period_start' => $startsAt,
                'period_end' => $endsAt,
                'notes' => $price === 0
                    ? "Beralih ke paket {$plan->name}"
                    : "Pembelian paket {$plan->name} (" . ($cycle === 'yearly' ? 'Tahunan' : 'Bulanan') . ')',
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'device_id' => null,
                'device_name' => "Paket {$plan->name}",
                'event' => $price === 0
                    ? "Mengaktifkan paket {$plan->name} ({$invoice->invoice_number})"
                    : "Berhasil berlangganan paket {$plan->name} ({$invoice->invoice_number})",
                'type' => 'success',
            ]);

            return [
                'idempotent_replay' => false,
                'invoice' => $this->formatInvoice($invoice),
                'summary' => $this->getCurrentBillingSummary($user),
            ];
        });
    }

    public function cancel(User $user, ?string $reason = null): array
    {
        return DB::transaction(function () use ($user, $reason) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $this->expireOverdueSubscriptions($user);

            $subscription = Subscription::with('plan')
                ->where('user_id', $user->id)
                ->currentlyValid()
                ->whereNotNull('ends_at')
                ->latest('id')
                ->first();

            if (!$subscription) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Tidak ada langganan berbayar aktif yang dapat dibatalkan.',
                ], 404));
            }

            if ($subscription->canceled_at !== null) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Langganan Anda sudah dijadwalkan berhenti pada akhir periode.',
                ], 409));
            }

            $subscription->update([
                'canceled_at' => now(),
                'auto_renew' => false,
                'cancel_reason' => $reason ? Str::limit(trim($reason), 255) : null,
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'device_id' => null,
                'device_name' => "Paket {$subscription->plan->name}",
                'event' => "Membatalkan perpanjangan otomatis paket {$subscription->plan->name} (aktif s/d " . $subscription->ends_at->format('d M Y') . ')',
                'type' => 'warning',
            ]);

            return $this->getCurrentBillingSummary($user);
        });
    }

    public function resume(User $user): array
    {
        return DB::transaction(function () use ($user) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $this->expireOverdueSubscriptions($user);

            $subscription = Subscription::with('plan')
                ->where('user_id', $user->id)
                ->currentlyValid()
                ->whereNotNull('ends_at')
                ->whereNotNull('canceled_at')
                ->latest('id')
                ->first();

            if (!$subscription) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Tidak ada langganan yang menunggu pembatalan untuk dilanjutkan.',
                ], 404));
            }

            $subscription->update([
                'canceled_at' => null,
                'cancel_reason' => null,
                'auto_renew' => true,
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'device_id' => null,
                'device_name' => "Paket {$subscription->plan->name}",
                'event' => "Melanjutkan perpanjangan otomatis paket {$subscription->plan->name}",
                'type' => 'success',
            ]);

            return $this->getCurrentBillingSummary($user);
        });
    }

    public function getInvoices(User $user): array
    {
        return Invoice::where('user_id', $user->id)
            ->latest('id')
            ->get()
            ->map(fn(Invoice $invoice) => $this->formatInvoice($invoice))
            ->values()
            ->all();
    }

    public function formatInvoice(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'plan_id' => $invoice->plan_id,
            'plan_name' => $invoice->plan_name,
            'billing_cycle' => $invoice->billing_cycle,
            'amount' => $invoice->amount,
            'discount_amount' => $invoice->discount_amount,
            'tax_amount' => $invoice->tax_amount,
            'total_amount' => $invoice->total_amount,
            'currency' => $invoice->currency,
            'status' => $invoice->status,
            'payment_method' => $invoice->payment_method,
            'payment_channel_label' => $invoice->payment_channel_label,
            'paid_at' => $invoice->paid_at?->toISOString(),
            'period_start' => $invoice->period_start?->toISOString(),
            'period_end' => $invoice->period_end?->toISOString(),
            'notes' => $invoice->notes,
            'created_at' => $invoice->created_at?->toISOString(),
        ];
    }

    public function assertQuotaAvailable(User $user, string $resource): void
    {
        $entitlement = $this->resolveActiveEntitlement($user);
        /** @var SubscriptionPlan $plan */
        $plan = $entitlement['plan'];

        $limit = match ($resource) {
            'devices' => $plan->max_devices,
            'buckets' => $plan->max_buckets,
            'rooms' => $plan->max_rooms,
            'endpoints' => $plan->max_endpoints,
            default => null,
        };

        if ($limit === null) {
            return;
        }

        $counts = $this->getUsageCounts($user);
        $current = $counts[$resource] ?? 0;

        if ($current >= $limit) {
            $label = self::RESOURCE_LABELS[$resource] ?? $resource;
            $message = $limit === 0
                ? "Fitur {$label} tidak tersedia pada paket {$plan->name}. Silakan upgrade paket Anda."
                : "Kuota {$label} untuk paket {$plan->name} telah penuh ({$current}/{$limit}). Silakan upgrade paket Anda.";

            throw new HttpResponseException(response()->json([
                'message' => $message,
                'error_code' => 'QUOTA_EXCEEDED',
                'resource' => $resource,
                'current' => $current,
                'limit' => $limit,
                'plan_code' => $plan->code,
                'plan_name' => $plan->name,
            ], 402));
        }
    }

    private function generateInvoiceNumber(): string
    {
        $prefix = 'INV-VL-' . now()->format('Ym') . '-';
        do {
            $candidate = $prefix . strtoupper(Str::random(6));
        } while (Invoice::where('invoice_number', $candidate)->exists());

        return $candidate;
    }
}

