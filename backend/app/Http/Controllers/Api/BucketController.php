<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataBucket;
use App\Models\BucketRecord;
use App\Models\Device;
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
        $validated = $request->validate([
            'device_id'  => 'required|exists:devices,id',
            'name'       => 'required|string|max:255',
            'description'=> 'nullable|string',
            'fields'     => 'nullable|array',
            'mqtt_topic' => 'nullable|string|max:255',
        ]);

        // Ensure device belongs to authenticated user
        $device = Device::where('id', $validated['device_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $bucket = DataBucket::create($validated);
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
            'widgets'           => 'nullable|array',
            'widgets.*.id'      => 'required|string',
            'widgets.*.type'    => 'required|string',
            'widgets.*.field'   => 'required|string',
            'widgets.*.title'   => 'nullable|string',
            'widgets.*.w'       => 'nullable|string',
            'widgets.*.h'       => 'nullable|string',
            'widgets.*.unit'    => 'nullable|string',
            'widgets.*.config'  => 'nullable|array',
            'widgets.*.config.min' => 'nullable',
            'widgets.*.config.max' => 'nullable',
            'widgets.*.config.onLabel' => 'nullable|string',
            'widgets.*.config.offLabel' => 'nullable|string',
            'widgets.*.config.topic' => 'nullable|string',
            'widgets.*.config.color' => 'nullable|string',
        ]);

        // In Laravel, if we just use $validated['widgets'], it might still strip nested keys if not fully specified.
        // But since we specified them above, it should keep them. However, to be absolutely safe and allow
        // any config to be saved (since widgets are dynamic), we can just take the raw widgets array
        // but ensure it passes the structural validation above.
        
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

        $record = BucketRecord::create([
            'data_bucket_id' => $bucket->id,
            'data'           => $request->all(),
            'recorded_at'    => now(),
        ]);

        return response()->json($record, 201);
    }

    public function destroy(Request $request, DataBucket $bucket)
    {
        $this->authorizeBucket($request, $bucket);
        $bucket->delete();
        return response()->json(['message' => 'Bucket deleted']);
    }

    public function mqttMap()
    {
        $buckets = DataBucket::whereNotNull('mqtt_topic')->where('enabled', true)->get();

        $map = [];
        foreach ($buckets as $bucket) {
            $map[] = [
                'id'    => $bucket->id,
                'topic' => $bucket->mqtt_topic,
            ];
        }

        return response()->json($map);
    }
}
