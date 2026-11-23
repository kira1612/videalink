<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailNotificationService
{
    public const DEFAULT_SUBJECT = '[VideaLink] {device}: {field} = {value} ({operator} {threshold})';

    public const DEFAULT_TEMPLATE = "Halo Tim Operasional,\n\nPembacaan sensor pada perangkat {device} ({location}) telah melampaui batas yang dikonfigurasi ({field} {operator} {threshold}) dengan nilai aktual {value}.\n\nSilakan tinjau kondisi perangkat dan riwayat telemetri terbaru melalui dashboard VideaLink.";

    /**
     * Parse and validate comma/semicolon-separated recipient email addresses.
     *
     * @return array<int, string>
     */
    public static function parseRecipients(?string $raw): array
    {
        $raw = trim((string) ($raw ?? ''));
        if ($raw === '') {
            return [];
        }

        $parts = preg_split('/[\s,;]+/', $raw, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $valid = [];

        foreach ($parts as $part) {
            $email = trim($part);
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $lower = strtolower($email);
                if (!in_array($lower, $valid, true)) {
                    $valid[] = $lower;
                }
            }
            if (count($valid) >= 10) {
                break;
            }
        }

        return $valid;
    }

    /**
     * Inspect current Laravel mail configuration so UI can inform the operator clearly.
     */
    public function getMailerInfo(): array
    {
        $mailer = (string) config('mail.default', 'log');
        $isLive = !in_array($mailer, ['log', 'array'], true);
        $host = (string) config('mail.mailers.smtp.host', '');
        $username = (string) config('mail.mailers.smtp.username', '');

        return [
            'mailer'           => $mailer,
            'is_live_mailer'   => $isLive,
            'smtp_configured'  => $mailer === 'smtp' ? ($host !== '' && $host !== '127.0.0.1' && $username !== '') : $isLive,
            'from_address'     => (string) config('mail.from.address', 'hello@example.com'),
            'from_name'        => (string) config('mail.from.name', config('app.name', 'VideaLink')),
            'default_subject'  => self::DEFAULT_SUBJECT,
            'default_template' => self::DEFAULT_TEMPLATE,
        ];
    }

    /**
     * Render custom subject (stripping CR/LF to prevent SMTP header injection).
     */
    public function renderSubject(?string $subjectTemplate, array $context = []): string
    {
        $raw = trim((string) ($subjectTemplate ?? ''));
        if ($raw === '') {
            $raw = self::DEFAULT_SUBJECT;
        }
        $rendered = $this->replacePlaceholders($raw, $context);
        return trim(preg_replace('/[\r\n]+/', ' ', $rendered) ?? $rendered);
    }

    /**
     * Render custom body text by replacing {placeholders}.
     */
    public function renderTemplate(?string $template, array $context = []): string
    {
        $body = trim((string) ($template ?? ''));
        if ($body === '') {
            $body = self::DEFAULT_TEMPLATE;
        }
        return $this->replacePlaceholders($body, $context);
    }

    private function formatPayloadSummary(mixed $payload): string
    {
        if (is_array($payload)) {
            $pairs = [];
            foreach ($payload as $k => $v) {
                $valStr = is_scalar($v) ? (string) $v : json_encode($v);
                $pairs[] = "{$k}: {$valStr}";
            }
            return implode(', ', $pairs);
        }
        if (is_string($payload)) {
            return trim($payload);
        }
        return '';
    }

    private function replacePlaceholders(string $text, array $context = []): string
    {
        $payloadSummary = $this->formatPayloadSummary($context['payload'] ?? null);

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

        return strtr($text, $replacements);
    }

    /**
     * Resolve local white logo file path for inline CID embedding on the royal-blue brand banner.
     */
    private function resolveLogoPath(): ?string
    {
        $candidates = [
            base_path('../public/videalink_email_logo.png'),
            public_path('videalink_email_logo.png'),
            base_path('../public/new_videa_link_logo.png'),
            public_path('new_videa_link_logo.png'),
        ];

        foreach ($candidates as $path) {
            if (is_string($path) && is_file($path) && is_readable($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Format plain operator message text into crisp left-aligned HTML paragraphs and bullet lists.
     */
    private function formatMessageHtml(string $renderedBody): string
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($renderedBody)) ?: [];
        $html = [];
        $inList = false;

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '') {
                if ($inList) {
                    $html[] = '</ul>';
                    $inList = false;
                }
                continue;
            }

            if (preg_match('/^[-•*]\s+(.+)$/', $trimmed, $m)) {
                if (!$inList) {
                    $html[] = '<ul style="margin:6px 0 14px 0;padding-left:18px;text-align:left;color:#374151;">';
                    $inList = true;
                }
                $itemText = e($m[1]);
                $itemText = preg_replace('/^([^:]{1,32}:)\s*/', '<strong style="color:#111827;font-weight:600;">$1</strong> ', $itemText, 1) ?? $itemText;
                $html[] = '<li style="margin:0 0 5px 0;line-height:1.6;">' . $itemText . '</li>';
            } else {
                if ($inList) {
                    $html[] = '</ul>';
                    $inList = false;
                }
                $html[] = '<p style="margin:0 0 12px 0;line-height:1.68;color:#374151;text-align:left;">' . e($trimmed) . '</p>';
            }
        }

        if ($inList) {
            $html[] = '</ul>';
        }

        return implode("\n", $html);
    }

    /**
     * Build a calm, anti-slop Swiss-editorial corporate transactional HTML alert email
     * (inspired by Stripe / Linear / Vercel: single white sheet, hairline dividers, zero nested boxes, strict typographic hierarchy).
     */
    public function buildHtmlBody(string $renderedBody, array $context = [], ?string $logoCid = null): string
    {
        $brandName = e((string) env('MAIL_FROM_NAME', 'VideaLink'));
        if ($brandName === '' || strtolower($brandName) === 'laravel' || strtolower($brandName) === 'example') {
            $brandName = 'VideaLink';
        }

        $device = e((string) ($context['device'] ?? 'IoT Device'));
        $location = e((string) ($context['location'] ?? '-'));
        $field = e((string) ($context['field'] ?? 'value'));
        $value = e(isset($context['value']) ? (string) $context['value'] : '-');
        $operator = (string) ($context['operator'] ?? '>');
        $threshold = isset($context['threshold']) ? (string) $context['threshold'] : '-';
        $condition = e(trim("{$operator} {$threshold}"));
        $rule = e((string) ($context['rule'] ?? 'Peringatan Ambang Batas Sensor'));
        $time = e((string) ($context['time'] ?? now()->setTimezone('Asia/Jakarta')->format('d M Y H:i:s')));
        $payloadSummary = e($this->formatPayloadSummary($context['payload'] ?? null) ?: "{$field}: {$value}");
        $formattedMessageHtml = $this->formatMessageHtml($renderedBody);

        $incidentId = 'VL-' . now()->format('ymd') . '-' . strtoupper(substr(md5($device . $field . $time), 0, 4));
        $year = date('Y');
        $frontendBase = rtrim((string) env('FRONTEND_URL', config('app.url', 'http://localhost:5173')), '/');
        $dashboardUrl = e($frontendBase . '/app/dashboard');
        $endpointsUrl = e($frontendBase . '/app/endpoints');
        $displayHost = e(preg_replace('#^https?://#', '', $frontendBase) ?: 'videalink.id');

        $preheader = e("{$device} ({$location}): {$field} = {$value} ({$operator} {$threshold}) · {$time}");

        $brandLogoHtml = $logoCid
            ? '<img src="' . e($logoCid) . '" alt="' . $brandName . '" width="102" height="60" style="display:block;margin:0 auto;width:102px;height:auto;border:0;outline:none;">'
            : '<div style="font-size:22px;font-weight:900;letter-spacing:0.06em;color:#ffffff;text-transform:uppercase;line-height:1.1;">' . strtoupper($brandName) . '</div>';

        return <<<HTML
<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{$rule} — {$brandName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f7f9;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
  <!-- Hidden inbox preview text -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    {$preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f7f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Single Crisp Corporate Paper Sheet (560px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">

          <!-- 1. Solid Royal Blue Corporate Brand Banner -->
          <tr>
            <td align="center" style="background-color:#1d5ee6;padding:28px 24px 24px 24px;text-align:center;">
              {$brandLogoHtml}
              <div style="margin-top:8px;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#dbeafe;">
                IOT CLOUD PLATFORM
              </div>
            </td>
          </tr>

          <!-- 2. Clean Left-Aligned Anti-Slop Editorial Body -->
          <tr>
            <td style="padding:28px 36px 32px 36px;text-align:left;">
              <!-- Quiet Status & Incident Reference Bar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px;">
                <tr>
                  <td align="left" valign="middle" style="font-size:11px;font-weight:600;color:#111827;letter-spacing:0.01em;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:999px;background-color:#dc2626;margin-right:6px;vertical-align:middle;"></span>Sensor Alert
                  </td>
                  <td align="right" valign="middle" style="font-size:11px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#9ca3af;">
                    #{$incidentId}
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 6px 0;font-size:21px;font-weight:700;letter-spacing:-0.025em;line-height:1.3;color:#111827;">
                {$rule}
              </h1>
              <p style="margin:0 0 24px 0;font-size:13px;color:#6b7280;line-height:1.5;">
                {$device} &middot; {$location} &middot; {$time}
              </p>

              <!-- Flat Hairline Metric Strip (Zero Nested Cards) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td valign="top" style="padding:16px 12px 16px 0;width:38%;">
                    <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;">
                      Nilai Aktual
                    </div>
                    <div style="font-size:24px;font-weight:700;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#111827;letter-spacing:-0.02em;line-height:1.2;margin-top:4px;">
                      {$value}
                    </div>
                    <div style="font-size:11.5px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#6b7280;margin-top:2px;">
                      {$field}
                    </div>
                  </td>
                  <td valign="top" style="padding:16px 12px;border-left:1px solid #f0f2f5;width:30%;">
                    <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;">
                      Kondisi Batas
                    </div>
                    <div style="font-size:14px;font-weight:600;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#b91c1c;margin-top:7px;">
                      {$condition}
                    </div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:3px;">
                      Terlampaui
                    </div>
                  </td>
                  <td valign="top" style="padding:16px 0 16px 12px;border-left:1px solid #f0f2f5;width:32%;">
                    <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;">
                      Perangkat
                    </div>
                    <div style="font-size:13.5px;font-weight:600;color:#111827;margin-top:7px;line-height:1.35;">
                      {$device}
                    </div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
                      {$location}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Clean Left-Aligned Operator Message (Zero Decorative Boxes) -->
              <div style="font-size:14px;line-height:1.68;color:#374151;text-align:left;margin-bottom:22px;">
                {$formattedMessageHtml}
              </div>

              <!-- Quiet Technical Payload Line -->
              <div style="padding:10px 0 24px 0;border-top:1px solid #f3f4f6;font-size:11.5px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#6b7280;word-break:break-word;">
                <span style="color:#9ca3af;">Payload:</span> {$payloadSummary}
              </div>

              <!-- Single Clear Primary CTA + Quiet Secondary Link -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="border-radius:6px;background-color:#1d5ee6;">
                    <a href="{$dashboardUrl}" target="_blank" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Buka Dashboard &rarr;
                    </a>
                  </td>
                  <td valign="middle" style="padding-left:18px;">
                    <a href="{$endpointsUrl}" target="_blank" style="font-size:12.5px;font-weight:500;color:#4b5563;text-decoration:underline;">
                      Kelola aturan alert
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Quiet Corporate Footer -->
          <tr>
            <td style="padding:18px 36px;background-color:#fafafa;border-top:1px solid #eef0f3;text-align:left;">
              <div style="font-size:11.5px;font-weight:600;color:#374151;margin-bottom:4px;">
                {$brandName} IoT Platform &middot; <a href="{$dashboardUrl}" target="_blank" style="color:#374151;text-decoration:none;font-weight:500;">{$displayHost}</a>
              </div>
              <div style="font-size:11px;line-height:1.55;color:#9ca3af;">
                Anda menerima email ini karena terdaftar sebagai penerima notifikasi alert perangkat {$device}. &copy; {$year} {$brandName}. Email otomatis &mdash; mohon tidak membalas.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Send an alert email via configured Laravel Mailer.
     *
     * @return array{ok: bool, message: string, mailer?: string, recipients?: array<int, string>, preview_subject?: string, preview_body?: string}
     */
    public function send(string $recipientsRaw, ?string $subjectTemplate, ?string $bodyTemplate, array $context = []): array
    {
        $recipients = self::parseRecipients($recipientsRaw);
        if (empty($recipients)) {
            return [
                'ok' => false,
                'message' => 'Alamat email penerima tidak valid atau masih kosong.',
            ];
        }

        $subject = $this->renderSubject($subjectTemplate, $context);
        $body = $this->renderTemplate($bodyTemplate, $context);
        $mailer = (string) config('mail.default', 'log');
        $logoPath = $this->resolveLogoPath();

        try {
            if ($mailer === 'smtp' && config('mail.mailers.smtp.timeout') === null) {
                config(['mail.mailers.smtp.timeout' => 8]);
            }

            Mail::send([], [], function ($message) use ($recipients, $subject, $body, $context, $logoPath) {
                $logoCid = null;
                if ($logoPath !== null) {
                    try {
                        $logoCid = $message->embed($logoPath);
                    } catch (\Throwable) {
                        $logoCid = null;
                    }
                }

                $html = $this->buildHtmlBody($body, $context, $logoCid);

                $message->to($recipients)
                    ->subject($subject)
                    ->html($html)
                    ->text($body);
            });

            $statusMsg = $mailer === 'log'
                ? 'Email diproses ke log lokal (MAIL_MAILER=log). Ubah MAIL_MAILER=smtp di backend/.env untuk pengiriman nyata ke inbox.'
                : 'Email alert berhasil dikirim ke ' . implode(', ', $recipients) . '.';

            return [
                'ok'              => true,
                'message'         => $statusMsg,
                'mailer'          => $mailer,
                'recipients'      => $recipients,
                'preview_subject' => $subject,
                'preview_body'    => $body,
            ];
        } catch (\Throwable $e) {
            Log::error('EmailNotificationService send exception', [
                'recipients' => $recipients,
                'mailer'     => $mailer,
                'error'      => $e->getMessage(),
            ]);

            return [
                'ok'              => false,
                'message'         => 'Gagal mengirim email (' . $mailer . '): ' . $e->getMessage(),
                'mailer'          => $mailer,
                'preview_subject' => $subject,
                'preview_body'    => $body,
            ];
        }
    }

    /**
     * Format IDR / currency amount cleanly for corporate invoices.
     */
    private static function formatCurrency(int|float $amount, string $currency = 'IDR'): string
    {
        if (strtoupper($currency) === 'IDR') {
            return 'Rp ' . number_format((float) $amount, 0, ',', '.');
        }
        return strtoupper($currency) . ' ' . number_format((float) $amount, 2, '.', ',');
    }

    /**
     * Resolve blue VideaLink icon mark for formal white-paper invoices.
     */
    private function resolveInvoiceLogoPath(): ?string
    {
        $candidates = [
            base_path('../public/videalink_icon_blue.png'),
            public_path('videalink_icon_blue.png'),
            base_path('../public/videalink_email_brand.png'),
            public_path('videalink_email_brand.png'),
        ];

        foreach ($candidates as $path) {
            if (is_string($path) && is_file($path) && is_readable($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Build a formal corporate Invoice HTML document matching the split-ribbon letterhead,
     * dark-header zebra table, highlighted total bar, and authorised footer layout.
     */
    public function buildInvoiceHtmlBody(Invoice $invoice, User $user, ?string $logoCid = null): string
    {
        $brandName = e((string) env('MAIL_FROM_NAME', 'VideaLink'));
        if ($brandName === '' || strtolower($brandName) === 'laravel' || strtolower($brandName) === 'example') {
            $brandName = 'VideaLink';
        }

        $tz = $user->timezone ?? 'Asia/Jakarta';
        $invoiceNumber = e($invoice->invoice_number);
        $customerName = e($user->name ?: 'Pelanggan');
        $customerEmail = e($user->email ?: '-');
        $planName = e($invoice->plan_name);
        $cycleLabel = $invoice->billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan';
        $dateShort = ($invoice->paid_at ?? $invoice->created_at ?? now())->copy()->setTimezone($tz)->format('d / m / Y');
        $periodText = $invoice->period_end
            ? ($invoice->period_start?->copy()->setTimezone($tz)->format('d M Y') . ' – ' . $invoice->period_end->copy()->setTimezone($tz)->format('d M Y'))
            : 'Aktif Selamanya (Free Tier)';
        $periodEsc = e($periodText);
        $paymentLabel = e($invoice->payment_channel_label ?: $invoice->payment_method ?: '-');
        $notes = e((string) ($invoice->notes ?? ''));

        $currency = $invoice->currency ?: 'IDR';
        $amountFmt = e(self::formatCurrency($invoice->amount ?? 0, $currency));
        $discountFmt = e(self::formatCurrency($invoice->discount_amount ?? 0, $currency));
        $taxFmt = e(self::formatCurrency($invoice->tax_amount ?? 0, $currency));
        $totalFmt = e(self::formatCurrency($invoice->total_amount ?? 0, $currency));

        $isPaid = strtolower((string) $invoice->status) === 'paid';
        $statusLabel = $isPaid ? 'Lunas (Terverifikasi)' : strtoupper((string) $invoice->status);

        $frontendBase = rtrim((string) env('FRONTEND_URL', config('app.url', 'http://localhost:5173')), '/');
        $billingUrl = e($frontendBase . '/app/billing');
        $displayHost = e(preg_replace('#^https?://#', '', $frontendBase) ?: 'videalink.id');
        $fromEmail = e((string) config('mail.from.address', 'billing@videalink.id'));

        $preheader = e("Invoice {$invoice->invoice_number} — Paket {$invoice->plan_name} ({$cycleLabel}) · Total " . self::formatCurrency($invoice->total_amount ?? 0, $currency));

        $brandLogoHtml = $logoCid
            ? '<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>'
                . '<td valign="middle" style="padding-right:12px;"><img src="' . e($logoCid) . '" alt="' . $brandName . '" width="44" height="38" style="display:block;width:44px;height:auto;border:0;outline:none;"></td>'
                . '<td valign="middle">'
                . '<div style="font-size:21px;font-weight:800;letter-spacing:-0.02em;color:#262c36;line-height:1.1;">' . $brandName . '</div>'
                . '<div style="font-size:8.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;margin-top:3px;">IOT CLOUD PLATFORM</div>'
                . '</td></tr></table>'
            : '<div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#262c36;">' . $brandName . '</div><div style="font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;margin-top:2px;">IOT CLOUD PLATFORM</div>';

        $discountRow = ($invoice->discount_amount ?? 0) > 0
            ? '<tr><td style="padding:5px 12px 5px 0;font-size:12.5px;font-weight:700;color:#262c36;">Diskon:</td><td align="right" style="padding:5px 0;font-size:12.5px;font-family:\'SFMono-Regular\',Consolas,Menlo,monospace;color:#059669;font-weight:600;">-' . $discountFmt . '</td></tr>'
            : '';

        $notesHtml = $notes !== ''
            ? '<div style="font-size:11px;color:#6b7280;margin-top:2px;">' . $notes . '</div>'
            : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Invoice {$invoiceNumber} — {$brandName}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef0f4;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#262c36;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    {$preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef0f4;padding:28px 14px;">
    <tr>
      <td align="center">
        <!-- Formal Corporate Invoice Sheet (640px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background-color:#ffffff;border:1px solid #d8dde6;box-shadow:0 4px 16px rgba(15,23,42,0.06);">

          <!-- 1. Top Brand Logo Row -->
          <tr>
            <td style="padding:28px 36px 20px 36px;">
              {$brandLogoHtml}
            </td>
          </tr>

          <!-- 2. Signature Split Accent Ribbon + Bold INVOICE Cutout -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="width:57%;">
                    <div style="height:24px;background-color:#1d5ee6;font-size:0;line-height:0;">&nbsp;</div>
                  </td>
                  <td align="center" valign="middle" style="padding:0 18px;white-space:nowrap;">
                    <span style="font-size:32px;font-weight:700;letter-spacing:0.04em;color:#262c36;line-height:1;">INVOICE</span>
                  </td>
                  <td valign="middle" style="width:12%;">
                    <div style="height:24px;background-color:#1d5ee6;font-size:0;line-height:0;">&nbsp;</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Invoice To & Metadata Row -->
          <tr>
            <td style="padding:24px 36px 22px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="top" align="left" style="width:52%;padding-right:16px;">
                    <div style="font-size:14px;font-weight:700;color:#262c36;margin-bottom:6px;">Invoice to:</div>
                    <div style="font-size:13.5px;font-weight:700;color:#111827;line-height:1.4;">{$customerName}</div>
                    <div style="font-size:12px;color:#64748b;line-height:1.5;margin-top:2px;">
                      {$customerEmail}<br>
                      Periode: {$periodEsc}
                    </div>
                  </td>
                  <td valign="bottom" align="right" style="width:48%;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-left:auto;font-size:12.5px;">
                      <tr>
                        <td align="left" style="padding:3px 20px 3px 0;font-weight:700;color:#262c36;">Invoice#</td>
                        <td align="right" style="padding:3px 0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#475569;">{$invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td align="left" style="padding:3px 20px 3px 0;font-weight:700;color:#262c36;">Date</td>
                        <td align="right" style="padding:3px 0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#475569;">{$dateShort}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. Dark Header Corporate Line-Item Table -->
          <tr>
            <td style="padding:0 36px 24px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #d1d5db;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#2f3542;color:#ffffff;">
                    <th align="left" style="padding:11px 14px;font-size:11.5px;font-weight:700;width:8%;">NO.</th>
                    <th align="left" style="padding:11px 12px;font-size:11.5px;font-weight:700;">Item Description</th>
                    <th align="right" style="padding:11px 12px;font-size:11.5px;font-weight:700;white-space:nowrap;">Price</th>
                    <th align="center" style="padding:11px 10px;font-size:11.5px;font-weight:700;width:10%;">Qty.</th>
                    <th align="right" style="padding:11px 14px;font-size:11.5px;font-weight:700;white-space:nowrap;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background-color:#ffffff;">
                    <td style="padding:14px;font-size:12.5px;font-weight:600;color:#262c36;vertical-align:top;">1</td>
                    <td style="padding:14px 12px;font-size:12.5px;font-weight:600;color:#262c36;vertical-align:top;">
                      Langganan Paket {$planName} ({$cycleLabel})
                      {$notesHtml}
                    </td>
                    <td align="right" style="padding:14px 12px;font-size:12.5px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#262c36;vertical-align:top;white-space:nowrap;">{$amountFmt}</td>
                    <td align="center" style="padding:14px 10px;font-size:12.5px;color:#262c36;vertical-align:top;">1</td>
                    <td align="right" style="padding:14px;font-size:12.5px;font-weight:700;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#262c36;vertical-align:top;white-space:nowrap;">{$amountFmt}</td>
                  </tr>
                  <tr style="background-color:#f4f5f7;">
                    <td style="padding:11px 14px;font-size:12px;color:#64748b;">2</td>
                    <td style="padding:11px 12px;font-size:12px;color:#475569;">Akses Platform IoT, Monitoring &amp; Notifikasi ({$periodEsc})</td>
                    <td align="right" style="padding:11px 12px;font-size:12px;color:#64748b;">Termasuk</td>
                    <td align="center" style="padding:11px 10px;font-size:12px;color:#64748b;">1</td>
                    <td align="right" style="padding:11px 14px;font-size:12px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#64748b;">Rp 0</td>
                  </tr>
                  <tr>
                    <td colspan="5" style="height:44px;background-color:#ffffff;">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- 5. Bottom 2-Column Info & Highlighted Right-Flush Total Bar -->
          <tr>
            <td style="padding:0 0 28px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <!-- Left: Thank You + Terms + Payment Info -->
                  <td valign="top" style="width:54%;padding-right:24px;">
                    <div style="font-size:13px;font-weight:700;color:#262c36;margin-bottom:14px;">
                      Terima kasih atas kepercayaan Anda
                    </div>

                    <div style="font-size:11.5px;font-weight:700;color:#262c36;margin-bottom:4px;">
                      Syarat &amp; Ketentuan
                    </div>
                    <p style="margin:0 0 14px 0;font-size:10.5px;line-height:1.55;color:#64748b;">
                      Dokumen ini adalah bukti pembayaran resmi yang diterbitkan secara elektronik oleh {$brandName} IoT Platform dan sah tanpa tanda tangan basah.
                    </p>

                    <div style="font-size:11.5px;font-weight:700;color:#262c36;margin-bottom:5px;">
                      Info Pembayaran:
                    </div>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:10.5px;color:#475569;line-height:1.55;">
                      <tr>
                        <td style="padding-right:10px;font-weight:700;color:#262c36;">Metode:</td>
                        <td>{$paymentLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding-right:10px;font-weight:700;color:#262c36;">Status:</td>
                        <td>{$statusLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding-right:10px;font-weight:700;color:#262c36;">Arsip:</td>
                        <td><a href="{$billingUrl}" target="_blank" style="color:#1d5ee6;text-decoration:none;">{$displayHost}/app/billing</a></td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right: Sub Total, Tax, and Flush Accent Total Bar -->
                  <td valign="top" style="width:46%;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-right:36px;">
                      <tr>
                        <td style="padding:4px 12px 4px 16px;font-size:12.5px;font-weight:700;color:#262c36;">Sub Total:</td>
                        <td align="right" style="padding:4px 36px 4px 0;font-size:12.5px;font-weight:700;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#262c36;white-space:nowrap;">{$amountFmt}</td>
                      </tr>
                      {$discountRow}
                      <tr>
                        <td style="padding:4px 12px 14px 16px;font-size:12.5px;font-weight:700;color:#262c36;">Pajak (PPN):</td>
                        <td align="right" style="padding:4px 36px 14px 0;font-size:12.5px;font-weight:700;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#262c36;white-space:nowrap;">{$taxFmt}</td>
                      </tr>
                    </table>

                    <!-- Highlighted Flush Total Bar -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1d5ee6;">
                      <tr>
                        <td style="padding:12px 12px 12px 18px;font-size:14px;font-weight:800;color:#ffffff;">Total:</td>
                        <td align="right" style="padding:12px 36px 12px 8px;font-size:15px;font-weight:800;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;color:#ffffff;white-space:nowrap;">{$totalFmt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Bottom Split Accent Line + Authorised Sign -->
          <tr>
            <td style="padding:6px 0 8px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="width:62%;">
                    <div style="height:3px;background-color:#1d5ee6;font-size:0;line-height:0;">&nbsp;</div>
                  </td>
                  <td align="center" valign="middle" style="padding:0 16px;white-space:nowrap;">
                    <div style="border-top:1px solid #475569;padding-top:6px;min-width:130px;font-size:11px;font-weight:700;color:#262c36;text-align:center;">
                      Otorisasi Elektronik
                    </div>
                  </td>
                  <td valign="middle" style="width:8%;">
                    <div style="height:3px;background-color:#1d5ee6;font-size:0;line-height:0;">&nbsp;</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. Contact Footer Row -->
          <tr>
            <td style="padding:10px 36px 24px 36px;font-size:11px;font-weight:600;color:#262c36;">
              {$fromEmail} &nbsp;|&nbsp; {$brandName} IoT Platform &nbsp;|&nbsp; <a href="{$billingUrl}" target="_blank" style="color:#262c36;text-decoration:none;">{$displayHost}</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Send a formal business Invoice receipt email to the customer (or optional recipient override).
     *
     * @return array{ok: bool, message: string, mailer?: string, recipients?: array<int, string>}
     */
    public function sendInvoice(Invoice $invoice, User $user, ?string $overrideEmail = null): array
    {
        $recipients = self::parseRecipients($overrideEmail ?: $user->email);
        if (empty($recipients)) {
            return [
                'ok' => false,
                'message' => 'Alamat email penerima invoice tidak valid atau kosong.',
            ];
        }

        $cycleLabel = $invoice->billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan';
        $totalFmt = self::formatCurrency($invoice->total_amount ?? 0, $invoice->currency ?: 'IDR');
        $subject = "Invoice {$invoice->invoice_number} — Paket {$invoice->plan_name} ({$totalFmt})";

        $plainText = "INVOICE RESMI — VIDEALINK\n"
            . "Nomor Invoice: {$invoice->invoice_number}\n"
            . "Status: " . strtoupper((string) $invoice->status) . "\n"
            . "Ditagihkan kepada: {$user->name} ({$user->email})\n"
            . "Layanan: Langganan Paket {$invoice->plan_name} ({$cycleLabel})\n"
            . "Metode Pembayaran: " . ($invoice->payment_channel_label ?: $invoice->payment_method) . "\n"
            . "Total Dibayar: {$totalFmt}\n";

        $mailer = (string) config('mail.default', 'log');
        $logoPath = $this->resolveInvoiceLogoPath();

        try {
            if ($mailer === 'smtp' && config('mail.mailers.smtp.timeout') === null) {
                config(['mail.mailers.smtp.timeout' => 8]);
            }

            Mail::send([], [], function ($message) use ($recipients, $subject, $plainText, $invoice, $user, $logoPath) {
                $logoCid = null;
                if ($logoPath !== null) {
                    try {
                        $logoCid = $message->embed($logoPath);
                    } catch (\Throwable) {
                        $logoCid = null;
                    }
                }

                $html = $this->buildInvoiceHtmlBody($invoice, $user, $logoCid);

                $message->to($recipients)
                    ->subject($subject)
                    ->html($html)
                    ->text($plainText);
            });

            $statusMsg = $mailer === 'log'
                ? 'Invoice diproses ke log lokal (MAIL_MAILER=log). Atur MAIL_MAILER=smtp di backend/.env untuk pengiriman ke inbox.'
                : 'Invoice ' . $invoice->invoice_number . ' berhasil dikirim ke ' . implode(', ', $recipients) . '.';

            return [
                'ok'         => true,
                'message'    => $statusMsg,
                'mailer'     => $mailer,
                'recipients' => $recipients,
            ];
        } catch (\Throwable $e) {
            Log::error('EmailNotificationService sendInvoice exception', [
                'invoice_id' => $invoice->id,
                'recipients' => $recipients,
                'error'      => $e->getMessage(),
            ]);

            return [
                'ok'      => false,
                'message' => 'Gagal mengirim invoice via email: ' . $e->getMessage(),
                'mailer'  => $mailer,
            ];
        }
    }
}
