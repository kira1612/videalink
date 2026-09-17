import { useState, useEffect } from 'react';
import { Webhook, Plus, ToggleLeft, ToggleRight, Play, Clock, Hash, ExternalLink, Mail, MessageSquare, Globe, MessageCircle } from 'lucide-react';
import { endpointsApi } from '../services/api';
import { StatusBadge } from '../components/UI/Badge';

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
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      const res = await endpointsApi.list();
      setEndpoints(res.data);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Endpoints</h2>
          <p className="text-slate-400 text-sm mt-1">Configure actions and webhooks to trigger external services</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} /> Create Endpoint
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 glass-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {endpoints.map(endpoint => {
            const Icon = typeIcons[endpoint.type] || Webhook;
            return (
              <div key={endpoint.id} className={`glass-card p-5 transition-all duration-300 ${!endpoint.enabled ? 'opacity-75 grayscale-[0.3]' : 'hover:border-slate-600/50'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${endpoint.enabled ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/30' : 'bg-slate-800 border-slate-700'}`}>
                      <Icon size={24} className={endpoint.enabled ? 'text-amber-400' : 'text-slate-500'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-200">{endpoint.name}</h3>
                        <StatusBadge status={endpoint.enabled ? 'online' : 'offline'} />
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{endpoint.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <button onClick={() => handleToggle(endpoint)} className={`transition-colors ${endpoint.enabled ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`}>
                      {endpoint.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                    <button onClick={() => handleTrigger(endpoint)} disabled={!endpoint.enabled} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${endpoint.enabled ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'}`}>
                      <Play size={10} className={endpoint.enabled ? 'fill-amber-400' : 'fill-slate-600'} /> Test Run
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {endpoint.type}
                    </span>
                    <span className="text-xs text-slate-500">Source: <span className="text-primary-400">{endpoint.device}</span></span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                    {endpoint.type === 'EMAIL' && `To: ${endpoint.config?.email}`}
                    {endpoint.type === 'HTTP' && `${endpoint.config?.method} ${endpoint.config?.url}`}
                    {endpoint.type === 'SLACK' && `Channel: ${endpoint.config?.channel}`}
                    {endpoint.type === 'TELEGRAM' && `Chat ID: ${endpoint.config?.chatId}`}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-500 border-t border-slate-800/50 pt-3">
                  <span className="flex items-center gap-1.5"><Hash size={14} className="text-slate-400"/> {endpoint.trigger_count?.toLocaleString() || 0} triggers</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> Last: {formatDate(endpoint.last_triggered)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
