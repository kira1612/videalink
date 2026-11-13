<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'tagline',
        'description',
        'price_monthly',
        'price_yearly',
        'currency',
        'max_devices',
        'max_buckets',
        'max_rooms',
        'max_endpoints',
        'retention_days',
        'features',
        'badge',
        'sort_order',
        'is_featured',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_monthly' => 'integer',
            'price_yearly' => 'integer',
            'max_devices' => 'integer',
            'max_buckets' => 'integer',
            'max_rooms' => 'integer',
            'max_endpoints' => 'integer',
            'retention_days' => 'integer',
            'features' => 'array',
            'sort_order' => 'integer',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    public function priceForCycle(string $cycle): int
    {
        return $cycle === 'yearly' ? (int) $this->price_yearly : (int) $this->price_monthly;
    }

    public function yearlySavings(): int
    {
        $annualMonthlyCost = (int) $this->price_monthly * 12;
        if ($annualMonthlyCost <= 0 || $this->price_yearly >= $annualMonthlyCost) {
            return 0;
        }
        return $annualMonthlyCost - (int) $this->price_yearly;
    }
}

