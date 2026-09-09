<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/api/v1/buckets/1/widgets', 'PUT', [
    'widgets' => [
        [
            'id' => '1',
            'type' => 'gauge',
            'field' => 'temp',
            'config' => ['min' => 10, 'max' => 50]
        ]
    ]
]);
$request->headers->set('Accept', 'application/json');
$user = App\Models\User::first();
$request->setUserResolver(function() use ($user) { return $user; });
Auth::login($user);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
