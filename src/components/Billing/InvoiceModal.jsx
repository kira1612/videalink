import { useEffect } from 'react';
import { X, Printer, CheckCircle2, FileText } from 'lucide-react';
import {
  formatRupiahStrict,
  formatBillingDate,
  formatBillingDateTime,
} from '../../utils/billingFormat';

export default function InvoiceModal({ invoice, user, onClose }) {
  useEffect(() => {
    if (!invoice) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, onClose]);

  if (!invoice) return null;

  const cycleLabel = invoice.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: 'rgb(var(--surface-900))',
          borderColor: 'rgb(var(--primary-500) / 0.22)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
        >
          <div>
            <h2
              id="invoice-modal-title"
              className="text-sm font-bold flex items-center gap-2"
              style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
            >
              <FileText size={15} style={{ color: 'rgb(var(--primary-400))' }} />
              Detail Invoice
            </h2>
            <p
              className="text-xs font-mono mt-0.5"
              style={{ color: 'rgb(var(--surface-400))' }}
            >
              {invoice.invoice_number}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail invoice"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-[background-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
            style={{
              color: 'rgb(var(--surface-400))',
              backgroundColor: 'rgb(var(--surface-800) / 0.7)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgb(var(--surface-400))' }}
              >
                Videa Link IoT Platform
              </div>
              <div
                className="text-lg font-extrabold mt-0.5"
                style={{ color: 'rgb(var(--surface-50))' }}
              >
                Bukti Pembayaran Langganan
              </div>
            </div>
            <span className="badge-online shrink-0">
              <CheckCircle2 size={13} />
              Lunas
            </span>
          </div>

          <dl
            className="rounded-xl border p-4 space-y-2.5 text-xs"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.35)',
              borderColor: 'rgb(var(--surface-700) / 0.5)',
            }}
          >
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'rgb(var(--surface-400))' }}>Ditagihkan ke</dt>
              <dd
                className="font-semibold text-right"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {user?.name || 'Pengguna'} ({user?.email || '-'})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'rgb(var(--surface-400))' }}>Tanggal Bayar</dt>
              <dd
                className="font-semibold tabular-nums text-right"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {formatBillingDateTime(invoice.paid_at || invoice.created_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'rgb(var(--surface-400))' }}>Metode Pembayaran</dt>
              <dd
                className="font-semibold text-right"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {invoice.payment_channel_label || invoice.payment_method}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'rgb(var(--surface-400))' }}>Periode Aktif</dt>
              <dd
                className="font-semibold tabular-nums text-right"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {invoice.period_end
                  ? `${formatBillingDate(invoice.period_start)} – ${formatBillingDate(invoice.period_end)}`
                  : 'Aktif Selamanya (Free Tier)'}
              </dd>
            </div>
          </dl>

          <div
            className="rounded-xl border p-4 space-y-2.5"
            style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
          >
            <div className="flex items-start justify-between gap-3 text-sm">
              <div>
                <div
                  className="font-bold"
                  style={{ color: 'rgb(var(--surface-50))' }}
                >
                  Paket {invoice.plan_name} ({cycleLabel})
                </div>
                {invoice.notes && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
                    {invoice.notes}
                  </p>
                )}
              </div>
              <span
                className="font-bold tabular-nums shrink-0"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {formatRupiahStrict(invoice.amount)}
              </span>
            </div>

            <div
              className="pt-2.5 border-t flex items-center justify-between text-xs"
              style={{
                borderColor: 'rgb(var(--surface-700) / 0.45)',
                color: 'rgb(var(--surface-400))',
              }}
            >
              <span>Pajak (Termasuk PPN)</span>
              <span className="tabular-nums">{formatRupiahStrict(invoice.tax_amount)}</span>
            </div>

            <div
              className="pt-2.5 border-t flex items-center justify-between"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: 'rgb(var(--surface-200))' }}
              >
                Total Dibayar
              </span>
              <span
                className="text-lg font-extrabold tabular-nums"
                style={{ color: 'rgb(var(--primary-400))' }}
              >
                {formatRupiahStrict(invoice.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-[background-color,transform] duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.7)',
                borderColor: 'rgb(var(--surface-700) / 0.6)',
                color: 'rgb(var(--surface-100))',
              }}
            >
              <Printer size={15} />
              Cetak / Simpan PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl text-xs font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
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
