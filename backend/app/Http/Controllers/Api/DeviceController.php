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
            'broker_config.topic' => 'sometimes|string',
            'credentials' => 'nullable|string',
            'location' => 'nullable|string',
            'ip' => 'nullable|string',
            'firmware' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        // Jika room_id dipilih dan location tidak diisi, gunakan nama Room sebagai location otomatis
        $location = $validated['location'] ?? null;
        if (!empty($validated['room_id'])) {
            $room = \App\Models\Room::find($validated['room_id']);
            if ($room) {
                $location = $room->name;
            }
        }

        $device = Device::create([
            ...$validated,
            'location' => $location ?? 'Unassigned',
            'user_id' => $request->user()->id,
            'status' => 'offline',
            'signal' => -60,
            'uptime' => '-',
            // Generate token unik jika tidak disediakan dari frontend
            'credentials' => $validated['credentials'] ?? \Illuminate\Support\Str::random(32),
        ]);

        // Auto-provisioning Data Bucket jika device bertipe MQTT agar langsung siap terima data
        if ($device->protocol === 'mqtt') {
            $mqttTopic = $device->broker_config['topic'] ?? "videalink/devices/" . \Illuminate\Support\Str::slug($device->name);
            \App\Models\DataBucket::firstOrCreate(
                ['device_id' => $device->id],
                [
                    'name'        => "{$device->name} Bucket",
                    'description' => "Auto-provisioned data bucket for {$device->name}",
                    'enabled'     => true,
                    'mqtt_topic'  => $mqttTopic,
                    'fields'      => ['temperature', 'humidity', 'rssi'],
                ]
            );
        }

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
        $device->load(['dataBuckets.records' => function ($q) {
            $q->latest('recorded_at')->limit(20);
        }, 'endpoints']);

        // Hitung akumulasi data riil dari bucket-bucket milik perangkat ini
        $totalRecords = 0;
        $bucketIds = $device->dataBuckets->pluck('id');
        $totalRecords = \App\Models\BucketRecord::whereIn('data_bucket_id', $bucketIds)->count();

        // Hitung estimasi bytes (rata-rata 128 byte per telemetri)
        $txBytes = $totalRecords * 128;
        $txFormatted = $txBytes < 1024 ? "{$txBytes} B" : ($txBytes < 1048576 ? round($txBytes / 1024, 1) . " KB" : round($txBytes / 1048576, 2) . " MB");
        
        // Data diterima (response server + command ~64 byte per request)
        $rxBytes = $totalRecords * 64;
        $rxFormatted = $rxBytes < 1024 ? "{$rxBytes} B" : ($rxBytes < 1048576 ? round($rxBytes / 1024, 1) . " KB" : round($rxBytes / 1048576, 2) . " MB");

        // Ambil riwayat telemetri riil untuk grafik
        $recentRecords = \App\Models\BucketRecord::whereIn('data_bucket_id', $bucketIds)
            ->latest('recorded_at')
            ->limit(15)
            ->get()
            ->reverse()
            ->values();

        $transmissionHistory = [];
        foreach ($recentRecords as $r) {
            $timeStr = $r->recorded_at->setTimezone($request->user()->timezone ?? 'Asia/Jakarta')->format('H:i');
            $dataSize = strlen(json_encode($r->data));
            $transmissionHistory[] = [
                'time' => $timeStr,
                'tx'   => max(10, $dataSize),
                'rx'   => max(5, intval($dataSize * 0.4)),
            ];
        }

        // Akumulasi data 30 hari terakhir
        $thirtyDaysAgo = now()->subDays(30);
        $records30Days = \App\Models\BucketRecord::whereIn('data_bucket_id', $bucketIds)
            ->where('recorded_at', '>=', $thirtyDaysAgo)
            ->count();

        $total30DaysBytes = $records30Days * (128 + 64);
        $total30DaysFormatted = $total30DaysBytes < 1024 ? "{$total30DaysBytes} B" : ($total30DaysBytes < 1048576 ? round($total30DaysBytes / 1024, 1) . " KB" : round($total30DaysBytes / 1048576, 2) . " MB");

        // Riwayat Daily Data Transmission (agregasi 7 hari terakhir)
        $dailyRecords = \App\Models\BucketRecord::whereIn('data_bucket_id', $bucketIds)
            ->where('recorded_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(recorded_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $dailyHistory = [];
        foreach ($dailyRecords as $dr) {
            $dailyHistory[] = [
                'time' => date('d M', strtotime($dr->date)),
                'data' => intval($dr->count),
            ];
        }

        // Jika belum ada record harian, buat data titik hari ini
        if (empty($dailyHistory)) {
            $dailyHistory[] = [
                'time' => date('d M'),
                'data' => $totalRecords,
            ];
        }

        $resData = $device->toArray();
        $resData['stats'] = [
            'total_records'   => $totalRecords,
            'tx_bytes'        => $txBytes,
            'tx_formatted'    => $txFormatted,
            'rx_bytes'        => $rxBytes,
            'rx_formatted'    => $rxFormatted,
            'history'         => $transmissionHistory,
            'records_30d'     => $records30Days,
            'total_30d_fmt'   => $total30DaysFormatted,
            'daily_history'   => $dailyHistory,
        ];

        return response()->json($resData);
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
            'broker_config.topic' => 'sometimes|string',
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

        // Jika room_id diupdate, sinkronkan lokasi otomatis
        if (array_key_exists('room_id', $validated)) {
            if (!empty($validated['room_id'])) {
                $room = \App\Models\Room::find($validated['room_id']);
                if ($room) {
                    $validated['location'] = $room->name;
                }
            } else {
                $validated['location'] = 'Unassigned';
            }
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

        // 2. Normalisasi Payload (Dukung format { payload: {...} } maupun direct flat JSON { temperature: 25, ... })
        $raw = $request->all();
        $payload = [];
        $timestamp = null;

        if (isset($raw['payload']) && is_array($raw['payload'])) {
            $payload = $raw['payload'];
            $timestamp = $raw['timestamp'] ?? null;
        } else {
            $payload = $raw;
            if (isset($payload['timestamp'])) {
                $timestamp = $payload['timestamp'];
                unset($payload['timestamp']);
            }
        }

        if (empty($payload)) {
            return response()->json(['message' => 'The payload field is required.'], 422);
        }

        // Update status perangkat menjadi online, catat IP dan waktu terakhir terlihat
        $device->update([
            'last_seen_at' => now(),
            'status'       => 'online',
            'ip'           => $request->ip(),
        ]);

        // Cari atau buat otomatis bucket aktif untuk perangkat ini jika belum ada (Auto-Provisioning)
        $bucket = \App\Models\DataBucket::where('device_id', $device->id)->where('enabled', true)->first();

        if (!$bucket) {
            $bucket = \App\Models\DataBucket::create([
                'device_id'   => $device->id,
                'name'        => "{$device->name} Telemetry Stream",
                'description' => 'Auto-generated bucket from incoming telemetry',
                'enabled'     => true,
                'fields'      => array_keys($payload),
            ]);
        } else {
            // Auto-Discovery: Gabungkan field baru dari payload ke dalam bucket->fields
            $existingFields = is_array($bucket->fields) ? $bucket->fields : [];
            $newFields = array_keys($payload);
            $mergedFields = array_values(array_unique(array_merge($existingFields, $newFields)));

            if ($mergedFields !== $existingFields) {
                $bucket->update(['fields' => $mergedFields]);
            }
        }

        // Tangani Offline Buffering (Gunakan timestamp perangkat jika ada, jika tidak gunakan waktu server)
        $recordedAt = (isset($timestamp) && is_numeric($timestamp))
            ? \Carbon\Carbon::createFromTimestamp($timestamp) 
            : now();

        $record = \App\Models\BucketRecord::create([
            'data_bucket_id' => $bucket->id,
            'data'           => $payload,
            'recorded_at'    => $recordedAt,
        ]);

        return response()->json([
            'message'     => $bucket ? 'Telemetry accepted' : 'Device heartbeat accepted (no active bucket assigned)',
            'recorded_at' => $record ? $record->recorded_at : now(),
            'status'      => 'online',
        ], 201);
    }
}
