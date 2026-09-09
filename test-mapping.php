<?php
require __DIR__.'/backend/vendor/autoload.php';
$app = require_once __DIR__.'/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Reset timezone to Asia/Jakarta for first user
App\Models\User::query()->update(['timezone' => 'Asia/Jakarta']);
echo "All users reset to Asia/Jakarta timezone.\n";

// Verify
$users = App\Models\User::all(['id', 'name', 'timezone']);
foreach ($users as $u) {
    echo "User #{$u->id} {$u->name}: {$u->timezone}\n";
}
