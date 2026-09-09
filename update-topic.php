<?php
require __DIR__.'/backend/vendor/autoload.php';
$app = require_once __DIR__.'/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$b = App\Models\DataBucket::find(8);
if ($b) {
    $b->mqtt_topic = 'suhu';
    $b->save();
    echo "Updated Bucket 8 to use topic 'suhu'.\n";
}
