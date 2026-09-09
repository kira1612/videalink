<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bucket = App\Models\DataBucket::where('name', 'Sensor Bucket')->first();
if ($bucket) {
    $bucket->fields = ['temperature', 'humidity', 'voltage'];
    $bucket->widgets = [
        ['id' => '1', 'type' => 'line', 'field' => 'temperature', 'title' => 'Temperature Chart'],
        ['id' => '2', 'type' => 'bar', 'field' => 'humidity', 'title' => 'Humidity Chart'],
        ['id' => '3', 'type' => 'stat', 'field' => 'voltage', 'title' => 'Current Voltage']
    ];
    $bucket->save();
    echo "Widgets added successfully.\n";
} else {
    echo "Bucket not found.\n";
}
