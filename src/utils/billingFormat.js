export function formatRupiah(amount) {
  const num = Number(amount || 0);
  if (num === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRupiahStrict(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatBillingDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatBillingDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatLimit(limit) {
  if (limit === null || limit === undefined) return 'Tanpa Batas';
  return new Intl.NumberFormat('id-ID').format(limit);
}

export const PAYMENT_METHOD_META = {
  qris: {
    id: 'qris',
    label: 'QRIS (Instant)',
    desc: 'Aktivasi instan melalui QRIS semua bank & e-wallet',
    group: 'Instan',
  },
  va_bca: {
    id: 'va_bca',
    label: 'Virtual Account BCA',
    desc: 'Transfer otomatis via BCA Mobile / KlikBCA',
    group: 'Bank VA',
  },
  va_mandiri: {
    id: 'va_mandiri',
    label: 'Virtual Account Mandiri',
    desc: 'Transfer otomatis via Livin’ by Mandiri',
    group: 'Bank VA',
  },
  va_bri: {
    id: 'va_bri',
    label: 'Virtual Account BRI',
    desc: 'Transfer otomatis via BRImo',
    group: 'Bank VA',
  },
  ewallet_gopay: {
    id: 'ewallet_gopay',
    label: 'GoPay',
    desc: 'Pembayaran cepat dari saldo GoPay',
    group: 'E-Wallet',
  },
  ewallet_ovo: {
    id: 'ewallet_ovo',
    label: 'OVO',
    desc: 'Pembayaran langsung via aplikasi OVO',
    group: 'E-Wallet',
  },
  card: {
    id: 'card',
    label: 'Kartu Kredit / Debit',
    desc: 'Visa, Mastercard, atau JCB berlogo 3DS',
    group: 'Kartu',
  },
};

export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `chk_${crypto.randomUUID()}`;
  }
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

