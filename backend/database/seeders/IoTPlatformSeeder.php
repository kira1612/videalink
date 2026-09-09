<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\BucketRecord;
use App\Models\DataBucket;
use App\Models\Device;
use App\Models\Endpoint;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class IoTPlatformSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $user = User::updateOrCreate(
            ['email' => 'admin@iot-platform.io'],
            [
                'name' => 'Viki Riyadi',
                'password' => Hash::make('password123'),
            ]
        );

        // Create devices
        $devicesData = [
            [
                'name' => 'ESP32-Sensor-Lab',
                'type' => 'ESP32',
                'status' => 'online',
                'ip' => '192.168.1.101',
                'location' => 'Lab A - Lantai 2',
                'firmware' => 'v2.1.4',
                'signal' => -45,
                'uptime' => '3d 14h 22m',
                'tags' => ['sensor', 'lab', 'temperature'],
                'resources' => ['temperature' => 28.4, 'humidity' => 62.1, 'pressure' => 1013.2],
                'last_seen_at' => now(),
            ],
            [
                'name' => 'RaspberryPi-Gateway',
                'type' => 'Raspberry Pi 4',
                'status' => 'online',
                'ip' => '192.168.1.102',
                'location' => 'Server Room',
                'firmware' => 'v1.8.0',
                'signal' => -38,
                'uptime' => '15d 2h 5m',
                'tags' => ['gateway', 'mqtt'],
                'resources' => ['cpu' => 34, 'memory' => 58, 'disk' => 72],
                'last_seen_at' => now(),
            ],
            [
                'name' => 'Arduino-WaterLevel',
                'type' => 'Arduino Uno',
                'status' => 'offline',
                'ip' => '192.168.1.103',
                'location' => 'Basement - Tank Room',
                'firmware' => 'v1.2.1',
                'signal' => -80,
                'uptime' => '-',
                'tags' => ['water', 'level', 'sensor'],
                'resources' => ['waterLevel' => 0],
                'last_seen_at' => now()->subMinutes(45),
            ],
            [
                'name' => 'ESP8266-SmartPlug',
                'type' => 'ESP8266',
                'status' => 'online',
                'ip' => '192.168.1.104',
                'location' => 'Office - Desk Area',
                'firmware' => 'v3.0.2',
                'signal' => -55,
                'uptime' => '1d 8h 44m',
                'tags' => ['power', 'smart', 'plug'],
                'resources' => ['power' => 145.2, 'voltage' => 220.8, 'current' => 0.66],
                'last_seen_at' => now(),
            ],
            [
                'name' => 'ESP32-AirQuality',
                'type' => 'ESP32',
                'status' => 'warning',
                'ip' => '192.168.1.105',
                'location' => 'Parking Area',
                'firmware' => 'v2.0.1',
                'signal' => -70,
                'uptime' => '5h 12m',
                'tags' => ['air', 'quality', 'outdoor'],
                'resources' => ['co2' => 450, 'pm25' => 38, 'pm10' => 55],
                'last_seen_at' => now()->subMinutes(2),
            ],
            [
                'name' => 'NodeMCU-DoorSensor',
                'type' => 'NodeMCU',
                'status' => 'online',
                'ip' => '192.168.1.106',
                'location' => 'Main Entrance',
                'firmware' => 'v1.5.3',
                'signal' => -42,
                'uptime' => '7d 3h 55m',
                'tags' => ['door', 'security', 'sensor'],
                'resources' => ['doorState' => 'closed', 'openCount' => 127],
                'last_seen_at' => now(),
            ],
        ];

        $devices = [];
        foreach ($devicesData as $data) {
            $devices[] = Device::create(array_merge($data, ['user_id' => $user->id]));
        }

        // Create buckets
        $bucket1 = DataBucket::create([
            'device_id' => $devices[0]->id,
            'name' => 'temperature_readings',
            'description' => 'Temperature & humidity readings from Lab A',
            'enabled' => true,
            'fields' => ['temperature', 'humidity', 'pressure'],
        ]);

        $bucket2 = DataBucket::create([
            'device_id' => $devices[3]->id,
            'name' => 'power_consumption',
            'description' => 'Power usage monitoring data',
            'enabled' => true,
            'fields' => ['power', 'voltage', 'current'],
        ]);

        $bucket3 = DataBucket::create([
            'device_id' => $devices[4]->id,
            'name' => 'air_quality_log',
            'description' => 'Outdoor air quality monitoring',
            'enabled' => true,
            'fields' => ['co2', 'pm25', 'pm10'],
        ]);

        $bucket4 = DataBucket::create([
            'device_id' => $devices[5]->id,
            'name' => 'door_events',
            'description' => 'Door open/close events log',
            'enabled' => false,
            'fields' => ['state', 'timestamp'],
        ]);

        // Seed bucket records
        for ($i = 0; $i < 20; $i++) {
            BucketRecord::create([
                'data_bucket_id' => $bucket1->id,
                'data' => [
                    'temperature' => round(25 + rand(-5, 10) + (rand(0, 9) / 10), 1),
                    'humidity' => round(60 + rand(-10, 15) + (rand(0, 9) / 10), 1),
                    'pressure' => round(1013 + rand(-5, 5) + (rand(0, 9) / 10), 1),
                ],
                'recorded_at' => now()->subMinutes($i * 5),
            ]);

            BucketRecord::create([
                'data_bucket_id' => $bucket2->id,
                'data' => [
                    'power' => round(140 + rand(-20, 30) + (rand(0, 9) / 10), 1),
                    'voltage' => round(220 + rand(-5, 5) + (rand(0, 9) / 10), 1),
                    'current' => round(0.6 + rand(0, 2) / 10, 2),
                ],
                'recorded_at' => now()->subMinutes($i * 3),
            ]);
        }

        // Create endpoints
        Endpoint::create([
            'device_id' => $devices[0]->id,
            'name' => 'temperature-alert',
            'description' => 'Send alert when temperature exceeds 35°C',
            'type' => 'EMAIL',
            'enabled' => true,
            'config' => ['email' => 'admin@iot-platform.io', 'subject' => 'High Temperature Alert'],
            'trigger_count' => 12,
            'last_triggered_at' => now()->subMinutes(30),
        ]);

        Endpoint::create([
            'device_id' => $devices[3]->id,
            'name' => 'power-webhook',
            'description' => 'POST power data to external API on high usage',
            'type' => 'HTTP',
            'enabled' => true,
            'config' => ['url' => 'https://api.example.com/power', 'method' => 'POST'],
            'trigger_count' => 45,
            'last_triggered_at' => now()->subMinutes(15),
        ]);

        Endpoint::create([
            'device_id' => $devices[4]->id,
            'name' => 'air-quality-slack',
            'description' => 'Notify Slack when PM2.5 exceeds threshold',
            'type' => 'SLACK',
            'enabled' => true,
            'config' => ['webhook' => 'https://hooks.slack.com/...', 'channel' => '#alerts'],
            'trigger_count' => 3,
            'last_triggered_at' => now()->subHours(2),
        ]);

        Endpoint::create([
            'device_id' => $devices[5]->id,
            'name' => 'door-telegram',
            'description' => 'Telegram notification on door open',
            'type' => 'TELEGRAM',
            'enabled' => false,
            'config' => ['chatId' => '-100123456789'],
            'trigger_count' => 127,
            'last_triggered_at' => now()->subHours(5),
        ]);

        // Activity logs
        $activityData = [
            ['device_id' => $devices[0]->id, 'device_name' => 'ESP32-Sensor-Lab', 'event' => 'Data written to bucket', 'type' => 'info'],
            ['device_id' => $devices[4]->id, 'device_name' => 'ESP32-AirQuality', 'event' => 'Signal strength warning: -70 dBm', 'type' => 'warning'],
            ['device_id' => $devices[2]->id, 'device_name' => 'Arduino-WaterLevel', 'event' => 'Device went offline', 'type' => 'error'],
            ['device_id' => $devices[5]->id, 'device_name' => 'NodeMCU-DoorSensor', 'event' => 'Door opened (event #127)', 'type' => 'info'],
            ['device_id' => $devices[3]->id, 'device_name' => 'ESP8266-SmartPlug', 'event' => 'Endpoint "power-webhook" triggered', 'type' => 'info'],
            ['device_id' => $devices[1]->id, 'device_name' => 'RaspberryPi-Gateway', 'event' => 'Firmware check: up to date', 'type' => 'success'],
        ];

        foreach ($activityData as $i => $log) {
            ActivityLog::create(array_merge($log, ['created_at' => now()->subMinutes($i * 10)]));
        }

        $this->command->info('✅ IoT Platform seeded successfully!');
        $this->command->info('   Email: admin@iot-platform.io');
        $this->command->info('   Password: password123');
    }
}
