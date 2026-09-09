<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        
        // Use node to run the publish script
        $command = "node {$scriptPath} {$topic} {$message} 2>&1";
        $output = shell_exec($command);

        return response()->json([
            'success' => true,
            'message' => 'Published successfully',
            'output' => $output
        ]);
    }
}
