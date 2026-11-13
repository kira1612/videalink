<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $rooms = Room::where('user_id', $request->user()->id)
            ->withCount('devices') // Menghitung jumlah perangkat di dalam ruangan
            ->get();
        return response()->json($rooms);
    }

    public function store(Request $request)
    {
        app(\App\Services\BillingService::class)->assertQuotaAvailable($request->user(), 'rooms');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
        ]);

        $room = Room::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => null,
            'device_name' => $room->name,
            'event' => "Menambahkan ruangan baru: {$room->name}",
            'type' => 'success',
        ]);

        return response()->json($room, 201);
    }

    public function show(Request $request, Room $room)
    {
        if ($room->user_id !== $request->user()->id) abort(403, 'Unauthorized');
        
        $room->load('devices');
        return response()->json($room);
    }

    public function update(Request $request, Room $room)
    {
        if ($room->user_id !== $request->user()->id) abort(403, 'Unauthorized');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'icon' => 'nullable|string|max:50',
        ]);

        $room->update($validated);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => null,
            'device_name' => $room->name,
            'event' => "Memperbarui data ruangan: {$room->name}",
            'type' => 'info',
        ]);

        return response()->json($room);
    }

    public function destroy(Request $request, Room $room)
    {
        if ($room->user_id !== $request->user()->id) abort(403, 'Unauthorized');
        
        $roomName = $room->name;
        $room->delete();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => null,
            'device_name' => $roomName,
            'event' => "Menghapus ruangan: {$roomName}",
            'type' => 'warning',
        ]);

        return response()->json(['message' => 'Room deleted']);
    }
}
