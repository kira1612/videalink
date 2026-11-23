<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BucketRecord;
use App\Models\Device;
use App\Models\Endpoint;
use App\Services\EmailNotificationService;
use App\Services\TelegramNotificationService;
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

    /**
     * Mask sensitive Bot Token before sending config back to frontend.
     */
    private function sanitizeConfig(?array $config): array
    {
        $cfg = is_array($config) ? $config : [];
        $rawToken = trim((string) ($cfg['bot_token'] ?? $cfg['botToken'] ?? ''));

        unset($cfg['bot_token'], $cfg['botToken'], $cfg['clear_bot_token']);

        if ($rawToken !== '') {
            $cfg['has_bot_token'] = true;
            $cfg['bot_token_masked'] = TelegramNotificationService::maskToken($rawToken);
        } else {
            $cfg['has_bot_token'] = false;
            $cfg['bot_token_masked'] = null;
        }

        return $cfg;
    }

    private function formatEndpoint(Endpoint $ep): array
    {
        $ep->loadMissing('device:id,name');

        return [
            'id'             => $ep->id,
            'name'           => $ep->name,
            'description'    => $ep->description,
            'type'           => $ep->type,
            'enabled'        => (bool) $ep->enabled,
            'device'         => $ep->device?->name ?? 'Unknown',
            'device_id'      => $ep->device_id,
            'config'         => $this->sanitizeConfig($ep->config),
            'trigger_count'  => (int) $ep->trigger_count,
            'last_triggered' => $ep->last_triggered_at?->toISOString(),
        ];
    }

    public function index(Request $request)
    {
        $deviceIds = Device::where('user_id', $request->user()->id)->pluck('id');

        $endpoints = Endpoint::whereIn('device_id', $deviceIds)
            ->with('device:id,name')
            ->latest()
            ->get()
            ->map(fn ($ep) => $this->formatEndpoint($ep));

        return response()->json($endpoints);
    }

    public function store(Request $request, TelegramNotificationService $telegram)
    {
        app(\App\Services\BillingService::class)->assertQuotaAvailable($request->user(), 'endpoints');

        $validated = $request->validate([
            'device_id'   => 'required|exists:devices,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'required|in:EMAIL,HTTP,SLACK,TELEGRAM,MQTT',
            'enabled'     => 'sometimes|boolean',
            'config'      => 'nullable|array',
        ]);

        // Ensure device belongs to authenticated user
        Device::where('id', $validated['device_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $config = is_array($validated['config'] ?? null) ? $validated['config'] : [];
        unset($config['has_bot_token'], $config['bot_token_masked'], $config['clear_bot_token']);

        if (($validated['type'] ?? '') === 'TELEGRAM') {
            $chatId = trim((string) ($config['chat_id'] ?? $config['chatId'] ?? ''));
            if ($chatId === '') {
                return response()->json(['message' => 'Chat ID Telegram wajib diisi.'], 422);
            }
            $config['chat_id'] = $chatId;
            unset($config['chatId']);

            $rawToken = trim((string) ($config['bot_token'] ?? $config['botToken'] ?? ''));
            unset($config['botToken']);

            if ($rawToken !== '') {
                $config['bot_token'] = TelegramNotificationService::encryptToken($rawToken);
            } else {
                unset($config['bot_token']);
                if (!$telegram->hasDefaultBotToken()) {
                    return response()->json([
                        'message' => 'Bot Token Telegram wajib diisi (buat bot Anda melalui @BotFather).',
                    ], 422);
                }
            }
        } elseif (($validated['type'] ?? '') === 'EMAIL') {
            $recipients = EmailNotificationService::parseRecipients($config['email'] ?? '');
            if (empty($recipients)) {
                return response()->json(['message' => 'Masukkan minimal satu alamat email penerima yang valid.'], 422);
            }
            $config['email'] = implode(', ', $recipients);
        }

        $validated['config'] = $config;
        $endpoint = Endpoint::create($validated);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $validated['device_id'],
            'device_name' => $endpoint->name,
            'event'       => "Menambahkan endpoint integrasi baru: {$endpoint->name} ({$endpoint->type})",
            'type'        => 'success',
        ]);

        return response()->json($this->formatEndpoint($endpoint), 201);
    }

    public function update(Request $request, Endpoint $endpoint, TelegramNotificationService $telegram)
    {
        $this->authorizeEndpoint($request, $endpoint);

        $validated = $request->validate([
            'device_id'   => 'sometimes|exists:devices,id',
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'sometimes|in:EMAIL,HTTP,SLACK,TELEGRAM,MQTT',
            'enabled'     => 'sometimes|boolean',
            'config'      => 'nullable|array',
        ]);

        if (isset($validated['device_id'])) {
            Device::where('id', $validated['device_id'])
                ->where('user_id', $request->user()->id)
                ->firstOrFail();
        }

        if (array_key_exists('config', $validated)) {
            $incomingConfig = is_array($validated['config']) ? $validated['config'] : [];
            $existingConfig = is_array($endpoint->config) ? $endpoint->config : [];

            $clearToken = !empty($incomingConfig['clear_bot_token']);
            unset($incomingConfig['has_bot_token'], $incomingConfig['bot_token_masked'], $incomingConfig['clear_bot_token']);

            $incomingToken = trim((string) ($incomingConfig['bot_token'] ?? $incomingConfig['botToken'] ?? ''));
            $existingToken = trim((string) ($existingConfig['bot_token'] ?? $existingConfig['botToken'] ?? ''));

            if ($clearToken) {
                unset($incomingConfig['bot_token'], $incomingConfig['botToken']);
            } elseif ($incomingToken !== '') {
                $incomingConfig['bot_token'] = TelegramNotificationService::encryptToken($incomingToken);
                unset($incomingConfig['botToken']);
            } elseif ($existingToken !== '') {
                $incomingConfig['bot_token'] = TelegramNotificationService::encryptToken($existingToken);
                unset($incomingConfig['botToken']);
            } else {
                unset($incomingConfig['bot_token'], $incomingConfig['botToken']);
            }

            $nextType = $validated['type'] ?? $endpoint->type;
            if ($nextType === 'TELEGRAM') {
                $chatId = trim((string) ($incomingConfig['chat_id'] ?? $incomingConfig['chatId'] ?? ''));
                if ($chatId === '') {
                    return response()->json(['message' => 'Chat ID Telegram wajib diisi.'], 422);
                }
                $incomingConfig['chat_id'] = $chatId;
                unset($incomingConfig['chatId']);

                if (empty($incomingConfig['bot_token']) && !$telegram->hasDefaultBotToken()) {
                    return response()->json([
                        'message' => 'Bot Token Telegram wajib diisi (buat bot Anda melalui @BotFather).',
                    ], 422);
                }
            } elseif ($nextType === 'EMAIL') {
                $recipients = EmailNotificationService::parseRecipients($incomingConfig['email'] ?? '');
                if (empty($recipients)) {
                    return response()->json(['message' => 'Masukkan minimal satu alamat email penerima yang valid.'], 422);
                }
                $incomingConfig['email'] = implode(', ', $recipients);
            }

            $validated['config'] = $incomingConfig;
        }

        $endpoint->update($validated);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $endpoint->device_id,
            'device_name' => $endpoint->name,
            'event'       => "Memperbarui konfigurasi endpoint: {$endpoint->name}",
            'type'        => 'info',
        ]);

        return response()->json($this->formatEndpoint($endpoint->fresh()));
    }

    public function toggle(Request $request, Endpoint $endpoint)
    {
        $this->authorizeEndpoint($request, $endpoint);
        $endpoint->update(['enabled' => !$endpoint->enabled]);
        return response()->json($this->formatEndpoint($endpoint->fresh()));
    }

    public function trigger(
        Request $request,
        Endpoint $endpoint,
        TelegramNotificationService $telegram,
        EmailNotificationService $emailService
    ) {
        $this->authorizeEndpoint($request, $endpoint);

        if (!$endpoint->enabled) {
            return response()->json(['message' => 'Endpoint sedang nonaktif. Aktifkan terlebih dahulu untuk mengetes.'], 400);
        }

        $endpoint->loadMissing('device.dataBuckets');
        $device = $endpoint->device;
        $cfg = is_array($endpoint->config) ? $endpoint->config : [];

        if (in_array($endpoint->type, ['TELEGRAM', 'EMAIL'], true)) {
            $latestPayload = [];
            if ($device && $device->dataBuckets->isNotEmpty()) {
                $latestRecord = BucketRecord::whereIn('data_bucket_id', $device->dataBuckets->pluck('id'))
                    ->latest('recorded_at')
                    ->first();
                if ($latestRecord && is_array($latestRecord->data)) {
                    $latestPayload = $latestRecord->data;
                }
            }

            $field = trim((string) ($cfg['field'] ?? ''));
            if ($field === '' && !empty($latestPayload)) {
                $field = (string) array_key_first($latestPayload);
            }
            if ($field === '') {
                $field = 'temperature';
            }

            $value = array_key_exists($field, $latestPayload)
                ? $latestPayload[$field]
                : ($cfg['threshold'] ?? 32.5);

            $timezone = $request->user()->timezone ?? 'Asia/Jakarta';
            $context = [
                'device'    => $device?->name ?? 'IoT Device',
                'location'  => $device?->location ?? '-',
                'field'     => $field,
                'value'     => $value,
                'operator'  => $cfg['operator'] ?? '>',
                'threshold' => $cfg['threshold'] ?? '30',
                'rule'      => $endpoint->name,
                'time'      => now()->setTimezone($timezone)->format('d M Y H:i:s'),
                'payload'   => !empty($latestPayload) ? $latestPayload : [$field => $value],
            ];

            if ($endpoint->type === 'TELEGRAM') {
                $chatId = trim((string) ($cfg['chat_id'] ?? $cfg['chatId'] ?? ''));
                $botToken = $cfg['bot_token'] ?? $cfg['botToken'] ?? null;
                $message = $telegram->renderTemplate($cfg['message_template'] ?? null, $context);
                $result = $telegram->send($chatId, $message, $botToken);

                if (!$result['ok']) {
                    ActivityLog::create([
                        'user_id'     => $request->user()->id,
                        'device_id'   => $endpoint->device_id,
                        'device_name' => $device?->name ?? 'Unknown',
                        'event'       => "Gagal tes Telegram ({$endpoint->name}): {$result['message']}",
                        'type'        => 'error',
                    ]);

                    return response()->json([
                        'message' => $result['message'],
                        'preview' => $message,
                    ], 422);
                }

                $endpoint->increment('trigger_count');
                $endpoint->update(['last_triggered_at' => now()]);

                ActivityLog::create([
                    'user_id'     => $request->user()->id,
                    'device_id'   => $endpoint->device_id,
                    'device_name' => $device?->name ?? 'Unknown',
                    'event'       => "Tes notifikasi Telegram berhasil dikirim: {$endpoint->name}",
                    'type'        => 'success',
                ]);

                return response()->json([
                    'message'             => 'Pesan tes Telegram berhasil dikirim!',
                    'preview'             => $message,
                    'telegram_message_id' => $result['telegram_message_id'] ?? null,
                    'trigger_count'       => (int) $endpoint->fresh()->trigger_count,
                    'last_triggered'      => $endpoint->fresh()->last_triggered_at?->toISOString(),
                ]);
            }

            // EMAIL endpoint trigger
            $result = $emailService->send(
                (string) ($cfg['email'] ?? ''),
                $cfg['subject'] ?? null,
                $cfg['message_template'] ?? null,
                $context
            );

            if (!$result['ok']) {
                ActivityLog::create([
                    'user_id'     => $request->user()->id,
                    'device_id'   => $endpoint->device_id,
                    'device_name' => $device?->name ?? 'Unknown',
                    'event'       => "Gagal tes Email ({$endpoint->name}): {$result['message']}",
                    'type'        => 'error',
                ]);

                return response()->json([
                    'message' => $result['message'],
                    'preview' => $result['preview_body'] ?? null,
                ], 422);
            }

            $endpoint->increment('trigger_count');
            $endpoint->update(['last_triggered_at' => now()]);

            ActivityLog::create([
                'user_id'     => $request->user()->id,
                'device_id'   => $endpoint->device_id,
                'device_name' => $device?->name ?? 'Unknown',
                'event'       => "Tes notifikasi Email berhasil diproses: {$endpoint->name}",
                'type'        => 'success',
            ]);

            return response()->json([
                'message'        => $result['message'],
                'mailer'         => $result['mailer'] ?? null,
                'preview'        => $result['preview_body'] ?? null,
                'trigger_count'  => (int) $endpoint->fresh()->trigger_count,
                'last_triggered' => $endpoint->fresh()->last_triggered_at?->toISOString(),
            ]);
        }

        $endpoint->increment('trigger_count');
        $endpoint->update(['last_triggered_at' => now()]);

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'device_id'   => $endpoint->device_id,
            'device_name' => $device?->name ?? 'Unknown',
            'event'       => "Pemicu manual endpoint: {$endpoint->name}",
            'type'        => 'info',
        ]);

        return response()->json([
            'message'        => 'Endpoint triggered successfully',
            'trigger_count'  => (int) $endpoint->fresh()->trigger_count,
            'last_triggered' => $endpoint->fresh()->last_triggered_at?->toISOString(),
        ]);
    }

    /**
     * Return server Telegram configuration status & default alert template.
     */
    public function telegramStatus(TelegramNotificationService $telegram)
    {
        return response()->json([
            'has_default_bot_token' => $telegram->hasDefaultBotToken(),
            'default_template'      => TelegramNotificationService::DEFAULT_TEMPLATE,
            'placeholders'          => [
                '{device}',
                '{location}',
                '{field}',
                '{value}',
                '{operator}',
                '{threshold}',
                '{rule}',
                '{time}',
                '{payload}',
            ],
        ]);
    }

    /**
     * Send an ad-hoc test message to Telegram directly from Endpoint/Automation modal before saving.
     */
    public function testTelegram(Request $request, TelegramNotificationService $telegram)
    {
        $validated = $request->validate([
            'endpoint_id'      => 'nullable|integer|exists:endpoints,id',
            'automation_id'    => 'nullable|integer|exists:automations,id',
            'device_id'        => 'nullable|integer|exists:devices,id',
            'chat_id'          => 'nullable|string|max:120',
            'bot_token'        => 'nullable|string|max:255',
            'message_template' => 'nullable|string|max:3500',
            'field'            => 'nullable|string|max:100',
            'operator'         => 'nullable|string|max:10',
            'threshold'        => 'nullable',
            'rule'             => 'nullable|string|max:255',
        ]);

        $chatId = trim((string) ($validated['chat_id'] ?? ''));
        $botToken = trim((string) ($validated['bot_token'] ?? ''));

        // Allow falling back to a saved endpoint owned by the user (so edit forms don't require retyping token)
        if (!empty($validated['endpoint_id'])) {
            $endpoint = Endpoint::where('id', $validated['endpoint_id'])
                ->whereHas('device', fn ($q) => $q->where('user_id', $request->user()->id))
                ->first();

            if ($endpoint && is_array($endpoint->config)) {
                if ($chatId === '') {
                    $chatId = trim((string) ($endpoint->config['chat_id'] ?? $endpoint->config['chatId'] ?? ''));
                }
                if ($botToken === '') {
                    $botToken = trim((string) ($endpoint->config['bot_token'] ?? $endpoint->config['botToken'] ?? ''));
                }
            }
        }

        // Also allow falling back to a saved automation's encrypted token when editing
        if (!empty($validated['automation_id']) && ($chatId === '' || $botToken === '')) {
            $automation = \App\Models\Automation::where('id', $validated['automation_id'])
                ->where('user_id', $request->user()->id)
                ->first();

            if ($automation && is_array($automation->action)) {
                if ($chatId === '') {
                    $chatId = trim((string) ($automation->action['chat_id'] ?? $automation->action['chatId'] ?? ''));
                }
                if ($botToken === '') {
                    $botToken = trim((string) ($automation->action['bot_token'] ?? $automation->action['botToken'] ?? ''));
                }
            }
        }

        $device = null;
        if (!empty($validated['device_id'])) {
            $device = Device::where('id', $validated['device_id'])
                ->where('user_id', $request->user()->id)
                ->first();
        }

        $field = trim((string) ($validated['field'] ?? 'temperature')) ?: 'temperature';
        $threshold = $validated['threshold'] ?? 35;
        $sampleVal = is_numeric($threshold) ? ((float) $threshold + 1.5) : $threshold;

        $timezone = $request->user()->timezone ?? 'Asia/Jakarta';
        $message = $telegram->renderTemplate($validated['message_template'] ?? null, [
            'device'    => $device?->name ?? 'ESP32 Sensor Node',
            'location'  => $device?->location ?? 'Ruang Server',
            'field'     => $field,
            'value'     => $sampleVal,
            'operator'  => $validated['operator'] ?? '>',
            'threshold' => $threshold,
            'rule'      => $validated['rule'] ?? 'Tes Alert VideaLink',
            'time'      => now()->setTimezone($timezone)->format('d M Y H:i:s'),
            'payload'   => [$field => $sampleVal, 'rssi' => -58],
        ]);

        $result = $telegram->send($chatId, $message, $botToken !== '' ? $botToken : null);

        if (!$result['ok']) {
            return response()->json([
                'message' => $result['message'],
                'preview' => $message,
            ], 422);
        }

        return response()->json([
            'message'             => 'Pesan tes Telegram berhasil dikirim!',
            'preview'             => $message,
            'telegram_message_id' => $result['telegram_message_id'] ?? null,
        ]);
    }

    /**
     * Return server email mailer configuration status & default templates.
     */
    public function emailStatus(EmailNotificationService $emailService)
    {
        return response()->json($emailService->getMailerInfo());
    }

    /**
     * Send an ad-hoc test alert email directly from Endpoint/Automation modal before saving.
     */
    public function testEmail(Request $request, EmailNotificationService $emailService)
    {
        $validated = $request->validate([
            'endpoint_id'      => 'nullable|integer|exists:endpoints,id',
            'device_id'        => 'nullable|integer|exists:devices,id',
            'email'            => 'nullable|string|max:500',
            'subject'          => 'nullable|string|max:255',
            'message_template' => 'nullable|string|max:5000',
            'field'            => 'nullable|string|max:100',
            'operator'         => 'nullable|string|max:10',
            'threshold'        => 'nullable',
            'rule'             => 'nullable|string|max:255',
        ]);

        $recipientsRaw = trim((string) ($validated['email'] ?? ''));

        if ($recipientsRaw === '' && !empty($validated['endpoint_id'])) {
            $endpoint = Endpoint::where('id', $validated['endpoint_id'])
                ->whereHas('device', fn ($q) => $q->where('user_id', $request->user()->id))
                ->first();
            if ($endpoint && is_array($endpoint->config)) {
                $recipientsRaw = trim((string) ($endpoint->config['email'] ?? ''));
            }
        }

        $device = null;
        if (!empty($validated['device_id'])) {
            $device = Device::where('id', $validated['device_id'])
                ->where('user_id', $request->user()->id)
                ->first();
        }

        $field = trim((string) ($validated['field'] ?? 'temperature')) ?: 'temperature';
        $threshold = $validated['threshold'] ?? 35;
        $sampleVal = is_numeric($threshold) ? ((float) $threshold + 1.5) : $threshold;
        $timezone = $request->user()->timezone ?? 'Asia/Jakarta';

        $result = $emailService->send(
            $recipientsRaw,
            $validated['subject'] ?? null,
            $validated['message_template'] ?? null,
            [
                'device'    => $device?->name ?? 'ESP32 Sensor Node',
                'location'  => $device?->location ?? 'Ruang Server',
                'field'     => $field,
                'value'     => $sampleVal,
                'operator'  => $validated['operator'] ?? '>',
                'threshold' => $threshold,
                'rule'      => $validated['rule'] ?? 'Tes Alert VideaLink',
                'time'      => now()->setTimezone($timezone)->format('d M Y H:i:s'),
                'payload'   => [$field => $sampleVal, 'rssi' => -58],
            ]
        );

        if (!$result['ok']) {
            return response()->json([
                'message' => $result['message'],
                'mailer'  => $result['mailer'] ?? null,
            ], 422);
        }

        return response()->json([
            'message'         => $result['message'],
            'mailer'          => $result['mailer'] ?? null,
            'recipients'      => $result['recipients'] ?? [],
            'preview_subject' => $result['preview_subject'] ?? null,
            'preview_body'    => $result['preview_body'] ?? null,
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
