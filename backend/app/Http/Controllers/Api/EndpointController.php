<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Endpoint;
use App\Models\ActivityLog;
use App\Models\Device;
use Illuminate\Http\Request;

class EndpointController extends Controller
{
    /**
     * Ensure the endpoint belongs to the authenticated user (via device).
     */
    private function authorizeEndpoint(Request $request, Endpoint $endpoint): void
    {
        $ownsDevice = Device::where('id', $endpoint->device_id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (!$ownsDevice) {
            abort(403, 'Unauthorized');
        }
    }

    public function index(Request $request)
    {
        $deviceIds = Device::where('user_id', $request->user()->id)->pluck('id');

        $endpoints = Endpoint::whereIn('device_id', $deviceIds)
            ->with('device:id,name')
            ->latest()
            ->get()
            ->map(fn($ep) => [
                'id'             => $ep->id,
                'name'           => $ep->name,
                'description'    => $ep->description,
                'type'           => $ep->type,
                'enabled'        => $ep->enabled,
                'device'         => $ep->device->name,
                'device_id'      => $ep->device_id,
                'config'         => $ep->config,
                'trigger_count'  => $ep->trigger_count,
                'last_triggered' => $ep->last_triggered_at?->toISOString(),
            ]);

        return response()->json($endpoints);
    }

    public function store(Request $request)
    {
        app(\App\Services\BillingService::class)->assertQuotaAvailable($request->user(), 'endpoints');

        $validated = $request->validate([
            'device_id'   => 'required|exists:devices,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'required|in:EMAIL,HTTP,SLACK,TELEGRAM,MQTT',
            'config'      => 'nullable|array',
        ]);

        // Ensure device belongs to authenticated user
        Device::where('id', $validated['device_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $endpoint = Endpoint::create($validated);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $validated['device_id'],
            'device_name' => $endpoint->name,
            'event'       => "Menambahkan endpoint integrasi baru: {$endpoint->name}",
            'type'        => 'success',
        ]);

        return response()->json($endpoint, 201);
    }

    public function toggle(Request $request, Endpoint $endpoint)
    {
        $this->authorizeEndpoint($request, $endpoint);
        $endpoint->update(['enabled' => !$endpoint->enabled]);
        return response()->json($endpoint);
    }

    public function trigger(Request $request, Endpoint $endpoint)
    {
        $this->authorizeEndpoint($request, $endpoint);

        if (!$endpoint->enabled) {
            return response()->json(['message' => 'Endpoint is disabled'], 400);
        }

        $endpoint->increment('trigger_count');
        $endpoint->update(['last_triggered_at' => now()]);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $endpoint->device_id,
            'device_name' => $endpoint->device->name ?? 'Unknown',
            'event'       => "Pemicu manual endpoint: {$endpoint->name}",
            'type'        => 'info',
        ]);

        return response()->json([
            'message'       => 'Endpoint triggered successfully',
            'trigger_count' => $endpoint->trigger_count,
            'last_triggered'=> $endpoint->last_triggered_at->toISOString(),
        ]);
    }

    public function destroy(Request $request, Endpoint $endpoint)
    {
        $this->authorizeEndpoint($request, $endpoint);
        $endpointName = $endpoint->name;
        $deviceId = $endpoint->device_id;
        $endpoint->delete();

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $deviceId,
            'device_name' => $endpointName,
            'event'       => "Menghapus endpoint: {$endpointName}",
            'type'        => 'warning',
        ]);

        return response()->json(['message' => 'Endpoint deleted']);
    }
}
