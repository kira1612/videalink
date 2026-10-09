<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index(Request $request)
    {
        $devices = Device::where('user_id', $request->user()->id)
            ->with('dataBuckets')
            ->latest()
            ->get();

        return response()->json($devices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'room_id' => 'nullable|exists:rooms,id',
            'type' => 'required|string',
            'protocol' => 'required|in:http,mqtt',
            'broker_config' => 'nullable|array',
            'broker_config.host' => 'sometimes|string',
            'broker_config.port' => 'sometimes|integer',
            'credentials' => 'nullable|string',
            'location' => 'nullable|string',
            'ip' => 'nullable|string',
            'firmware' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $device = Device::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => 'offline',
            'signal' => -60,
            'uptime' => '-',
            // Generate token unik jika tidak disediakan dari frontend
            'credentials' => $validated['credentials'] ?? \Illuminate\Support\Str::random(32),
        ]);

        ActivityLog::create([
            'device_id' => $device->id,
            'device_name' => $device->name,
            'event' => 'Device registered to platform',
            'type' => 'info',
        ]);

        return response()->json($device, 201);
    }

    public function show(Request $request, Device $device)
    {
        $this->authorizeDevice($request, $device);
        $device->load(['dataBuckets', 'endpoints']);
        return response()->json($device);
    }

    public function update(Request $request, Device $device)
    {
        $this->authorizeDevice($request, $device);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'room_id' => 'nullable|exists:rooms,id',
            'type' => 'sometimes|string',
            'protocol' => 'sometimes|in:http,mqtt',
            'broker_config' => 'nullable|array',
            'broker_config.host' => 'sometimes|string',
            'broker_config.port' => 'sometimes|integer',
            'broker_config.position' => 'sometimes|array',
            'broker_config.popup_layout' => 'sometimes|array',
            'credentials' => 'nullable|string',
            'location' => 'nullable|string',
            'ip' => 'nullable|string',
            'status' => 'sometimes|in:online,offline,warning',
            'firmware' => 'nullable|string',
            'signal' => 'nullable|integer',
            'uptime' => 'nullable|string',
            'tags' => 'nullable|array',
            'resources' => 'nullable|array',
        ]);

        if (isset($validated['status'])) {
            $validated['last_seen_at'] = now();
        }

        $device->update($validated);

        return response()->json($device);
    }

    public function destroy(Request $request, Device $device)
    {
        $this->authorizeDevice($request, $device);
        $device->delete();
        return response()->json(['message' => 'Device deleted']);
    }

    private function authorizeDevice(Request $request, Device $device)
    {
        if ($device->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }

    public function telemetry(Request $request, Device $device)
    {
        // 1. Keamanan: Autentikasi Perangkat via HTTP Header
        $token = $request->header('X-Device-Token') ?? $request->bearerToken();
        
        if (!$token || $device->credentials !== $token) {
            return response()->json(['message' => 'Unauthorized device. Invalid or missing token.'], 401);
        }

        // 2. Validasi Payload (Jangan pernah percaya input mentah)
        $validated = $request->validate([
            'payload' => 'required|array', // Data sensor harus berada di dalam object "payload"
            'timestamp' => 'nullable|integer', // Optional: Unix timestamp dari perangkat (jika offline buffering)
        ]);

        // Cari bucket aktif untuk perangkat ini
        $bucket = \App\Models\DataBucket::where('device_id', $device->id)->where('enabled', true)->first();

        if (!$bucket) {
            return response()->json(['message' => 'No active bucket for this device'], 404);
        }

        // 3. Tangani Offline Buffering (Gunakan timestamp perangkat jika ada, jika tidak gunakan waktu server)
        $recordedAt = isset($validated['timestamp']) 
            ? \Carbon\Carbon::createFromTimestamp($validated['timestamp']) 
            : now();

        $record = \App\Models\BucketRecord::create([
            'data_bucket_id' => $bucket->id,
            'data' => $validated['payload'],
            'recorded_at' => $recordedAt,
        ]);

        // Update status perangkat menjadi online dan terakhir terlihat
        $device->update(['last_seen_at' => now(), 'status' => 'online']);

        return response()->json([
            'message' => 'Telemetry accepted',
            'recorded_at' => $record->recorded_at,
        ], 201);
    }
}
