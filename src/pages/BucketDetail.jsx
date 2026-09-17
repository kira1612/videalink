import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Database, Activity, Clock, Cpu, Download, Plus, X, Trash2, LayoutGrid, GripVertical, ChevronRight, Settings, Move, Maximize2, Minimize2, LineChart as LineChartIcon, BarChart2 as BarChartIcon, PieChart as PieChartIcon, Activity as AreaChartIcon, Radar as RadarChartIcon, Hash, Gauge as GaugeIcon, Radio, ToggleRight, MapPin, CircleDashed, SlidersHorizontal, Zap, Terminal } from 'lucide-react';
import { bucketsApi, mqttApi } from '../services/api';
import { StatusBadge } from '../components/UI/Badge';
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet icon issue
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';

// ─── Chart color palette ───────────────────────────────────────────────────
const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#fb923c', '#a78bfa'];
const getColor = (i) => COLORS[i % COLORS.length];

const CHART_TYPES = [
  { value: 'line',   label: 'Line Chart',    icon: LineChartIcon, category: 'chart' },
  { value: 'area',   label: 'Area Chart',    icon: AreaChartIcon, category: 'chart' },
  { value: 'bar',    label: 'Bar Chart',     icon: BarChartIcon, category: 'chart' },
  { value: 'pie',    label: 'Pie Chart',     icon: PieChartIcon, category: 'chart' },
  { value: 'donut',  label: 'Donut Chart',   icon: CircleDashed, category: 'chart' },
  { value: 'radar',  label: 'Radar Chart',   icon: RadarChartIcon, category: 'chart' },
  { value: 'stat',   label: 'Value / Stat',  icon: Hash, category: 'widget' },
  { value: 'gauge',  label: 'Gauge / Meter', icon: GaugeIcon, category: 'widget' },
  { value: 'status', label: 'Indicator',     icon: Radio, category: 'widget' },
  { value: 'switch', label: 'Switch / Toggle',icon: ToggleRight, category: 'widget' },
  { value: 'combo',  label: 'Combo (2 in 1)', icon: LayoutGrid, category: 'widget' },
  { value: 'map',    label: 'Map / GPS',     icon: MapPin, category: 'widget' },
  { value: 'slider', label: 'Analog Slider', icon: SlidersHorizontal, category: 'widget' },
  { value: 'action', label: 'Action Button', icon: Zap, category: 'widget' },
  { value: 'log',    label: 'Log Console',   icon: Terminal, category: 'widget' },
];

const SIZE_OPTIONS = [
  { value: '1', label: 'Small (1 col)',  cols: 1 },
  { value: '2', label: 'Medium (2 cols)', cols: 2 },
  { value: '3', label: 'Large (3 cols)',  cols: 3 },
];

// ─── Stateful Widget Components ─────────────────────────────────────────────
function SwitchWidget({ widget, latestVal }) {
  const initialIsOn = String(latestVal).toLowerCase() === '1' || String(latestVal).toLowerCase() === 'on' || String(latestVal) === 'true';
  const switchColor = widget.config?.color || '#06b6d4';

  const [isOn, setIsOn] = useState(initialIsOn);
  const [sending, setSending] = useState(false);

  useEffect(() => { setIsOn(initialIsOn); }, [latestVal]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (sending) return;
    const newState = isOn ? 0 : 1;
    const topic = widget.config?.topic || `iot/device/${widget.field}/set`;

    setIsOn(!isOn);
    setSending(true);

    try {
      await mqttApi.publish(topic, JSON.stringify({ [widget.field]: newState }));
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: `Command sent: ${newState ? 'ON' : 'OFF'}`,
        showConfirmButton: false, timer: 1500, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399'
      });
    } catch (err) {
      setIsOn(isOn);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'error',
        title: 'Failed to send command',
        showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#e2e8f0'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <button
        className="relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer disabled:opacity-50"
        style={{ backgroundColor: isOn ? switchColor : '#334155' }}
        onClick={handleToggle}
        disabled={sending}
      >
        <span
          className="inline-block h-10 w-10 transform rounded-full bg-white shadow-md transition-transform duration-300"
          style={{ transform: isOn ? 'translateX(52px)' : 'translateX(4px)' }}
        />
      </button>
      <div className="text-center">
        <span className={`text-lg font-bold transition-colors duration-200 ${isOn ? 'text-cyan-400' : 'text-slate-400'}`}>
          {isOn ? (widget.config?.onLabel || 'ON') : (widget.config?.offLabel || 'OFF')}
        </span>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{widget.field}</p>
      </div>
    </div>
  );
}

