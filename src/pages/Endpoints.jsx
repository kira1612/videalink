import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Webhook,
  Plus,
  Play,
  Mail,
  MessageSquare,
  Globe,
  Send,
  Lock,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { endpointsApi, devicesApi } from '../services/api';
import { useBillingQuota } from '../hooks/useBillingQuota';
import QuotaNoticeBanner, { promptQuotaUpgrade } from '../components/Billing/QuotaNoticeBanner';
import TelegramMessageEditor, {
  DEFAULT_TELEGRAM_TEMPLATE,
  OPERATOR_OPTIONS,
  COOLDOWN_OPTIONS,
  TelegramSetupGuide,
} from '../components/Telegram/TelegramMessageEditor';
import EmailMessageEditor, {
  DEFAULT_EMAIL_SUBJECT,
  DEFAULT_EMAIL_TEMPLATE,
} from '../components/Email/EmailMessageEditor';

const typeIcons = {
  EMAIL: Mail,
  HTTP: Globe,
  SLACK: MessageSquare,
  TELEGRAM: Send,
  MQTT: Webhook,
};

function formatDate(iso) {
  if (!iso) return 'Belum pernah';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

const inputStyle = {
  backgroundColor: 'rgb(var(--surface-950) / 0.65)',
  borderColor: 'rgb(var(--surface-700) / 0.65)',
  color: 'rgb(var(--surface-50))',
};

export default function Endpoints() {
  const navigate = useNavigate();
  const { refreshQuota, getResourceQuota } = useBillingQuota();
  const endpointQuota = getResourceQuota('endpoints');

  const [endpoints, setEndpoints] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telegramStatus, setTelegramStatus] = useState({ has_default_bot_token: false });
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [triggeringId, setTriggeringId] = useState(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all | telegram | email | active

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TELEGRAM');
  const [deviceId, setDeviceId] = useState('');

  // TELEGRAM & EMAIL shared alert config
  const [chatId, setChatId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [clearBotToken, setClearBotToken] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertField, setAlertField] = useState('temperature');
  const [alertOperator, setAlertOperator] = useState('>');
  const [alertThreshold, setAlertThreshold] = useState('35');
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TELEGRAM_TEMPLATE);

  // Email specific
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(DEFAULT_EMAIL_SUBJECT);
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);

  // Other endpoint type configs
  const [httpMethod, setHttpMethod] = useState('POST');
  const [httpUrl, setHttpUrl] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [mqttTopic, setMqttTopic] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const fetchAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [epRes, devRes, tgRes, mailRes] = await Promise.all([
        endpointsApi.list(),
        devicesApi.list(),
        endpointsApi.telegramStatus().catch(() => ({ data: { has_default_bot_token: false } })),
        endpointsApi.emailStatus().catch(() => ({ data: null })),
      ]);
      setEndpoints(epRes.data);
      setDevices(devRes.data);
      setTelegramStatus(tgRes.data || { has_default_bot_token: false });
      setEmailStatus(mailRes.data || null);
      refreshQuota();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Gagal memuat daftar endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDevice = useMemo(
    () => devices.find((d) => String(d.id) === String(deviceId)) || null,
    [devices, deviceId]
  );

  const availableFields = useMemo(() => {
    if (!selectedDevice?.data_buckets) return [];
    const set = new Set();
    selectedDevice.data_buckets.forEach((b) => {
      if (Array.isArray(b.fields)) {
        b.fields.forEach((f) => f && set.add(f));
      }
    });
    return Array.from(set);
  }, [selectedDevice]);

  const filteredEndpoints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return endpoints.filter((ep) => {
      if (filterTab === 'telegram' && ep.type !== 'TELEGRAM') return false;
      if (filterTab === 'email' && ep.type !== 'EMAIL') return false;
      if (filterTab === 'active' && !ep.enabled) return false;
      if (!q) return true;
      const cfg = ep.config || {};
      return (
        (ep.name || '').toLowerCase().includes(q) ||
        (ep.device || '').toLowerCase().includes(q) ||
        (ep.type || '').toLowerCase().includes(q) ||
        String(cfg.chat_id || cfg.chatId || '').toLowerCase().includes(q) ||
        String(cfg.email || '').toLowerCase().includes(q) ||
        String(cfg.field || '').toLowerCase().includes(q)
      );
    });
  }, [endpoints, search, filterTab]);

  const isTokenRequired =
    type === 'TELEGRAM' &&
    !telegramStatus.has_default_bot_token &&
    (!editingEndpoint?.config?.has_bot_token || clearBotToken);

  const openModal = (endpoint = null) => {
    setFormFeedback(null);
    setClearBotToken(false);

    if (endpoint) {
      const cfg = endpoint.config || {};
      setEditingEndpoint(endpoint);
      setName(endpoint.name || '');
      setDescription(endpoint.description || '');
      setType(endpoint.type || 'TELEGRAM');
      setDeviceId(String(endpoint.device_id || ''));

      setChatId(cfg.chat_id || cfg.chatId || '');
      setBotToken('');
      setAlertEnabled(cfg.alert_enabled !== undefined ? Boolean(cfg.alert_enabled) : true);
      setAlertField(cfg.field || 'temperature');
      setAlertOperator(cfg.operator || '>');
      setAlertThreshold(cfg.threshold !== undefined && cfg.threshold !== null ? String(cfg.threshold) : '35');
      setCooldownSeconds(cfg.cooldown_seconds !== undefined ? Number(cfg.cooldown_seconds) : 60);
      setMessageTemplate(cfg.message_template || DEFAULT_TELEGRAM_TEMPLATE);

      setHttpMethod(cfg.method || 'POST');
      setHttpUrl(cfg.url || '');
      setEmailTo(cfg.email || '');
      setEmailSubject(cfg.subject || DEFAULT_EMAIL_SUBJECT);
      setEmailTemplate(endpoint.type === 'EMAIL' ? (cfg.message_template || DEFAULT_EMAIL_TEMPLATE) : DEFAULT_EMAIL_TEMPLATE);
      setSlackChannel(cfg.channel || '');
      setMqttTopic(cfg.topic || '');
    } else {
      if (endpointQuota.blocked) {
        promptQuotaUpgrade({
          navigate,
          resourceLabel: endpointQuota.label,
          planName: endpointQuota.planName,
          current: endpointQuota.current,
          limit: endpointQuota.limit,
        });
        return;
      }

      const defaultDev = devices[0];
      const defaultField = defaultDev?.data_buckets?.[0]?.fields?.[0] || 'temperature';

      setEditingEndpoint(null);
      setName('');
      setDescription('');
      setType('TELEGRAM');
      setDeviceId(defaultDev ? String(defaultDev.id) : '');
      setChatId('');
      setBotToken('');
      setAlertEnabled(true);
      setAlertField(defaultField);
      setAlertOperator('>');
      setAlertThreshold('35');
      setCooldownSeconds(60);
      setMessageTemplate(DEFAULT_TELEGRAM_TEMPLATE);
      setHttpMethod('POST');
      setHttpUrl('');
      setEmailTo('');
      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
      setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
      setSlackChannel('');
      setMqttTopic('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormFeedback(null);
  };

  const buildConfigPayload = () => {
    if (type === 'TELEGRAM') {
      const cfg = {
        chat_id: chatId.trim(),
        alert_enabled: alertEnabled,
        field: alertField.trim(),
        operator: alertOperator,
        threshold: alertThreshold,
        cooldown_seconds: Number(cooldownSeconds) || 0,
        message_template: messageTemplate.trim() || DEFAULT_TELEGRAM_TEMPLATE,
      };
      if (botToken.trim()) cfg.bot_token = botToken.trim();
      if (clearBotToken) cfg.clear_bot_token = true;
      return cfg;
    }
    if (type === 'HTTP') return { method: httpMethod, url: httpUrl.trim() };
    if (type === 'EMAIL') {
      return {
        email: emailTo.trim(),
        subject: emailSubject.trim() || DEFAULT_EMAIL_SUBJECT,
        message_template: emailTemplate.trim() || DEFAULT_EMAIL_TEMPLATE,
        alert_enabled: alertEnabled,
        field: alertField.trim(),
        operator: alertOperator,
        threshold: alertThreshold,
        cooldown_seconds: Number(cooldownSeconds) || 0,
      };
    }
    if (type === 'SLACK') return { channel: slackChannel.trim() };
    if (type === 'MQTT') return { topic: mqttTopic.trim() };
    return {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!deviceId) {
      setFormFeedback({ type: 'error', text: 'Pilih perangkat sumber terlebih dahulu.' });
      return;
    }
    if (type === 'TELEGRAM' && !chatId.trim()) {
      setFormFeedback({ type: 'error', text: 'Chat ID Telegram wajib diisi.' });
      return;
    }
    if (isTokenRequired && !botToken.trim()) {
      setFormFeedback({
        type: 'error',
        text: 'Bot Token Telegram wajib diisi (buat bot Anda melalui @BotFather).',
      });
      return;
    }
    if (type === 'EMAIL' && !emailTo.trim()) {
      setFormFeedback({ type: 'error', text: 'Alamat email penerima wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type,
        device_id: Number(deviceId),
        config: buildConfigPayload(),
      };

      if (editingEndpoint) {
        await endpointsApi.update(editingEndpoint.id, payload);
      } else {
        await endpointsApi.create(payload);
      }

      closeModal();
      await fetchAll();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: editingEndpoint ? 'Endpoint diperbarui' : 'Endpoint ditambahkan',
        showConfirmButton: false,
        timer: 2200,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan endpoint. Periksa kembali isian Anda.';
      setFormFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestTelegramInModal = async () => {
    setFormFeedback(null);
    if (!chatId.trim()) {
      setFormFeedback({ type: 'error', text: 'Masukkan Chat ID Telegram terlebih dahulu.' });
      return;
    }
    if (isTokenRequired && !botToken.trim()) {
      setFormFeedback({ type: 'error', text: 'Masukkan Bot Token Telegram terlebih dahulu.' });
      return;
    }

    setIsTesting(true);
    try {
      const res = await endpointsApi.testTelegram({
        endpoint_id: editingEndpoint?.id || undefined,
        device_id: deviceId ? Number(deviceId) : undefined,
        chat_id: chatId.trim(),
        bot_token: botToken.trim() || undefined,
        message_template: messageTemplate.trim() || DEFAULT_TELEGRAM_TEMPLATE,
        field: alertField.trim() || 'temperature',
        operator: alertOperator,
        threshold: alertThreshold || '35',
        rule: name.trim() || 'Tes Alert VideaLink',
      });
      setFormFeedback({
        type: 'success',
        text: res.data?.message || 'Pesan tes Telegram berhasil dikirim.',
      });
    } catch (err) {
      setFormFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengirim pesan tes ke Telegram.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestEmailInModal = async () => {
    setFormFeedback(null);
    if (!emailTo.trim()) {
      setFormFeedback({ type: 'error', text: 'Masukkan alamat email penerima terlebih dahulu.' });
      return;
    }

    setIsTesting(true);
    try {
      const res = await endpointsApi.testEmail({
        endpoint_id: editingEndpoint?.id || undefined,
        device_id: deviceId ? Number(deviceId) : undefined,
        email: emailTo.trim(),
        subject: emailSubject.trim() || DEFAULT_EMAIL_SUBJECT,
        message_template: emailTemplate.trim() || DEFAULT_EMAIL_TEMPLATE,
        field: alertField.trim() || 'temperature',
        operator: alertOperator,
        threshold: alertThreshold || '35',
        rule: name.trim() || 'Tes Alert VideaLink',
      });
      setFormFeedback({
        type: 'success',
        text: res.data?.message || 'Email tes berhasil diproses.',
      });
    } catch (err) {
      setFormFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengirim email tes.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async (endpoint) => {
    try {
      await endpointsApi.toggle(endpoint.id);
      setEndpoints((prev) =>
        prev.map((e) => (e.id === endpoint.id ? { ...e, enabled: !e.enabled } : e))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrigger = async (endpoint) => {
    if (!endpoint.enabled || triggeringId === endpoint.id) return;
    setTriggeringId(endpoint.id);
    try {
      const res = await endpointsApi.trigger(endpoint.id);
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === endpoint.id
            ? {
                ...e,
                trigger_count: res.data.trigger_count,
                last_triggered: res.data.last_triggered,
              }
            : e
        )
      );
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: res.data?.message || 'Tes notifikasi terkirim',
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Alert',
        text: err.response?.data?.message || 'Terjadi kesalahan saat memicu endpoint.',
      });
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = async (endpoint) => {
    const result = await Swal.fire({
      title: `Hapus "${endpoint.name}"?`,
      text: 'Aturan notifikasi pada endpoint ini akan berhenti permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await endpointsApi.delete(endpoint.id);
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = endpoints.filter((e) => e.enabled).length;
  const telegramCount = endpoints.filter((e) => e.type === 'TELEGRAM').length;
  const emailCount = endpoints.filter((e) => e.type === 'EMAIL').length;
  const totalTriggers = endpoints.reduce((acc, e) => acc + (e.trigger_count || 0), 0);
  const isTwoColModal = type === 'TELEGRAM' || type === 'EMAIL';

  return (
    <div className="space-y-5 pb-8 max-w-6xl mx-auto">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
          >
            Endpoints & Notifikasi
          </h1>
          <p
            className="text-xs"
            style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
          >
            Hubungkan bot Telegram, webhook, dan aturan ambang batas data sensor secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="self-start sm:self-auto min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
          style={{
            backgroundColor: endpointQuota.blocked ? 'rgb(225 29 72)' : 'rgb(var(--primary-500))',
          }}
        >
          {endpointQuota.blocked ? <Lock size={14} /> : <Plus size={15} />}
          {endpointQuota.blocked ? 'Kuota Penuh · Upgrade' : 'Tambah Endpoint'}
        </button>
      </div>

      <QuotaNoticeBanner quota={endpointQuota} />

      {/* Quiet Single-Row Metric Strip */}
      <div className="ops-surface grid grid-cols-3 divide-x" style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}>
        <div className="px-4 py-3.5" style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}>
          <p className="text-[11px] font-medium" style={{ color: 'rgb(var(--surface-400))' }}>
            Total Endpoint
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums" style={{ color: 'rgb(var(--surface-50))' }}>
              {endpoints.length}
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: 'rgb(var(--surface-400))' }}>
              {telegramCount} Telegram · {emailCount} Email
            </span>
          </div>
        </div>

        <div className="px-4 py-3.5" style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}>
          <p className="text-[11px] font-medium" style={{ color: 'rgb(var(--surface-400))' }}>
            Aktif Memantau
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums" style={{ color: 'rgb(var(--surface-50))' }}>
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-400">online</span>
          </div>
        </div>

        <div className="px-4 py-3.5" style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}>
          <p className="text-[11px] font-medium" style={{ color: 'rgb(var(--surface-400))' }}>
            Alert Terkirim
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums" style={{ color: 'rgb(var(--surface-50))' }}>
              {totalTriggers.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px]" style={{ color: 'rgb(var(--surface-400))' }}>
              event
            </span>
          </div>
        </div>
      </div>

      {/* Error Recovery */}
      {loadError && (
        <div
          role="alert"
          className="ops-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderColor: 'rgb(244 63 94 / 0.45)' }}
        >
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle size={15} className="shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 self-start sm:self-auto"
            style={{ backgroundColor: 'rgb(var(--primary-500))' }}
          >
            <RefreshCw size={13} /> Muat Ulang
          </button>
        </div>
      )}

      {/* Unified Operational List Surface */}
      <div className="ops-surface overflow-hidden">
        {/* Toolbar */}
        <div
          className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
        >
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgb(var(--surface-400))' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, perangkat, atau Chat ID..."
              aria-label="Cari endpoint"
              className="w-full min-h-[38px] pl-9 pr-8 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.4)',
                borderColor: 'rgb(var(--surface-700) / 0.6)',
                color: 'rgb(var(--surface-50))',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center"
                style={{ color: 'rgb(var(--surface-400))' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Filter Endpoint"
            className="inline-flex p-0.5 rounded-lg border self-start md:self-auto"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.45)',
              borderColor: 'rgb(var(--surface-700) / 0.55)',
            }}
          >
            {[
              { id: 'all', label: `Semua (${endpoints.length})` },
              { id: 'telegram', label: `Telegram (${telegramCount})` },
              { id: 'email', label: `Email (${emailCount})` },
              { id: 'active', label: `Aktif (${activeCount})` },
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className="px-2.5 py-1.5 rounded-md text-[11px] font-medium tabular-nums transition-colors duration-150"
                  style={{
                    backgroundColor: active ? 'rgb(var(--surface-700))' : 'transparent',
                    color: active ? 'rgb(var(--surface-50))' : 'rgb(var(--surface-400))',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="divide-y" style={{ borderColor: 'rgb(var(--surface-700) / 0.4)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1 max-w-md">
                  <div className="h-3.5 w-44 rounded" style={{ backgroundColor: 'rgb(var(--surface-700) / 0.6)' }} />
                  <div className="h-3 w-72 rounded" style={{ backgroundColor: 'rgb(var(--surface-800) / 0.8)' }} />
                </div>
                <div className="h-8 w-24 rounded-lg" style={{ backgroundColor: 'rgb(var(--surface-800) / 0.8)' }} />
              </div>
            ))}
          </div>
        ) : filteredEndpoints.length === 0 ? (
          /* Empty State */
          <div className="py-14 px-6 text-center space-y-3">
            <div
              className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center border"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                borderColor: 'rgb(var(--surface-700) / 0.6)',
                color: 'rgb(var(--primary-400))',
              }}
            >
              <Send size={17} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold" style={{ color: 'rgb(var(--surface-100))' }}>
                {endpoints.length === 0 ? 'Belum ada endpoint notifikasi' : 'Tidak ada endpoint yang cocok'}
              </p>
              <p
                className="text-xs max-w-sm mx-auto"
                style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
              >
                {endpoints.length === 0
                  ? 'Tambahkan bot Telegram Anda dan atur nilai ambang batas sensor untuk menerima alert otomatis.'
                  : 'Coba ubah kata kunci pencarian atau pilih tab filter lain.'}
              </p>
            </div>
            {endpoints.length === 0 && (
              <button
                type="button"
                onClick={() => openModal()}
                className="min-h-[38px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 mt-1"
                style={{ backgroundColor: 'rgb(var(--primary-500))' }}
              >
                <Plus size={14} /> Tambah Notifikasi Telegram
              </button>
            )}
          </div>
        ) : (
          /* Scannable Operational Rows */
          <div className="divide-y" style={{ borderColor: 'rgb(var(--surface-700) / 0.4)' }}>
            {filteredEndpoints.map((endpoint) => {
              const Icon = typeIcons[endpoint.type] || Webhook;
              const cfg = endpoint.config || {};
              const isTelegram = endpoint.type === 'TELEGRAM';
              const isEmail = endpoint.type === 'EMAIL';
              const displayChatId = cfg.chat_id || cfg.chatId || '-';
              const isBusy = triggeringId === endpoint.id;

              return (
                <div
                  key={endpoint.id}
                  className="px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 transition-colors duration-150 hover:bg-[rgb(var(--surface-800)/0.35)]"
                  style={{ opacity: endpoint.enabled ? 1 : 0.65 }}
                >
                  {/* Left: Identity + Rule + Destination */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: endpoint.enabled
                          ? 'rgb(var(--primary-500) / 0.12)'
                          : 'rgb(var(--surface-800) / 0.5)',
                        borderColor: endpoint.enabled
                          ? 'rgb(var(--primary-500) / 0.3)'
                          : 'rgb(var(--surface-700) / 0.55)',
                        color: endpoint.enabled ? 'rgb(var(--primary-400))' : 'rgb(var(--surface-400))',
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[13.5px] font-semibold truncate"
                          style={{ color: 'rgb(var(--surface-50))' }}
                        >
                          {endpoint.name}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono border"
                          style={{
                            backgroundColor: 'rgb(var(--surface-800) / 0.6)',
                            borderColor: 'rgb(var(--surface-700) / 0.6)',
                            color: 'rgb(var(--surface-300))',
                          }}
                        >
                          {endpoint.type}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'rgb(var(--surface-400))' }}>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              endpoint.enabled ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          {endpoint.enabled ? 'Aktif' : 'Dijeda'}
                        </span>
                      </div>

                      {/* Structured metadata line */}
                      <div
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        <span>
                          Perangkat:{' '}
                          <strong className="font-medium" style={{ color: 'rgb(var(--surface-200))' }}>
                            {endpoint.device}
                          </strong>
                        </span>

                        {isTelegram && (
                          <span className="font-mono text-[11.5px]">
                            Chat{' '}
                            <span style={{ color: 'rgb(var(--surface-200))' }}>{displayChatId}</span>
                            {cfg.has_bot_token && (
                              <span style={{ color: 'rgb(var(--surface-500))' }}> · {cfg.bot_token_masked}</span>
                            )}
                          </span>
                        )}
                        {endpoint.type === 'HTTP' && (
                          <span className="font-mono text-[11.5px] truncate max-w-xs">
                            {cfg.method || 'POST'} {cfg.url || '-'}
                          </span>
                        )}
                        {endpoint.type === 'EMAIL' && <span className="font-mono text-[11.5px]">{cfg.email || '-'}</span>}
                        {endpoint.type === 'SLACK' && <span className="font-mono text-[11.5px]">{cfg.channel || '-'}</span>}
                        {endpoint.type === 'MQTT' && <span className="font-mono text-[11.5px]">{cfg.topic || '-'}</span>}

                        {(isTelegram || isEmail) && cfg.alert_enabled && cfg.field && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border"
                            style={{
                              backgroundColor: 'rgb(var(--primary-500) / 0.1)',
                              borderColor: 'rgb(var(--primary-500) / 0.25)',
                              color: 'rgb(var(--primary-300))',
                            }}
                          >
                            IF {cfg.field} {cfg.operator || '>'} {cfg.threshold}
                            {Number(cfg.cooldown_seconds) > 0 && ` · ${cfg.cooldown_seconds}d`}
                          </span>
                        )}
                      </div>

                      {isTelegram && cfg.message_template && (
                        <p
                          className="text-[11px] font-mono truncate max-w-2xl"
                          style={{ color: 'rgb(var(--surface-500))' }}
                        >
                          {cfg.message_template.replace(/\n/g, ' ↵ ')}
                        </p>
                      )}
                      {isEmail && (cfg.subject || cfg.message_template) && (
                        <p
                          className="text-[11px] font-mono truncate max-w-2xl"
                          style={{ color: 'rgb(var(--surface-500))' }}
                        >
                          {cfg.subject || cfg.message_template.replace(/\n/g, ' ↵ ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Counters + Controls */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pl-12 lg:pl-0">
                    <div className="text-left lg:text-right mr-1">
                      <p
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: 'rgb(var(--surface-200))' }}
                      >
                        {(endpoint.trigger_count || 0).toLocaleString('id-ID')} terkirim
                      </p>
                      <p className="text-[11px] tabular-nums" style={{ color: 'rgb(var(--surface-500))' }}>
                        {formatDate(endpoint.last_triggered)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTrigger(endpoint)}
                        disabled={!endpoint.enabled || isBusy}
                        className="min-h-[34px] px-2.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-[background-color,border-color,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                          borderColor: 'rgb(var(--surface-700) / 0.65)',
                          color: 'rgb(var(--surface-100))',
                        }}
                      >
                        {isBusy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isTelegram ? (
                          <Send size={11} style={{ color: 'rgb(var(--primary-400))' }} />
                        ) : isEmail ? (
                          <Mail size={11} style={{ color: 'rgb(var(--primary-400))' }} />
                        ) : (
                          <Play size={11} />
                        )}
                        Test
                      </button>

                      <button
                        type="button"
                        onClick={() => openModal(endpoint)}
                        aria-label={`Edit ${endpoint.name}`}
                        title="Edit"
                        className="w-[34px] h-[34px] rounded-lg border flex items-center justify-center transition-colors duration-150 hover:border-[rgb(var(--primary-500)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.35)',
                          borderColor: 'rgb(var(--surface-700) / 0.55)',
                          color: 'rgb(var(--surface-300))',
                        }}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(endpoint)}
                        aria-label={`Hapus ${endpoint.name}`}
                        title="Hapus"
                        className="w-[34px] h-[34px] rounded-lg border flex items-center justify-center transition-colors duration-150 hover:text-rose-400 hover:border-rose-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.35)',
                          borderColor: 'rgb(var(--surface-700) / 0.55)',
                          color: 'rgb(var(--surface-400))',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={endpoint.enabled}
                        aria-label={endpoint.enabled ? 'Nonaktifkan endpoint' : 'Aktifkan endpoint'}
                        onClick={() => handleToggle(endpoint)}
                        className="w-10 h-6 rounded-full p-0.5 transition-colors duration-150 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                        style={{
                          backgroundColor: endpoint.enabled
                            ? 'rgb(var(--primary-500))'
                            : 'rgb(var(--surface-700))',
                        }}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                            endpoint.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT STUDIO MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="endpoint-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto"
        >
          <div
            className="w-full rounded-2xl border shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
            style={{
              maxWidth: isTwoColModal ? '56rem' : '38rem',
              backgroundColor: 'rgb(var(--surface-900))',
              borderColor: 'rgb(var(--surface-700) / 0.65)',
            }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
            >
              <div>
                <h2
                  id="endpoint-modal-title"
                  className="text-base font-bold tracking-tight"
                  style={{ color: 'rgb(var(--surface-50))' }}
                >
                  {editingEndpoint ? 'Edit Endpoint' : 'Endpoint Baru'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
                  Konfigurasi integrasi, ambang batas data sensor, dan format pesan alert.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup modal"
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-150"
                style={{
                  backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                  borderColor: 'rgb(var(--surface-700) / 0.6)',
                  color: 'rgb(var(--surface-300))',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <form id="endpoint-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div
                className={`p-6 grid grid-cols-1 gap-6 ${
                  isTwoColModal ? 'lg:grid-cols-12' : ''
                }`}
              >
                {/* Left Column: Config & Threshold */}
                <div className={isTwoColModal ? 'lg:col-span-6 space-y-5' : 'space-y-5'}>
                  {/* Section 1: Identity */}
                  <div className="space-y-3.5">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    >
                      Informasi Dasar
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Nama Endpoint <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alert Suhu Ruang Server"
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Tipe Kanal
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                          style={inputStyle}
                        >
                          <option value="TELEGRAM">Telegram Bot</option>
                          <option value="HTTP">HTTP Webhook</option>
                          <option value="EMAIL">Email</option>
                          <option value="SLACK">Slack</option>
                          <option value="MQTT">MQTT Forward</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Perangkat Sumber <span className="text-rose-400">*</span>
                        </label>
                        <select
                          required
                          value={deviceId}
                          onChange={(e) => setDeviceId(e.target.value)}
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                          style={inputStyle}
                        >
                          <option value="">Pilih Perangkat...</option>
                          {devices.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Catatan
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Opsional"
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Credentials */}
                  {type === 'TELEGRAM' && (
                    <>
                      <div
                        className="pt-4 border-t space-y-3.5"
                        style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                      >
                        <p
                          className="text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: 'rgb(var(--surface-400))' }}
                        >
                          Kredensial Telegram
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                              Chat ID <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={chatId}
                              onChange={(e) => setChatId(e.target.value)}
                              placeholder="5404451013 atau -100..."
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                              Bot Token {isTokenRequired && <span className="text-rose-400">*</span>}
                            </label>
                            <input
                              type="password"
                              required={isTokenRequired}
                              value={botToken}
                              onChange={(e) => {
                                setBotToken(e.target.value);
                                if (e.target.value) setClearBotToken(false);
                              }}
                              placeholder={
                                editingEndpoint?.config?.has_bot_token && !clearBotToken
                                  ? editingEndpoint.config.bot_token_masked
                                  : '123456789:AAH...'
                              }
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        {editingEndpoint?.config?.has_bot_token && !clearBotToken && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400">
                              <ShieldCheck size={13} /> Token terenkripsi di server ({editingEndpoint.config.bot_token_masked})
                            </span>
                            <button
                              type="button"
                              onClick={() => setClearBotToken(true)}
                              className="text-rose-400 hover:underline font-medium"
                            >
                              Ganti token
                            </button>
                          </div>
                        )}

                      <TelegramSetupGuide />
                      </div>
                    </>
                  )}

                  {type === 'EMAIL' && (
                    <div
                      className="pt-4 border-t space-y-2"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        Penerima Email
                      </p>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Alamat Email Tujuan <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          placeholder="admin@domain.com, teknisi@domain.com"
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                          style={inputStyle}
                        />
                        <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--surface-500))' }}>
                          Bisa lebih dari satu email, pisahkan dengan tanda koma (maksimal 10 penerima).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shared Section 3: Threshold Trigger for TELEGRAM & EMAIL */}
                  {(type === 'TELEGRAM' || type === 'EMAIL') && (
                    <div
                      className="pt-4 border-t space-y-3.5"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: 'rgb(var(--surface-400))' }}
                          >
                            Alert Ambang Batas Sensor
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--surface-500))' }}>
                            Kirim otomatis ketika data telemetri memenuhi kondisi.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={alertEnabled}
                          onClick={() => setAlertEnabled((v) => !v)}
                          className="w-10 h-6 rounded-full p-0.5 transition-colors duration-150 flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                          style={{
                            backgroundColor: alertEnabled
                              ? 'rgb(var(--primary-500))'
                              : 'rgb(var(--surface-700))',
                          }}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                              alertEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {alertEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Parameter / Field
                            </label>
                            <input
                              type="text"
                              list="endpoint-sensor-fields"
                              required={alertEnabled}
                              value={alertField}
                              onChange={(e) => setAlertField(e.target.value)}
                              placeholder="temperature"
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                              style={inputStyle}
                            />
                            <datalist id="endpoint-sensor-fields">
                              {availableFields.map((f) => (
                                <option key={f} value={f} />
                              ))}
                              <option value="temperature" />
                              <option value="humidity" />
                              <option value="voltage" />
                              <option value="current" />
                              <option value="gas" />
                            </datalist>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Kondisi
                            </label>
                            <select
                              value={alertOperator}
                              onChange={(e) => setAlertOperator(e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border px-2.5 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                              style={inputStyle}
                            >
                              {OPERATOR_OPTIONS.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Nilai Batas (Threshold)
                            </label>
                            <input
                              type="text"
                              required={alertEnabled}
                              value={alertThreshold}
                              onChange={(e) => setAlertThreshold(e.target.value)}
                              placeholder="35"
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono tabular-nums outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Jeda Anti-Spam
                            </label>
                            <select
                              value={cooldownSeconds}
                              onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                              className="w-full min-h-[38px] rounded-lg border px-2.5 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                              style={inputStyle}
                            >
                              {COOLDOWN_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other types */}
                  {type === 'HTTP' && (
                    <div
                      className="pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-3"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Method
                        </label>
                        <select
                          value={httpMethod}
                          onChange={(e) => setHttpMethod(e.target.value)}
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none"
                          style={inputStyle}
                        >
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          required
                          value={httpUrl}
                          onChange={(e) => setHttpUrl(e.target.value)}
                          placeholder="https://example.com/webhook"
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  )}

                  {type === 'SLACK' && (
                    <div
                      className="pt-4 border-t"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                        Channel Slack
                      </label>
                      <input
                        type="text"
                        required
                        value={slackChannel}
                        onChange={(e) => setSlackChannel(e.target.value)}
                        placeholder="#iot-alerts"
                        className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none"
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {type === 'MQTT' && (
                    <div
                      className="pt-4 border-t"
                      style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                    >
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                        Target MQTT Topic
                      </label>
                      <input
                        type="text"
                        required
                        value={mqttTopic}
                        onChange={(e) => setMqttTopic(e.target.value)}
                        placeholder="videalink/alerts/server-room"
                        className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: Telegram or Email Message Composer & Live Preview */}
                {type === 'TELEGRAM' && (
                  <div
                    className="lg:col-span-6 lg:border-l lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0"
                    style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                  >
                    <TelegramMessageEditor
                      value={messageTemplate}
                      onChange={setMessageTemplate}
                      previewContext={{
                        device: selectedDevice?.name || 'ESP32 Sensor Node',
                        location: selectedDevice?.location || 'Ruang Server',
                        field: alertField || 'temperature',
                        operator: alertOperator,
                        threshold: alertThreshold || '35',
                        rule: name || 'Alert Sensor VideaLink',
                      }}
                    />
                  </div>
                )}

                {type === 'EMAIL' && (
                  <div
                    className="lg:col-span-6 lg:border-l lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0"
                    style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                  >
                    <EmailMessageEditor
                      subject={emailSubject}
                      onSubjectChange={setEmailSubject}
                      value={emailTemplate}
                      onChange={setEmailTemplate}
                      recipient={emailTo}
                      emailStatus={emailStatus}
                      previewContext={{
                        device: selectedDevice?.name || 'ESP32 Sensor Node',
                        location: selectedDevice?.location || 'Ruang Server',
                        field: alertField || 'temperature',
                        operator: alertOperator,
                        threshold: alertThreshold || '35',
                        rule: name || 'Alert Sensor VideaLink',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Inline Feedback Banner */}
              {formFeedback && (
                <div className="px-6 pb-4">
                  <div
                    role="status"
                    className={`flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-xs border ${
                      formFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {formFeedback.type === 'success' ? (
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{formFeedback.text}</span>
                  </div>
                </div>
              )}
            </form>

            {/* Sticky Modal Footer */}
            <div
              className="px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0"
              style={{
                backgroundColor: 'rgb(var(--surface-950) / 0.35)',
                borderColor: 'rgb(var(--surface-700) / 0.5)',
              }}
            >
              <div>
                {type === 'TELEGRAM' && (
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestTelegramInModal}
                    className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                      borderColor: 'rgb(var(--surface-700) / 0.7)',
                      color: 'rgb(var(--surface-100))',
                    }}
                  >
                    {isTesting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} style={{ color: 'rgb(var(--primary-400))' }} />
                    )}
                    Test Kirim Telegram
                  </button>
                )}
                {type === 'EMAIL' && (
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestEmailInModal}
                    className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                      borderColor: 'rgb(var(--surface-700) / 0.7)',
                      color: 'rgb(var(--surface-100))',
                    }}
                  >
                    {isTesting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Mail size={13} style={{ color: 'rgb(var(--primary-400))' }} />
                    )}
                    Test Kirim Email
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[38px] px-4 rounded-lg text-xs font-medium transition-colors duration-150"
                  style={{ color: 'rgb(var(--surface-300))' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="endpoint-form"
                  disabled={isSubmitting}
                  className="min-h-[38px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(var(--primary-500))' }}
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {editingEndpoint ? 'Simpan Perubahan' : 'Simpan Endpoint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
