import { useEffect, useState } from 'react';
import { X, Printer, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { billingApi } from '../../services/api';
import { formatRupiahStrict, formatBillingDate } from '../../utils/billingFormat';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSlashDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
}

export default function InvoiceModal({ invoice, user, onClose }) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState(null);

  useEffect(() => {
    setEmailFeedback(null);
    if (!invoice) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, onClose]);

  if (!invoice) return null;

  const cycleLabel = invoice.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan';
  const dateSlash = formatSlashDate(invoice.paid_at || invoice.created_at);
  const periodStr = invoice.period_end
    ? `${formatBillingDate(invoice.period_start)} – ${formatBillingDate(invoice.period_end)}`
    : 'Aktif Selamanya (Free Tier)';
  const paymentLabel = invoice.payment_channel_label || invoice.payment_method || '-';
  const isPaid = String(invoice.status || 'paid').toLowerCase() === 'paid';
  const statusLabel = isPaid ? 'Lunas (Terverifikasi)' : String(invoice.status || '').toUpperCase();
  const hasDiscount = Number(invoice.discount_amount || 0) > 0;

  const handleSendEmail = async () => {
    if (sendingEmail) return;
    setSendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await billingApi.sendInvoiceEmail(invoice.id);
      setEmailFeedback({
        type: 'success',
        text: res.data?.message || `Invoice berhasil dikirim ke ${user?.email || 'email Anda'}.`,
      });
    } catch (err) {
      setEmailFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengirim invoice ke email.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  /**
   * Print ONLY a full-bleed A4 (210mm x 297mm) corporate invoice with zero browser print headers/footers.
   */
  const handlePrintPdf = () => {
    const origin = window.location.origin;
    const iconUrl = `${origin}/videalink_icon_blue.png`;
    const host = window.location.host;

    const discountRowHtml = hasDiscount
      ? `<tr>
          <td style="padding:5px 12px 5px 18px;font-size:13px;font-weight:700;color:#262c36;">Diskon:</td>
          <td style="padding:5px 16mm 5px 0;font-size:13px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#059669;font-weight:600;text-align:right;">-${escapeHtml(formatRupiahStrict(invoice.discount_amount))}</td>
        </tr>`
      : '';

    const notesHtml = invoice.notes
      ? `<div style="font-size:11.5px;color:#64748b;margin-top:3px;font-weight:400;">${escapeHtml(invoice.notes)}</div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${escapeHtml(invoice.invoice_number)} — VideaLink</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm !important;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #262c36;
    }
    .sheet {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      padding-top: 14mm;
      padding-bottom: 12mm;
    }
    .table-wrap {
      flex: 1;
      margin: 0 16mm 10mm;
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- 1. Blue VideaLink Icon + Brand Lockup -->
    <div style="padding:0 16mm 10mm;display:flex;align-items:center;gap:12px;">
      <img src="${iconUrl}" alt="VideaLink" style="height:40px;width:auto;display:block;" />
      <div>
        <div style="font-size:23px;font-weight:800;letter-spacing:-0.025em;color:#262c36;line-height:1.05;">VideaLink</div>
        <div style="font-size:8.5px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#64748b;margin-top:3px;">IOT CLOUD PLATFORM</div>
      </div>
    </div>

    <!-- 2. Full-Bleed Split Accent Ribbon + Bold INVOICE -->
    <div style="display:flex;align-items:center;width:100%;">
      <div style="height:26px;background:#1d5ee6;flex:1;"></div>
      <div style="padding:0 20px;font-size:38px;font-weight:700;letter-spacing:0.04em;color:#262c36;line-height:1;white-space:nowrap;">INVOICE</div>
      <div style="height:26px;background:#1d5ee6;width:24mm;flex-shrink:0;"></div>
    </div>

    <!-- 3. Invoice To & Metadata -->
    <div style="padding:10mm 16mm 9mm;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;">
      <div style="width:54%;">
        <div style="font-size:15px;font-weight:700;color:#262c36;margin-bottom:6px;">Invoice to:</div>
        <div style="font-size:15px;font-weight:700;color:#111827;">${escapeHtml(user?.name || 'Pelanggan')}</div>
        <div style="font-size:12.5px;color:#64748b;line-height:1.6;margin-top:3px;">
          ${escapeHtml(user?.email || '-')}<br />
          Periode: ${escapeHtml(periodStr)}
        </div>
      </div>
      <table style="border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:4px 24px 4px 0;font-weight:700;color:#262c36;">Invoice#</td>
          <td style="padding:4px 0;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#475569;text-align:right;">${escapeHtml(invoice.invoice_number)}</td>
        </tr>
        <tr>
          <td style="padding:4px 24px 4px 0;font-weight:700;color:#262c36;">Date</td>
          <td style="padding:4px 0;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#475569;text-align:right;">${escapeHtml(dateSlash)}</td>
        </tr>
      </table>
    </div>

    <!-- 4. Flex-Expanded Dark Header Table (Fills Exact A4 Middle Height, All 4 Borders Closed) -->
    <div class="table-wrap">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#2f3542;color:#ffffff;">
            <th style="text-align:left;padding:12px 16px;font-size:12px;font-weight:700;width:9%;">NO.</th>
            <th style="text-align:left;padding:12px 14px;font-size:12px;font-weight:700;">Item Description</th>
            <th style="text-align:right;padding:12px 14px;font-size:12px;font-weight:700;">Price</th>
            <th style="text-align:center;padding:12px 10px;font-size:12px;font-weight:700;width:10%;">Qty.</th>
            <th style="text-align:right;padding:12px 16px;font-size:12px;font-weight:700;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#ffffff;">
            <td style="padding:16px;font-size:13px;font-weight:600;vertical-align:top;">1</td>
            <td style="padding:16px 14px;font-size:13px;font-weight:600;vertical-align:top;">
              Langganan Paket ${escapeHtml(invoice.plan_name)} (${escapeHtml(cycleLabel)})
              ${notesHtml}
            </td>
            <td style="padding:16px 14px;font-size:13px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;text-align:right;vertical-align:top;white-space:nowrap;">${escapeHtml(formatRupiahStrict(invoice.amount))}</td>
            <td style="padding:16px 10px;font-size:13px;text-align:center;vertical-align:top;">1</td>
            <td style="padding:16px;font-size:13px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;text-align:right;vertical-align:top;white-space:nowrap;">${escapeHtml(formatRupiahStrict(invoice.amount))}</td>
          </tr>
          <tr style="background:#f4f5f7;">
            <td style="padding:13px 16px;font-size:12.5px;color:#64748b;">2</td>
            <td style="padding:13px 14px;font-size:12.5px;color:#475569;">Akses Platform IoT, Monitoring &amp; Notifikasi (${escapeHtml(periodStr)})</td>
            <td style="padding:13px 14px;font-size:12.5px;color:#64748b;text-align:right;">Termasuk</td>
            <td style="padding:13px 10px;font-size:12.5px;color:#64748b;text-align:center;">1</td>
            <td style="padding:13px 16px;font-size:12.5px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#64748b;text-align:right;">Rp 0</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 5. Bottom 2-Column Summary + Flush Right Total Bar -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12mm;">
      <div style="padding:0 20px 0 16mm;width:54%;">
        <div style="font-size:14px;font-weight:700;color:#262c36;margin-bottom:14px;">Terima kasih atas kepercayaan Anda</div>

        <div style="font-size:12px;font-weight:700;color:#262c36;margin-bottom:4px;">Syarat &amp; Ketentuan</div>
        <p style="margin:0 0 14px;font-size:11px;line-height:1.6;color:#64748b;">
          Dokumen ini merupakan bukti pembayaran resmi yang diterbitkan secara elektronik oleh sistem VideaLink dan sah tanpa tanda tangan basah.
        </p>

        <div style="font-size:12px;font-weight:700;color:#262c36;margin-bottom:4px;">Info Pembayaran:</div>
        <table style="border-collapse:collapse;font-size:11px;color:#475569;line-height:1.6;">
          <tr>
            <td style="padding-right:12px;font-weight:700;color:#262c36;">Metode:</td>
            <td>${escapeHtml(paymentLabel)}</td>
          </tr>
          <tr>
            <td style="padding-right:12px;font-weight:700;color:#262c36;">Status:</td>
            <td>${escapeHtml(statusLabel)}</td>
          </tr>
          <tr>
            <td style="padding-right:12px;font-weight:700;color:#262c36;">Platform:</td>
            <td>VideaLink IoT Cloud</td>
          </tr>
        </table>
      </div>

      <div style="width:46%;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:5px 12px 5px 18px;font-size:13px;font-weight:700;color:#262c36;">Sub Total:</td>
            <td style="padding:5px 16mm 5px 0;font-size:13px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;text-align:right;">${escapeHtml(formatRupiahStrict(invoice.amount))}</td>
          </tr>
          ${discountRowHtml}
          <tr>
            <td style="padding:5px 12px 16px 18px;font-size:13px;font-weight:700;color:#262c36;">Pajak (PPN):</td>
            <td style="padding:5px 16mm 16px 0;font-size:13px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;text-align:right;">${escapeHtml(formatRupiahStrict(invoice.tax_amount))}</td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;background:#1d5ee6;">
          <tr>
            <td style="padding:13px 12px 13px 18px;font-size:15px;font-weight:800;color:#ffffff;">Total:</td>
            <td style="padding:13px 16mm 13px 8px;font-size:16.5px;font-weight:800;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#ffffff;text-align:right;">${escapeHtml(formatRupiahStrict(invoice.total_amount))}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- 6. Full-Bleed Split Bottom Accent Line + Authorised Sign -->
    <div style="display:flex;align-items:center;width:100%;">
      <div style="height:3px;background:#1d5ee6;flex:1;"></div>
      <div style="padding:0 18px;text-align:center;white-space:nowrap;">
        <div style="border-top:1px solid #475569;padding-top:6px;min-width:140px;font-size:11.5px;font-weight:700;color:#262c36;">
          Otorisasi Elektronik
        </div>
      </div>
      <div style="height:3px;background:#1d5ee6;width:16mm;flex-shrink:0;"></div>
    </div>

    <!-- 7. Contact Footer -->
    <div style="padding:12px 16mm 0;font-size:11.5px;font-weight:600;color:#262c36;">
      billing@videalink.id &nbsp;|&nbsp; VideaLink IoT Platform &nbsp;|&nbsp; ${escapeHtml(host)}
    </div>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1200);
      }
    };

    const img = doc.querySelector('img');
    if (img && !img.complete) {
      img.onload = triggerPrint;
      img.onerror = triggerPrint;
      setTimeout(triggerPrint, 800);
    } else {
      setTimeout(triggerPrint, 120);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: 'rgb(var(--surface-900))',
          borderColor: 'rgb(var(--surface-700) / 0.65)',
        }}
      >
        {/* Top Modal Chrome */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
        >
          <div className="min-w-0">
            <h2
              id="invoice-modal-title"
              className="text-sm font-bold tracking-tight"
              style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
            >
              Dokumen Invoice
            </h2>
            <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: 'rgb(var(--surface-400))' }}>
              {invoice.invoice_number}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dokumen invoice"
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
            style={{
              color: 'rgb(var(--surface-300))',
              backgroundColor: 'rgb(var(--surface-800) / 0.5)',
              borderColor: 'rgb(var(--surface-700) / 0.6)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Corporate White-Paper Invoice Sheet */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3" style={{ backgroundColor: 'rgb(var(--surface-950) / 0.55)' }}>
          <div className="bg-white border border-slate-300 overflow-hidden text-[#262c36] shadow-md">
            {/* 1. Top Blue VideaLink Icon + Brand Lockup */}
            <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center gap-3">
              <img
                src="/videalink_icon_blue.png"
                alt="VideaLink"
                className="h-9 w-auto object-contain shrink-0"
                onError={(e) => {
                  e.currentTarget.src = '/videa_link_logo.png';
                }}
              />
              <div>
                <div className="text-xl font-extrabold tracking-tight text-[#262c36] leading-none">VideaLink</div>
                <div className="text-[8px] font-bold tracking-[0.2em] uppercase text-slate-500 mt-1">
                  IOT CLOUD PLATFORM
                </div>
              </div>
            </div>

            {/* 2. Signature Split Accent Ribbon + Bold INVOICE Cutout */}
            <div className="flex items-center w-full">
              <div className="h-5 sm:h-6 bg-[#1d5ee6] flex-1" />
              <div className="px-4 sm:px-5 text-2xl sm:text-[30px] font-bold tracking-[0.04em] text-[#262c36] leading-none select-none">
                INVOICE
              </div>
              <div className="h-5 sm:h-6 bg-[#1d5ee6] w-10 sm:w-16 shrink-0" />
            </div>

            {/* 3. Invoice To & Document Meta */}
            <div className="px-6 sm:px-8 pt-5 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-[13px] font-bold text-[#262c36] mb-1">Invoice to:</div>
                <div className="text-[13.5px] font-bold text-slate-900">{user?.name || 'Pelanggan'}</div>
                <div className="text-[11.5px] text-slate-500 leading-relaxed mt-0.5">
                  {user?.email || '-'}
                  <br />
                  Periode: {periodStr}
                </div>
              </div>

              <div className="space-y-1 text-xs sm:min-w-[210px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-[#262c36]">Invoice#</span>
                  <span className="font-mono text-slate-600 tabular-nums">{invoice.invoice_number}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-[#262c36]">Date</span>
                  <span className="font-mono text-slate-600 tabular-nums">{dateSlash}</span>
                </div>
              </div>
            </div>

            {/* 4. Dark Header Corporate Line-Item Table */}
            <div className="px-6 sm:px-8 pb-5">
              <div className="border border-slate-300 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2f3542] text-white text-[11px] font-bold">
                      <th className="py-2.5 px-3 w-10">NO.</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-2 text-center w-12">Qty.</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="bg-white">
                      <td className="py-3 px-3 font-semibold align-top">1</td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-[#262c36]">
                          Langganan Paket {invoice.plan_name} ({cycleLabel})
                        </div>
                        {invoice.notes && <div className="text-[11px] text-slate-500 mt-0.5">{invoice.notes}</div>}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums align-top whitespace-nowrap">
                        {formatRupiahStrict(invoice.amount)}
                      </td>
                      <td className="py-3 px-2 text-center tabular-nums align-top">1</td>
                      <td className="py-3 px-3 text-right font-semibold font-mono tabular-nums align-top whitespace-nowrap">
                        {formatRupiahStrict(invoice.amount)}
                      </td>
                    </tr>
                    <tr className="bg-[#f4f5f7] text-slate-600">
                      <td className="py-2.5 px-3">2</td>
                      <td className="py-2.5 px-3 text-[11.5px]">
                        Akses Platform IoT, Monitoring &amp; Notifikasi ({periodStr})
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11.5px]">Termasuk</td>
                      <td className="py-2.5 px-2 text-center">1</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">Rp 0</td>
                    </tr>
                    <tr className="bg-white">
                      <td colSpan={5} className="h-10" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Bottom 2-Column Info & Highlighted Right-Flush Total Bar */}
            <div className="pb-6 flex flex-col sm:flex-row items-stretch justify-between gap-5">
              {/* Left: Thank You + Terms + Payment Info */}
              <div className="px-6 sm:pl-8 sm:pr-4 sm:w-[54%] space-y-3 text-left">
                <div className="text-xs font-bold text-[#262c36]">Terima kasih atas kepercayaan Anda</div>

                <div>
                  <div className="text-[11px] font-bold text-[#262c36] mb-0.5">Syarat &amp; Ketentuan</div>
                  <p className="text-[10.5px] leading-relaxed text-slate-500">
                    Dokumen ini merupakan bukti pembayaran resmi yang diterbitkan secara elektronik oleh sistem
                    VideaLink dan sah tanpa tanda tangan basah.
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#262c36] mb-1">Info Pembayaran:</div>
                  <dl className="space-y-0.5 text-[10.5px] text-slate-600">
                    <div className="flex gap-2">
                      <dt className="font-bold text-[#262c36] w-14 shrink-0">Metode:</dt>
                      <dd>{paymentLabel}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-bold text-[#262c36] w-14 shrink-0">Status:</dt>
                      <dd className={isPaid ? 'text-emerald-700 font-semibold' : 'font-semibold'}>{statusLabel}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Right: Sub Total, Tax + Flush Accent Total Bar */}
              <div className="sm:w-[46%] flex flex-col justify-between">
                <div className="px-6 sm:pl-4 sm:pr-8 space-y-1.5 text-xs mb-3">
                  <div className="flex items-center justify-between font-bold text-[#262c36]">
                    <span>Sub Total:</span>
                    <span className="font-mono tabular-nums">{formatRupiahStrict(invoice.amount)}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center justify-between font-bold text-[#262c36]">
                      <span>Diskon:</span>
                      <span className="font-mono tabular-nums text-emerald-700">
                        -{formatRupiahStrict(invoice.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-[#262c36]">
                    <span>Pajak (PPN):</span>
                    <span className="font-mono tabular-nums">{formatRupiahStrict(invoice.tax_amount)}</span>
                  </div>
                </div>

                {/* Flush Right Accent Total Bar */}
                <div className="bg-[#1d5ee6] text-white px-6 sm:pl-5 sm:pr-8 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-extrabold">Total:</span>
                  <span className="text-[15px] font-extrabold font-mono tabular-nums">
                    {formatRupiahStrict(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Split Bottom Accent Line + Authorised Sign */}
            <div className="flex items-center w-full pt-1">
              <div className="h-[3px] bg-[#1d5ee6] flex-1" />
              <div className="px-4 text-center shrink-0">
                <div className="border-t border-slate-500 pt-1 min-w-[125px] text-[10.5px] font-bold text-[#262c36]">
                  Otorisasi Elektronik
                </div>
              </div>
              <div className="h-[3px] bg-[#1d5ee6] w-8 sm:w-12 shrink-0" />
            </div>

            {/* 7. Bottom Contact Footer */}
            <div className="px-6 sm:px-8 pt-2.5 pb-5 text-[10.5px] font-semibold text-[#262c36] flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>billing@videalink.id</span>
              <span className="text-slate-400">|</span>
              <span>VideaLink IoT Platform</span>
              <span className="text-slate-400">|</span>
              <span>{window.location.host}</span>
            </div>
          </div>

          {emailFeedback && (
            <div
              role="status"
              className={`flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-xs border ${
                emailFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {emailFeedback.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{emailFeedback.text}</span>
            </div>
          )}
        </div>

        {/* Sticky Modal Action Bar */}
        <div
          className="px-5 py-3.5 border-t flex flex-wrap items-center justify-between gap-2.5 shrink-0"
          style={{
            backgroundColor: 'rgb(var(--surface-900))',
            borderColor: 'rgb(var(--surface-700) / 0.5)',
          }}
        >
          <button
            type="button"
            disabled={sendingEmail}
            onClick={handleSendEmail}
            className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.5)',
              borderColor: 'rgb(var(--surface-700) / 0.7)',
              color: 'rgb(var(--surface-100))',
            }}
          >
            {sendingEmail ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Mail size={13} style={{ color: 'rgb(var(--primary-400))' }} />
            )}
            Kirim ke Email
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                borderColor: 'rgb(var(--surface-700) / 0.7)',
                color: 'rgb(var(--surface-100))',
              }}
            >
              <Printer size={13} />
              Cetak / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 rounded-lg text-xs font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: 'rgb(var(--primary-500))' }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
