<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\DataBucket;
use App\Models\Endpoint;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;
        $devices = Device::where('user_id', $userId)->get();
        $deviceIds = $devices->pluck('id');

        $buckets = DataBucket::whereIn('device_id', $deviceIds)->get();
        $totalRecords = 0;
        foreach ($buckets as $bucket) {
            $totalRecords += $bucket->records()->count();
        }

        return response()->json([
            'total_devices' => $devices->count(),
            'online_devices' => $devices->where('status', 'online')->count(),
            'offline_devices' => $devices->where('status', 'offline')->count(),
            'warning_devices' => $devices->where('status', 'warning')->count(),
            'total_data_points' => $totalRecords,
            'total_buckets' => $buckets->count(),
            'active_endpoints' => Endpoint::whereIn('device_id', $deviceIds)->where('enabled', true)->count(),
            'total_endpoints' => Endpoint::whereIn('device_id', $deviceIds)->count(),
        ]);
    }

    public function activity(Request $request)
    {
        $deviceIds = Device::where('user_id', $request->user()->id)->pluck('id');

        $logs = ActivityLog::whereIn('device_id', $deviceIds)
            ->orWhereNull('device_id')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn($log) => [
                'id' => $log->id,
                'device' => $log->device_name ?? 'System',
                'event' => $log->event,
                'type' => $log->type,
                'time' => $log->created_at->format('H:i:s'),
            ]);

        return response()->json($logs);
    }
}
