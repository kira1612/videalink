<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataBucket;
use App\Models\BucketRecord;
use App\Models\Device;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class BucketController extends Controller
{
    /**
     * Ensure the bucket belongs to the authenticated user.
     */
    private function authorizeBucket(Request $request, DataBucket $bucket): void
    {
        $ownsDevice = Device::where('id', $bucket->device_id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (!$ownsDevice) {
            abort(403, 'Unauthorized');
        }
    }

    public function index(Request $request)
    {
        $deviceIds = Device::where('user_id', $request->user()->id)->pluck('id');

        $buckets = DataBucket::whereIn('device_id', $deviceIds)
            ->with('device:id,name')
            ->latest()
            ->get()
            ->map(function ($bucket) {
                return [
                    'id'          => $bucket->id,
                    'name'        => $bucket->name,
                    'description' => $bucket->description,
                    'enabled'     => $bucket->enabled,
                    'fields'      => $bucket->fields,
                    'device'      => $bucket->device->name,
                    'device_id'   => $bucket->device_id,
                    'mqtt_topic'  => $bucket->mqtt_topic,
                    'records'     => $bucket->records_count,
                    'size'        => $bucket->size,
                    'last_write'  => $bucket->last_write,
                    'created_at'  => $bucket->created_at,
                ];
            });

        return response()->json($buckets);
    }

    public function store(Request $request)
    {
        app(\App\Services\BillingService::class)->assertQuotaAvailable($request->user(), 'buckets');

        // 1. Validasi awal untuk mendapatkan ID perangkat
        $request->validate([
            'device_id'  => 'required|exists:devices,id',
        ]);

        // 2. Pastikan perangkat milik user yang sedang login
        $device = Device::where('id', $request->device_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // 3. Susun aturan validasi berdasarkan protokol perangkat
        $rules = [
            'name'       => 'required|string|max:255',
            'description'=> 'nullable|string',
            'fields'     => 'nullable|array',
        ];

        if ($device->protocol === 'mqtt') {
            // Jika perangkat pakai MQTT, maka mqtt_topic WAJIB diisi 
            // dan idealnya harus unik agar tidak bentrok dengan bucket lain
            $rules['mqtt_topic'] = 'required|string|max:255|unique:data_buckets,mqtt_topic';
        } else {
            // Jika HTTP, tolak jika mengirimkan mqtt_topic
            $rules['mqtt_topic'] = 'prohibited';
        }

        $validated = $request->validate($rules);
        $validated['device_id'] = $device->id;

        // Kosongkan secara eksplisit jika protokolnya HTTP
        if ($device->protocol === 'http') {
            $validated['mqtt_topic'] = null;
        }

        $bucket = DataBucket::create($validated);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => $device->id,
            'device_name' => $bucket->name,
            'event' => "Menambahkan data bucket baru: {$bucket->name}",
            'type' => 'success',
        ]);

        return response()->json($bucket, 201);
    }

    public function show(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);
        return response()->json($bucket->load('device:id,name'));
    }

    public function toggle(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);
        $bucket->update(['enabled' => !$bucket->enabled]);
        return response()->json($bucket);
    }

    public function updateWidgets(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);
        
        \Log::info('Update Widgets Payload:', $request->all());

        try {
            $validated = $request->validate([
                'widgets'               => 'nullable|array',
                'widgets.*.id'          => 'required|string',
                'widgets.*.type'        => 'required|string',
                'widgets.*.field'       => 'nullable|string',
                'widgets.*.title'       => 'nullable|string',
                'widgets.*.w'           => 'nullable|string',
                'widgets.*.h'           => 'nullable|string',
                'widgets.*.unit'        => 'nullable|string',
                'widgets.*.containerId' => 'nullable|string',
                'widgets.*.config'      => 'nullable|array',
            ]);

            $widgetsToSave = $request->input('widgets', []);
            $bucket->update(['widgets' => $widgetsToSave]);
            return response()->json($bucket);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Widget Validation Failed:', $e->errors());
            throw $e;
        }
    }

    public function records(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);

        // DB stores timestamps in WIB (Asia/Jakarta) because that's what now() used when data was recorded
        // Parse the stored time as WIB, then convert to the user's chosen timezone
        $userTz = $request->user()->timezone ?? 'Asia/Jakarta';

        $records = $bucket->records()
            ->latest('recorded_at')
            ->limit(10)
            ->get()
            ->map(function ($r) use ($userTz) {
                // recorded_at is stored as WIB — parse as WIB, then show in user tz
                $ts = \Carbon\Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $r->recorded_at->format('Y-m-d H:i:s'),
                    'Asia/Jakarta'
                )->setTimezone($userTz);

                return array_merge(['timestamp' => $ts->format('d M Y H:i:s')], $r->data);
            });

        return response()->json($records);
    }

    public function storeRecord(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);

        $validated = $request->validate([
            'payload' => 'required|array',
            'timestamp' => 'nullable|integer',
        ]);

        $recordedAt = isset($validated['timestamp']) 
            ? \Carbon\Carbon::createFromTimestamp($validated['timestamp']) 
            : now();

        $record = BucketRecord::create([
            'data_bucket_id' => $bucket->id,
            'data'           => $validated['payload'],
            'recorded_at'    => $recordedAt,
        ]);

        return response()->json($record, 201);
    }

    public function destroy(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);
        $bucketName = $bucket->name;
        $deviceId = $bucket->device_id;
        $bucket->delete();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => $deviceId,
            'device_name' => $bucketName,
            'event' => "Menghapus data bucket: {$bucketName}",
            'type' => 'warning',
        ]);

        return response()->json(['message' => 'Bucket deleted']);
    }

    public function mqttMap()
    {
        $map = [];
        $registeredTopics = [];

        // 1. Ambil dari Data Bucket yang sudah memiliki mqtt_topic
        $buckets = DataBucket::whereNotNull('mqtt_topic')
            ->where('mqtt_topic', '!=', '')
            ->where('enabled', true)
            ->get();

        foreach ($buckets as $bucket) {
            $topic = trim($bucket->mqtt_topic);
            if ($topic !== '') {
                $map[] = [
                    'id'    => $bucket->id,
                    'topic' => $topic,
                ];
                $registeredTopics[$topic] = true;
            }
        }

        // 2. Ambil dari Device bertipe MQTT yang memiliki broker_config['topic']
        $mqttDevices = Device::where('protocol', 'mqtt')->get();
        foreach ($mqttDevices as $device) {
            $configTopic = trim($device->broker_config['topic'] ?? '');
            if ($configTopic === '') {
                $configTopic = 'videalink/devices/' . \Illuminate\Support\Str::slug($device->name);
            }

            if (!isset($registeredTopics[$configTopic])) {
                // Cari atau buatkan bucket otomatis untuk device ini
                $autoBucket = DataBucket::firstOrCreate(
                    ['device_id' => $device->id],
                    [
                        'name'        => "{$device->name} Telemetry Stream",
                        'description' => "Auto-linked bucket for {$device->name}",
                        'enabled'     => true,
                        'mqtt_topic'  => $configTopic,
                        'fields'      => ['temperature', 'humidity', 'rssi'],
                    ]
                );

                if (!$autoBucket->mqtt_topic) {
                    $autoBucket->update(['mqtt_topic' => $configTopic]);
                }

                $map[] = [
                    'id'    => $autoBucket->id,
                    'topic' => $configTopic,
                ];
                $registeredTopics[$configTopic] = true;
            }
        }

        return response()->json($map);
    }

    /**
     * Ingest MQTT telemetry forwarded by the internal MQTT listener/daemon.
     */
    public function ingestMqttTelemetry(Request $request, DataBucket $bucket)
    {
        if (!$bucket->enabled) {
            return response()->json(['message' => 'Bucket is disabled'], 403);
        }

        // Support both { payload: { ... }, timestamp?: int } AND direct flat sensor json { temperature: 25.5, ... }
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
            return response()->json(['message' => 'Payload cannot be empty'], 422);
        }

        $recordedAt = (isset($timestamp) && is_numeric($timestamp))
            ? \Carbon\Carbon::createFromTimestamp($timestamp)
            : now();

        // Auto-Discovery: Gabungkan field baru ke dalam bucket->fields
        $existingFields = is_array($bucket->fields) ? $bucket->fields : [];
        $newFields = array_keys($payload);
        $mergedFields = array_values(array_unique(array_merge($existingFields, $newFields)));

        if ($mergedFields !== $existingFields) {
            $bucket->update(['fields' => $mergedFields]);
        }

        $record = BucketRecord::create([
            'data_bucket_id' => $bucket->id,
            'data'           => $payload,
            'recorded_at'    => $recordedAt,
        ]);

        // Update associated device status if available
        if ($bucket->device) {
            $bucket->device->update([
                'last_seen_at' => now(),
                'status'       => 'online',
            ]);
        }

        return response()->json([
            'message'     => 'MQTT telemetry recorded successfully',
            'record_id'   => $record->id,
            'recorded_at' => $record->recorded_at,
        ], 201);
    }
}
