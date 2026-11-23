<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotificationService
{
    public const ENCRYPTED_PREFIX = 'enc:';

    public const DEFAULT_TEMPLATE = "⚠️ *ALERT VIDEA LINK*\nPerangkat: *{device}*\nSensor: `{field}` = *{value}* (Kondisi: `{operator} {threshold}`)\nLokasi: {location}\nWaktu: {time}";

    /**
     * Encrypt a Bot Token for safe at-rest storage in database.
     * Idempotent: already-encrypted tokens are returned untouched.
     */
    public static function encryptToken(?string $token): ?string
    {
        $clean = trim((string) ($token ?? ''));
        if ($clean === '') {
            return null;
        }
        if (str_starts_with($clean, self::ENCRYPTED_PREFIX)) {
            return $clean;
        }
        return self::ENCRYPTED_PREFIX . Crypt::encryptString($clean);
    }

    /**
     * Decrypt a stored Bot Token (supports both encrypted 'enc:' values and legacy plaintext).
     */
    public static function decryptToken(?string $stored): ?string
    {
        $clean = trim((string) ($stored ?? ''));
        if ($clean === '') {
            return null;
        }
        if (!str_starts_with($clean, self::ENCRYPTED_PREFIX)) {
            return $clean;
        }

        try {
            $decrypted = trim(Crypt::decryptString(substr($clean, strlen(self::ENCRYPTED_PREFIX))));
            return $decrypted !== '' ? $decrypted : null;
        } catch (\Throwable $e) {
            Log::warning('Failed to decrypt stored Telegram Bot Token', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Resolve Bot Token: explicit/stored user token first, then server .env default.
     */
    public function resolveBotToken(?string $customToken = null): ?string
    {
        $token = self::decryptToken($customToken);
        if ($token !== null && $token !== '') {
            return $token;
        }

        $envToken = trim((string) config('services.telegram.bot_token', ''));
        return $envToken !== '' ? $envToken : null;
    }

    /**
     * Check whether a server-level default Telegram Bot Token is configured.
     */
    public function hasDefaultBotToken(): bool
    {
        return trim((string) config('services.telegram.bot_token', '')) !== '';
    }

    /**
     * Mask sensitive Bot Token (decrypting first if stored encrypted) before sending to frontend.
     */
    public static function maskToken(?string $token): ?string
    {
        $plain = self::decryptToken($token);
        if ($plain === null || $plain === '') {
            return null;
        }
        $len = strlen($plain);
        if ($len <= 10) {
            return str_repeat('*', $len);
        }
        return substr($plain, 0, 6) . '••••••' . substr($plain, -4);
    }

    /**
     * Render custom message template by replacing {placeholders}.
     *
     * Supported variables:
     * {device}, {location}, {field}, {value}, {operator}, {threshold}, {rule}, {time}, {payload}
     */
    public function renderTemplate(?string $template, array $context = []): string
    {
        $body = trim((string) ($template ?? ''));
        if ($body === '') {
            $body = self::DEFAULT_TEMPLATE;
        }

        $payloadSummary = '';
        if (isset($context['payload']) && is_array($context['payload'])) {
            $pairs = [];
            foreach ($context['payload'] as $k => $v) {
                $valStr = is_scalar($v) ? (string) $v : json_encode($v);
                $pairs[] = "{$k}: {$valStr}";
            }
            $payloadSummary = implode(', ', $pairs);
        } elseif (isset($context['payload']) && is_string($context['payload'])) {
            $payloadSummary = $context['payload'];
        }

        $replacements = [
            '{device}'    => (string) ($context['device'] ?? 'IoT Device'),
            '{location}'  => (string) ($context['location'] ?? '-'),
            '{field}'     => (string) ($context['field'] ?? 'value'),
            '{value}'     => isset($context['value']) ? (string) $context['value'] : '-',
            '{operator}'  => (string) ($context['operator'] ?? ''),
            '{threshold}' => isset($context['threshold']) ? (string) $context['threshold'] : '-',
            '{rule}'      => (string) ($context['rule'] ?? 'Alert Rule'),
            '{time}'      => (string) ($context['time'] ?? now()->setTimezone('Asia/Jakarta')->format('d M Y H:i:s')),
            '{payload}'   => $payloadSummary !== '' ? $payloadSummary : '-',
        ];

        return strtr($body, $replacements);
    }

    /**
     * Send a message via Telegram Bot API with strict timeout so ingestion never hangs.
     *
     * @return array{ok: bool, message: string, telegram_message_id?: int, status_code?: int}
     */
    public function send(string $chatId, string $text, ?string $customBotToken = null, ?string $parseMode = 'Markdown'): array
    {
        $botToken = $this->resolveBotToken($customBotToken);
        $chatId = trim($chatId);

        if (!$botToken) {
            return [
                'ok' => false,
                'message' => 'Bot Token Telegram belum dikonfigurasi. Isi Bot Token pada form atau set TELEGRAM_BOT_TOKEN di backend/.env.',
            ];
        }

        if ($chatId === '') {
            return [
                'ok' => false,
                'message' => 'Chat ID Telegram tidak boleh kosong.',
            ];
        }

        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

        $body = [
            'chat_id' => $chatId,
            'text' => $text,
            'disable_web_page_preview' => true,
        ];

        if ($parseMode) {
            $body['parse_mode'] = $parseMode;
        }

        try {
            $response = Http::connectTimeout(3)
                ->timeout(6)
                ->post($url, $body);

            // If Markdown parsing fails due to unescaped special chars in custom user text, retry safely as plain text
            if (!$response->successful() && $parseMode !== null) {
                $errDesc = (string) ($response->json('description') ?? '');
                if (stripos($errDesc, 'parse entities') !== false || stripos($errDesc, 'can\'t find end') !== false) {
                    unset($body['parse_mode']);
                    $response = Http::connectTimeout(3)
                        ->timeout(6)
                        ->post($url, $body);
                }
            }

            if ($response->successful() && $response->json('ok') === true) {
                return [
                    'ok' => true,
                    'message' => 'Pesan Telegram berhasil terkirim.',
                    'telegram_message_id' => $response->json('result.message_id'),
                    'status_code' => $response->status(),
                ];
            }

            $description = $response->json('description') ?? $response->body() ?: 'Telegram API returned an error.';
            Log::warning('Telegram sendMessage failed', [
                'chat_id' => $chatId,
                'status' => $response->status(),
                'description' => $description,
            ]);

            return [
                'ok' => false,
                'message' => "Telegram API Error: {$description}",
                'status_code' => $response->status(),
            ];
        } catch (\Throwable $e) {
            Log::error('Telegram sendMessage exception', [
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);

            return [
                'ok' => false,
                'message' => 'Gagal terhubung ke server Telegram: ' . $e->getMessage(),
            ];
        }
    }
}

