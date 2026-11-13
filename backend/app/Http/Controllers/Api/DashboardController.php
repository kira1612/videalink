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
        $userId = $request->user()->id;
        $deviceIds = Device::where('user_id', $userId)->pluck('id');

        \Carbon\Carbon::setLocale('id');

        $logs = ActivityLog::where(function ($q) use ($userId, $deviceIds) {
                $q->where('user_id', $userId)
                  ->orWhereIn('device_id', $deviceIds);
            })
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($log) {
                $timeDiff = $log->created_at ? $log->created_at->diffForHumans() : 'Baru saja';
                return [
                    'id' => $log->id,
                    'device' => $log->device_name ?? 'Sistem',
                    'event' => $log->event,
                    'type' => $log->type ?? 'info',
                    'time' => $timeDiff,
                    'created_at' => $log->created_at?->toISOString(),
                ];
            });

        return response()->json($logs);
    }
}
