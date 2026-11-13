import { Link } from 'react-router-dom';
import { Lock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import Swal from 'sweetalert2';

export function promptQuotaUpgrade({
  navigate,
  resourceLabel,
  planName,
  current,
  limit,
  serverMessage,
  onAfterNavigate,
}) {
  const isUnavailable = limit === 0;
  const fallbackText = isUnavailable
    ? `Fitur ${resourceLabel} tidak tersedia pada paket ${planName}. Upgrade paket Anda untuk membuka fitur ini.`
    : `Kuota ${resourceLabel} pada paket ${planName} sudah mencapai batas (${current}/${limit}). Data lama tetap aman, silakan upgrade paket untuk menambah ${resourceLabel.toLowerCase()} baru.`;

  return Swal.fire({
    icon: 'warning',
    title: isUnavailable ? 'Fitur Membutuhkan Upgrade' : 'Batas Paket Tercapai',
    text: serverMessage || fallbackText,
    showCancelButton: true,
    confirmButtonText: 'Upgrade Paket Sekarang',
    cancelButtonText: 'Tutup',
  }).then((result) => {
    if (result.isConfirmed && typeof navigate === 'function') {
      if (typeof onAfterNavigate === 'function') onAfterNavigate();
      navigate('/app/billing');
    }
  });
}

export function handleQuotaError(err, navigate, onAfterNavigate) {
  const data = err?.response?.data;
  if (err?.response?.status === 402 || data?.error_code === 'QUOTA_EXCEEDED') {
    promptQuotaUpgrade({
      navigate,
      resourceLabel: data?.resource || 'sumber daya',
      planName: data?.plan_name || 'aktif',
      current: data?.current ?? 0,
      limit: data?.limit ?? 0,
      serverMessage: data?.message,
      onAfterNavigate,
    });
    return true;
  }
  return false;
}

export default function QuotaNoticeBanner({ quota }) {
  if (!quota?.loaded) return null;

  const isBlocked = quota.blocked;
  const isNear = !isBlocked && !quota.unlimited && quota.percentage >= 80 && quota.limit > 0;

  if (!isBlocked && !isNear) return null;

  const isUnavailable = quota.unavailable;
  const isOver = quota.overLimit;

  const title = isUnavailable
    ? `Fitur ${quota.label} Tidak Tersedia di Paket ${quota.planName}`
    : isOver
      ? `Pemakaian ${quota.label} Melebihi Batas Paket ${quota.planName} (${quota.current}/${quota.limit})`
      : isBlocked
        ? `Kuota ${quota.label} Paket ${quota.planName} Sudah Penuh (${quota.current}/${quota.limit})`
        : `Kuota ${quota.label} Hampir Penuh (${quota.current}/${quota.limit})`;

  const description = isUnavailable
    ? `Paket ${quota.planName} tidak mencakup ${quota.label.toLowerCase()}. Tingkatkan ke paket Basic atau lebih tinggi untuk mulai menambahkan.`
    : isBlocked
      ? `Data yang sudah ada tetap berjalan normal, namun penambahan ${quota.label.toLowerCase()} baru dinonaktifkan sampai paket ditingkatkan.`
      : `Anda telah memakai ${quota.percentage}% kuota ${quota.label.toLowerCase()} pada paket ${quota.planName}.`;

  const toneBorder = isBlocked ? 'rgb(244 63 94 / 0.38)' : 'rgb(245 158 11 / 0.35)';
  const toneBg = isBlocked ? 'rgb(244 63 94 / 0.08)' : 'rgb(245 158 11 / 0.08)';
  const toneAccent = isBlocked ? 'rgb(251 113 133)' : 'rgb(251 191 36)';

  return (
    <div
      role="status"
      className="ops-surface p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      style={{
        borderColor: toneBorder,
        backgroundColor: toneBg,
      }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            backgroundColor: isBlocked ? 'rgb(244 63 94 / 0.16)' : 'rgb(245 158 11 / 0.16)',
            color: toneAccent,
          }}
        >
          {isBlocked ? <Lock size={16} /> : <AlertTriangle size={16} />}
        </div>

        <div className="space-y-0.5 min-w-0">
          <p
            className="text-xs sm:text-[13px] font-bold tabular-nums"
            style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
          >
            {title}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'rgb(var(--surface-300))', textWrap: 'pretty' }}
          >
            {description}
          </p>
        </div>
      </div>

      <Link
        to="/app/billing"
        className="min-h-[40px] px-4 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shrink-0 transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
        style={{
          backgroundColor: 'rgb(var(--primary-500))',
          boxShadow: '0 4px 14px rgb(var(--primary-500) / 0.3)',
        }}
      >
        Upgrade Paket
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}

