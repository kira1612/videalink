<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Automation;
use App\Models\Device;
use App\Models\Endpoint;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AlertEvaluatorService
{
    public function __construct(
        private readonly TelegramNotificationService $telegram,
        private readonly EmailNotificationService $email
    ) {}

    /**
     * Evaluate all active Automations and Alert Endpoints (Telegram & Email) for incoming telemetry.
     * Always fails safely (never throws) so sensor data ingestion is never interrupted.
     *
     * @return array<int, array<string, mixed>> List of triggered alert summaries
     */
    public function evaluate(Device $device, array $payload, ?Carbon $recordedAt = null): array
    {
        $triggered = [];
        $timezone = $device->user?->timezone ?? 'Asia/Jakarta';
        $timestampStr = ($recordedAt ?? now())->copy()->setTimezone($timezone)->format('d M Y H:i:s');

        // 1. Evaluate active Automations (sensor trigger rules)
        try {
            $automations = Automation::where('user_id', $device->user_id)
                ->where('is_active', true)
                ->get();

            foreach ($automations as $auto) {
                $cond = $auto->condition ?? [];
                if (($cond['type'] ?? null) !== 'sensor') {
                    continue;
                }
                if ((int) ($cond['device_id'] ?? 0) !== (int) $device->id) {
                    continue;
                }

                [$matched, $matchedField, $actualValue] = $this->matchCondition($cond, $payload);
                if (!$matched) {
                    continue;
                }

                $cooldown = max(0, (int) ($cond['cooldown_seconds'] ?? 60));
                if ($this->isInCooldown($auto->last_triggered_at, $cooldown)) {
                    continue;
                }

                $action = $auto->action ?? [];
                $actionType = $action['type'] ?? 'device';
                $context = [
                    'device'    => $device->name,
                    'location'  => $device->location ?? '-',
                    'field'     => $matchedField,
                    'value'     => $actualValue,
                    'operator'  => $cond['operator'] ?? '>',
                    'threshold' => $cond['value'] ?? '',
                    'rule'      => $auto->name,
                    'time'      => $timestampStr,
                    'payload'   => $payload,
                ];

                if ($actionType === 'telegram') {
                    $resolved = $this->resolveTelegramTarget($action, $device);
                    if (!$resolved['chat_id']) {
                        continue;
                    }

                    $message = $this->telegram->renderTemplate($action['message_template'] ?? null, $context);
                    $result = $this->telegram->send(
                        $resolved['chat_id'],
                        $message,
                        $resolved['bot_token']
                    );

                    if ($result['ok']) {
                        $auto->increment('trigger_count');
                        $auto->update(['last_triggered_at' => now()]);

                        if (!empty($resolved['endpoint'])) {
                            $resolved['endpoint']->increment('trigger_count');
                            $resolved['endpoint']->update(['last_triggered_at' => now()]);
                        }

                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Alert Telegram terkirim ({$auto->name}): {$matchedField} = {$actualValue}",
                            'type'        => 'warning',
                        ]);

                        $triggered[] = [
                            'source'  => 'automation',
                            'channel' => 'telegram',
                            'id'      => $auto->id,
                            'name'    => $auto->name,
                            'field'   => $matchedField,
                            'value'   => $actualValue,
                            'sent'    => true,
                        ];
                    } else {
                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Gagal kirim Alert Telegram ({$auto->name}): {$result['message']}",
                            'type'        => 'error',
                        ]);
                    }
                } elseif ($actionType === 'email') {
                    $resolved = $this->resolveEmailTarget($action, $device);
                    if ($resolved['email'] === '') {
                        continue;
                    }

                    $result = $this->email->send(
                        $resolved['email'],
                        $action['subject'] ?? null,
                        $action['message_template'] ?? null,
                        $context
                    );

                    if ($result['ok']) {
                        $auto->increment('trigger_count');
                        $auto->update(['last_triggered_at' => now()]);

                        if (!empty($resolved['endpoint'])) {
                            $resolved['endpoint']->increment('trigger_count');
                            $resolved['endpoint']->update(['last_triggered_at' => now()]);
                        }

                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Alert Email terkirim ({$auto->name}): {$matchedField} = {$actualValue}",
                            'type'        => 'warning',
                        ]);

                        $triggered[] = [
                            'source'  => 'automation',
                            'channel' => 'email',
                            'id'      => $auto->id,
                            'name'    => $auto->name,
                            'field'   => $matchedField,
                            'value'   => $actualValue,
                            'sent'    => true,
                        ];
                    } else {
                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Gagal kirim Alert Email ({$auto->name}): {$result['message']}",
                            'type'        => 'error',
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('AlertEvaluatorService automation error', [
                'device_id' => $device->id,
                'error'     => $e->getMessage(),
            ]);
        }

        // 2. Evaluate active TELEGRAM & EMAIL Endpoints with built-in threshold alert rules
        try {
            $endpoints = Endpoint::where('device_id', $device->id)
                ->whereIn('type', ['TELEGRAM', 'EMAIL'])
                ->where('enabled', true)
                ->get();

            foreach ($endpoints as $endpoint) {
                $cfg = $endpoint->config ?? [];
                if (empty($cfg['alert_enabled'])) {
                    continue;
                }

                $cond = [
                    'field'    => $cfg['field'] ?? null,
                    'operator' => $cfg['operator'] ?? '>',
                    'value'    => $cfg['threshold'] ?? null,
                ];

                [$matched, $matchedField, $actualValue] = $this->matchCondition($cond, $payload);
                if (!$matched) {
                    continue;
                }

                $cooldown = max(0, (int) ($cfg['cooldown_seconds'] ?? 60));
                if ($this->isInCooldown($endpoint->last_triggered_at, $cooldown)) {
                    continue;
                }

                $context = [
                    'device'    => $device->name,
                    'location'  => $device->location ?? '-',
                    'field'     => $matchedField,
                    'value'     => $actualValue,
                    'operator'  => $cond['operator'],
                    'threshold' => $cond['value'],
                    'rule'      => $endpoint->name,
                    'time'      => $timestampStr,
                    'payload'   => $payload,
                ];

                if ($endpoint->type === 'TELEGRAM') {
                    $chatId = trim((string) ($cfg['chat_id'] ?? $cfg['chatId'] ?? ''));
                    $botToken = $cfg['bot_token'] ?? $cfg['botToken'] ?? null;

                    if ($chatId === '') {
                        continue;
                    }

                    $message = $this->telegram->renderTemplate($cfg['message_template'] ?? null, $context);
                    $result = $this->telegram->send($chatId, $message, $botToken);

                    if ($result['ok']) {
                        $endpoint->increment('trigger_count');
                        $endpoint->update(['last_triggered_at' => now()]);

                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Alert Endpoint Telegram terkirim ({$endpoint->name}): {$matchedField} = {$actualValue}",
                            'type'        => 'warning',
                        ]);

                        $triggered[] = [
                            'source'  => 'endpoint',
                            'channel' => 'telegram',
                            'id'      => $endpoint->id,
                            'name'    => $endpoint->name,
                            'field'   => $matchedField,
                            'value'   => $actualValue,
                            'sent'    => true,
                        ];
                    } else {
                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Gagal kirim Endpoint Telegram ({$endpoint->name}): {$result['message']}",
                            'type'        => 'error',
                        ]);
                    }
                } elseif ($endpoint->type === 'EMAIL') {
                    $recipients = trim((string) ($cfg['email'] ?? ''));
                    if ($recipients === '') {
                        continue;
                    }

                    $result = $this->email->send(
                        $recipients,
                        $cfg['subject'] ?? null,
                        $cfg['message_template'] ?? null,
                        $context
                    );

                    if ($result['ok']) {
                        $endpoint->increment('trigger_count');
                        $endpoint->update(['last_triggered_at' => now()]);

                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Alert Endpoint Email terkirim ({$endpoint->name}): {$matchedField} = {$actualValue}",
                            'type'        => 'warning',
                        ]);

                        $triggered[] = [
                            'source'  => 'endpoint',
                            'channel' => 'email',
                            'id'      => $endpoint->id,
                            'name'    => $endpoint->name,
                            'field'   => $matchedField,
                            'value'   => $actualValue,
                            'sent'    => true,
                        ];
                    } else {
                        ActivityLog::create([
                            'user_id'     => $device->user_id,
                            'device_id'   => $device->id,
                            'device_name' => $device->name,
                            'event'       => "Gagal kirim Endpoint Email ({$endpoint->name}): {$result['message']}",
                            'type'        => 'error',
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('AlertEvaluatorService endpoint error', [
                'device_id' => $device->id,
                'error'     => $e->getMessage(),
            ]);
        }

        return $triggered;
    }

    /**
     * Evaluate whether payload matches a sensor threshold condition.
     *
     * @return array{0: bool, 1: string, 2: mixed}
     */
    public function matchCondition(array $cond, array $payload): array
    {
        $operator = (string) ($cond['operator'] ?? '>');
        $threshold = $cond['value'] ?? null;
        if ($threshold === null || $threshold === '') {
            return [false, '', null];
        }

        $targetField = trim((string) ($cond['field'] ?? ''));

        if ($targetField !== '') {
            if (!array_key_exists($targetField, $payload)) {
                return [false, $targetField, null];
            }
            $val = $payload[$targetField];
            return [$this->compareValues($val, $operator, $threshold), $targetField, $val];
        }

        foreach ($payload as $key => $val) {
            if (is_numeric($val)) {
                if ($this->compareValues($val, $operator, $threshold)) {
                    return [true, (string) $key, $val];
                }
            }
        }

        return [false, '', null];
    }

    private function compareValues(mixed $actual, string $operator, mixed $threshold): bool
    {
        if (is_bool($actual)) {
            $actualStr = $actual ? 'true' : 'false';
            $threshStr = strtolower(trim((string) $threshold));
            if ($threshStr === '1') $threshStr = 'true';
            if ($threshStr === '0') $threshStr = 'false';
            return match ($operator) {
                '==', '=' => $actualStr === $threshStr,
                '!='      => $actualStr !== $threshStr,
                default   => false,
            };
        }

        if (is_numeric($actual) && is_numeric($threshold)) {
            $a = (float) $actual;
            $b = (float) $threshold;
            return match ($operator) {
                '>'       => $a > $b,
                '>='      => $a >= $b,
                '<'       => $a < $b,
                '<='      => $a <= $b,
                '==', '=' => abs($a - $b) < 0.000001,
                '!='      => abs($a - $b) >= 0.000001,
                default   => false,
            };
        }

        $aStr = trim((string) $actual);
        $bStr = trim((string) $threshold);
        return match ($operator) {
            '==', '=' => strcasecmp($aStr, $bStr) === 0,
            '!='      => strcasecmp($aStr, $bStr) !== 0,
            default   => false,
        };
    }

    private function isInCooldown(?Carbon $lastTriggeredAt, int $cooldownSeconds): bool
    {
        if (!$lastTriggeredAt || $cooldownSeconds <= 0) {
            return false;
        }
        return $lastTriggeredAt->diffInSeconds(now()) < $cooldownSeconds;
    }

    /**
     * @return array{chat_id: string, bot_token: ?string, endpoint: ?Endpoint}
     */
    private function resolveTelegramTarget(array $action, Device $device): array
    {
        $endpoint = null;
        $chatId = trim((string) ($action['chat_id'] ?? $action['chatId'] ?? ''));
        $botToken = $action['bot_token'] ?? $action['botToken'] ?? null;

        if (!empty($action['endpoint_id'])) {
            $endpoint = Endpoint::where('id', $action['endpoint_id'])
                ->whereHas('device', fn ($q) => $q->where('user_id', $device->user_id))
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

        return [
            'chat_id'   => $chatId,
            'bot_token' => $botToken,
            'endpoint'  => $endpoint,
        ];
    }

    /**
     * @return array{email: string, endpoint: ?Endpoint}
     */
    private function resolveEmailTarget(array $action, Device $device): array
    {
        $endpoint = null;
        $email = trim((string) ($action['email'] ?? ''));

        if (!empty($action['endpoint_id'])) {
            $endpoint = Endpoint::where('id', $action['endpoint_id'])
                ->whereHas('device', fn ($q) => $q->where('user_id', $device->user_id))
                ->first();

            if ($endpoint && is_array($endpoint->config) && $email === '') {
                $email = trim((string) ($endpoint->config['email'] ?? ''));
            }
        }

        return [
            'email'    => $email,
            'endpoint' => $endpoint,
        ];
    }
}
