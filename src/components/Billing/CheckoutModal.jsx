import { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  Building2,
  Wallet,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  formatRupiahStrict,
  PAYMENT_METHOD_META,
  createIdempotencyKey,
} from '../../utils/billingFormat';

const METHOD_ICON = {
  qris: QrCode,
  va_bca: Building2,
  va_mandiri: Building2,
  va_bri: Building2,
  ewallet_gopay: Wallet,
  ewallet_ovo: Wallet,
  card: CreditCard,
};

export default function CheckoutModal({
  open,
  plan,
  billingCycle,
  onClose,
  onConfirm,
}) {
  const [selectedMethod, setSelectedMethod] = useState('qris');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open && plan) {
      setSelectedMethod('qris');
      setIdempotencyKey(createIdempotencyKey());
      setErrorMsg('');
      setSubmitting(false);
    }
  }, [open, plan?.code, billingCycle]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open || !plan) return null;

  const isYearly = billingCycle === 'yearly';
  const totalAmount = isYearly ? plan.price_yearly : plan.price_monthly;
  const isFreePlan = Number(totalAmount) === 0;
  const methods = Object.values(PAYMENT_METHOD_META);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onConfirm({
        plan_code: plan.code,
        billing_cycle: billingCycle,
        payment_method: isFreePlan ? 'free_tier' : selectedMethod,
        idempotency_key: idempotencyKey,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal memproses transaksi. Silakan coba lagi.';
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      {/* Concentric outer 24px (rounded-3xl) with p-5/6 -> inner 12px (rounded-xl) */}
      <div
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh]"
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
              id="checkout-modal-title"
              className="text-base font-bold flex items-center gap-2"
              style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
            >
              <Sparkles size={16} style={{ color: 'rgb(var(--primary-400))' }} />
              {isFreePlan ? 'Konfirmasi Perubahan ke Starter' : `Checkout Paket ${plan.name}`}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
              Siklus {isYearly ? 'Tahunan (12 Bulan)' : 'Bulanan (1 Bulan)'} • Aktivasi Instan
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup modal checkout"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-[background-color,transform] duration-150 ease-out active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
            style={{
              color: 'rgb(var(--surface-400))',
              backgroundColor: 'rgb(var(--surface-800) / 0.7)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Clean Summary Section (single hairline container, no nested cards) */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.35)',
              borderColor: 'rgb(var(--surface-700) / 0.55)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'rgb(var(--primary-400))' }}
                >
                  Paket Dipilih
                </span>
                <h3
                  className="text-lg font-extrabold"
                  style={{ color: 'rgb(var(--surface-50))' }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-xs"
                  style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
                >
                  {plan.tagline}
                </p>
              </div>

              <div className="text-right tabular-nums">
                <div
                  className="text-xl font-extrabold"
                  style={{ color: 'rgb(var(--surface-50))' }}
                >
                  {isFreePlan ? 'Rp 0' : formatRupiahStrict(totalAmount)}
                </div>
                <div className="text-xs" style={{ color: 'rgb(var(--surface-400))' }}>
                  {isFreePlan ? 'Gratis selamanya' : isYearly ? 'per tahun' : 'per bulan'}
                </div>
              </div>
            </div>

            {!isFreePlan && isYearly && plan.yearly_savings > 0 && (
              <div
                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'rgb(16 185 129 / 0.1)',
                  borderColor: 'rgb(16 185 129 / 0.25)',
                  color: 'rgb(52 211 153)',
                }}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 size={14} />
                  Hemat paket tahunan ({plan.yearly_discount_percent}%)
                </span>
                <span className="font-bold tabular-nums">
                  -{formatRupiahStrict(plan.yearly_savings)}
                </span>
              </div>
            )}

            <div
              className="pt-3 border-t flex items-center justify-between text-sm"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
            >
              <span style={{ color: 'rgb(var(--surface-300))' }}>
                Total Pembayaran (Termasuk PPN)
              </span>
              <span
                className="text-base font-extrabold tabular-nums"
                style={{ color: 'rgb(var(--primary-400))' }}
              >
                {formatRupiahStrict(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          {!isFreePlan && (
            <div className="space-y-2.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider"
                style={{ color: 'rgb(var(--surface-300))' }}
              >
                Pilih Metode Pembayaran
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {methods.map((method) => {
                  const Icon = METHOD_ICON[method.id] || CreditCard;
                  const active = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      aria-pressed={active}
                      className="text-left p-3 rounded-xl border transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.99] min-h-[60px] flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                      style={{
                        backgroundColor: active
                          ? 'rgb(var(--primary-500) / 0.12)'
                          : 'rgb(var(--surface-800) / 0.4)',
                        borderColor: active
                          ? 'rgb(var(--primary-500) / 0.7)'
                          : 'rgb(var(--surface-700) / 0.55)',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: active
                            ? 'rgb(var(--primary-500))'
                            : 'rgb(var(--surface-700) / 0.6)',
                          color: active ? '#fff' : 'rgb(var(--surface-300))',
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-bold truncate"
                          style={{ color: 'rgb(var(--surface-50))' }}
                        >
                          {method.label}
                        </div>
                        <p
                          className="text-[11px] leading-snug mt-0.5 truncate"
                          style={{ color: 'rgb(var(--surface-400))' }}
                        >
                          {method.desc}
                        </p>
                      </div>
                      <span
                        className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: active
                            ? 'rgb(var(--primary-500))'
                            : 'rgb(var(--surface-600))',
                          backgroundColor: active
                            ? 'rgb(var(--primary-500))'
                            : 'transparent',
                        }}
                      >
                        {active && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sandbox Notice */}
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-xs"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.35)',
              borderColor: 'rgb(var(--surface-700) / 0.45)',
              color: 'rgb(var(--surface-300))',
            }}
          >
            <ShieldCheck
              size={15}
              className="shrink-0 mt-0.5"
              style={{ color: 'rgb(var(--primary-400))' }}
            />
            <p className="leading-relaxed" style={{ textWrap: 'pretty' }}>
              {isFreePlan
                ? 'Berpindah ke paket Starter menghentikan tagihan berulang berikutnya. Perangkat & bucket yang sudah ada tetap aman.'
                : 'Simulasi Checkout (Sandbox): tidak ada saldo riil yang dipotong, invoice tercatat otomatis, dan kuota langsung aktif.'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium"
              style={{
                backgroundColor: 'rgb(244 63 94 / 0.12)',
                borderColor: 'rgb(244 63 94 / 0.35)',
                color: 'rgb(251 113 133)',
              }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div
            className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t"
            style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] px-5 rounded-xl text-xs font-semibold border transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.7)',
                borderColor: 'rgb(var(--surface-700) / 0.6)',
                color: 'rgb(var(--surface-200))',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-6 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 shadow-lg"
              style={{
                backgroundColor: 'rgb(var(--primary-500))',
                boxShadow: '0 8px 20px rgb(var(--primary-500) / 0.28)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Memproses Pembayaran...
                </>
              ) : isFreePlan ? (
                'Konfirmasi Beralih ke Starter'
              ) : (
                `Bayar ${formatRupiahStrict(totalAmount)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