function SliderWidget({ widget, latestVal }) {
  const min = parseFloat(widget.config?.min) || 0;
  const max = parseFloat(widget.config?.max) || 100;
  const step = parseFloat(widget.config?.step) || 1;
  const sliderColor = widget.config?.color || '#06b6d4';
  
  const [sliderVal, setSliderVal] = useState(parseFloat(latestVal) || min);
  const [sending, setSending] = useState(false);
  
  useEffect(() => { 
     const val = parseFloat(latestVal);
     if (!isNaN(val)) setSliderVal(val); 
  }, [latestVal]);

  const handleMouseUp = async () => {
    const topic = widget.config?.topic || `iot/device/${widget.field}/set`;
    setSending(true);
    try {
      await mqttApi.publish(topic, JSON.stringify({ [widget.field]: sliderVal }));
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Sent: ${sliderVal}`, showConfirmButton: false, timer: 1000, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
    } catch (err) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to send', showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#e2e8f0' });
    } finally {
      setSending(false);
    }
  };

  const percent = ((sliderVal - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 w-full">
      <style>{`
        .premium-slider-${widget.id}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid ${sliderColor};
          box-shadow: 0 0 15px ${sliderColor}80, 0 4px 6px -1px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          margin-top: -8px; /* Centers thumb on the track */
        }
        .premium-slider-${widget.id}::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .premium-slider-${widget.id}::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid ${sliderColor};
          box-shadow: 0 0 15px ${sliderColor}80;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
      `}</style>
      
      {/* Premium Value Display */}
      <div 
        className="relative flex flex-col items-center justify-center mb-6"
      >
        <div 
          className="px-6 py-2 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-inner flex items-baseline gap-1"
          style={{ boxShadow: `0 0 25px ${sliderColor}15, inset 0 2px 4px rgba(0,0,0,0.5)` }}
        >
          <span className="text-4xl font-black tabular-nums tracking-tighter" style={{ color: sliderColor, textShadow: `0 0 15px ${sliderColor}50` }}>
            {sliderVal}
          </span>
          {widget.unit && <span className="text-slate-400 font-semibold text-lg">{widget.unit}</span>}
        </div>
        <span className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-3">{widget.field}</span>
      </div>

      {/* Custom Sleek Slider */}
      <div className="w-full relative flex items-center">
        <input 
          type="range" 
          min={min} max={max} step={step} 
          value={sliderVal} 
          onChange={(e) => setSliderVal(parseFloat(e.target.value))} 
          onMouseUp={handleMouseUp} 
          onTouchEnd={handleMouseUp}
          disabled={sending}
          className={`premium-slider-${widget.id} w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-50 outline-none transition-all duration-300`}
          style={{ 
            background: `linear-gradient(to right, ${sliderColor} ${percent}%, #1e293b ${percent}%)`,
            boxShadow: `inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)`
          }}
        />
      </div>
      
      <div className="flex justify-between w-full text-[10px] text-slate-500 font-bold mt-3">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ActionWidget({ widget }) {
  const btnColor = widget.config?.color || '#3b82f6';
  const [sending, setSending] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (sending) return;
    setSending(true);
    const topic = widget.config?.topic || `iot/device/${widget.field}/set`;
    const payloadStr = widget.config?.payload || '1';

    try {
      await mqttApi.publish(topic, payloadStr);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Action Triggered`, showConfirmButton: false, timer: 1000, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
    } catch (err) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Action Failed', showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#e2e8f0' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <button 
        onClick={handleClick}
        disabled={sending}
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50 focus:outline-none"
        style={{ backgroundColor: `${btnColor}20`, border: `2px solid ${btnColor}` }}
      >
        {sending ? (
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: btnColor, borderTopColor: 'transparent' }} />
        ) : (
          <Zap size={32} style={{ color: btnColor }} className="mb-1" />
        )}
      </button>
      <span className="text-base font-bold text-slate-200">{widget.config?.btnLabel || 'Trigger Action'}</span>
    </div>
  );
}

// ─── Single Widget Renderer ─────────────────────────────────────────────────
function WidgetChart({ widget, chartData, color }) {
  const h = widget.h === 'tall' ? 320 : 220;

  const renderFields = widget.config?.fields?.length > 0 ? widget.config.fields : [widget.field];
  const getFieldColor = (f, i) => {
    if (widget.config?.fieldColors?.[f]) return widget.config.fieldColors[f];
    return renderFields.length > 1 ? getColor(i) : activeColor;
  };

  if (widget.type === 'combo') {
    const isStack = widget.config?.layout === 'stack';
    return (
      <div className={`w-full h-full flex ${isStack ? 'flex-col' : 'flex-row'} divide-slate-800/50 ${isStack ? 'divide-y' : 'divide-x'}`}>
        <div className="flex-1 w-full h-full relative overflow-hidden p-2">
           <WidgetChart widget={widget.config?.widgetA} chartData={chartData} color={color} />
        </div>
        <div className="flex-1 w-full h-full relative overflow-hidden p-2">
           <WidgetChart widget={widget.config?.widgetB} chartData={chartData} color={color} />
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Database size={24} className="mb-2 opacity-40" />
        <p className="text-sm">No data yet</p>
      </div>
    );
  }

  const latestVal = chartData[chartData.length - 1]?.[widget.field] ?? '-';

  // ── Alert Threshold Override ──
  let activeColor = color || '#06b6d4'; // Fallback to cyan if color is missing
  const isNumeric = ['stat', 'gauge', 'line', 'bar', 'area'].includes(widget.type);
  const val = parseFloat(latestVal);
  const threshold = parseFloat(widget.config?.alertThreshold);
  let isAlertActive = false;
  
  if (isNumeric && !isNaN(val) && !isNaN(threshold) && val >= threshold) {
    activeColor = widget.config?.alertColor || '#ef4444';
    isAlertActive = true;
  }

  if (widget.type === 'stat') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <span className={`text-5xl font-black flex items-baseline gap-2 ${isAlertActive ? 'animate-pulse' : ''}`} style={{ color: activeColor }}>
          {latestVal}
          {widget.unit && <span className="text-2xl text-slate-400 font-medium">{widget.unit}</span>}
        </span>
        <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">{widget.field}</span>
        <span className="text-xs text-slate-500">Latest value</span>
      </div>
    );
  }

  if (widget.type === 'gauge') {
    // Simple recharts gauge (half pie)
    const val = parseFloat(latestVal) || 0;
    const min = parseFloat(widget.config?.min) || 0;
    const max = parseFloat(widget.config?.max) || 100;
    
    // Normalize value between min and max
    let normalized = val;
    if (normalized < min) normalized = min;
    if (normalized > max) normalized = max;
    
    // Calculate percentage for half-circle
    const percent = (normalized - min) / (max - min);
    
    const pieData = [
      { name: 'Value', value: percent, fill: activeColor },
      { name: 'Remaining', value: 1 - percent, fill: '#334155' }
    ];

    return (
      <div className="flex flex-col items-center justify-center h-full relative" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="80%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              dataKey="value"
              isAnimationActive={false}
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className={`text-3xl font-black text-slate-100 ${isAlertActive ? 'text-rose-400 animate-pulse' : ''}`}>{val}</span>
          <span className="text-xs text-slate-500">{widget.unit || widget.field}</span>
        </div>
      </div>
    );
  }

  if (widget.type === 'status') {
    const valStr = String(latestVal).toLowerCase();
    const isOk = valStr === '1' || valStr === 'true' || valStr === 'on' || valStr === 'normal' || valStr === 'online';
    const isBad = valStr === '0' || valStr === 'false' || valStr === 'off' || valStr === 'bahaya' || valStr === 'offline';
    
    let stateColor = '#64748b'; // default gray
    let icon = '⚪';
    let label = latestVal;

    if (isOk) {
      stateColor = widget.config?.color || '#10b981'; // custom or emerald
      icon = '🟢';
      label = widget.config?.onLabel || 'Normal / Online';
    } else if (isBad) {
      stateColor = '#ef4444'; // rose
      icon = '🔴';
      label = widget.config?.offLabel || 'Bahaya / Offline';
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stateColor}20` }}>
          <div className="w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: stateColor }} />
        </div>
        <span className="text-xl font-bold text-slate-200">{label}</span>
        <span className="text-sm text-slate-500 uppercase">{widget.field}</span>
      </div>
    );
  }

  if (widget.type === 'switch') return <SwitchWidget widget={widget} latestVal={latestVal} />;
  if (widget.type === 'slider') return <SliderWidget widget={widget} latestVal={latestVal} />;
  if (widget.type === 'action') return <ActionWidget widget={widget} />;

  if (widget.type === 'log') {
    const logs = chartData.slice(-20).reverse();
    return (
      <div className="w-full h-full bg-slate-950 p-3 rounded-lg flex flex-col font-mono text-[10px] leading-relaxed border border-slate-800/50" style={{ height: h }}>
        <div className="shrink-0 pb-2 mb-2 border-b border-slate-800 flex items-center gap-2 text-slate-400">
          <Terminal size={12} className="text-emerald-400" />
          <span>Console: {widget.field}</span>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 hover:bg-slate-900/50 p-1 rounded transition-colors">
              <span className="text-slate-600 shrink-0 whitespace-nowrap">[{log.timestamp}]</span>
              <span className="text-slate-300 break-all">{typeof log[widget.field] === 'object' ? JSON.stringify(log[widget.field]) : String(log[widget.field] ?? '-')}</span>
            </div>
          ))}
          {logs.length === 0 && <span className="text-slate-500 italic">No logs available...</span>}
        </div>
      </div>
    );
  }

  if (widget.type === 'map') {
    // Assuming field contains "lat,lng" e.g. "-6.2,106.8"
    let lat = -6.2;
    let lng = 106.8;
    
    if (typeof latestVal === 'string' && latestVal.includes(',')) {
      const parts = latestVal.split(',');
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }

    return (
      <div className="w-full h-full rounded-xl overflow-hidden z-0" style={{ height: h }}>
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <Marker position={[lat, lng]}>
            <Popup>{widget.field}: {lat}, {lng}</Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  }

  // For pie / donut — use only last 6 points
  if (widget.type === 'pie' || widget.type === 'donut') {
    const slice = chartData.slice(-6);
    const pieData = slice.map((d, i) => ({
      name: d.timestamp,
      value: parseFloat(d[widget.field]) || 0,
      fill: COLORS[i % COLORS.length],
    }));
    const innerRadius = widget.type === 'donut' ? '55%' : 0;
    return (
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              innerRadius={innerRadius}
              isAnimationActive={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8 }}
              itemStyle={{ color: '#e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widget.type === 'radar') {
    const slice = chartData.slice(-8);
    return (
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={slice}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
            <PolarRadiusAxis stroke="#334155" fontSize={9} />
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return <Radar key={f} name={f} dataKey={f} stroke={c} fill={c} fillOpacity={0.25} isAnimationActive={false} />;
            })}
            {renderFields.length > 1 && <Legend wrapperStyle={{ fontSize: '10px' }} />}
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8 }}
              itemStyle={{ color: '#e2e8f0' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widget.type === 'bar') {
    return (
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickMargin={8} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8 }} itemStyle={{ color: '#e2e8f0' }} />
            {renderFields.length > 1 && <Legend wrapperStyle={{ fontSize: '10px' }} />}
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return <Bar key={f} name={f} dataKey={f} fill={c} radius={[4, 4, 0, 0]} isAnimationActive={false} />;
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widget.type === 'area') {
    return (
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              {renderFields.map((f, i) => {
                const c = getFieldColor(f, i);
                return (
                  <linearGradient key={`grad-${widget.id}-${f}`} id={`grad-${widget.id}-${f}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickMargin={8} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8 }} itemStyle={{ color: '#e2e8f0' }} />
            {renderFields.length > 1 && <Legend wrapperStyle={{ fontSize: '10px' }} />}
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return <Area key={f} name={f} type="monotone" dataKey={f} stroke={c} strokeWidth={2.5} fill={`url(#grad-${widget.id}-${f})`} dot={false} isAnimationActive={false} />;
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default: Line
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickMargin={8} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8 }} itemStyle={{ color: '#e2e8f0' }} />
          {renderFields.length > 1 && <Legend wrapperStyle={{ fontSize: '10px' }} />}
          {renderFields.map((f, i) => {
            const c = getFieldColor(f, i);
            return <Line key={f} name={f} type="monotone" dataKey={f} stroke={c} strokeWidth={2.5} dot={{ r: 2.5, fill: '#1e293b' }} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />;
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Sortable Widget Card ───────────────────────────────────────────────────
function SortableWidget({ widget, index, chartData, onDelete, onEdit, onResize, editMode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const color = widget.config?.color || getColor(index);

  // Local state for instant visual resizing
  const [localW, setLocalW] = useState(widget.w || '1');
  const [localH, setLocalH] = useState(widget.h || 'normal');
  const [resizing, setResizing] = useState(false);
  const [ghostSize, setGhostSize] = useState(null);
  const startDragRef = useRef(null);

  // Sync local state when widget prop changes (e.g. from modal)
  useEffect(() => {
    setLocalW(widget.w || '1');
    setLocalH(widget.h || 'normal');
  }, [widget.w, widget.h]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setResizing(true);
    
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: parseInt(localW),
      startH: localH,
      baseWidth: rect.width,
      baseHeight: rect.height,
    };
    
    setGhostSize({ w: rect.width, h: rect.height });

    const handlePointerMove = (moveEvent) => {
      if (!startDragRef.current) return;
      
      const dx = moveEvent.clientX - startDragRef.current.x;
      const dy = moveEvent.clientY - startDragRef.current.y;
      
      // Update pixel-perfect ghost box size
      setGhostSize({
        w: Math.max(150, startDragRef.current.baseWidth + dx),
        h: Math.max(150, startDragRef.current.baseHeight + dy),
      });
    };

    const handlePointerUp = (upEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      if (!startDragRef.current) return;
      
      const dx = upEvent.clientX - startDragRef.current.x;
      const dy = upEvent.clientY - startDragRef.current.y;
      
      // Calculate final snapped values based on total drag distance
      let newW = startDragRef.current.startW;
      if (dx > 120) newW = Math.min(3, startDragRef.current.startW + 1);
      if (dx > 350) newW = Math.min(3, startDragRef.current.startW + 2);
      if (dx < -120) newW = Math.max(1, startDragRef.current.startW - 1);
      if (dx < -350) newW = Math.max(1, startDragRef.current.startW - 2);

      let newH = startDragRef.current.startH;
      if (dy > 80) newH = 'tall';
      if (dy < -80) newH = 'normal';

      const finalW = newW.toString();
      const finalH = newH;
      
      setLocalW(finalW);
      setLocalH(finalH);
      setGhostSize(null);
      setResizing(false);
      
      if (finalW !== widget.w || finalH !== widget.h) {
        if (onResize) {
          onResize(widget.id, { w: finalW, h: finalH });
        }
      }
      startDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ? `${transition}, min-height 0.3s ease` : 'min-height 0.3s ease',
    opacity: isDragging ? 0.5 : 1,
    gridColumn: localW === '3' ? 'span 3' : localW === '2' ? 'span 2' : 'span 1',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`glass-card p-5 relative group flex flex-col gap-3 transition-[grid-column] duration-300 ease-in-out ${localH === 'tall' ? 'min-h-[400px]' : ''}`}
    >
      {/* Ghost Resize Box */}
      {ghostSize && (
        <div 
          className="absolute top-0 left-0 rounded-2xl border-2 border-dashed border-primary-400 bg-primary-500/10 z-50 pointer-events-none backdrop-blur-[2px] transition-none"
          style={{ width: `${ghostSize.w}px`, height: `${ghostSize.h}px` }}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {editMode && (
            <button
              {...listeners}
              {...attributes}
              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing flex-shrink-0 p-1 -ml-1 rounded hover:bg-slate-700/50 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical size={16} />
            </button>
          )}
          <h4 className="font-semibold text-slate-200 truncate">{widget.title}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {editMode && (
            <>
              <button
                onClick={() => onEdit(widget)}
                className="text-slate-500 hover:text-primary-400 p-1 rounded hover:bg-slate-700/50 transition-colors"
                title="Edit widget"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => onDelete(widget.id)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-700/50 transition-colors"
                title="Delete widget"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[180px]">
        <WidgetChart widget={widget} chartData={chartData} color={color} />
      </div>

      {/* Footer badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-mono">
          {CHART_TYPES.find(c => c.value === widget.type)?.label || widget.type}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-mono">
          field: {widget.field}
        </span>
      </div>

      {/* Drag Resize Handle */}
      {editMode && (
        <div
          onPointerDown={handlePointerDown}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 text-slate-500 hover:text-primary-400 transition-colors z-10"
          title="Drag to resize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L0 12H12V0Z" fill="currentColor" opacity="0.5"/>
            <path d="M12 6L6 12H12V6Z" fill="currentColor"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function BucketDetail() {
  const { id } = useParams();
  const [bucket, setBucket] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [widgets, setWidgets] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cloudConnected, setCloudConnected] = useState(true);
  // Modal states
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null); // for editing existing
  const [submitting, setSubmitting] = useState(false);
  const [formType, setFormType] = useState('line');
  const [formColor, setFormColor] = useState('');
  const [modalStep, setModalStep] = useState(1);
  const [previewWidget, setPreviewWidget] = useState(null);
  const lastUpdateRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Fetch ──
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchData = async (showLoading = true) => {
    const fetchStartTime = Date.now();
    try {
      if (showLoading) setLoading(true);
      const [bucketRes, recordsRes] = await Promise.all([
        bucketsApi.get(id),
        bucketsApi.records(id),
      ]);
      setBucket(prev => JSON.stringify(prev) === JSON.stringify(bucketRes.data) ? prev : bucketRes.data);
      setRecords(prev => JSON.stringify(prev) === JSON.stringify(recordsRes.data) ? prev : recordsRes.data);
      
      setWidgets(prev => {
        // Prevent stale fetch from overwriting local state if an update happened recently
        if (fetchStartTime < lastUpdateRef.current) return prev;
        
        const next = bucketRes.data.widgets || [];
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
      setCloudConnected(true);
    } catch (err) {
      console.error(err);
      setError('Failed to load bucket data.');
      setCloudConnected(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // ── Format data for charts ──
  const formatChartData = (recs) => {
    if (!bucket?.fields) return [];
    return recs.map(r => {
      const point = { timestamp: r.timestamp };
      bucket.fields.forEach(f => {
        point[f] = r[f] !== undefined ? parseFloat(r[f]) : null;
      });
      return point;
    }).reverse();
  };

  const chartData = formatChartData(records);

  // ── Calculate Stale Data ──
  const isStale = useMemo(() => {
    if (!chartData || chartData.length === 0) return false;
    const latestTimestamp = new Date(chartData[chartData.length - 1].timestamp).getTime();
    return (Date.now() - latestTimestamp) > 5 * 60 * 1000; // > 5 minutes
  }, [chartData]);

  // ── Save widgets to API ──
  const saveWidgets = useCallback(async (newWidgets) => {
    try {
      await bucketsApi.updateWidgets(id, newWidgets);
      lastUpdateRef.current = Date.now();
    } catch (err) {
      console.error("Save widgets failed:", err);
      Swal.fire({ text: 'Failed to save widget layout', icon: 'error', background: '#1e293b', color: '#e2e8f0' });
      throw err; // Re-throw so caller knows it failed
    }
  }, [id]);

  // ── Drag end ──
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setWidgets(prev => {
        const oldIndex = prev.findIndex(w => w.id === active.id);
        const newIndex = prev.findIndex(w => w.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        saveWidgets(reordered);
        return reordered;
      });
    }
  };

  // ── Add / Edit Widget Submit ──
  const handleFormChange = (e) => {
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    const multiFields = fd.getAll('multiFields');
    
    const currentType = data.type || formType;
    const isMulti = ['line', 'area', 'bar', 'radar'].includes(currentType);

    const fieldColors = {};
    if (isMulti) {
      multiFields.forEach(f => {
        if (data[`color_${f}`]) fieldColors[f] = data[`color_${f}`];
      });
    }
    
    setPreviewWidget({
      id: 'preview',
      type: currentType,
      field: data.field || (currentType === 'combo' ? 'combo' : isMulti ? 'multi' : bucket?.fields?.[0]),
      title: data.title || (currentType === 'combo' ? 'Combo Widget' : isMulti ? `Multi ${currentType}` : `${data.field || bucket?.fields?.[0] || 'Field'} ${currentType}`),
      w: data.w || '1',
      h: data.h || 'normal',
      unit: data.unit || null,
      config: currentType === 'combo' ? {
        layout: data.layout || 'split',
        widgetA: {
          type: data.typeA || 'gauge',
          field: data.fieldA || bucket?.fields?.[0],
          unit: data.unitA,
          config: { min: data.minA, max: data.maxA, onLabel: data.onLabelA, offLabel: data.offLabelA, topic: data.topicA }
        },
        widgetB: {
          type: data.typeB || 'switch',
          field: data.fieldB || bucket?.fields?.[0],
          unit: data.unitB,
          config: { min: data.minB, max: data.maxB, onLabel: data.onLabelB, offLabel: data.offLabelB, topic: data.topicB }
        }
      } : {
        fields: isMulti ? (multiFields.length > 0 ? multiFields : [bucket?.fields?.[0]]) : undefined,
        fieldColors: isMulti ? fieldColors : undefined,
        min: data.min || 0,
        max: data.max || 100,
        onLabel: data.onLabel || 'Online',
        offLabel: data.offLabel || 'Offline',
        topic: data.topic || null,
        color: data.color || formColor || null,
        alertThreshold: data.alertThreshold || null,
        alertColor: data.alertColor || '#ef4444',
        step: data.step || 1,
        payload: data.payload || null,
        btnLabel: data.btnLabel || null,
      }
    });
  };

  const handleWidgetSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    const multiFields = fd.getAll('multiFields');
    const isMulti = ['line', 'area', 'bar', 'radar'].includes(data.type);

    const fieldColors = {};
    if (isMulti) {
      multiFields.forEach(f => {
        if (data[`color_${f}`]) fieldColors[f] = data[`color_${f}`];
      });
    }

    setSubmitting(true);
    try {
      const widgetPayload = {
        type: data.type,
        field: data.field || (data.type === 'combo' ? 'combo' : isMulti ? 'multi' : ''),
        title: data.title || (data.type === 'combo' ? 'Combo Widget' : isMulti ? `Multi ${data.type}` : `${data.field} ${data.type}`),
        w: data.w || '1',
        h: data.h || 'normal',
        unit: data.unit || null,
        config: data.type === 'combo' ? {
          layout: data.layout || 'split',
          widgetA: {
            type: data.typeA,
            field: data.fieldA,
            unit: data.unitA,
            config: { min: data.minA, max: data.maxA, onLabel: data.onLabelA, offLabel: data.offLabelA, topic: data.topicA }
          },
          widgetB: {
            type: data.typeB,
            field: data.fieldB,
            unit: data.unitB,
            config: { min: data.minB, max: data.maxB, onLabel: data.onLabelB, offLabel: data.offLabelB, topic: data.topicB }
          }
        } : {
          fields: isMulti ? (multiFields.length > 0 ? multiFields : [bucket?.fields?.[0]]) : undefined,
          fieldColors: isMulti ? fieldColors : undefined,
          min: data.min || 0,
          max: data.max || 100,
          onLabel: data.onLabel || 'Online',
          offLabel: data.offLabel || 'Offline',
          topic: data.topic || null,
          color: data.color || null,
          alertThreshold: data.alertThreshold || null,
          alertColor: data.alertColor || '#ef4444',
          step: data.step || 1,
          payload: data.payload || null,
          btnLabel: data.btnLabel || null,
        }
      };

      if (editingWidget) {
        // Edit existing
        const updated = widgets.map(w => w.id === editingWidget.id ? { ...w, ...widgetPayload } : w);
        setWidgets(updated);
        await saveWidgets(updated);
        setEditingWidget(null);
        setShowWidgetModal(false);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Widget updated!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
      } else {
        // Add new
        const newWidget = { id: Date.now().toString(), ...widgetPayload };
        const newWidgets = [...widgets, newWidget];
        setWidgets(newWidgets);
        await saveWidgets(newWidgets);
        setShowWidgetModal(false);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Widget added!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Widget ──
  const handleDeleteWidget = async (widgetId) => {
    const result = await Swal.fire({
      title: 'Remove widget?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      confirmButtonColor: '#ef4444',
      background: '#1e293b',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    setWidgets(newWidgets);
    try {
      await saveWidgets(newWidgets);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Widget removed!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
    } catch {
      setWidgets(widgets); // Revert on failure
    }
  };

  // ── Resize Widget ──
  const handleResizeWidget = async (widgetId, updates) => {
    const updated = widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w);
    setWidgets(updated);
    try {
      await saveWidgets(updated);
    } catch {
      setWidgets(widgets); // Revert on failure
    }
  };

  // ── Open edit modal ──
  const handleEditWidget = (widget) => {
    setEditingWidget(widget);
    setFormType(widget.type);
    setFormColor(widget.config?.color || '');
    setModalStep(1);
    setPreviewWidget(widget);
    setShowWidgetModal(true);
  };
  
  // ── Open add modal ──
  const handleAddWidget = () => {
    setEditingWidget(null);
    setFormType('line');
    setFormColor('');
    setModalStep(1);
    setPreviewWidget({
      id: 'preview',
      type: 'line',
      field: bucket?.fields?.[0] || 'field',
      title: 'Preview Widget',
      w: '1', h: 'normal', config: {}
    });
    setShowWidgetModal(true);
  };

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-40 glass-card animate-pulse" />
        <div className="h-96 glass-card animate-pulse" />
      </div>
    );
  }

  if (error || !bucket) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center glass-card">
        <Database size={48} className="text-rose-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-200 mb-2">Error Loading Bucket</h3>
        <p className="text-slate-400 mb-6">{error || 'Bucket not found'}</p>
        <Link to="/app/buckets" className="btn-primary">Back to Buckets</Link>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Header ─── */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/app/buckets" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100">{bucket.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={bucket.enabled ? 'online' : 'offline'} label={bucket.enabled ? 'Active' : 'Disabled'} />
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wide ${cloudConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                <div className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-500'}`} />
                {cloudConnected ? 'Broker Connected' : 'Broker Disconnected'}
              </div>

              {isStale && bucket.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 text-[11px] font-semibold uppercase tracking-wide">
                   ⚠️ Stale Data (&gt; 5m)
                </div>
              )}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">{bucket.description || 'Customizable IoT Dashboard'}</p>
        </div>
        <div className="flex items-center gap-3">
          {widgets.length > 0 && (
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                editMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {editMode ? <><Move size={15} /> Done Editing</> : <><Settings size={15} /> Edit Layout</>}
            </button>
          )}
          <button onClick={handleAddWidget} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Widget
          </button>
        </div>
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400"><Cpu size={16} /></div>
          <div><p className="text-xs text-slate-400">Device</p><p className="font-semibold text-slate-200 text-sm">{bucket.device?.name || bucket.device || 'Unknown'}</p></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400"><Database size={16} /></div>
          <div><p className="text-xs text-slate-400">Records</p><p className="font-semibold text-slate-200 text-sm">{bucket.records_count?.toLocaleString() || records.length}</p></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><Clock size={16} /></div>
          <div><p className="text-xs text-slate-400">Last Write</p><p className="font-semibold text-slate-200 text-sm truncate w-24">{bucket.last_write ? new Date(bucket.last_write).toLocaleTimeString() : 'Never'}</p></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><Activity size={16} /></div>
          <div><p className="text-xs text-slate-400">Fields</p><p className="font-semibold text-slate-200 text-sm">{bucket.fields?.length || 0}</p></div>
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 mb-6">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
          { id: 'records', label: 'Raw Records', icon: Database },
          { id: 'connection', label: 'Connection', icon: Cpu },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.id 
                  ? 'border-primary-400 text-primary-400 bg-primary-950/20' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── Tab Content: Dashboard ─── */}
      {activeTab === 'dashboard' && (
        <div className="animate-fade-in">
          {/* Edit Mode Banner */}
          {editMode && (
            <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              <Move size={16} className="flex-shrink-0" />
              <span><strong>Edit Mode:</strong> Drag widgets to reorder · Click <Settings size={12} className="inline" /> to change type, size or field · Click <Trash2 size={12} className="inline" /> to remove</span>
            </div>
          )}

          {/* Widget Grid */}
          {widgets.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {widgets.map((widget, i) => (
                    <SortableWidget key={widget.id} widget={widget} index={i} chartData={chartData} onDelete={handleDeleteWidget} onEdit={handleEditWidget} onResize={handleResizeWidget} editMode={editMode} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="glass-card p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <LayoutGrid size={24} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Your Dashboard is Empty</h3>
              <p className="text-slate-400 mb-6 max-w-sm">Add charts, graphs, or stat cards mapped to your IoT data fields.</p>
              <button onClick={handleAddWidget} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Add First Widget
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab Content: Connection Info ─── */}
      {activeTab === 'connection' && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-violet-400" /> Connection Instructions
          </h3>
          {bucket.mqtt_topic ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">MQTT Subscribe Topic (Listen to Devices)</p>
                  <p className="text-primary-400 font-mono text-sm">{bucket.mqtt_topic}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">MQTT Publish Topic (Send Commands)</p>
                  <p className="text-emerald-400 font-mono text-sm">iot/device/{bucket.id}/set</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Expected Payload Format (JSON)</p>
                  <pre className="text-amber-400 font-mono text-sm p-3 bg-slate-950 rounded-md overflow-x-auto border border-slate-800">
{`{
  ${bucket.fields?.map(f => `"${f}": 25.5`).join(',\n  ') || '"temperature": 25.5'}
}`}
                  </pre>
                  <p className="text-xs text-slate-500 mt-3">Ensure your device sends data matching this exact JSON schema.</p>
                </div>
                
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Example cURL Test</p>
                  <pre className="text-violet-400 font-mono text-sm p-3 bg-slate-950 rounded-md overflow-x-auto border border-slate-800 break-all whitespace-pre-wrap">
{`curl -X POST http://127.0.0.1:8000/api/v1/mqtt/publish \\
-H "Content-Type: application/json" \\
-d '{"topic": "${bucket.mqtt_topic}", "message": {${bucket.fields?.map(f => `"${f}": 25.5`).join(', ') || '"temperature": 25.5'}}}'`}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">REST API Endpoint</p>
              <p className="text-primary-400 font-mono text-sm">POST http://your-server/api/v1/buckets/{bucket.id}/records</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab Content: Raw Records ─── */}
      {activeTab === 'records' && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Database size={18} className="text-violet-400" /> Raw Records
            </h4>
            <button className="text-sm flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors">
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-800/80 uppercase">
                <tr>
                  <th className="px-4 py-4 font-medium">Timestamp</th>
                  {bucket.fields?.map(field => (
                    <th key={field} className="px-4 py-4 font-medium capitalize">{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((record, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{record.timestamp || record.recorded_at || 'Unknown'}</td>
                    {bucket.fields?.map(field => (
                      <td key={field} className="px-4 py-3 text-primary-400 font-mono">
                        {record[field] !== undefined ? record[field] : '-'}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr><td colSpan={100} className="px-4 py-12 text-center text-slate-500">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Add/Edit Widget Modal ─── */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-5xl my-auto animate-scale-in flex flex-col lg:flex-row max-h-[90vh]">
            
            {/* LEFT SIDE: FORM */}
            <div className="w-full lg:w-1/2 flex flex-col border-slate-700/50 lg:border-r overflow-y-auto">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{editingWidget ? 'Edit Widget' : 'Add Dashboard Widget'}</h3>
                  <p className="text-slate-400 text-sm mt-1">Configure visualization for your IoT data</p>
                </div>
                <button type="button" onClick={() => { setShowWidgetModal(false); setEditingWidget(null); }} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors lg:hidden">
                  <X size={20} />
                </button>
              </div>

              <form 
                onChange={handleFormChange}
                onSubmit={handleWidgetSubmit} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName === 'INPUT' && modalStep < 3) {
                  e.preventDefault();
                  setModalStep(s => s + 1);
                }
              }}
              className="p-6"
            >
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                {[
                  { step: 1, label: 'Widget Type' },
                  { step: 2, label: 'Appearance' },
                  { step: 3, label: 'Data & Config' }
                ].map(s => (
                  <div key={s.step} className={`flex items-center gap-2 ${modalStep === s.step ? 'text-primary-400' : (modalStep > s.step ? 'text-emerald-400' : 'text-slate-500')}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${modalStep === s.step ? 'bg-primary-500/20 ring-1 ring-primary-500/50' : (modalStep > s.step ? 'bg-emerald-500/20' : 'bg-slate-800')}`}>
                      {s.step}
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* STEP 1: Widget Type */}
              <div className={modalStep === 1 ? 'block space-y-5 min-h-[300px]' : 'hidden'}>
                <div>
                  <div className="space-y-4">
                    {/* Charts Group */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data Charts</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {CHART_TYPES.filter(c => c.category === 'chart').map(ct => {
                          const Icon = ct.icon;
                          return (
                            <label key={ct.value} className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="type"
                                value={ct.value}
                                defaultChecked={editingWidget ? editingWidget.type === ct.value : ct.value === 'line'}
                                onChange={(e) => setFormType(e.target.value)}
                                className="sr-only peer"
                              />
                              <div className="flex flex-col items-center justify-center p-3 h-[85px] rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400 peer-checked:border-primary-400/80 peer-checked:bg-primary-500/10 peer-checked:text-primary-400 peer-checked:shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:bg-slate-800 hover:border-slate-500 hover:text-slate-200 transition-all text-center">
                                <Icon size={26} strokeWidth={1.5} className="mb-2" />
                                <span className="text-[11px] font-medium leading-tight">{ct.label}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Components Group */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Components & Controls</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {CHART_TYPES.filter(c => c.category === 'widget').map(ct => {
                          const Icon = ct.icon;
                          return (
                            <label key={ct.value} className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="type"
                                value={ct.value}
                                defaultChecked={editingWidget ? editingWidget.type === ct.value : ct.value === 'line'}
                                onChange={(e) => setFormType(e.target.value)}
                                className="sr-only peer"
                              />
                              <div className="flex flex-col items-center justify-center p-3 h-[85px] rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400 peer-checked:border-fuchsia-400/80 peer-checked:bg-fuchsia-500/10 peer-checked:text-fuchsia-400 peer-checked:shadow-[0_0_15px_rgba(232,121,249,0.15)] hover:bg-slate-800 hover:border-slate-500 hover:text-slate-200 transition-all text-center">
                                <Icon size={26} strokeWidth={1.5} className="mb-2" />
                                <span className="text-[11px] font-medium leading-tight">{ct.label}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: Appearance */}
              <div className={modalStep === 2 ? 'block space-y-6 min-h-[300px]' : 'hidden'}>
                {/* Color Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Widget Color (Optional)</label>
                  
                  {/* Hidden input to ensure FormData captures the color */}
                  <input type="hidden" name="color" value={formColor} />

                  <div className="flex flex-col gap-4">
                    {/* Predefined Swatches */}
                    <div className="flex gap-3 flex-wrap items-center">
                      {[
                        { label: 'Auto (Default)', value: '' },
                        { label: 'Cyan', value: '#22d3ee' },
                        { label: 'Emerald', value: '#34d399' },
                        { label: 'Rose', value: '#f43f5e' },
                        { label: 'Violet', value: '#a78bfa' },
                        { label: 'Amber', value: '#fbbf24' },
                      ].map(c => (
                        <button
                          type="button"
                          key={c.label}
                          title={c.label}
                          onClick={() => setFormColor(c.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center shadow-lg ${
                            formColor === c.value 
                              ? 'border-white ring-2 ring-primary-500/50' 
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.value || '#334155' }}
                        >
                          {c.value === '' && <span className="text-[10px] text-slate-400 font-medium">Auto</span>}
                        </button>
                      ))}
                    </div>

                    {/* Custom Color Picker & Text Input */}
                    <div className="flex gap-3 items-center">
                      <div 
                        className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-600 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500"
                        title="Custom Color Picker"
                      >
                        <input
                          type="color"
                          value={formColor || '#22d3ee'}
                          onChange={(e) => setFormColor(e.target.value)}
                          className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        placeholder="Auto (#hexcode)"
                        className="input-field max-w-[150px]"
                      />
                      {formColor && (
                        <button 
                          type="button" 
                          onClick={() => setFormColor('')} 
                          className="text-xs text-slate-400 hover:text-rose-400"
                        >
                          Clear (Auto)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Widget Width</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZE_OPTIONS.map(sz => (
                      <label key={sz.value} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="w"
                          value={sz.value}
                          defaultChecked={editingWidget ? editingWidget.w === sz.value : sz.value === '1'}
                          className="sr-only peer"
                        />
                        <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 peer-checked:border-violet-400/70 peer-checked:bg-violet-500/10 peer-checked:text-violet-300 hover:border-slate-500 transition-all text-center">
                          <div className="flex gap-0.5">
                            {Array.from({ length: sz.cols }).map((_, i) => (
                              <div key={i} className="w-4 h-4 rounded-sm bg-current opacity-70" />
                            ))}
                            {Array.from({ length: 3 - sz.cols }).map((_, i) => (
                              <div key={i} className="w-4 h-4 rounded-sm bg-slate-600 opacity-30" />
                            ))}
                          </div>
                          <span className="text-[10px] font-medium">{sz.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Widget Height</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'normal', label: 'Normal', icon: <Minimize2 size={16} /> }, { value: 'tall', label: 'Tall', icon: <Maximize2 size={16} /> }].map(h => (
                      <label key={h.value} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="h"
                          value={h.value}
                          defaultChecked={editingWidget ? editingWidget.h === h.value : h.value === 'normal'}
                          className="sr-only peer"
                        />
                        <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 peer-checked:border-emerald-400/70 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300 hover:border-slate-500 transition-all">
                          {h.icon}
                          <span className="text-sm font-medium">{h.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* STEP 3: Data & Config */}
              <div className={modalStep === 3 ? 'block space-y-5 min-h-[300px]' : 'hidden'}>
                
                {formType !== 'combo' ? (
                  <>
                    {/* Standard Widget Config */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Widget Title</label>
                      <input name="title" type="text" defaultValue={editingWidget?.title || ''} placeholder="e.g. Temperature Over Time" className="input-field w-full" />
                    </div>

                    {['line', 'area', 'bar', 'radar'].includes(formType) ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Data Fields (Multi-select)</label>
                        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 max-h-48 overflow-y-auto custom-scrollbar">
                          {bucket.fields?.map((f, idx) => {
                            const isChecked = (previewWidget || editingWidget)?.config?.fields?.includes(f) || false;
                            return (
                              <div key={f} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white flex-1">
                                  <input 
                                    type="checkbox" 
                                    name="multiFields" 
                                    value={f} 
                                    defaultChecked={editingWidget?.config?.fields?.includes(f) || false}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-slate-900" 
                                  />
                                  <span className="truncate">{f}</span>
                                </label>
                                {isChecked && (
                                  <input 
                                    type="color" 
                                    name={`color_${f}`} 
                                    defaultValue={editingWidget?.config?.fieldColors?.[f] || getColor(idx)} 
                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Data Field</label>
                        <select name="field" defaultValue={editingWidget?.field || bucket.fields?.[0] || ''} className="input-field w-full appearance-none" required={formType !== 'combo'}>
                          {bucket.fields?.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    )}

                    {(formType === 'stat' || formType === 'gauge') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                        <input name="unit" type="text" defaultValue={editingWidget?.unit || ''} placeholder="e.g. °C, %, ppm" className="input-field w-full" />
                      </div>
                    )}
                    
                    {formType === 'gauge' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-2">Min Value</label><input name="min" type="number" defaultValue={editingWidget?.config?.min || 0} className="input-field w-full" /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-2">Max Value</label><input name="max" type="number" defaultValue={editingWidget?.config?.max || 100} className="input-field w-full" /></div>
                      </div>
                    )}

                    {['stat', 'gauge', 'line', 'bar', 'area'].includes(formType) && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Critical Threshold</label>
                          <p className="text-[10px] text-slate-500 mb-2">Change color if value &ge; this</p>
                          <input name="alertThreshold" type="number" step="any" defaultValue={editingWidget?.config?.alertThreshold || ''} placeholder="e.g. 80" className="input-field w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Alert Color</label>
                          <p className="text-[10px] text-slate-500 mb-2">Color when threshold is met</p>
                          <div className="flex gap-2 items-center">
                            <input name="alertColor" type="color" defaultValue={editingWidget?.config?.alertColor || '#ef4444'} className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 p-1" />
                            <span className="text-xs text-slate-400">Pick color</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formType === 'status' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-2">On Label (1, true)</label><input name="onLabel" type="text" defaultValue={editingWidget?.config?.onLabel || 'Online'} className="input-field w-full" /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-2">Off Label (0, false)</label><input name="offLabel" type="text" defaultValue={editingWidget?.config?.offLabel || 'Offline'} className="input-field w-full" /></div>
                      </div>
                    )}
                    
                    {formType === 'switch' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target MQTT Topic</label>
                        <input name="topic" type="text" defaultValue={editingWidget?.config?.topic || `iot/device/${bucket.id}/set`} placeholder="e.g. home/livingroom/light/set" className="input-field w-full" />
                      </div>
                    )}

                    {formType === 'slider' && (
                      <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-2">Target MQTT Topic</label><input name="topic" type="text" defaultValue={editingWidget?.config?.topic || `iot/device/${bucket.id}/set`} className="input-field w-full" /></div>
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className="block text-sm font-medium text-slate-300 mb-2">Min</label><input name="min" type="number" defaultValue={editingWidget?.config?.min || 0} className="input-field w-full" /></div>
                          <div><label className="block text-sm font-medium text-slate-300 mb-2">Max</label><input name="max" type="number" defaultValue={editingWidget?.config?.max || 100} className="input-field w-full" /></div>
                          <div><label className="block text-sm font-medium text-slate-300 mb-2">Step</label><input name="step" type="number" step="any" defaultValue={editingWidget?.config?.step || 1} className="input-field w-full" /></div>
                        </div>
                      </div>
                    )}

                    {formType === 'action' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><label className="block text-sm font-medium text-slate-300 mb-2">Target MQTT Topic</label><input name="topic" type="text" defaultValue={editingWidget?.config?.topic || `iot/device/${bucket.id}/set`} className="input-field w-full" /></div>
                          <div><label className="block text-sm font-medium text-slate-300 mb-2">Button Label</label><input name="btnLabel" type="text" defaultValue={editingWidget?.config?.btnLabel || 'Trigger'} className="input-field w-full" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-2">Payload (Text / JSON)</label><input name="payload" type="text" defaultValue={editingWidget?.config?.payload || '1'} className="input-field w-full font-mono text-sm" placeholder='e.g. {"cmd": "start"}' /></div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Combo Widget Config */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Widget Title</label>
                      <input name="title" type="text" defaultValue={editingWidget?.title || ''} placeholder="e.g. Temp & Heater Control" className="input-field w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Layout</label>
                      <select name="layout" defaultValue={editingWidget?.config?.layout || 'split'} className="input-field w-full appearance-none">
                        <option value="split">Split Horizontal (Side-by-side)</option>
                        <option value="stack">Stack Vertical (Top/Bottom)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                      {/* Sub-Widget A */}
                      <div className="space-y-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
                        <h4 className="text-sm font-bold text-primary-400">Widget A (Left/Top)</h4>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                          <select name="typeA" defaultValue={editingWidget?.config?.widgetA?.type || 'gauge'} className="input-field w-full py-1.5 px-3 text-xs appearance-none">
                            {CHART_TYPES.filter(t => t.value !== 'combo').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Data Field</label>
                          <select name="fieldA" defaultValue={editingWidget?.config?.widgetA?.field || bucket.fields?.[0] || ''} className="input-field w-full py-1.5 px-3 text-xs appearance-none">
                            {bucket.fields?.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="block text-[10px] text-slate-500 mb-1">Min/Unit/On</label><input name="minA" type="text" defaultValue={editingWidget?.config?.widgetA?.config?.min || editingWidget?.config?.widgetA?.unit || ''} className="input-field w-full py-1 px-2 text-xs" /></div>
                          <div><label className="block text-[10px] text-slate-500 mb-1">Max/Topic/Off</label><input name="maxA" type="text" defaultValue={editingWidget?.config?.widgetA?.config?.max || editingWidget?.config?.widgetA?.config?.topic || ''} className="input-field w-full py-1 px-2 text-xs" /></div>
                        </div>
                      </div>

                      {/* Sub-Widget B */}
                      <div className="space-y-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
                        <h4 className="text-sm font-bold text-emerald-400">Widget B (Right/Bottom)</h4>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                          <select name="typeB" defaultValue={editingWidget?.config?.widgetB?.type || 'switch'} className="input-field w-full py-1.5 px-3 text-xs appearance-none">
                            {CHART_TYPES.filter(t => t.value !== 'combo').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Data Field</label>
                          <select name="fieldB" defaultValue={editingWidget?.config?.widgetB?.field || bucket.fields?.[0] || ''} className="input-field w-full py-1.5 px-3 text-xs appearance-none">
                            {bucket.fields?.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="block text-[10px] text-slate-500 mb-1">Min/Unit/On</label><input name="minB" type="text" defaultValue={editingWidget?.config?.widgetB?.config?.min || editingWidget?.config?.widgetB?.unit || ''} className="input-field w-full py-1 px-2 text-xs" /></div>
                          <div><label className="block text-[10px] text-slate-500 mb-1">Max/Topic/Off</label><input name="maxB" type="text" defaultValue={editingWidget?.config?.widgetB?.config?.max || editingWidget?.config?.widgetB?.config?.topic || ''} className="input-field w-full py-1 px-2 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="pt-6 mt-6 flex justify-between gap-3 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => {
                    if (modalStep > 1) {
                      setModalStep(s => s - 1);
                    } else {
                      setShowWidgetModal(false);
                      setEditingWidget(null);
                    }
                  }}
                  className="btn-secondary px-6"
                  disabled={submitting}
                >
                  {modalStep > 1 ? 'Back' : 'Cancel'}
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStep(s => s + 1)}
                    className={`btn-primary px-6 ${modalStep < 3 ? 'block' : 'hidden'}`}
                  >
                    Next Step
                  </button>

                  <button
                    type="submit"
                    className={`btn-primary px-6 flex items-center gap-2 min-w-[130px] justify-center ${modalStep === 3 ? 'block' : 'hidden'}`}
                    disabled={!bucket.fields || bucket.fields.length === 0 || submitting}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      editingWidget ? 'Save Changes' : 'Add Widget'
                    )}
                  </button>
                </div>
              </div>
            </form>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW */}
            <div className="w-full lg:w-1/2 p-6 flex flex-col bg-slate-900/50 rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                  <Maximize2 size={18} className="text-emerald-400" /> Live Preview
                </h3>
                <button type="button" onClick={() => { setShowWidgetModal(false); setEditingWidget(null); }} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors hidden lg:block">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center relative min-h-[350px]">
                {previewWidget ? (() => {
                  const fieldsToMock = [
                    previewWidget.field,
                    previewWidget.config?.widgetA?.field,
                    previewWidget.config?.widgetB?.field,
                    ...(bucket?.fields || [])
                  ].filter(Boolean);

                  const previewData = (chartData && chartData.length > 0) ? chartData : Array.from({ length: 10 }).map((_, i) => {
                    const row = { timestamp: `10:0${i}` };
                    fieldsToMock.forEach(f => { row[f] = 20 + i * 5 + Math.floor(Math.random() * 10); });
                    return row;
                  });

                  return (
                    <div className="w-full max-w-md pointer-events-none transition-all">
                      <WidgetChart widget={previewWidget} chartData={previewData} color={formColor || previewWidget?.config?.color || undefined} />
                    </div>
                  );
                })() : (
                  <div className="text-center text-slate-500 animate-pulse">
                    <Maximize2 size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Select a widget type to preview</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-slate-500 mt-4 shrink-0">
                {chartData?.length > 0 ? 'Preview uses actual live data from your bucket.' : 'Preview uses simulated data (bucket has no records yet).'}
              </p>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
