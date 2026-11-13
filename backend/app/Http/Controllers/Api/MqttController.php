<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Device;
use Illuminate\Http\Request;

class MqttController extends Controller
{
    public function publish(Request $request)
    {
        $validated = $request->validate([
            'topic' => 'required|string',
            'message' => 'required|string',
        ]);

        $topic = escapeshellarg($validated['topic']);
        $message = escapeshellarg($validated['message']);
        
        $scriptPath = base_path('../mqtt-publish.cjs');
        $brokerUrl = env('MQTT_BROKER_URL', 'mqtt://test.mosquitto.org:1883');
        
        // Locate node executable (especially when running inside Apache service where PATH might omit user/system node)
        $nodeBin = env('NODE_BINARY');
        if (!$nodeBin) {
            $commonPaths = [
                'node',
                'C:\\Program Files\\nodejs\\node.exe',
                'C:\\Program Files (x86)\\nodejs\\node.exe',
                'C:\\laragon\\bin\\nodejs\\node.exe',
                '/usr/bin/node',
                '/usr/local/bin/node',
            ];
            foreach ($commonPaths as $p) {
                if ($p === 'node' || file_exists($p)) {
                    $nodeBin = $p;
                    if ($p !== 'node') break;
                }
            }
        }
        
        // Pass broker URL to node process
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $command = "set MQTT_BROKER_URL={$brokerUrl}&& \"{$nodeBin}\" \"{$scriptPath}\" {$topic} {$message} 2>&1";
        } else {
            $command = "MQTT_BROKER_URL={$brokerUrl} \"{$nodeBin}\" \"{$scriptPath}\" {$topic} {$message} 2>&1";
        }
        $output = shell_exec($command);

        if ($request->user()) {
            $device = Device::where('user_id', $request->user()->id)
                ->where(function ($q) use ($validated) {
                    $q->where('broker_config->topic', $validated['topic'])
                      ->orWhere('broker_config->command_topic', $validated['topic']);
                })->first();

            $targetName = $device ? $device->name : $validated['topic'];
            ActivityLog::create([
                'user_id'     => $request->user()->id,
                'device_id'   => $device?->id,
                'device_name' => $targetName,
                'event'       => "Kontrol saklar/aktuator: {$validated['message']} ({$targetName})",
                'type'        => 'info',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Published successfully',
            'output' => $output
        ]);
    }
}
