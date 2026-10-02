<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
        ]);

        $room = Room::create([
            ...$validated,
            'user_id' => $request->user()->id,
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
        return response()->json($room);
    }

    public function destroy(Request $request, Room $room)
    {
        if ($room->user_id !== $request->user()->id) abort(403, 'Unauthorized');
        
        $room->delete();
        return response()->json(['message' => 'Room deleted']);
    }
}
