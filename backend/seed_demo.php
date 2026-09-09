<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Device;
use App\Models\DataBucket;
use Illuminate\Support\Str;

$user = User::first();
if (!$user) {
    $user = User::create([
        'name' => 'Demo User',
        'email' => 'demo@example.com',
        'password' => bcrypt('password')
    ]);
}

$device = Device::first();
if (!$device) {
    $deviceId = 'DEV-' . strtoupper(Str::random(6));
    $device = Device::create([
        'id' => $deviceId,
        'user_id' => $user->id,
        'name' => 'Dummy ESP32',
        'type' => 'ESP32',
        'protocol' => 'mqtt',
        'broker_config' => ['host' => 'test.mosquitto.org', 'port' => 1883],
        'status' => 'online'
    ]);
}

$bucket = DataBucket::where('device_id', $device->id)->first();
if (!$bucket) {
    $bucket = DataBucket::create([
        'device_id' => $device->id,
        'name' => 'Sensor Bucket',
        'enabled' => true
    ]);
}

echo $device->id;
