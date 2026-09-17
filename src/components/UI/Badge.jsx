export function StatusBadge({ status }) {
  const config = {
    online: { class: 'badge-online', dot: 'bg-emerald-400', label: 'Online' },
    offline: { class: 'badge-offline', dot: 'bg-rose-400', label: 'Offline' },
    warning: { class: 'badge-warning', dot: 'bg-amber-400', label: 'Warning' },
  };
  const c = config[status] || config.offline;
  return (
    <span className={c.class}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'online' ? 'animate-pulse' : ''}`}></span>
      {c.label}
    </span>
  );
}

export function TypeBadge({ type }) {
  const colors = {
    ESP32: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    'ESP8266': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    'Raspberry Pi 4': 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    'Arduino Uno': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
    NodeMCU: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${colors[type] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
      {type}
    </span>
  );
}

export function EndpointTypeBadge({ type }) {
  const colors = {
    EMAIL: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    HTTP: 'bg-primary-500/15 text-primary-400 border-primary-500/20',
    SLACK: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    TELEGRAM: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    MQTT: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${colors[type] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
      {type}
    </span>
  );
}
