<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Automation;
use App\Models\BucketRecord;
use App\Models\Device;
use App\Models\Endpoint;
use App\Services\EmailNotificationService;
use App\Services\TelegramNotificationService;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    private function sanitizeAutomation(Automation $automation): array
    {
        $data = $automation->toArray();
        $action = is_array($data['action'] ?? null) ? $data['action'] : [];

        $rawToken = trim((string) ($action['bot_token'] ?? $action['botToken'] ?? ''));
        unset($action['bot_token'], $action['botToken'], $action['clear_bot_token']);

        if ($rawToken !== '') {
            $action['has_bot_token'] = true;
            $action['bot_token_masked'] = TelegramNotificationService::maskToken($rawToken);
        } else {
            $action['has_bot_token'] = false;
            $action['bot_token_masked'] = null;
        }

        $data['action'] = $action;
        return $data;
    }

    public function index(Request $request)
    {
        $automations = Automation::where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn ($auto) => $this->sanitizeAutomation($auto));

        return response()->json($automations);
    }

    public function store(Request $request, TelegramNotificationService $telegram)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'condition' => 'required|array',
            'action'    => 'required|array',
            'is_active' => 'boolean',
        ]);

        $action = $validated['action'];
        unset($action['has_bot_token'], $action['bot_token_masked'], $action['clear_bot_token']);

        if (($action['type'] ?? 'device') === 'telegram') {
            $hasEndpoint = !empty($action['endpoint_id']);
            $hasChatId = trim((string) ($action['chat_id'] ?? $action['chatId'] ?? '')) !== '';
            if (!$hasEndpoint && !$hasChatId) {
                return response()->json([
                    'message' => 'Pilih Endpoint Telegram atau masukkan Chat ID Telegram untuk aksi notifikasi.',
                ], 422);
            }

            $rawToken = trim((string) ($action['bot_token'] ?? $action['botToken'] ?? ''));
            unset($action['botToken']);

            if ($rawToken !== '') {
                $action['bot_token'] = TelegramNotificationService::encryptToken($rawToken);
            } else {
                unset($action['bot_token']);
                if (!$hasEndpoint && !$telegram->hasDefaultBotToken()) {
                    return response()->json([
                        'message' => 'Bot Token Telegram wajib diisi pada mode Chat ID langsung (atau pilih Endpoint Telegram tersimpan).',
                    ], 422);
                }
            }
        } elseif (($action['type'] ?? 'device') === 'email') {
            $hasEndpoint = !empty($action['endpoint_id']);
            $recipients = EmailNotificationService::parseRecipients($action['email'] ?? '');
            if (!$hasEndpoint && empty($recipients)) {
                return response()->json([
                    'message' => 'Pilih Endpoint Email atau masukkan alamat email penerima yang valid.',
                ], 422);
            }
            if (!empty($recipients)) {
                $action['email'] = implode(', ', $recipients);
            }
        }

        $validated['action'] = $action;

        $automation = Automation::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $validated['condition']['device_id'] ?? null,
            'device_name' => $automation->name,
            'event'       => "Menambahkan aturan otomasi baru: {$automation->name}",
            'type'        => 'success',
        ]);

        return response()->json($this->sanitizeAutomation($automation), 201);
    }

    public function show(Request $request, Automation $automation)
    {
        if ($automation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
        return response()->json($this->sanitizeAutomation($automation));
    }

    public function update(Request $request, Automation $automation, TelegramNotificationService $telegram)
    {
        if ($automation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'condition' => 'sometimes|array',
            'action'    => 'sometimes|array',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['action']) && is_array($validated['action'])) {
            $incomingAction = $validated['action'];
            $existingAction = is_array($automation->action) ? $automation->action : [];

            $clearToken = !empty($incomingAction['clear_bot_token']);
            unset($incomingAction['has_bot_token'], $incomingAction['bot_token_masked'], $incomingAction['clear_bot_token']);

            $incomingToken = trim((string) ($incomingAction['bot_token'] ?? $incomingAction['botToken'] ?? ''));
            $existingToken = trim((string) ($existingAction['bot_token'] ?? $existingAction['botToken'] ?? ''));

            if ($clearToken) {
                unset($incomingAction['bot_token'], $incomingAction['botToken']);
            } elseif ($incomingToken !== '') {
                $incomingAction['bot_token'] = TelegramNotificationService::encryptToken($incomingToken);
                unset($incomingAction['botToken']);
            } elseif ($existingToken !== '') {
                $incomingAction['bot_token'] = TelegramNotificationService::encryptToken($existingToken);
                unset($incomingAction['botToken']);
            } else {
                unset($incomingAction['bot_token'], $incomingAction['botToken']);
            }

            if (($incomingAction['type'] ?? 'device') === 'telegram') {
                $hasEndpoint = !empty($incomingAction['endpoint_id']);
                $hasChatId = trim((string) ($incomingAction['chat_id'] ?? $incomingAction['chatId'] ?? '')) !== '';
                if (!$hasEndpoint && !$hasChatId) {
                    return response()->json([
                        'message' => 'Pilih Endpoint Telegram atau masukkan Chat ID Telegram untuk aksi notifikasi.',
                    ], 422);
                }
                if (!$hasEndpoint && empty($incomingAction['bot_token']) && !$telegram->hasDefaultBotToken()) {
                    return response()->json([
                        'message' => 'Bot Token Telegram wajib diisi pada mode Chat ID langsung (atau pilih Endpoint Telegram tersimpan).',
                    ], 422);
                }
            } elseif (($incomingAction['type'] ?? 'device') === 'email') {
                $hasEndpoint = !empty($incomingAction['endpoint_id']);
                $recipients = EmailNotificationService::parseRecipients($incomingAction['email'] ?? '');
                if (!$hasEndpoint && empty($recipients)) {
                    return response()->json([
                        'message' => 'Pilih Endpoint Email atau masukkan alamat email penerima yang valid.',
                    ], 422);
                }
                if (!empty($recipients)) {
                    $incomingAction['email'] = implode(', ', $recipients);
                }
            }

            $validated['action'] = $incomingAction;
        }

        $automation->update($validated);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $automation->condition['device_id'] ?? null,
            'device_name' => $automation->name,
            'event'       => "Memperbarui aturan otomasi: {$automation->name}",
            'type'        => 'info',
        ]);

        return response()->json($this->sanitizeAutomation($automation->fresh()));
    }

    /**
     * Manually test an automation's Telegram or Email notification with latest telemetry or sample data.
     */
    public function test(
        Request $request,
        Automation $automation,
        TelegramNotificationService $telegram,
        EmailNotificationService $emailService
    ) {
        if ($automation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $action = is_array($automation->action) ? $automation->action : [];
        $actionType = $action['type'] ?? 'device';
        if (!in_array($actionType, ['telegram', 'email'], true)) {
            return response()->json(['message' => 'Aturan otomasi ini bukan bertipe notifikasi Telegram atau Email.'], 400);
        }

        $cond = is_array($automation->condition) ? $automation->condition : [];
        $device = !empty($cond['device_id'])
            ? Device::where('id', $cond['device_id'])->where('user_id', $request->user()->id)->with('dataBuckets')->first()
            : null;

        $latestPayload = [];
        if ($device && $device->dataBuckets->isNotEmpty()) {
            $latestRecord = BucketRecord::whereIn('data_bucket_id', $device->dataBuckets->pluck('id'))
                ->latest('recorded_at')
                ->first();
            if ($latestRecord && is_array($latestRecord->data)) {
                $latestPayload = $latestRecord->data;
            }
        }

        $field = trim((string) ($cond['field'] ?? '')) ?: (array_key_first($latestPayload) ?: 'temperature');
        $threshold = $cond['value'] ?? 30;
        $value = array_key_exists($field, $latestPayload)
            ? $latestPayload[$field]
            : (is_numeric($threshold) ? ((float) $threshold + 1) : $threshold);

        $timezone = $request->user()->timezone ?? 'Asia/Jakarta';
        $context = [
            'device'    => $device?->name ?? 'IoT Device',
            'location'  => $device?->location ?? '-',
            'field'     => $field,
            'value'     => $value,
            'operator'  => $cond['operator'] ?? '>',
            'threshold' => $threshold,
            'rule'      => $automation->name,
            'time'      => now()->setTimezone($timezone)->format('d M Y H:i:s'),
            'payload'   => !empty($latestPayload) ? $latestPayload : [$field => $value],
        ];

        if ($actionType === 'email') {
            $recipientsRaw = trim((string) ($action['email'] ?? ''));
            if ($recipientsRaw === '' && !empty($action['endpoint_id'])) {
                $endpoint = Endpoint::where('id', $action['endpoint_id'])
                    ->whereHas('device', fn ($q) => $q->where('user_id', $request->user()->id))
                    ->first();
                if ($endpoint && is_array($endpoint->config)) {
                    $recipientsRaw = trim((string) ($endpoint->config['email'] ?? ''));
                }
            }

            $result = $emailService->send(
                $recipientsRaw,
                $action['subject'] ?? null,
                $action['message_template'] ?? null,
                $context
            );

            if (!$result['ok']) {
                return response()->json([
                    'message' => $result['message'],
                    'preview' => $result['preview_body'] ?? null,
                ], 422);
            }

            $automation->increment('trigger_count');
            $automation->update(['last_triggered_at' => now()]);

            ActivityLog::create([
                'user_id'     => $request->user()->id,
                'device_id'   => $device?->id,
                'device_name' => $automation->name,
                'event'       => "Tes alert Email otomasi berhasil: {$automation->name}",
                'type'        => 'success',
            ]);

            return response()->json([
                'message'           => $result['message'],
                'mailer'            => $result['mailer'] ?? null,
                'preview'           => $result['preview_body'] ?? null,
                'trigger_count'     => (int) $automation->fresh()->trigger_count,
                'last_triggered_at' => $automation->fresh()->last_triggered_at?->toISOString(),
            ]);
        }

        // Telegram test
        $chatId = trim((string) ($action['chat_id'] ?? $action['chatId'] ?? ''));
        $botToken = $action['bot_token'] ?? $action['botToken'] ?? null;

        if (!empty($action['endpoint_id'])) {
            $endpoint = Endpoint::where('id', $action['endpoint_id'])
                ->whereHas('device', fn ($q) => $q->where('user_id', $request->user()->id))
                ->first();

            if ($endpoint && is_array($endpoint->config)) {
                if ($chatId === '') {
                    $chatId = trim((string) ($endpoint->config['chat_id'] ?? $endpoint->config['chatId'] ?? ''));
                }
                if (empty($botToken)) {
                    $botToken = $endpoint->config['bot_token'] ?? $endpoint->config['botToken'] ?? null;
                }
            }
        }

        $message = $telegram->renderTemplate($action['message_template'] ?? null, $context);
        $result = $telegram->send($chatId, $message, $botToken);

        if (!$result['ok']) {
            return response()->json([
                'message' => $result['message'],
                'preview' => $message,
            ], 422);
        }

        $automation->increment('trigger_count');
        $automation->update(['last_triggered_at' => now()]);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $device?->id,
            'device_name' => $automation->name,
            'event'       => "Tes alert Telegram otomasi berhasil: {$automation->name}",
            'type'        => 'success',
        ]);

        return response()->json([
            'message'             => 'Pesan tes Telegram berhasil dikirim!',
            'preview'             => $message,
            'telegram_message_id' => $result['telegram_message_id'] ?? null,
            'trigger_count'       => (int) $automation->fresh()->trigger_count,
            'last_triggered_at'   => $automation->fresh()->last_triggered_at?->toISOString(),
        ]);
    }

    public function destroy(Request $request, Automation $automation)
    {
        if ($automation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $automationName = $automation->name;
        $automation->delete();

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => null,
            'device_name' => $automationName,
            'event'       => "Menghapus aturan otomasi: {$automationName}",
            'type'        => 'warning',
        ]);

        return response()->json(['message' => 'Automation deleted']);
    }
}
