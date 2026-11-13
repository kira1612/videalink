<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Automation;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function index(Request $request)
    {
        $automations = Automation::where('user_id', $request->user()->id)->latest()->get();
        return response()->json($automations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'condition' => 'required|array',
            'action'    => 'required|array',
            'is_active' => 'boolean',
        ]);

        $automation = Automation::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => null,
            'device_name' => $automation->name,
            'event' => "Menambahkan aturan otomasi baru: {$automation->name}",
            'type' => 'success',
        ]);

        return response()->json($automation, 201);
    }

    public function show(Request $request, Automation $automation)
    {
        if ($automation->user_id !== $request->user()->id) abort(403, 'Unauthorized');
        return response()->json($automation);
    }

    public function update(Request $request, Automation $automation)
    {
        if ($automation->user_id !== $request->user()->id) abort(403, 'Unauthorized');

        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'condition' => 'sometimes|array',
            'action'    => 'sometimes|array',
            'is_active' => 'boolean',
        ]);

        $automation->update($validated);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => null,
            'device_name' => $automation->name,
            'event' => "Memperbarui aturan otomasi: {$automation->name}",
            'type' => 'info',
        ]);

        return response()->json($automation);
    }

    public function destroy(Request $request, Automation $automation)
    {
        if ($automation->user_id !== $request->user()->id) abort(403, 'Unauthorized');
        
        $automationName = $automation->name;
        $automation->delete();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'device_id' => null,
            'device_name' => $automationName,
            'event' => "Menghapus aturan otomasi: {$automationName}",
            'type' => 'warning',
        ]);

        return response()->json(['message' => 'Automation deleted']);
    }
}
