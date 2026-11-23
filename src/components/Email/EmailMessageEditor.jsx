import { useRef, useState } from 'react';
import { Mail, HelpCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { TELEGRAM_PLACEHOLDERS, renderTelegramPreview } from '../Telegram/TelegramMessageEditor';

export const DEFAULT_EMAIL_SUBJECT = '[VideaLink] {device}: {field} = {value} ({operator} {threshold})';

export const DEFAULT_EMAIL_TEMPLATE =
  'Halo Tim Operasional,\n\nPembacaan sensor pada perangkat {device} ({location}) telah melampaui batas yang dikonfigurasi ({field} {operator} {threshold}) dengan nilai aktual {value}.\n\nSilakan tinjau kondisi perangkat dan riwayat telemetri terbaru melalui dashboard VideaLink.';

export const EMAIL_PRESETS = [
  {
    id: 'standard',
    label: 'Standar',
    subject: DEFAULT_EMAIL_SUBJECT,
    template: DEFAULT_EMAIL_TEMPLATE,
  },
  {
    id: 'compact',
    label: 'Ringkas',
    subject: '[{device}] {field} = {value} ({operator} {threshold})',
    template:
      'Peringatan sistem: perangkat {device} ({location}) melaporkan {field} = {value} pada {time}. Harap segera ditindaklanjuti.',
  },
  {
    id: 'detailed',
    label: 'Detail',
    subject: '[INSIDEN] {rule} — {device} ({location})',
    template:
      'Laporan insiden otomatis untuk aturan "{rule}":\n- Perangkat: {device} ({location})\n- Pembacaan aktual: {field} = {value}\n- Ambang batas: {field} {operator} {threshold}\n- Payload lengkap: {payload}\n- Waktu kejadian: {time}',
  },
];

export function EmailSmtpNotice({ emailStatus }) {
  const [open, setOpen] = useState(false);

  if (!emailStatus || emailStatus.is_live_mailer) {
    return null;
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'rgb(var(--surface-800) / 0.35)',
        borderColor: 'rgb(var(--surface-700) / 0.6)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[38px] px-3 py-2 flex items-center justify-between text-left text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
        style={{ color: 'rgb(var(--surface-200))' }}
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={14} style={{ color: 'rgb(var(--primary-400))' }} className="shrink-0" />
          Mode log lokal aktif (<code className="font-mono">MAIL_MAILER={emailStatus.mailer || 'log'}</code>) · Panduan SMTP
        </span>
        {open ? (
          <ChevronUp size={14} style={{ color: 'rgb(var(--surface-400))' }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'rgb(var(--surface-400))' }} />
        )}
      </button>
      {open && (
        <div
          className="px-3.5 pb-3 pt-2 space-y-2 text-[11.5px] border-t leading-relaxed"
          style={{
            borderColor: 'rgb(var(--surface-700) / 0.45)',
            color: 'rgb(var(--surface-300))',
          }}
        >
          <p>
            Agar email masuk ke inbox asli (bukan hanya ke <code className="font-mono">laravel.log</code>), atur SMTP
            (misalnya Gmail App Password atau Mailtrap) di <code className="font-mono">backend/.env</code>:
          </p>
          <pre
            className="p-2.5 rounded-md font-mono text-[11px] overflow-x-auto border"
            style={{
              backgroundColor: 'rgb(var(--surface-950) / 0.7)',
              borderColor: 'rgb(var(--surface-700) / 0.5)',
              color: 'rgb(var(--surface-200))',
            }}
          >
{`MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=emailanda@gmail.com
MAIL_PASSWORD=app_password_16_digit
MAIL_FROM_ADDRESS="emailanda@gmail.com"
MAIL_FROM_NAME="VideaLink"`}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function EmailMessageEditor({
  subject,
  onSubjectChange,
  value,
  onChange,
  recipient = '',
  previewContext = {},
  emailStatus = null,
  rows = 4,
}) {
  const textareaRef = useRef(null);

  const insertPlaceholder = (token) => {
    const el = textareaRef.current;
    const current = value || '';
    if (!el) {
      onChange(`${current}${token}`);
      return;
    }

    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const previewSubject = renderTelegramPreview(subject || DEFAULT_EMAIL_SUBJECT, previewContext).replace(/\n/g, ' ');
  const previewBody = renderTelegramPreview(value || DEFAULT_EMAIL_TEMPLATE, previewContext);

  const field = previewContext.field || 'temperature';
  const threshold = previewContext.threshold !== '' && previewContext.threshold !== undefined ? previewContext.threshold : '35';
  const operator = previewContext.operator || '>';
  const numThresh = Number(threshold);
  const sampleValue = !Number.isNaN(numThresh)
    ? operator === '<' || operator === '<='
      ? Number((numThresh - 1.5).toFixed(1))
      : Number((numThresh + 1.5).toFixed(1))
    : threshold;

  return (
    <div className="space-y-3">
      <EmailSmtpNotice emailStatus={emailStatus} />

      {/* Header + Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold" style={{ color: 'rgb(var(--surface-200))' }}>
          Subjek &amp; Isi Email Alert
        </label>

        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex p-0.5 rounded-lg border"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.45)',
              borderColor: 'rgb(var(--surface-700) / 0.55)',
            }}
          >
            {EMAIL_PRESETS.map((preset) => {
              const isSelected = (value || '').trim() === preset.template.trim();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSubjectChange(preset.subject);
                    onChange(preset.template);
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                  style={{
                    backgroundColor: isSelected ? 'rgb(var(--surface-700))' : 'transparent',
                    color: isSelected ? 'rgb(var(--surface-50))' : 'rgb(var(--surface-400))',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            title="Reset template email ke default"
            aria-label="Reset template email ke default"
            onClick={() => {
              onSubjectChange(DEFAULT_EMAIL_SUBJECT);
              onChange(DEFAULT_EMAIL_TEMPLATE);
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.4)',
              borderColor: 'rgb(var(--surface-700) / 0.55)',
              color: 'rgb(var(--surface-400))',
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Subject input */}
      <div>
        <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-400))' }}>
          Subjek Email
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder={DEFAULT_EMAIL_SUBJECT}
          className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
          style={{
            backgroundColor: 'rgb(var(--surface-950) / 0.7)',
            borderColor: 'rgb(var(--surface-700) / 0.65)',
            color: 'rgb(var(--surface-100))',
          }}
        />
      </div>

      {/* Body textarea */}
      <div>
        <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-400))' }}>
          Pesan Kustom
        </label>
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={DEFAULT_EMAIL_TEMPLATE}
          className="w-full rounded-lg border px-3 py-2.5 text-xs font-mono leading-relaxed outline-none resize-y transition-colors duration-150 focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
          style={{
            backgroundColor: 'rgb(var(--surface-950) / 0.7)',
            borderColor: 'rgb(var(--surface-700) / 0.65)',
            color: 'rgb(var(--surface-100))',
          }}
        />
      </div>

      {/* Variable chips */}
      <div className="space-y-1.5">
        <p className="text-[11px]" style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}>
          Klik variabel untuk menyisipkan data sensor dinamis (bisa dipakai di Subjek &amp; Pesan):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TELEGRAM_PLACEHOLDERS.map((item) => (
            <button
              key={item.token}
              type="button"
              onClick={() => insertPlaceholder(item.token)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-[background-color,border-color] duration-150 hover:border-[rgb(var(--primary-500)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.45)',
                borderColor: 'rgb(var(--surface-700) / 0.55)',
              }}
            >
              <code className="font-mono" style={{ color: 'rgb(var(--primary-300))' }}>
                {item.token}
              </code>
              <span style={{ color: 'rgb(var(--surface-400))' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Corporate Email Preview (Faithful miniaturized version of actual HTML email) */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'rgb(var(--surface-950) / 0.7)',
          borderColor: 'rgb(var(--surface-700) / 0.5)',
        }}
      >
        {/* Inbox metadata bar */}
        <div
          className="px-3.5 py-2 border-b space-y-0.5"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
        >
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'rgb(var(--surface-300))' }}>
              <Mail size={11} style={{ color: 'rgb(var(--primary-400))' }} />
              Preview Email Perusahaan
            </span>
            <span className="font-mono" style={{ color: 'rgb(var(--surface-500))' }}>
              HTML + Plain Text
            </span>
          </div>
          <div className="text-[10.5px] truncate" style={{ color: 'rgb(var(--surface-400))' }}>
            Kepada: <span className="font-mono">{recipient || 'penerima@perusahaan.com'}</span>
          </div>
          <div className="text-[11px] font-semibold truncate" style={{ color: 'rgb(var(--surface-100))' }}>
            {previewSubject}
          </div>
        </div>

        {/* Anti-Slop Corporate Email Preview: Blue VideaLink Brand Banner + Clean Editorial Body */}
        <div className="p-3 bg-[#f6f7f9]">
          <div className="rounded-lg bg-white border border-slate-200 overflow-hidden text-slate-900">
            {/* Solid Royal Blue Brand Banner */}
            <div className="bg-[#1d5ee6] px-4 py-4 text-center">
              <img
                src="/videalink_email_logo.png"
                alt="VideaLink"
                className="h-9 mx-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/new_videa_link_logo.png';
                }}
              />
              <div className="text-[8.5px] font-semibold tracking-[0.2em] uppercase text-blue-100 mt-1.5">
                IOT CLOUD PLATFORM
              </div>
            </div>

            {/* Single-Column Left-Aligned Editorial Body */}
            <div className="px-4 py-4 text-left space-y-3.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Sensor Alert
                </span>
                <span className="font-mono text-slate-400">#VL-AUTO</span>
              </div>

              <div>
                <div className="text-[14px] font-bold text-slate-900 tracking-tight leading-snug">
                  {previewContext.rule || 'Peringatan Ambang Batas Sensor'}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-0.5">
                  {previewContext.device || 'ESP32 Sensor Node'} · {previewContext.location || 'Ruang Server'}
                </div>
              </div>

              {/* Flat Hairline Metric Strip (Zero Nested Cards) */}
              <div className="grid grid-cols-3 border-y border-slate-200 py-2.5 divide-x divide-slate-100">
                <div className="pr-2">
                  <div className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Nilai Aktual
                  </div>
                  <div className="text-[15px] font-bold font-mono text-slate-900 tabular-nums leading-tight mt-0.5">
                    {sampleValue}
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-500 truncate">{field}</div>
                </div>
                <div className="px-2.5">
                  <div className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Kondisi Batas
                  </div>
                  <div className="text-[11.5px] font-semibold font-mono text-red-700 mt-1">
                    {operator} {threshold}
                  </div>
                  <div className="text-[9px] text-slate-400">Terlampaui</div>
                </div>
                <div className="pl-2.5">
                  <div className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Perangkat
                  </div>
                  <div className="text-[11px] font-semibold text-slate-900 mt-1 truncate">
                    {previewContext.device || 'ESP32 Node'}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {previewContext.location || 'Ruang Server'}
                  </div>
                </div>
              </div>

              {/* Clean Left-Aligned Operator Message (Zero Decorative Boxes) */}
              <div className="text-[11px] leading-relaxed text-slate-700 space-y-1.5 break-words">
                {previewBody.split('\n').map((rawLine, idx) => {
                  const line = rawLine.trim();
                  if (!line) return null;
                  const bulletMatch = line.match(/^[-•*]\s+(.+)$/);
                  if (bulletMatch) {
                    const text = bulletMatch[1];
                    const colonIdx = text.indexOf(':');
                    const hasLabel = colonIdx > 0 && colonIdx <= 28;
                    return (
                      <div key={idx} className="flex items-start gap-1.5 pl-1">
                        <span className="text-slate-400">•</span>
                        <span>
                          {hasLabel ? (
                            <>
                              <strong className="font-semibold text-slate-900">{text.slice(0, colonIdx + 1)}</strong>
                              {text.slice(colonIdx + 1)}
                            </>
                          ) : (
                            text
                          )}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="m-0">
                      {line}
                    </p>
                  );
                })}
              </div>

              {/* Single Primary CTA + Quiet Secondary Link */}
              <div className="flex items-center gap-3 pt-1">
                <span className="inline-block px-3.5 py-1.5 rounded-md bg-[#1d5ee6] text-white text-[10.5px] font-semibold">
                  Buka Dashboard →
                </span>
                <span className="text-[10.5px] text-slate-500 underline">Kelola aturan alert</span>
              </div>
            </div>

            {/* Quiet Corporate Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-left space-y-0.5">
              <div className="text-[10px] font-semibold text-slate-700">VideaLink IoT Platform · videalink.id</div>
              <div className="text-[9px] text-slate-400">
                &copy; {new Date().getFullYear()} VideaLink. Email otomatis sistem pemantauan — mohon tidak membalas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
