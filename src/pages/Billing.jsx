import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Check,
  Sparkles,
  Cpu,
  Database,
  LayoutDashboard,
  Webhook,
  RefreshCw,
  Receipt,
  CalendarClock,
  AlertTriangle,
  RotateCcw,
  XCircle,
  ArrowRight,
  Clock,
  ArrowUpRight,
  Radio,
  Box,
  Share2,
  Calendar,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { billingApi } from '../services/api';
import {
  formatBillingDate,
  formatLimit,
  formatRupiah,
  formatRupiahStrict,
} from '../utils/billingFormat';
import CheckoutModal from '../components/Billing/CheckoutModal';
import InvoiceModal from '../components/Billing/InvoiceModal';

const QUOTA_ICONS = {
  devices: Cpu,
  buckets: Database,
  rooms: LayoutDashboard,
  endpoints: Webhook,
};

const PLAN_RANK = {
  starter: 1,
  basic: 2,
  plus: 3,
  pro: 4,
  enterprise: 5,
};

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('iot_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const fetchBillingData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const [plansRes, currentRes, invoicesRes] = await Promise.all([
        billingApi.plans(),
        billingApi.current(),
        billingApi.invoices(),
      ]);

      setPlans(plansRes.data?.plans || []);
      const currentData = currentRes.data || null;
      setBilling(currentData);
      if (currentData?.subscription?.billing_cycle) {
        setBillingCycle(currentData.subscription.billing_cycle);
      }
      setInvoices(invoicesRes.data?.invoices || []);
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          'Gagal memuat data langganan. Periksa koneksi server dan coba lagi.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData(false);
  }, [fetchBillingData]);

  const handleCheckoutConfirm = async (payload) => {
    const res = await billingApi.subscribe(payload);
    const createdInvoice = res.data?.invoice;
    setCheckoutPlan(null);
    await fetchBillingData(true);

    Swal.fire({
      title: 'Langganan Aktif',
      text: createdInvoice
        ? `Transaksi ${createdInvoice.invoice_number} berhasil diproses dan kuota paket langsung diperbarui.`
        : 'Paket langganan Anda sudah aktif.',
      icon: 'success',
      confirmButtonText: 'Lihat Invoice',
      showCancelButton: true,
      cancelButtonText: 'Tutup',
    }).then((result) => {
      if (result.isConfirmed && createdInvoice) {
        setSelectedInvoice(createdInvoice);
      }
    });
  };

  const handleCancelSubscription = async () => {
    if (actionBusy) return;
    const { isConfirmed, value: reason } = await Swal.fire({
      title: 'Batalkan Perpanjangan Otomatis?',
      text: 'Paket berbayar Anda tetap aktif hingga akhir periode penagihan saat ini dan tidak akan diperpanjang lagi.',
      input: 'text',
      inputPlaceholder: 'Alasan pembatalan (opsional)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Pertahankan',
    });

    if (!isConfirmed) return;

    setActionBusy(true);
    try {
      await billingApi.cancel(reason || null);
      await fetchBillingData(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Perpanjangan otomatis berhasil dibatalkan.',
        showConfirmButton: false,
        timer: 2600,
      });
    } catch (err) {
      Swal.fire({
        title: 'Gagal Membatalkan',
        text: err?.response?.data?.message || 'Terjadi kesalahan saat membatalkan langganan.',
        icon: 'error',
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await billingApi.resume();
      await fetchBillingData(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Langganan Anda kembali aktif dengan perpanjangan otomatis.',
        showConfirmButton: false,
        timer: 2600,
      });
    } catch (err) {
      Swal.fire({
        title: 'Gagal Melanjutkan',
        text: err?.response?.data?.message || 'Terjadi kesalahan.',
        icon: 'error',
      });
    } finally {
      setActionBusy(false);
    }
  };

  const activePlan = billing?.plan;
  const activeSub = billing?.subscription;
  const isPaidActive = Boolean(activeSub && activeSub.ends_at);
  const isCanceledPending = Boolean(activeSub?.is_canceled_at_period_end);

  const hasOverLimitResource = useMemo(
    () => Object.values(billing?.usage || {}).some((item) => item.over_limit),
    [billing]
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
        >
          Langganan &amp; Paket
        </h1>
        <p
          className="text-xs"
          style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
        >
          Kelola paket kapasitas IoT, pantau pemakaian kuota secara langsung, dan unduh riwayat invoice.
        </p>
      </div>

      <button
        type="button"
        onClick={() => fetchBillingData(true)}
        disabled={loading || refreshing}
        className="self-start sm:self-auto min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
        style={{
          backgroundColor: 'rgb(var(--surface-900))',
          borderColor: 'rgb(var(--surface-700) / 0.7)',
          color: 'rgb(var(--surface-200))',
        }}
      >
        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        Muat Ulang
      </button>
    </div>

    {/* Error State */}
    {errorMsg && (
      <div
        role="alert"
        className="ops-surface p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ borderColor: 'rgb(244 63 94 / 0.4)' }}
      >
          <div className="flex items-start gap-3">
            <AlertTriangle size={19} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-rose-400">
                Gagal Memuat Informasi Billing
              </div>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'rgb(var(--surface-300))', textWrap: 'pretty' }}
              >
                {errorMsg}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchBillingData(false)}
            className="min-h-[42px] px-4 rounded-xl text-xs font-bold text-white shrink-0 transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
            style={{ backgroundColor: 'rgb(var(--primary-500))' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Section 1: Active Subscription & Inline Real-Time Quota Strip */}
      {loading ? (
        <div className="ops-surface p-6 space-y-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div
                className="h-4 w-32 rounded-md"
                style={{ backgroundColor: 'rgb(var(--surface-700) / 0.5)' }}
              />
              <div
                className="h-7 w-56 rounded-lg"
                style={{ backgroundColor: 'rgb(var(--surface-700) / 0.5)' }}
              />
            </div>
            <div
              className="h-10 w-40 rounded-xl"
              style={{ backgroundColor: 'rgb(var(--surface-700) / 0.5)' }}
            />
          </div>
          <div
            className="pt-5 border-t grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
            style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
          >
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-14 rounded-xl"
                style={{ backgroundColor: 'rgb(var(--surface-800) / 0.55)' }}
              />
            ))}
          </div>
        </div>
      ) : (
        billing && (
          <section
            aria-label="Ringkasan Paket Aktif dan Kuota"
            className="ops-surface p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgb(var(--surface-400))' }}
                  >
                    Paket Aktif
                  </span>
                  {isCanceledPending ? (
                    <span className="badge-warning">
                      <CalendarClock size={12} />
                      Berakhir {formatBillingDate(activeSub.ends_at)}
                    </span>
                  ) : (
                    <span className="badge-online">
                      <Check size={12} />
                      Aktif
                    </span>
                  )}
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.6)',
                      borderColor: 'rgb(var(--surface-700) / 0.5)',
                      color: 'rgb(var(--surface-300))',
                    }}
                  >
                    {isPaidActive
                      ? activeSub.billing_cycle === 'yearly'
                        ? 'Siklus Tahunan'
                        : 'Siklus Bulanan'
                      : 'Gratis Selamanya'}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 flex-wrap">
                  <h2
                    className="text-xl font-extrabold"
                    style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
                  >
                    {activePlan?.name}
                  </h2>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs tabular-nums"
                    style={{ color: 'rgb(var(--surface-400))' }}
                  >
                    <Clock size={13} />
                    Retensi data {activePlan?.retention_days} hari
                  </span>
                </div>

                {isPaidActive && (
                  <p
                    className="text-xs tabular-nums"
                    style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
                  >
                    {isCanceledPending
                      ? `Perpanjangan otomatis dihentikan. Akses paket tetap aktif hingga ${formatBillingDate(activeSub.ends_at)} (${activeSub.days_remaining} hari tersisa).`
                      : `Perpanjangan otomatis pada ${formatBillingDate(activeSub.ends_at)} (${activeSub.days_remaining} hari lagi) melalui ${activeSub.payment_channel_label}.`}
                  </p>
                )}
              </div>

              {isPaidActive && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  {isCanceledPending ? (
                    <button
                      type="button"
                      onClick={handleResumeSubscription}
                      disabled={actionBusy}
                      className="min-h-[42px] px-4 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                      style={{ backgroundColor: 'rgb(var(--primary-500))' }}
                    >
                      <RotateCcw size={14} />
                      Lanjutkan Langganan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={actionBusy}
                      className="min-h-[42px] px-4 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-[background-color,border-color,transform] duration-150 ease-out hover:bg-rose-500/15 active:scale-[0.98] motion-reduce:transform-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      style={{
                        backgroundColor: 'rgb(244 63 94 / 0.06)',
                        borderColor: 'rgb(244 63 94 / 0.28)',
                        color: 'rgb(251 113 133)',
                      }}
                    >
                      <XCircle size={14} />
                      Batalkan Perpanjangan
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasOverLimitResource && (
              <div
                className="px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2.5"
                style={{
                  backgroundColor: 'rgb(245 158 11 / 0.08)',
                  borderColor: 'rgb(245 158 11 / 0.3)',
                  color: 'rgb(251 191 36)',
                }}
              >
                <AlertTriangle size={15} className="shrink-0" />
                <span style={{ textWrap: 'pretty' }}>
                  Sebagian sumber daya Anda saat ini melebihi batas paket {activePlan?.name}. Data lama tetap aman, tetapi penambahan baru membutuhkan upgrade paket.
                </span>
              </div>
            )}

            {/* Inline Quota Meters */}
            <div
              className="pt-5 border-t grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-4"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
            >
              {Object.entries(billing.usage || {}).map(([key, item]) => {
                const Icon = QUOTA_ICONS[key] || Cpu;
                const isUnavailable = !item.unlimited && item.limit === 0 && item.current === 0;
                const isOver = item.over_limit;
                const isFull = !isUnavailable && item.exceeded;
                const isNear = !item.unlimited && !isUnavailable && item.percentage >= 80 && !isFull;

                const barColor =
                  isOver || isFull
                    ? 'rgb(244 63 94)'
                    : isNear
                      ? 'rgb(245 158 11)'
                      : 'rgb(var(--primary-500))';

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          size={14}
                          className="shrink-0"
                          style={{
                            color: isUnavailable
                              ? 'rgb(var(--surface-500))'
                              : 'rgb(var(--primary-400))',
                          }}
                        />
                        <span
                          className="text-xs font-semibold truncate"
                          style={{ color: 'rgb(var(--surface-200))' }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums shrink-0"
                        style={{
                          color: isUnavailable
                            ? 'rgb(var(--surface-500))'
                            : isOver || isFull
                              ? 'rgb(251 113 133)'
                              : 'rgb(var(--surface-50))',
                        }}
                      >
                        {isUnavailable
                          ? 'Tidak Tersedia'
                          : `${item.current} / ${item.unlimited ? '∞' : formatLimit(item.limit)}`}
                      </span>
                    </div>

                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-300 ease-out"
                        style={{
                          width: item.unlimited
                            ? '100%'
                            : isUnavailable
                              ? '0%'
                              : `${Math.min(100, item.percentage)}%`,
                          backgroundColor: item.unlimited
                            ? 'rgb(16 185 129 / 0.75)'
                            : barColor,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: 'rgb(var(--surface-400))' }}>
                        {item.unlimited
                          ? 'Tanpa batas kuota'
                          : isUnavailable
                            ? 'Perlu upgrade paket'
                            : isOver
                              ? 'Melebihi batas aktif'
                              : isFull
                                ? 'Kuota penuh'
                                : `${item.limit - item.current} slot tersisa`}
                      </span>
                      {!item.unlimited && !isUnavailable && (
                        <span
                          className="tabular-nums font-medium"
                          style={{ color: 'rgb(var(--surface-400))' }}
                        >
                          {item.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}

      {/* Section 2: Plan Catalog */}
      <section aria-label="Pilihan Paket IoT" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-0.5">
            <h2
              className="text-lg font-extrabold"
              style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
            >
              Pilih Paket Sesuai Kebutuhan
            </h2>
            <p
              className="text-xs"
              style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
            >
              Mulai gratis atau tingkatkan kapasitas kapan saja. Perubahan paket langsung memperbarui batas kuota.
            </p>
          </div>

          {/* Concentric Segmented Billing Cycle Control (outer 16px, p-1 = 4px -> inner 12px) */}
          <div
            className="inline-flex p-1 rounded-2xl border self-start sm:self-auto"
            role="tablist"
            aria-label="Siklus Penagihan"
            style={{
              backgroundColor: 'rgb(var(--surface-900) / 0.85)',
              borderColor: 'rgb(var(--surface-700) / 0.6)',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={billingCycle === 'monthly'}
              onClick={() => setBillingCycle('monthly')}
              className="min-h-[38px] px-4 rounded-xl text-xs font-bold transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
              style={{
                backgroundColor:
                  billingCycle === 'monthly' ? 'rgb(var(--primary-500))' : 'transparent',
                color:
                  billingCycle === 'monthly' ? '#ffffff' : 'rgb(var(--surface-300))',
              }}
            >
              Bulanan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billingCycle === 'yearly'}
              onClick={() => setBillingCycle('yearly')}
              className="min-h-[38px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
              style={{
                backgroundColor:
                  billingCycle === 'yearly' ? 'rgb(var(--primary-500))' : 'transparent',
                color:
                  billingCycle === 'yearly' ? '#ffffff' : 'rgb(var(--surface-300))',
              }}
            >
              Tahunan
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums"
                style={{
                  backgroundColor:
                    billingCycle === 'yearly'
                      ? 'rgb(255 255 255 / 0.22)'
                      : 'rgb(16 185 129 / 0.16)',
                  color: billingCycle === 'yearly' ? '#ffffff' : 'rgb(52 211 153)',
                }}
              >
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="ops-surface p-4 2xl:p-5 h-[430px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-stretch">
            {plans.map((plan) => {
              const isYearly = billingCycle === 'yearly';
              const displayPrice = isYearly
                ? plan.effective_monthly_on_yearly
                : plan.price_monthly;
              const isFree = plan.price_monthly === 0;

              const isCurrentPlan = activePlan?.code === plan.code;
              const isExactActiveCycle =
                isCurrentPlan &&
                (isFree ||
                  (activeSub?.billing_cycle === billingCycle && !isCanceledPending));

              const currentRank = PLAN_RANK[activePlan?.code] || 1;
              const targetRank = PLAN_RANK[plan.code] || 1;
              const isUpgrade = targetRank > currentRank;

              let ctaLabel = `Pilih ${plan.name}`;
              if (isExactActiveCycle) {
                ctaLabel = 'Paket Aktif';
              } else if (isCurrentPlan && isCanceledPending) {
                ctaLabel = 'Aktifkan Kembali';
              } else if (isCurrentPlan && !isFree) {
                ctaLabel = isYearly ? 'Ubah ke Tahunan' : 'Ubah ke Bulanan';
              } else if (isFree) {
                ctaLabel = 'Beralih ke Starter';
              } else if (isUpgrade) {
                ctaLabel = `Upgrade ke ${plan.name}`;
              }

              const roomsLimit = plan.limits?.rooms;
              const specs = [
                { icon: Radio, label: 'Perangkat IoT', value: formatLimit(plan.limits?.devices) },
                { icon: Database, label: 'Data Bucket', value: formatLimit(plan.limits?.buckets) },
                {
                  icon: Box,
                  label: 'Ruangan 3D',
                  value: roomsLimit === 0 ? 'Tidak Ada' : formatLimit(roomsLimit),
                  muted: roomsLimit === 0,
                },
                { icon: Share2, label: 'Endpoint', value: formatLimit(plan.limits?.endpoints) },
                { icon: Calendar, label: 'Retensi Data', value: `${plan.limits?.retention_days} Hari` },
              ];

              return (
                <article
                  key={plan.code}
                  className={`ops-surface p-4 2xl:p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-[transform,border-color] duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transform-none ${
                    plan.is_featured ? 'billing-plan-featured' : ''
                  }`}
                  style={
                    plan.is_featured
                      ? undefined
                      : {
                          borderColor: isCurrentPlan
                            ? 'rgb(16 185 129 / 0.5)'
                            : undefined,
                        }
                  }
                >
                  <div className="space-y-4">
                    {/* Plan Header */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className="text-base font-extrabold"
                          style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
                        >
                          {plan.name}
                        </h3>

                        {isCurrentPlan ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                            <Check size={10} strokeWidth={3} />
                            Aktif
                          </span>
                        ) : (
                          plan.badge && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                              style={{
                                background: plan.is_featured
                                  ? 'linear-gradient(90deg, rgb(var(--primary-500) / 0.3), rgb(var(--primary-400) / 0.22))'
                                  : 'rgb(var(--surface-800) / 0.85)',
                                color: plan.is_featured
                                  ? 'rgb(var(--primary-300))'
                                  : 'rgb(var(--surface-300))',
                                border: plan.is_featured
                                  ? '1px solid rgb(var(--primary-400) / 0.55)'
                                  : '1px solid rgb(var(--surface-700) / 0.65)',
                              }}
                            >
                              {plan.is_featured && <Sparkles size={10} />}
                              {plan.badge}
                            </span>
                          )
                        )}
                      </div>

                      <p
                        className="text-xs leading-relaxed min-h-[48px]"
                        style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
                      >
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div
                      className="pb-4 border-b space-y-1.5"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <div className="flex items-baseline gap-1 tabular-nums whitespace-nowrap">
                        <span
                          className="text-[20px] 2xl:text-[25px] font-extrabold tracking-tight leading-none"
                          style={{ color: 'rgb(var(--surface-50))' }}
                        >
                          {formatRupiah(displayPrice)}
                        </span>
                        {!isFree && (
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: 'rgb(var(--surface-400))' }}
                          >
                            / bln
                          </span>
                        )}
                      </div>

                      <p
                        className="text-[11px] tabular-nums min-h-[30px] leading-snug"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        {isFree
                          ? 'Gratis selamanya tanpa kartu kredit'
                          : isYearly
                            ? `${formatRupiahStrict(plan.price_yearly)} / thn • Hemat ${formatRupiahStrict(plan.yearly_savings)}`
                            : 'Ditagih bulanan • Batalkan kapan saja'}
                      </p>
                    </div>

                    {/* Clean Key-Value Spec Table with Icons */}
                    <dl
                      className="divide-y text-[11.5px]"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.35)' }}
                    >
                      {specs.map((spec) => {
                        const SpecIcon = spec.icon;
                        return (
                          <div
                            key={spec.label}
                            className="py-2 flex items-center justify-between gap-1.5"
                          >
                            <dt
                              className="flex items-center gap-1.5 min-w-0"
                              style={{ color: 'rgb(var(--surface-300))' }}
                            >
                              <SpecIcon
                                size={13}
                                className="shrink-0"
                                style={{
                                  color: spec.muted
                                    ? 'rgb(var(--surface-500))'
                                    : plan.is_featured
                                      ? 'rgb(var(--primary-400))'
                                      : 'rgb(var(--surface-400))',
                                }}
                              />
                              <span className="truncate">{spec.label}</span>
                            </dt>
                            <dd
                              className="font-bold tabular-nums text-right shrink-0 whitespace-nowrap"
                              style={{
                                color: spec.muted
                                  ? 'rgb(var(--surface-500))'
                                  : 'rgb(var(--surface-50))',
                              }}
                            >
                              {spec.value}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>

                  {/* Anchored Bottom CTA */}
                  <button
                    type="button"
                    disabled={isExactActiveCycle}
                    onClick={() => setCheckoutPlan(plan)}
                    className={`min-h-[44px] w-full px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-[background-color,border-color,filter,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none disabled:active:scale-100 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))] ${
                      plan.is_featured && !isExactActiveCycle
                        ? 'billing-btn-featured hover:brightness-110 text-white'
                        : 'hover:border-[rgb(var(--primary-400)/0.55)]'
                    }`}
                    style={
                      plan.is_featured && !isExactActiveCycle
                        ? undefined
                        : {
                            backgroundColor: isExactActiveCycle
                              ? 'rgb(16 185 129 / 0.1)'
                              : 'rgb(var(--surface-800) / 0.5)',
                            color: isExactActiveCycle
                              ? 'rgb(52 211 153)'
                              : 'rgb(var(--surface-50))',
                            border: isExactActiveCycle
                              ? '1px solid rgb(16 185 129 / 0.35)'
                              : '1px solid rgb(var(--surface-600) / 0.55)',
                          }
                    }
                  >
                    {isExactActiveCycle ? (
                      <>
                        <Check size={15} />
                        {ctaLabel}
                      </>
                    ) : (
                      <>
                        {ctaLabel}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Invoice History */}
      <section aria-label="Riwayat Tagihan dan Invoice" className="ops-surface p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Receipt size={17} style={{ color: 'rgb(var(--primary-400))' }} />
            <div>
              <h2
                className="text-sm font-bold"
                style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
              >
                Riwayat Tagihan &amp; Invoice
              </h2>
              <p className="text-xs" style={{ color: 'rgb(var(--surface-400))' }}>
                Seluruh transaksi pembelian atau perpindahan paket tersimpan otomatis.
              </p>
            </div>
          </div>

          <span
            className="text-xs font-semibold tabular-nums shrink-0"
            style={{ color: 'rgb(var(--surface-400))' }}
          >
            {invoices.length} Transaksi
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl"
                style={{ backgroundColor: 'rgb(var(--surface-800) / 0.55)' }}
              />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div
            className="py-8 px-4 border border-dashed rounded-2xl text-center space-y-3"
            style={{ borderColor: 'rgb(var(--surface-700) / 0.65)' }}
          >
            <div
              className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.8)',
                color: 'rgb(var(--surface-400))',
              }}
            >
              <CreditCard size={18} />
            </div>
            <div className="space-y-1">
              <div
                className="text-sm font-bold"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                Belum ada riwayat invoice
              </div>
              <p
                className="text-xs max-w-md mx-auto"
                style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
              >
                Akun Anda sedang menggunakan paket Starter gratis. Mulai berlangganan dari paket Basic (Rp 30.000/bulan) untuk menambah kapasitas perangkat Anda.
              </p>
            </div>
            {plans.find((p) => p.code === 'basic') && (
              <button
                type="button"
                onClick={() => setCheckoutPlan(plans.find((p) => p.code === 'basic'))}
                className="min-h-[40px] px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 text-white transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                style={{ backgroundColor: 'rgb(var(--primary-500))' }}
              >
                Mulai Paket Basic
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Compact List */}
            <div
              className="divide-y sm:hidden"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
            >
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div
                      className="text-xs font-bold truncate"
                      style={{ color: 'rgb(var(--surface-50))' }}
                    >
                      {inv.plan_name} ({inv.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                    </div>
                    <div
                      className="text-[11px] font-mono truncate"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    >
                      {inv.invoice_number} • {formatBillingDate(inv.paid_at || inv.created_at)}
                    </div>
                    <div
                      className="text-xs font-extrabold tabular-nums pt-0.5"
                      style={{ color: 'rgb(var(--primary-400))' }}
                    >
                      {formatRupiahStrict(inv.total_amount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(inv)}
                    className="min-h-[40px] px-3 rounded-xl border text-xs font-semibold shrink-0 transition-[background-color,transform] duration-150 active:scale-[0.98]"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.7)',
                      borderColor: 'rgb(var(--surface-700) / 0.65)',
                      color: 'rgb(var(--surface-100))',
                    }}
                  >
                    Struk
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[11px] uppercase tracking-wider"
                    style={{
                      borderColor: 'rgb(var(--surface-700) / 0.5)',
                      color: 'rgb(var(--surface-400))',
                    }}
                  >
                    <th className="py-3 pr-4 font-bold">No. Invoice</th>
                    <th className="py-3 px-4 font-bold">Paket</th>
                    <th className="py-3 px-4 font-bold">Metode</th>
                    <th className="py-3 px-4 font-bold">Tanggal</th>
                    <th className="py-3 px-4 font-bold text-right">Total</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 pl-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y text-xs"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.35)' }}
                >
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="table-row-hover">
                      <td
                        className="py-3.5 pr-4 font-mono font-semibold whitespace-nowrap"
                        style={{ color: 'rgb(var(--surface-100))' }}
                      >
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="font-bold"
                          style={{ color: 'rgb(var(--surface-50))' }}
                        >
                          {inv.plan_name}
                        </span>{' '}
                        <span style={{ color: 'rgb(var(--surface-400))' }}>
                          ({inv.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                        </span>
                      </td>
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        style={{ color: 'rgb(var(--surface-300))' }}
                      >
                        {inv.payment_channel_label || inv.payment_method}
                      </td>
                      <td
                        className="py-3.5 px-4 whitespace-nowrap tabular-nums"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        {formatBillingDate(inv.paid_at || inv.created_at)}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right font-bold tabular-nums whitespace-nowrap"
                        style={{ color: 'rgb(var(--surface-50))' }}
                      >
                        {formatRupiahStrict(inv.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="badge-online">Lunas</span>
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="min-h-[38px] px-3 rounded-xl border text-xs font-semibold transition-[background-color,border-color,transform] duration-150 ease-out hover:border-[rgb(var(--primary-500)/0.5)] active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                          style={{
                            backgroundColor: 'rgb(var(--surface-800) / 0.65)',
                            borderColor: 'rgb(var(--surface-700) / 0.6)',
                            color: 'rgb(var(--primary-400))',
                          }}
                        >
                          Lihat Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <CheckoutModal
        open={Boolean(checkoutPlan)}
        plan={checkoutPlan}
        billingCycle={billingCycle}
        onClose={() => setCheckoutPlan(null)}
        onConfirm={handleCheckoutConfirm}
      />

      <InvoiceModal
        invoice={selectedInvoice}
        user={currentUser}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
