import React, { useState, useEffect, useMemo } from 'react';
import { automationsApi, devicesApi, endpointsApi } from '../services/api';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Activity,
  ArrowRight,
  X,
  Loader2,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import Swal from 'sweetalert2';
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

const inputStyle = {
  backgroundColor: 'rgb(var(--surface-950) / 0.65)',
  borderColor: 'rgb(var(--surface-700) / 0.65)',
  color: 'rgb(var(--surface-50))',
};

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telegramEndpoints, setTelegramEndpoints] = useState([]);
  const [emailEndpoints, setEmailEndpoints] = useState([]);
  const [telegramStatus, setTelegramStatus] = useState({ has_default_bot_token: false });
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [testingAutoId, setTestingAutoId] = useState(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all | telegram | email | device

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingModal, setIsTestingModal] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);
  const [editingAuto, setEditingAuto] = useState(null);

  // Condition Form State
  const [name, setName] = useState('');
  const [conditionType, setConditionType] = useState('sensor');
  const [conditionTime, setConditionTime] = useState('18:00');
  const [conditionDevice, setConditionDevice] = useState('');
  const [conditionField, setConditionField] = useState('temperature');
  const [conditionOperator, setConditionOperator] = useState('>');
  const [conditionValue, setConditionValue] = useState('35');
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  // Action Form State
  const [actionType, setActionType] = useState('telegram'); // telegram | email | device
  const [actionDevice, setActionDevice] = useState('');
  const [actionCommand, setActionCommand] = useState('turn_on');

  // Telegram Action State
  const [telegramTargetMode, setTelegramTargetMode] = useState('manual');
  const [selectedEndpointId, setSelectedEndpointId] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [clearBotToken, setClearBotToken] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TELEGRAM_TEMPLATE);

  // Email Action State
  const [emailTargetMode, setEmailTargetMode] = useState('manual'); // endpoint | manual
  const [selectedEmailEndpointId, setSelectedEmailEndpointId] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(DEFAULT_EMAIL_SUBJECT);
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [autoRes, devRes, epRes, tgRes, mailRes] = await Promise.all([
        automationsApi.list(),
        devicesApi.list(),
        endpointsApi.list().catch(() => ({ data: [] })),
        endpointsApi.telegramStatus().catch(() => ({ data: { has_default_bot_token: false } })),
        endpointsApi.emailStatus().catch(() => ({ data: null })),
      ]);
      const allEps = epRes.data || [];
      setAutomations(autoRes.data);
      setDevices(devRes.data);
      setTelegramEndpoints(allEps.filter((ep) => ep.type === 'TELEGRAM'));
      setEmailEndpoints(allEps.filter((ep) => ep.type === 'EMAIL'));
      setTelegramStatus(tgRes.data || { has_default_bot_token: false });
      setEmailStatus(mailRes.data || null);
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Gagal memuat daftar aturan otomasi.');
    } finally {
      setLoading(false);
    }
  };

  const selectedConditionDevice = useMemo(
    () => devices.find((d) => String(d.id) === String(conditionDevice)) || null,
    [devices, conditionDevice]
  );

  const availableFields = useMemo(() => {
    if (!selectedConditionDevice?.data_buckets) return [];
    const set = new Set();
    selectedConditionDevice.data_buckets.forEach((b) => {
      if (Array.isArray(b.fields)) {
        b.fields.forEach((f) => f && set.add(f));
      }
    });
    return Array.from(set);
  }, [selectedConditionDevice]);

  const filteredAutomations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return automations.filter((auto) => {
      const actType = auto.action?.type || 'device';
      if (filterTab === 'telegram' && actType !== 'telegram') return false;
      if (filterTab === 'email' && actType !== 'email') return false;
      if (filterTab === 'device' && actType !== 'device') return false;
      if (!q) return true;
      return (
        (auto.name || '').toLowerCase().includes(q) ||
        String(auto.condition?.field || '').toLowerCase().includes(q) ||
        String(auto.action?.chat_id || '').toLowerCase().includes(q) ||
        String(auto.action?.email || '').toLowerCase().includes(q)
      );
    });
  }, [automations, search, filterTab]);

  const manualTokenRequired =
    actionType === 'telegram' &&
    telegramTargetMode === 'manual' &&
    !telegramStatus.has_default_bot_token &&
    (!editingAuto?.action?.has_bot_token || clearBotToken);

  const isTwoColModal = actionType === 'telegram' || actionType === 'email';

  const openModal = (auto = null) => {
    setFormFeedback(null);
    setClearBotToken(false);

    if (auto) {
      setEditingAuto(auto);
      setName(auto.name || '');

      const cond = auto.condition || {};
      if (cond.type === 'time') {
        setConditionType('time');
        setConditionTime(cond.value || '18:00');
        setConditionDevice(devices[0] ? String(devices[0].id) : '');
        setConditionField('temperature');
        setConditionOperator('>');
        setConditionValue('35');
        setCooldownSeconds(60);
      } else {
        setConditionType('sensor');
        setConditionDevice(cond.device_id ? String(cond.device_id) : '');
        setConditionField(cond.field || 'temperature');
        setConditionOperator(cond.operator || '>');
        setConditionValue(cond.value !== undefined && cond.value !== null ? String(cond.value) : '');
        setCooldownSeconds(cond.cooldown_seconds !== undefined ? Number(cond.cooldown_seconds) : 60);
      }

      const act = auto.action || {};
      if (act.type === 'telegram') {
        setActionType('telegram');
        if (act.endpoint_id) {
          setTelegramTargetMode('endpoint');
          setSelectedEndpointId(String(act.endpoint_id));
        } else {
          setTelegramTargetMode('manual');
          setSelectedEndpointId(telegramEndpoints[0] ? String(telegramEndpoints[0].id) : '');
        }
        setTelegramChatId(act.chat_id || act.chatId || '');
        setTelegramBotToken('');
        setMessageTemplate(act.message_template || DEFAULT_TELEGRAM_TEMPLATE);

        setEmailTargetMode(emailEndpoints.length > 0 ? 'endpoint' : 'manual');
        setSelectedEmailEndpointId(emailEndpoints[0] ? String(emailEndpoints[0].id) : '');
        setEmailTo('');
        setEmailSubject(DEFAULT_EMAIL_SUBJECT);
        setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
        setActionDevice(devices[0] ? String(devices[0].id) : '');
        setActionCommand('turn_on');
      } else if (act.type === 'email') {
        setActionType('email');
        if (act.endpoint_id) {
          setEmailTargetMode('endpoint');
          setSelectedEmailEndpointId(String(act.endpoint_id));
        } else {
          setEmailTargetMode('manual');
          setSelectedEmailEndpointId(emailEndpoints[0] ? String(emailEndpoints[0].id) : '');
        }
        setEmailTo(act.email || '');
        setEmailSubject(act.subject || DEFAULT_EMAIL_SUBJECT);
        setEmailTemplate(act.message_template || DEFAULT_EMAIL_TEMPLATE);

        setTelegramTargetMode(telegramEndpoints.length > 0 ? 'endpoint' : 'manual');
        setSelectedEndpointId(telegramEndpoints[0] ? String(telegramEndpoints[0].id) : '');
        setTelegramChatId('');
        setTelegramBotToken('');
        setMessageTemplate(DEFAULT_TELEGRAM_TEMPLATE);
        setActionDevice(devices[0] ? String(devices[0].id) : '');
        setActionCommand('turn_on');
      } else {
        setActionType('device');
        setActionDevice(act.device_id ? String(act.device_id) : '');
        setActionCommand(act.command || 'turn_on');

        setTelegramTargetMode(telegramEndpoints.length > 0 ? 'endpoint' : 'manual');
        setSelectedEndpointId(telegramEndpoints[0] ? String(telegramEndpoints[0].id) : '');
        setTelegramChatId('');
        setTelegramBotToken('');
        setMessageTemplate(DEFAULT_TELEGRAM_TEMPLATE);

        setEmailTargetMode(emailEndpoints.length > 0 ? 'endpoint' : 'manual');
        setSelectedEmailEndpointId(emailEndpoints[0] ? String(emailEndpoints[0].id) : '');
        setEmailTo('');
        setEmailSubject(DEFAULT_EMAIL_SUBJECT);
        setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
      }
    } else {
      const firstDev = devices[0];
      const firstField = firstDev?.data_buckets?.[0]?.fields?.[0] || 'temperature';

      setEditingAuto(null);
      setName('');
      setConditionType('sensor');
      setConditionTime('18:00');
      setConditionDevice(firstDev ? String(firstDev.id) : '');
      setConditionField(firstField);
      setConditionOperator('>');
      setConditionValue('35');
      setCooldownSeconds(60);

      setActionType('telegram');
      setActionDevice(firstDev ? String(firstDev.id) : '');
      setActionCommand('turn_on');

      if (telegramEndpoints.length > 0) {
        setTelegramTargetMode('endpoint');
        setSelectedEndpointId(String(telegramEndpoints[0].id));
      } else {
        setTelegramTargetMode('manual');
        setSelectedEndpointId('');
      }
      setTelegramChatId('');
      setTelegramBotToken('');
      setMessageTemplate(DEFAULT_TELEGRAM_TEMPLATE);

      if (emailEndpoints.length > 0) {
        setEmailTargetMode('endpoint');
        setSelectedEmailEndpointId(String(emailEndpoints[0].id));
      } else {
        setEmailTargetMode('manual');
        setSelectedEmailEndpointId('');
      }
      setEmailTo('');
      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
      setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormFeedback(null);

    if (conditionType === 'sensor' && !conditionDevice) {
      setFormFeedback({ type: 'error', text: 'Pilih perangkat sensor pemicu terlebih dahulu.' });
      return;
    }

    if (actionType === 'telegram') {
      if (telegramTargetMode === 'endpoint' && !selectedEndpointId) {
        setFormFeedback({ type: 'error', text: 'Pilih Endpoint Telegram atau ubah ke mode Chat ID Langsung.' });
        return;
      }
      if (telegramTargetMode === 'manual' && !telegramChatId.trim()) {
        setFormFeedback({ type: 'error', text: 'Chat ID Telegram wajib diisi.' });
        return;
      }
      if (manualTokenRequired && !telegramBotToken.trim()) {
        setFormFeedback({
          type: 'error',
          text: 'Bot Token Telegram wajib diisi pada mode Chat ID langsung.',
        });
        return;
      }
    } else if (actionType === 'email') {
      if (emailTargetMode === 'endpoint' && !selectedEmailEndpointId) {
        setFormFeedback({ type: 'error', text: 'Pilih Endpoint Email atau ubah ke mode Email Langsung.' });
        return;
      }
      if (emailTargetMode === 'manual' && !emailTo.trim()) {
        setFormFeedback({ type: 'error', text: 'Alamat email penerima wajib diisi.' });
        return;
      }
    } else if (!actionDevice) {
      setFormFeedback({ type: 'error', text: 'Pilih target perangkat untuk dikontrol.' });
      return;
    }

    setIsSubmitting(true);

    const conditionPayload =
      conditionType === 'time'
        ? { type: 'time', value: conditionTime }
        : {
            type: 'sensor',
            device_id: Number(conditionDevice),
            field: conditionField.trim(),
            operator: conditionOperator,
            value: conditionValue,
            cooldown_seconds: Number(cooldownSeconds) || 0,
          };

    let actionPayload;
    if (actionType === 'telegram') {
      actionPayload = {
        type: 'telegram',
        message_template: messageTemplate.trim() || DEFAULT_TELEGRAM_TEMPLATE,
      };
      if (telegramTargetMode === 'endpoint') {
        actionPayload.endpoint_id = Number(selectedEndpointId);
      } else {
        actionPayload.chat_id = telegramChatId.trim();
        if (telegramBotToken.trim()) actionPayload.bot_token = telegramBotToken.trim();
        if (clearBotToken) actionPayload.clear_bot_token = true;
      }
    } else if (actionType === 'email') {
      actionPayload = {
        type: 'email',
        subject: emailSubject.trim() || DEFAULT_EMAIL_SUBJECT,
        message_template: emailTemplate.trim() || DEFAULT_EMAIL_TEMPLATE,
      };
      if (emailTargetMode === 'endpoint') {
        actionPayload.endpoint_id = Number(selectedEmailEndpointId);
      } else {
        actionPayload.email = emailTo.trim();
      }
    } else {
      actionPayload = {
        type: 'device',
        device_id: Number(actionDevice),
        command: actionCommand,
      };
    }

    const payload = {
      name: name.trim(),
      is_active: editingAuto ? Boolean(editingAuto.is_active) : true,
      condition: conditionPayload,
      action: actionPayload,
    };

    try {
      if (editingAuto) {
        await automationsApi.update(editingAuto.id, payload);
      } else {
        await automationsApi.create(payload);
      }
      closeModal();
      await fetchData();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: editingAuto ? 'Skenario diperbarui' : 'Skenario dibuat',
        showConfirmButton: false,
        timer: 2200,
      });
    } catch (err) {
      setFormFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan skenario.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestTelegramInModal = async () => {
    setFormFeedback(null);

    if (telegramTargetMode === 'endpoint' && !selectedEndpointId) {
      setFormFeedback({ type: 'error', text: 'Pilih Endpoint Telegram terlebih dahulu.' });
      return;
    }
    if (telegramTargetMode === 'manual' && !telegramChatId.trim()) {
      setFormFeedback({ type: 'error', text: 'Masukkan Chat ID Telegram terlebih dahulu.' });
      return;
    }
    if (manualTokenRequired && !telegramBotToken.trim()) {
      setFormFeedback({ type: 'error', text: 'Masukkan Bot Token Telegram terlebih dahulu.' });
      return;
    }

    setIsTestingModal(true);
    try {
      const res = await endpointsApi.testTelegram({
        endpoint_id: telegramTargetMode === 'endpoint' ? Number(selectedEndpointId) : undefined,
        automation_id: telegramTargetMode === 'manual' && editingAuto?.id && !clearBotToken ? editingAuto.id : undefined,
        device_id: conditionDevice ? Number(conditionDevice) : undefined,
        chat_id: telegramTargetMode === 'manual' ? telegramChatId.trim() : undefined,
        bot_token: telegramTargetMode === 'manual' && telegramBotToken.trim() ? telegramBotToken.trim() : undefined,
        message_template: messageTemplate.trim() || DEFAULT_TELEGRAM_TEMPLATE,
        field: conditionField.trim() || 'temperature',
        operator: conditionOperator,
        threshold: conditionValue || '35',
        rule: name.trim() || 'Tes Skenario Otomasi',
      });

      setFormFeedback({
        type: 'success',
        text: res.data?.message || 'Pesan tes Telegram berhasil dikirim.',
      });
    } catch (err) {
      setFormFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengirim pesan tes Telegram.',
      });
    } finally {
      setIsTestingModal(false);
    }
  };

  const handleTestEmailInModal = async () => {
    setFormFeedback(null);

    if (emailTargetMode === 'endpoint' && !selectedEmailEndpointId) {
      setFormFeedback({ type: 'error', text: 'Pilih Endpoint Email terlebih dahulu.' });
      return;
    }
    if (emailTargetMode === 'manual' && !emailTo.trim()) {
      setFormFeedback({ type: 'error', text: 'Masukkan alamat email penerima terlebih dahulu.' });
      return;
    }

    setIsTestingModal(true);
    try {
      const res = await endpointsApi.testEmail({
        endpoint_id: emailTargetMode === 'endpoint' ? Number(selectedEmailEndpointId) : undefined,
        device_id: conditionDevice ? Number(conditionDevice) : undefined,
        email: emailTargetMode === 'manual' ? emailTo.trim() : undefined,
        subject: emailSubject.trim() || DEFAULT_EMAIL_SUBJECT,
        message_template: emailTemplate.trim() || DEFAULT_EMAIL_TEMPLATE,
        field: conditionField.trim() || 'temperature',
        operator: conditionOperator,
        threshold: conditionValue || '35',
        rule: name.trim() || 'Tes Skenario Otomasi',
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
      setIsTestingModal(false);
    }
  };

  const handleTestCardAutomation = async (auto) => {
    if (testingAutoId === auto.id) return;
    setTestingAutoId(auto.id);
    try {
      const res = await automationsApi.test(auto.id);
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === auto.id
            ? {
                ...a,
                trigger_count: res.data.trigger_count,
                last_triggered_at: res.data.last_triggered_at,
              }
            : a
        )
      );
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: res.data?.message || 'Notifikasi tes terkirim',
        showConfirmButton: false,
        timer: 2600,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Tes Alert',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengirim notifikasi.',
      });
    } finally {
      setTestingAutoId(null);
    }
  };

  const handleDelete = async (auto) => {
    const res = await Swal.fire({
      title: `Hapus "${auto.name}"?`,
      text: 'Aturan otomasi ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (!res.isConfirmed) return;

    try {
      await automationsApi.delete(auto.id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (auto) => {
    try {
      await automationsApi.update(auto.id, { is_active: !auto.is_active });
      setAutomations((prev) =>
        prev.map((a) => (a.id === auto.id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const telegramCount = automations.filter((a) => a.action?.type === 'telegram').length;
  const emailCount = automations.filter((a) => a.action?.type === 'email').length;
  const deviceCount = automations.length - telegramCount - emailCount;

  const selectedEmailEndpoint = useMemo(
    () => emailEndpoints.find((e) => String(e.id) === String(selectedEmailEndpointId)) || null,
    [emailEndpoints, selectedEmailEndpointId]
  );

  const renderConditionSummary = (cond) => {
    if (!cond) return 'Kondisi tidak valid';
    if (cond.type === 'time') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} style={{ color: 'rgb(var(--surface-400))' }} />
          <span>Pukul</span>
          <code className="font-mono font-semibold" style={{ color: 'rgb(var(--surface-100))' }}>
            {cond.value}
          </code>
        </span>
      );
    }
    const dev = devices.find((d) => String(d.id) === String(cond.device_id));
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Activity size={12} style={{ color: 'rgb(var(--primary-400))' }} />
        <span className="font-medium" style={{ color: 'rgb(var(--surface-200))' }}>
          {dev ? dev.name : `Device #${cond.device_id}`}
        </span>
        <code
          className="px-1.5 py-0.5 rounded font-mono text-[11px]"
          style={{
            backgroundColor: 'rgb(var(--primary-500) / 0.12)',
            color: 'rgb(var(--primary-300))',
          }}
        >
          {cond.field || 'value'} {cond.operator} {cond.value}
        </code>
        {Number(cond.cooldown_seconds) > 0 && (
          <span className="text-[11px] tabular-nums" style={{ color: 'rgb(var(--surface-500))' }}>
            · jeda {cond.cooldown_seconds}d
          </span>
        )}
      </span>
    );
  };

  const renderActionSummary = (act) => {
    if (!act) return 'Aksi tidak valid';
    if (act.type === 'telegram') {
      const ep = act.endpoint_id
        ? telegramEndpoints.find((e) => String(e.id) === String(act.endpoint_id))
        : null;
      return (
        <span className="inline-flex items-center gap-1.5">
          <Send size={12} style={{ color: 'rgb(var(--primary-400))' }} />
          <span style={{ color: 'rgb(var(--surface-200))' }}>
            Telegram · {ep ? ep.name : `Chat ${act.chat_id || act.chatId || '-'}`}
          </span>
        </span>
      );
    }
    if (act.type === 'email') {
      const ep = act.endpoint_id
        ? emailEndpoints.find((e) => String(e.id) === String(act.endpoint_id))
        : null;
      return (
        <span className="inline-flex items-center gap-1.5">
          <Mail size={12} style={{ color: 'rgb(var(--primary-400))' }} />
          <span style={{ color: 'rgb(var(--surface-200))' }}>
            Email · {ep ? ep.name : act.email || '-'}
          </span>
        </span>
      );
    }
    const dev = devices.find((d) => String(d.id) === String(act.device_id));
    const isOn = act.command === 'turn_on';
    return (
      <span className="inline-flex items-center gap-1.5">
        <Zap size={12} className={isOn ? 'text-emerald-400' : 'text-rose-400'} />
        <span className={isOn ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
          {isOn ? 'ON' : 'OFF'}
        </span>
        <span style={{ color: 'rgb(var(--surface-200))' }}>{dev ? dev.name : `Device #${act.device_id}`}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-8 max-w-6xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
          >
            Otomasi & Aturan Alert
          </h1>
          <p className="text-xs" style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}>
            Atur alur IF-THEN untuk mengontrol perangkat atau mengirim alert Telegram &amp; Email kustom.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="self-start sm:self-auto min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
          style={{ backgroundColor: 'rgb(var(--primary-500))' }}
        >
          <Plus size={15} />
          Buat Aturan
        </button>
      </div>

      {/* Error Banner */}
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
            onClick={fetchData}
            className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 self-start sm:self-auto"
            style={{ backgroundColor: 'rgb(var(--primary-500))' }}
          >
            <RefreshCw size={13} /> Muat Ulang
          </button>
        </div>
      )}

      {/* Unified Operational Rule Surface */}
      <div className="ops-surface overflow-hidden">
        {/* Toolbar */}
        <div
          className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
        >
          <div className="relative flex-1 md:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgb(var(--surface-400))' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aturan, parameter, atau email..."
              aria-label="Cari aturan otomasi"
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
            aria-label="Filter Aturan"
            className="inline-flex p-0.5 rounded-lg border self-start md:self-auto overflow-x-auto no-scrollbar max-w-full"
            style={{
              backgroundColor: 'rgb(var(--surface-800) / 0.45)',
              borderColor: 'rgb(var(--surface-700) / 0.55)',
            }}
          >
            {[
              { id: 'all', label: `Semua (${automations.length})` },
              { id: 'telegram', label: `Telegram (${telegramCount})` },
              { id: 'email', label: `Email (${emailCount})` },
              { id: 'device', label: `Perangkat (${deviceCount})` },
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

        {/* Loading */}
        {loading ? (
          <div className="divide-y" style={{ borderColor: 'rgb(var(--surface-700) / 0.4)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1 max-w-md">
                  <div className="h-3.5 w-48 rounded" style={{ backgroundColor: 'rgb(var(--surface-700) / 0.6)' }} />
                  <div className="h-3 w-full max-w-[20rem] rounded" style={{ backgroundColor: 'rgb(var(--surface-800) / 0.8)' }} />
                </div>
                <div className="h-8 w-24 rounded-lg" style={{ backgroundColor: 'rgb(var(--surface-800) / 0.8)' }} />
              </div>
            ))}
          </div>
        ) : filteredAutomations.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <div
              className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center border"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                borderColor: 'rgb(var(--surface-700) / 0.6)',
                color: 'rgb(var(--primary-400))',
              }}
            >
              <Zap size={17} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold" style={{ color: 'rgb(var(--surface-100))' }}>
                {automations.length === 0 ? 'Belum ada aturan otomasi' : 'Tidak ada aturan yang cocok'}
              </p>
              <p
                className="text-xs max-w-sm mx-auto"
                style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
              >
                {automations.length === 0
                  ? 'Buat aturan seperti: jika suhu lebih dari 35°C, kirim notifikasi ke Telegram atau Email dengan pesan khusus.'
                  : 'Coba ubah pencarian atau filter yang dipilih.'}
              </p>
            </div>
            {automations.length === 0 && (
              <button
                type="button"
                onClick={() => openModal()}
                className="min-h-[38px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 mt-1"
                style={{ backgroundColor: 'rgb(var(--primary-500))' }}
              >
                <Plus size={14} /> Buat Aturan Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgb(var(--surface-700) / 0.4)' }}>
            {filteredAutomations.map((auto) => {
              const actType = auto.action?.type || 'device';
              const isAlertAction = actType === 'telegram' || actType === 'email';
              const isTestingThis = testingAutoId === auto.id;

              return (
                <div
                  key={auto.id}
                  className="px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 transition-colors duration-150 hover:bg-[rgb(var(--surface-800)/0.35)]"
                  style={{ opacity: auto.is_active ? 1 : 0.65 }}
                >
                  {/* Left: Name + Inline IF -> THEN Logic */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[13.5px] font-semibold truncate"
                        style={{ color: 'rgb(var(--surface-50))' }}
                      >
                        {auto.name}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px]"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            auto.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {auto.is_active ? 'Aktif' : 'Dijeda'}
                      </span>
                      {isAlertAction && (
                        <span
                          className="text-[11px] font-mono tabular-nums"
                          style={{ color: 'rgb(var(--surface-500))' }}
                        >
                          · {auto.trigger_count || 0} alert
                        </span>
                      )}
                    </div>

                    {/* Horizontal IF -> THEN Flow */}
                    <div
                      className="flex flex-wrap items-center gap-2 text-xs"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.6)',
                          borderColor: 'rgb(var(--surface-700) / 0.55)',
                          color: 'rgb(var(--surface-300))',
                        }}
                      >
                        JIKA
                      </span>
                      {renderConditionSummary(auto.condition)}

                      <ArrowRight size={12} style={{ color: 'rgb(var(--surface-500))' }} className="shrink-0" />

                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.6)',
                          borderColor: 'rgb(var(--surface-700) / 0.55)',
                          color: 'rgb(var(--surface-300))',
                        }}
                      >
                        MAKA
                      </span>
                      {renderActionSummary(auto.action)}
                    </div>

                    {actType === 'telegram' && auto.action?.message_template && (
                      <p
                        className="text-[11px] font-mono truncate max-w-2xl"
                        style={{ color: 'rgb(var(--surface-500))' }}
                      >
                        {auto.action.message_template.replace(/\n/g, ' ↵ ')}
                      </p>
                    )}
                    {actType === 'email' && (auto.action?.subject || auto.action?.message_template) && (
                      <p
                        className="text-[11px] font-mono truncate max-w-2xl"
                        style={{ color: 'rgb(var(--surface-500))' }}
                      >
                        {auto.action.subject || auto.action.message_template.replace(/\n/g, ' ↵ ')}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    {isAlertAction && (
                      <button
                        type="button"
                        onClick={() => handleTestCardAutomation(auto)}
                        disabled={isTestingThis}
                        className="min-h-[34px] px-2.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                          borderColor: 'rgb(var(--surface-700) / 0.65)',
                          color: 'rgb(var(--surface-100))',
                        }}
                      >
                        {isTestingThis ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : actType === 'email' ? (
                          <Mail size={11} style={{ color: 'rgb(var(--primary-400))' }} />
                        ) : (
                          <Send size={11} style={{ color: 'rgb(var(--primary-400))' }} />
                        )}
                        Test
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openModal(auto)}
                      aria-label={`Edit ${auto.name}`}
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
                      onClick={() => handleDelete(auto)}
                      aria-label={`Hapus ${auto.name}`}
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
                      aria-checked={auto.is_active}
                      aria-label={auto.is_active ? 'Nonaktifkan aturan' : 'Aktifkan aturan'}
                      onClick={() => toggleStatus(auto)}
                      className="w-10 h-6 rounded-full p-0.5 transition-colors duration-150 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                      style={{
                        backgroundColor: auto.is_active
                          ? 'rgb(var(--primary-500))'
                          : 'rgb(var(--surface-700))',
                      }}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                          auto.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RULE STUDIO MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="automation-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto"
        >
          <div
            className="w-full rounded-2xl border shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
            style={{
              maxWidth: isTwoColModal ? '58rem' : '42rem',
              backgroundColor: 'rgb(var(--surface-900))',
              borderColor: 'rgb(var(--surface-700) / 0.65)',
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
            >
              <div>
                <h2
                  id="automation-modal-title"
                  className="text-base font-bold tracking-tight"
                  style={{ color: 'rgb(var(--surface-50))' }}
                >
                  {editingAuto ? 'Edit Aturan Otomasi' : 'Aturan Otomasi Baru'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
                  Tentukan kondisi pemicu (JIKA) dan aksi otomatis (MAKA).
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

            {/* Body */}
            <form id="automation-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div
                className={`p-6 grid grid-cols-1 gap-6 ${
                  isTwoColModal ? 'lg:grid-cols-12' : ''
                }`}
              >
                {/* Left Pane: Rule Name + Condition + Action Target */}
                <div className={isTwoColModal ? 'lg:col-span-6 space-y-5' : 'space-y-5'}>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(var(--surface-200))' }}>
                      Nama Aturan <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alert Suhu Ruang Server > 35°C"
                      className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.25)]"
                      style={inputStyle}
                    />
                  </div>

                  {/* KONDISI (JIKA) */}
                  <div
                    className="pt-4 border-t space-y-3.5"
                    style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        1. Kondisi (JIKA)
                      </p>
                      <div
                        className="inline-flex p-0.5 rounded-lg border"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.45)',
                          borderColor: 'rgb(var(--surface-700) / 0.55)',
                        }}
                      >
                        {[
                          { id: 'sensor', label: 'Data Sensor' },
                          { id: 'time', label: 'Jadwal' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setConditionType(opt.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150"
                            style={{
                              backgroundColor: conditionType === opt.id ? 'rgb(var(--surface-700))' : 'transparent',
                              color: conditionType === opt.id ? 'rgb(var(--surface-50))' : 'rgb(var(--surface-400))',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {conditionType === 'time' ? (
                      <div>
                        <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                          Waktu (HH:MM)
                        </label>
                        <input
                          type="time"
                          required
                          value={conditionTime}
                          onChange={(e) => setConditionTime(e.target.value)}
                          className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                          style={inputStyle}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Perangkat Sensor
                            </label>
                            <select
                              required
                              value={conditionDevice}
                              onChange={(e) => setConditionDevice(e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border px-2.5 text-xs outline-none"
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
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Parameter / Field
                            </label>
                            <input
                              type="text"
                              list="auto-sensor-fields"
                              required
                              value={conditionField}
                              onChange={(e) => setConditionField(e.target.value)}
                              placeholder="temperature"
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                              style={inputStyle}
                            />
                            <datalist id="auto-sensor-fields">
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
                        </div>

                        {availableFields.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {availableFields.map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setConditionField(f)}
                                className="px-2 py-0.5 rounded border font-mono text-[10.5px] transition-colors duration-150"
                                style={{
                                  backgroundColor:
                                    conditionField === f
                                      ? 'rgb(var(--primary-500) / 0.14)'
                                      : 'rgb(var(--surface-800) / 0.45)',
                                  borderColor:
                                    conditionField === f
                                      ? 'rgb(var(--primary-500) / 0.4)'
                                      : 'rgb(var(--surface-700) / 0.55)',
                                  color:
                                    conditionField === f
                                      ? 'rgb(var(--primary-300))'
                                      : 'rgb(var(--surface-400))',
                                }}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Operator
                            </label>
                            <select
                              value={conditionOperator}
                              onChange={(e) => setConditionOperator(e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border px-2 text-xs outline-none"
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
                              Nilai Batas
                            </label>
                            <input
                              type="text"
                              required
                              value={conditionValue}
                              onChange={(e) => setConditionValue(e.target.value)}
                              placeholder="35"
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono tabular-nums outline-none"
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Cooldown
                            </label>
                            <select
                              value={cooldownSeconds}
                              onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                              className="w-full min-h-[38px] rounded-lg border px-2 text-xs outline-none"
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
                      </div>
                    )}
                  </div>

                  {/* AKSI (MAKA) */}
                  <div
                    className="pt-4 border-t space-y-3.5"
                    style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        2. Aksi (MAKA)
                      </p>
                      <div
                        className="inline-flex p-0.5 rounded-lg border"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800) / 0.45)',
                          borderColor: 'rgb(var(--surface-700) / 0.55)',
                        }}
                      >
                        {[
                          { id: 'telegram', label: 'Telegram' },
                          { id: 'email', label: 'Email' },
                          { id: 'device', label: 'Perangkat' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setActionType(opt.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150"
                            style={{
                              backgroundColor: actionType === opt.id ? 'rgb(var(--surface-700))' : 'transparent',
                              color: actionType === opt.id ? 'rgb(var(--surface-50))' : 'rgb(var(--surface-400))',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {actionType === 'device' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                            Target Perangkat
                          </label>
                          <select
                            required
                            value={actionDevice}
                            onChange={(e) => setActionDevice(e.target.value)}
                            className="w-full min-h-[38px] rounded-lg border px-2.5 text-xs outline-none"
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
                          <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                            Perintah
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setActionCommand('turn_on')}
                              className="min-h-[38px] rounded-lg text-xs font-semibold border transition-colors duration-150"
                              style={{
                                backgroundColor:
                                  actionCommand === 'turn_on'
                                    ? 'rgb(16 185 129 / 0.14)'
                                    : 'rgb(var(--surface-950) / 0.5)',
                                borderColor:
                                  actionCommand === 'turn_on'
                                    ? 'rgb(16 185 129 / 0.5)'
                                    : 'rgb(var(--surface-700) / 0.6)',
                                color: actionCommand === 'turn_on' ? 'rgb(52 211 153)' : 'rgb(var(--surface-400))',
                              }}
                            >
                              Nyalakan
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionCommand('turn_off')}
                              className="min-h-[38px] rounded-lg text-xs font-semibold border transition-colors duration-150"
                              style={{
                                backgroundColor:
                                  actionCommand === 'turn_off'
                                    ? 'rgb(244 63 94 / 0.14)'
                                    : 'rgb(var(--surface-950) / 0.5)',
                                borderColor:
                                  actionCommand === 'turn_off'
                                    ? 'rgb(244 63 94 / 0.5)'
                                    : 'rgb(var(--surface-700) / 0.6)',
                                color: actionCommand === 'turn_off' ? 'rgb(251 113 133)' : 'rgb(var(--surface-400))',
                              }}
                            >
                              Matikan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {actionType === 'telegram' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={telegramEndpoints.length === 0}
                            onClick={() => setTelegramTargetMode('endpoint')}
                            className="min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors duration-150 disabled:opacity-40"
                            style={{
                              backgroundColor:
                                telegramTargetMode === 'endpoint'
                                  ? 'rgb(var(--primary-500) / 0.12)'
                                  : 'rgb(var(--surface-950) / 0.5)',
                              borderColor:
                                telegramTargetMode === 'endpoint'
                                  ? 'rgb(var(--primary-500) / 0.45)'
                                  : 'rgb(var(--surface-700) / 0.6)',
                              color:
                                telegramTargetMode === 'endpoint'
                                  ? 'rgb(var(--surface-50))'
                                  : 'rgb(var(--surface-400))',
                            }}
                          >
                            Endpoint Tersimpan ({telegramEndpoints.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTelegramTargetMode('manual')}
                            className="min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors duration-150"
                            style={{
                              backgroundColor:
                                telegramTargetMode === 'manual'
                                  ? 'rgb(var(--primary-500) / 0.12)'
                                  : 'rgb(var(--surface-950) / 0.5)',
                              borderColor:
                                telegramTargetMode === 'manual'
                                  ? 'rgb(var(--primary-500) / 0.45)'
                                  : 'rgb(var(--surface-700) / 0.6)',
                              color:
                                telegramTargetMode === 'manual'
                                  ? 'rgb(var(--surface-50))'
                                  : 'rgb(var(--surface-400))',
                            }}
                          >
                            Chat ID Langsung
                          </button>
                        </div>

                        {telegramTargetMode === 'endpoint' ? (
                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Pilih Endpoint Telegram
                            </label>
                            <select
                              required
                              value={selectedEndpointId}
                              onChange={(e) => setSelectedEndpointId(e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none"
                              style={inputStyle}
                            >
                              <option value="">Pilih Endpoint...</option>
                              {telegramEndpoints.map((ep) => (
                                <option key={ep.id} value={ep.id}>
                                  {ep.name} (Chat: {ep.config?.chat_id || ep.config?.chatId || '-'})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                                  Chat ID <span className="text-rose-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={telegramChatId}
                                  onChange={(e) => setTelegramChatId(e.target.value)}
                                  placeholder="5404451013"
                                  className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                                  style={inputStyle}
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                                  Bot Token {manualTokenRequired && <span className="text-rose-400">*</span>}
                                </label>
                                <input
                                  type="password"
                                  required={manualTokenRequired}
                                  value={telegramBotToken}
                                  onChange={(e) => {
                                    setTelegramBotToken(e.target.value);
                                    if (e.target.value) setClearBotToken(false);
                                  }}
                                  placeholder={
                                    editingAuto?.action?.has_bot_token && !clearBotToken
                                      ? editingAuto.action.bot_token_masked
                                      : '123456789:AAH...'
                                  }
                                  className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                                  style={inputStyle}
                                />
                              </div>
                            </div>

                            {editingAuto?.action?.has_bot_token && !clearBotToken && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                                  <ShieldCheck size={13} /> Token terenkripsi ({editingAuto.action.bot_token_masked})
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
                          </>
                        )}
                      </div>
                    )}

                    {actionType === 'email' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={emailEndpoints.length === 0}
                            onClick={() => setEmailTargetMode('endpoint')}
                            className="min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors duration-150 disabled:opacity-40"
                            style={{
                              backgroundColor:
                                emailTargetMode === 'endpoint'
                                  ? 'rgb(var(--primary-500) / 0.12)'
                                  : 'rgb(var(--surface-950) / 0.5)',
                              borderColor:
                                emailTargetMode === 'endpoint'
                                  ? 'rgb(var(--primary-500) / 0.45)'
                                  : 'rgb(var(--surface-700) / 0.6)',
                              color:
                                emailTargetMode === 'endpoint'
                                  ? 'rgb(var(--surface-50))'
                                  : 'rgb(var(--surface-400))',
                            }}
                          >
                            Endpoint Tersimpan ({emailEndpoints.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmailTargetMode('manual')}
                            className="min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors duration-150"
                            style={{
                              backgroundColor:
                                emailTargetMode === 'manual'
                                  ? 'rgb(var(--primary-500) / 0.12)'
                                  : 'rgb(var(--surface-950) / 0.5)',
                              borderColor:
                                emailTargetMode === 'manual'
                                  ? 'rgb(var(--primary-500) / 0.45)'
                                  : 'rgb(var(--surface-700) / 0.6)',
                              color:
                                emailTargetMode === 'manual'
                                  ? 'rgb(var(--surface-50))'
                                  : 'rgb(var(--surface-400))',
                            }}
                          >
                            Email Langsung
                          </button>
                        </div>

                        {emailTargetMode === 'endpoint' ? (
                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Pilih Endpoint Email
                            </label>
                            <select
                              required
                              value={selectedEmailEndpointId}
                              onChange={(e) => setSelectedEmailEndpointId(e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs outline-none"
                              style={inputStyle}
                            >
                              <option value="">Pilih Endpoint...</option>
                              {emailEndpoints.map((ep) => (
                                <option key={ep.id} value={ep.id}>
                                  {ep.name} ({ep.config?.email || '-'})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-medium mb-1" style={{ color: 'rgb(var(--surface-300))' }}>
                              Alamat Email Penerima <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={emailTo}
                              onChange={(e) => setEmailTo(e.target.value)}
                              placeholder="admin@domain.com, teknisi@domain.com"
                              className="w-full min-h-[38px] rounded-lg border px-3 text-xs font-mono outline-none"
                              style={inputStyle}
                            />
                            <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--surface-500))' }}>
                              Pisahkan dengan koma untuk mengirim ke beberapa alamat sekaligus.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Pane: Telegram or Email Composer & Live Preview */}
                {actionType === 'telegram' && (
                  <div
                    className="lg:col-span-6 lg:border-l lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0"
                    style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                  >
                    <TelegramMessageEditor
                      value={messageTemplate}
                      onChange={setMessageTemplate}
                      previewContext={{
                        device: selectedConditionDevice?.name || 'ESP32 Sensor Node',
                        location: selectedConditionDevice?.location || 'Ruang Server',
                        field: conditionField || 'temperature',
                        operator: conditionOperator,
                        threshold: conditionValue || '35',
                        rule: name || 'Alert Otomasi VideaLink',
                      }}
                    />
                  </div>
                )}

                {actionType === 'email' && (
                  <div
                    className="lg:col-span-6 lg:border-l lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0"
                    style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                  >
                    <EmailMessageEditor
                      subject={emailSubject}
                      onSubjectChange={setEmailSubject}
                      value={emailTemplate}
                      onChange={setEmailTemplate}
                      recipient={
                        emailTargetMode === 'endpoint'
                          ? selectedEmailEndpoint?.config?.email || ''
                          : emailTo
                      }
                      emailStatus={emailStatus}
                      previewContext={{
                        device: selectedConditionDevice?.name || 'ESP32 Sensor Node',
                        location: selectedConditionDevice?.location || 'Ruang Server',
                        field: conditionField || 'temperature',
                        operator: conditionOperator,
                        threshold: conditionValue || '35',
                        rule: name || 'Alert Otomasi VideaLink',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Feedback Banner */}
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

            {/* Footer */}
            <div
              className="px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0"
              style={{
                backgroundColor: 'rgb(var(--surface-950) / 0.35)',
                borderColor: 'rgb(var(--surface-700) / 0.5)',
              }}
            >
              <div>
                {actionType === 'telegram' && (
                  <button
                    type="button"
                    disabled={isTestingModal}
                    onClick={handleTestTelegramInModal}
                    className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                      borderColor: 'rgb(var(--surface-700) / 0.7)',
                      color: 'rgb(var(--surface-100))',
                    }}
                  >
                    {isTestingModal ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} style={{ color: 'rgb(var(--primary-400))' }} />
                    )}
                    Test Kirim Telegram
                  </button>
                )}
                {actionType === 'email' && (
                  <button
                    type="button"
                    disabled={isTestingModal}
                    onClick={handleTestEmailInModal}
                    className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                      borderColor: 'rgb(var(--surface-700) / 0.7)',
                      color: 'rgb(var(--surface-100))',
                    }}
                  >
                    {isTestingModal ? (
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
                  form="automation-form"
                  disabled={isSubmitting}
                  className="min-h-[38px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(var(--primary-500))' }}
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {editingAuto ? 'Simpan Perubahan' : 'Simpan Aturan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
