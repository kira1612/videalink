import { useRef, useState } from 'react';
import { Send, HelpCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export const DEFAULT_TELEGRAM_TEMPLATE =
  '*ALERT VIDEALINK*\nPerangkat: *{device}*\nSensor: `{field}` = *{value}* (`{operator} {threshold}`)\nLokasi: {location}\nWaktu: {time}';

export const TELEGRAM_PLACEHOLDERS = [
  { token: '{device}', label: 'Perangkat' },
  { token: '{field}', label: 'Parameter' },
  { token: '{value}', label: 'Nilai' },
  { token: '{operator}', label: 'Operator' },
  { token: '{threshold}', label: 'Batas' },
  { token: '{location}', label: 'Lokasi' },
  { token: '{rule}', label: 'Aturan' },
  { token: '{time}', label: 'Waktu' },
  { token: '{payload}', label: 'Payload' },
];

export const TELEGRAM_PRESETS = [
  {
    id: 'standard',
    label: 'Standar',
    template: DEFAULT_TELEGRAM_TEMPLATE,
  },
  {
    id: 'compact',
    label: 'Ringkas',
    template: '*[{device}]* `{field}` = *{value}* (batas `{operator} {threshold}`) — {time}',
  },
  {
    id: 'detailed',
    label: 'Detail',
    template:
      '*NOTIFIKASI: {rule}*\nPerangkat: *{device}* ({location})\nParameter: `{field}` = *{value}*\nKondisi: `{field} {operator} {threshold}`\nPayload: `{payload}`\nWaktu: {time}',
  },
];

export const OPERATOR_OPTIONS = [
  { value: '>', label: '> Lebih dari' },
  { value: '>=', label: '>= Minimal' },
  { value: '<', label: '< Kurang dari' },
  { value: '<=', label: '<= Maksimal' },
  { value: '==', label: '== Sama dengan' },
  { value: '!=', label: '!= Tidak sama' },
];

export const COOLDOWN_OPTIONS = [
  { value: 0, label: 'Tanpa jeda' },
  { value: 15, label: '15 detik' },
  { value: 30, label: '30 detik' },
  { value: 60, label: '1 menit' },
  { value: 300, label: '5 menit' },
  { value: 900, label: '15 menit' },
  { value: 3600, label: '1 jam' },
];

export function renderTelegramPreview(template, context = {}) {
  const source = (template && template.trim()) || DEFAULT_TELEGRAM_TEMPLATE;
  const field = context.field || 'temperature';
  const threshold = context.threshold !== '' && context.threshold !== undefined ? context.threshold : '35';
  const numericThreshold = Number(threshold);
  const sampleValue =
    context.value !== undefined && context.value !== ''
      ? context.value
      : !Number.isNaN(numericThreshold)
        ? context.operator === '<' || context.operator === '<='
          ? Number((numericThreshold - 1.5).toFixed(1))
          : Number((numericThreshold + 1.5).toFixed(1))
        : threshold;

  const nowStr = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const replacements = {
    '{device}': context.device || 'ESP32 Sensor Node',
    '{location}': context.location || 'Ruang Server',
    '{field}': field,
    '{value}': String(sampleValue),
    '{operator}': context.operator || '>',
    '{threshold}': String(threshold),
    '{rule}': context.rule || 'Alert Suhu Tinggi',
    '{time}': nowStr,
    '{payload}': `${field}: ${sampleValue}, rssi: -58`,
  };

  let out = source;
  Object.entries(replacements).forEach(([key, val]) => {
    out = out.split(key).join(val);
  });
  return out;
}

/**
 * Safely render basic Telegram Markdown (*bold* and `code`) into React nodes without dangerouslySetInnerHTML.
 */
function renderFormattedLine(line, lineIdx) {
  const parts = line.split(/(\*[^*]+\*|`[^`]+`)/g);
  return (
    <span key={lineIdx}>
      {parts.map((part, idx) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <strong key={idx} className="font-semibold" style={{ color: 'rgb(var(--surface-50))' }}>
              {part.slice(1, -1)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={idx}
              className="px-1 py-0.5 rounded font-mono text-[11px]"
              style={{
                backgroundColor: 'rgb(var(--primary-500) / 0.14)',
                color: 'rgb(var(--primary-300))',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

export function TelegramSetupGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'rgb(var(--surface-800) / 0.35)',
        borderColor: 'rgb(var(--surface-700) / 0.55)',
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
          Panduan mendapatkan Bot Token & Chat ID
        </span>
        {open ? (
          <ChevronUp size={14} style={{ color: 'rgb(var(--surface-400))' }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'rgb(var(--surface-400))' }} />
        )}
      </button>
      {open && (
        <ol
          className="px-3.5 pb-3 pt-2 space-y-1.5 text-[11.5px] list-decimal list-inside border-t leading-relaxed"
          style={{
            borderColor: 'rgb(var(--surface-700) / 0.45)',
            color: 'rgb(var(--surface-300))',
          }}
        >
          <li>
            Buka <code className="font-mono" style={{ color: 'rgb(var(--primary-300))' }}>@BotFather</code> di
            Telegram, kirim <code className="font-mono">/newbot</code> lalu salin{' '}
            <strong style={{ color: 'rgb(var(--surface-100))' }}>Bot Token</strong>.
          </li>
          <li>
            Buka chat bot yang baru dibuat lalu tekan{' '}
            <strong style={{ color: 'rgb(var(--surface-100))' }}>Start</strong> agar bot diizinkan mengirim pesan.
          </li>
          <li>
            Ambil <strong style={{ color: 'rgb(var(--surface-100))' }}>Chat ID</strong> lewat{' '}
            <code className="font-mono" style={{ color: 'rgb(var(--primary-300))' }}>@userinfobot</code> (atau gunakan
            ID grup berawalan <code className="font-mono">-100...</code>).
          </li>
        </ol>
      )}
    </div>
  );
}

export default function TelegramMessageEditor({
  value,
  onChange,
  previewContext = {},
  rows = 5,
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

  const previewText = renderTelegramPreview(value, previewContext);

  return (
    <div className="space-y-3">
      {/* Header + segmented preset picker */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          className="text-xs font-semibold"
          style={{ color: 'rgb(var(--surface-200))' }}
        >
          Template Pesan Alert
        </label>

        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex p-0.5 rounded-lg border"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.45)',
              borderColor: 'rgb(var(--surface-700) / 0.55)',
            }}
          >
            {TELEGRAM_PRESETS.map((preset) => {
              const isSelected = (value || '').trim() === preset.template.trim();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange(preset.template)}
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
            title="Reset template ke default"
            aria-label="Reset template ke default"
            onClick={() => onChange(DEFAULT_TELEGRAM_TEMPLATE)}
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

      {/* Monospace template editor */}
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_TELEGRAM_TEMPLATE}
        className="w-full rounded-lg border px-3 py-2.5 text-xs font-mono leading-relaxed outline-none resize-y transition-colors duration-150 focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
        style={{
          backgroundColor: 'rgb(var(--surface-950) / 0.7)',
          borderColor: 'rgb(var(--surface-700) / 0.65)',
          color: 'rgb(var(--surface-100))',
        }}
      />

      {/* Variable chips */}
      <div className="space-y-1.5">
        <p className="text-[11px]" style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}>
          Sisipkan variabel dinamis (dukung <code className="font-mono">*tebal*</code> dan{' '}
          <code className="font-mono">`kode`</code>):
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

      {/* Live Preview Panel — Matte, theme-reactive */}
      <div
        className="rounded-xl border p-3.5 space-y-2.5"
        style={{
          backgroundColor: 'rgb(var(--surface-950) / 0.65)',
          borderColor: 'rgb(var(--surface-700) / 0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: 'rgb(var(--surface-300))' }}
          >
            <Send size={11} style={{ color: 'rgb(var(--primary-400))' }} />
            Preview Pesan
          </span>
          <span className="text-[10.5px] font-mono tabular-nums" style={{ color: 'rgb(var(--surface-500))' }}>
            Markdown
          </span>
        </div>

        <div
          className="rounded-lg rounded-tl-xs border px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words"
          style={{
            backgroundColor: 'rgb(var(--surface-900))',
            borderColor: 'rgb(var(--surface-700) / 0.55)',
            color: 'rgb(var(--surface-200))',
          }}
        >
          {previewText.split('\n').map((line, i, arr) => (
            <span key={i}>
              {renderFormattedLine(line, i)}
              {i < arr.length - 1 && '\n'}
            </span>
          ))}
          <div
            className="text-[10px] text-right mt-2 tabular-nums"
            style={{ color: 'rgb(var(--surface-500))' }}
          >
            VideaLink Bot · baru saja
          </div>
        </div>
      </div>
    </div>
  );
}
