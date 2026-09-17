<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\BucketController;
use App\Http\Controllers\Api\EndpointController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/devices/{device}/telemetry', [DeviceController::class, 'telemetry']);
    Route::get('/buckets/mqtt-map', [BucketController::class, 'mqttMap']);
    Route::post('/buckets/{bucket}/records', [BucketController::class, 'storeRecord']);
});

// Protected routes (require Sanctum token)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // User profile and management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'updateById']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::put('/user', [UserController::class, 'update']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/activity', [DashboardController::class, 'activity']);

    // Devices
    Route::apiResource('devices', DeviceController::class);

    // Data Buckets
    Route::get('/buckets', [BucketController::class, 'index']);
    Route::post('/buckets', [BucketController::class, 'store']);
    Route::get('/buckets/{bucket}', [BucketController::class, 'show']);
    Route::delete('/buckets/{bucket}', [BucketController::class, 'destroy']);
    Route::patch('/buckets/{bucket}/toggle', [BucketController::class, 'toggle']);
    Route::put('/buckets/{bucket}/widgets', [BucketController::class, 'updateWidgets']);
    Route::get('/buckets/{bucket}/records', [BucketController::class, 'records']);

    // MQTT
    Route::post('/mqtt/publish', [App\Http\Controllers\Api\MqttController::class, 'publish']);

    // Endpoints
    Route::get('/endpoints', [EndpointController::class, 'index']);
    Route::post('/endpoints', [EndpointController::class, 'store']);
    Route::delete('/endpoints/{endpoint}', [EndpointController::class, 'destroy']);
    Route::patch('/endpoints/{endpoint}/toggle', [EndpointController::class, 'toggle']);
    Route::post('/endpoints/{endpoint}/trigger', [EndpointController::class, 'trigger']);
});
