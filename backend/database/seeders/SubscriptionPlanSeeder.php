<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public static function defaultPlans(): array
    {
        return [
            [
                'code' => 'starter',
                'name' => 'Starter',
                'tagline' => 'Untuk uji coba awal dan satu perangkat smart home.',
                'description' => 'Mulai pantau perangkat IoT Anda secara real-time dengan paket gratis.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'currency' => 'IDR',
                'max_devices' => 1,
                'max_buckets' => 1,
                'max_rooms' => 0,
                'max_endpoints' => 1,
                'retention_days' => 7,
                'features' => [
                    '1 Perangkat IoT',
                    '1 Data Bucket Telemetri',
                    'Tanpa Ruangan & Denah 3D',
                    '1 Endpoint Integrasi',
                    'Retensi Data 7 Hari',
                    'Kustomisasi Widget Dashboard',
                ],
                'badge' => null,
                'sort_order' => 1,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'code' => 'basic',
                'name' => 'Basic',
                'tagline' => 'Untuk mulai membangun proyek IoT dengan 1 denah ruangan 3D.',
                'description' => 'Paket hemat dengan 3 perangkat, 4 data bucket, 1 ruangan 3D, dan retensi 14 hari.',
                'price_monthly' => 30000,
                'price_yearly' => 288000,
                'currency' => 'IDR',
                'max_devices' => 3,
                'max_buckets' => 4,
                'max_rooms' => 1,
                'max_endpoints' => 2,
                'retention_days' => 14,
                'features' => [
                    'Hingga 3 Perangkat IoT',
                    '4 Data Bucket Telemetri',
                    '1 Ruangan & Denah 3D',
                    '2 Endpoint Integrasi',
                    'Retensi Data 14 Hari',
                    'Kustomisasi Widget Dashboard',
                ],
                'badge' => 'Hemat',
                'sort_order' => 2,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'code' => 'plus',
                'name' => 'Plus',
                'tagline' => 'Untuk proyek maker, prototipe aktif, dan smart home multi-ruangan.',
                'description' => 'Kapasitas seimbang dengan 5 perangkat, 8 bucket, 3 ruangan 3D, dan retensi 30 hari.',
                'price_monthly' => 70000,
                'price_yearly' => 672000,
                'currency' => 'IDR',
                'max_devices' => 5,
                'max_buckets' => 8,
                'max_rooms' => 3,
                'max_endpoints' => 5,
                'retention_days' => 30,
                'features' => [
                    'Hingga 5 Perangkat IoT',
                    '8 Data Bucket Telemetri',
                    '3 Ruangan & Denah 3D',
                    '5 Endpoint Integrasi',
                    'Retensi Data 30 Hari',
                    'Kustomisasi Widget Dashboard',
                ],
                'badge' => 'Nilai Terbaik',
                'sort_order' => 3,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'code' => 'pro',
                'name' => 'Pro IoT',
                'tagline' => 'Untuk tim engineer, smart office, dan proyek produksi aktif.',
                'description' => 'Kapasitas lebih luas, retensi jangka panjang, dan automasi penuh untuk sistem IoT skala menengah.',
                'price_monthly' => 149000,
                'price_yearly' => 1430000,
                'currency' => 'IDR',
                'max_devices' => 25,
                'max_buckets' => 50,
                'max_rooms' => 15,
                'max_endpoints' => 25,
                'retention_days' => 90,
                'features' => [
                    'Hingga 25 Perangkat IoT',
                    '50 Data Bucket Real-time',
                    '15 Ruangan & Denah 3D',
                    '25 Endpoint Webhook & MQTT',
                    'Retensi Data 90 Hari',
                    'Prioritas Eksekusi Automations',
                ],
                'badge' => 'Paling Populer',
                'sort_order' => 4,
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'tagline' => 'Untuk deployment industrial, multi-gedung, dan armada besar.',
                'description' => 'Kuota perangkat dan bucket tanpa batas dengan retensi data tahunan.',
                'price_monthly' => 499000,
                'price_yearly' => 4790000,
                'currency' => 'IDR',
                'max_devices' => null,
                'max_buckets' => null,
                'max_rooms' => null,
                'max_endpoints' => null,
                'retention_days' => 365,
                'features' => [
                    'Perangkat IoT Tanpa Batas',
                    'Data Bucket Tanpa Batas',
                    'Ruangan & Denah 3D Tanpa Batas',
                    'Endpoint Integrasi Tanpa Batas',
                    'Retensi Data 365 Hari',
                    'Dukungan Prioritas & SLA',
                ],
                'badge' => 'Skala Penuh',
                'sort_order' => 5,
                'is_featured' => false,
                'is_active' => true,
            ],
        ];
    }

    public function run(): void
    {
        foreach (self::defaultPlans() as $planData) {
            SubscriptionPlan::updateOrCreate(
                ['code' => $planData['code']],
                $planData
            );
        }
    }
}
