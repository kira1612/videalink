import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Webhook, Plus, ToggleLeft, ToggleRight, Play, Clock, Hash, ExternalLink, Mail, MessageSquare, Globe, MessageCircle, Lock } from 'lucide-react';
import { endpointsApi } from '../services/api';
import { StatusBadge } from '../components/UI/Badge';
import { useBillingQuota } from '../hooks/useBillingQuota';
import QuotaNoticeBanner, { promptQuotaUpgrade } from '../components/Billing/QuotaNoticeBanner';

const typeIcons = {
  EMAIL: Mail,
  HTTP: Globe,
  SLACK: MessageSquare,
  TELEGRAM: MessageCircle,
  MQTT: Webhook,
};

function formatDate(iso) {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Endpoints() {
  const navigate = useNavigate();
  const { refreshQuota, getResourceQuota } = useBillingQuota();
  const endpointQuota = getResourceQuota('endpoints');
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      const res = await endpointsApi.list();
      setEndpoints(res.data);
      refreshQuota();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (endpoint) => {
    try {
      await endpointsApi.toggle(endpoint.id);
      setEndpoints(endpoints.map(e => e.id === endpoint.id ? { ...e, enabled: !e.enabled } : e));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrigger = async (endpoint) => {
    if (!endpoint.enabled) return;
    try {
      const res = await endpointsApi.trigger(endpoint.id);
      setEndpoints(endpoints.map(e => e.id === endpoint.id ? { 
        ...e, 
        trigger_count: res.data.trigger_count, 
        last_triggered: res.data.last_triggered 
      } : e));
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = endpoints.filter(e => e.enabled).length;
  const totalTriggers = endpoints.reduce((acc, e) => acc + (e.trigger_count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black text-slate-100 tracking-tight">Endpoints & Webhooks</h2>
          <p className="text-slate-400 text-[13px] mt-0.5">Configure actions and webhooks to trigger external services</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (endpointQuota.blocked) {
              promptQuotaUpgrade({
                navigate,
                resourceLabel: endpointQuota.label,
                planName: endpointQuota.planName,
                current: endpointQuota.current,
                limit: endpointQuota.limit,
              });
            }
          }}
          className={
            endpointQuota.blocked
              ? 'flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/35 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 transition-colors'
              : 'btn-primary flex items-center gap-2 w-full sm:w-auto justify-center'
          }
        >
          {endpointQuota.blocked ? <Lock size={15} /> : <Plus size={16} />}
          {endpointQuota.blocked ? 'Kuota Penuh • Upgrade' : 'Create Endpoint'}
        </button>
      </div>

      <QuotaNoticeBanner quota={endpointQuota} />

      {/* Vision UI Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">Total Endpoints</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold text-slate-100 tracking-tight leading-none">{endpoints.length}</span>
              <span className="text-[12px] font-bold text-primary-400">Configured</span>
            </div>
          </div>
          <div className="vision-icon-box w-11 h-11 rounded-xl">
            <Webhook size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">Active Hooks</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold text-slate-100 tracking-tight leading-none">{activeCount}</span>
              <span className="text-[12px] font-bold text-emerald-400">Listening</span>
            </div>
          </div>
          <div className="vision-icon-box w-11 h-11 rounded-xl">
            <Globe size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">Total Triggers</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold text-slate-100 tracking-tight leading-none">{totalTriggers.toLocaleString()}</span>
              <span className="text-[12px] font-bold text-amber-400">Events</span>
            </div>
          </div>
          <div className="vision-icon-box w-11 h-11 rounded-xl">
            <Hash size={20} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-44 vision-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {endpoints.map(endpoint => {
            const Icon = typeIcons[endpoint.type] || Webhook;
            return (
              <div key={endpoint.id} className={`vision-card p-6 transition-all duration-300 ${!endpoint.enabled ? 'opacity-75' : 'hover:-translate-y-0.5'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={endpoint.enabled ? 'vision-icon-box w-12 h-12 rounded-2xl flex-shrink-0' : 'vision-inner-box w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 flex-shrink-0'}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[16px] font-bold text-slate-100">{endpoint.name}</h3>
                        <StatusBadge status={endpoint.enabled ? 'online' : 'offline'} />
                      </div>
                      <p className="text-[12px] text-slate-400 mt-1">{endpoint.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <button onClick={() => handleToggle(endpoint)} className={`transition-colors ${endpoint.enabled ? 'text-primary-400' : 'text-slate-500 hover:text-slate-400'}`}>
                      {endpoint.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                    <button
                      onClick={() => handleTrigger(endpoint)}
                      disabled={!endpoint.enabled}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                        endpoint.enabled
                          ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 hover:bg-primary-500 hover:text-white'
                          : 'vision-inner-box text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Play size={10} className="fill-current" /> Test Run
                    </button>
                  </div>
                </div>

                <div className="vision-inner-box p-3.5 rounded-2xl mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-primary-500/15 text-primary-400 border border-primary-500/25">
                      {endpoint.type}
                    </span>
                    <span className="text-xs text-slate-400">Source: <span className="text-slate-200 font-semibold">{endpoint.device}</span></span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
                    {endpoint.type === 'EMAIL' && `To: ${endpoint.config?.email}`}
                    {endpoint.type === 'HTTP' && `${endpoint.config?.method} ${endpoint.config?.url}`}
                    {endpoint.type === 'SLACK' && `Channel: ${endpoint.config?.channel}`}
                    {endpoint.type === 'TELEGRAM' && `Chat ID: ${endpoint.config?.chatId}`}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                  <span className="flex items-center gap-1.5 font-semibold"><Hash size={14} className="text-primary-400"/> {endpoint.trigger_count?.toLocaleString() || 0} triggers</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-500"/> Last: {formatDate(endpoint.last_triggered)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
