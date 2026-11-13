import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Database, Activity, Clock, Cpu, Download, Plus, X, Trash2,
  LayoutGrid, GripVertical, ChevronRight, Settings, Move, Maximize2, Minimize2,
  LineChart as LineChartIcon, BarChart2 as BarChartIcon, BarChart3,
  PieChart as PieChartIcon, Activity as AreaChartIcon, Radar as RadarChartIcon,
  Hash, Gauge as GaugeIcon, Radio, ToggleRight, MapPin, CircleDashed,
  SlidersHorizontal, Zap, Terminal, Layers, Sparkles, TrendingUp, Check,
  Palette, Tag, Eye, Info, Box, Flame, ArrowRight as ArrowRightIcon,
  Boxes, FolderInput, LogOut, ExternalLink, Pin, PinOff
} from 'lucide-react';
import { bucketsApi, mqttApi } from '../services/api';
import { PREF_KEYS, getUserJsonPref, setUserJsonPref } from '../utils/dashboardPrefs';
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
import {
  AreaChart as BklitAreaChart,
  Area as BklitArea,
  BarChart as BklitBarChart,
  Bar as BklitBar,
  BarSquares as BklitBarSquares,
  LineChart as BklitLineChart,
  Line as BklitLine,
  Band as BklitBand,
  PatternArea as BklitPatternArea,
  PatternPreset as BklitPatternPreset,
  ProjectionLine as BklitProjectionLine,
  Gauge as BklitGauge,
  PieChart as BklitPieChart,
  PieSlice as BklitPieSlice,
  PieCenter as BklitPieCenter,
  RingChart as BklitRingChart,
  Ring as BklitRing,
  RingCenter as BklitRingCenter,
  RingGrid as BklitRingGrid,
  RingLabels as BklitRingLabels,
  RadarChart as BklitRadarChart,
  RadarGrid as BklitRadarGrid,
  RadarAxis as BklitRadarAxis,
  RadarLabels as BklitRadarLabels,
  RadarArea as BklitRadarArea,
  RadialChart as BklitRadialChart,
  RadialBar as BklitRadialBar,
  RadialDotBar as BklitRadialDotBar,
  RadialRingBar as BklitRadialRingBar,
  RadialAxis as BklitRadialAxis,
  RadialCenter as BklitRadialCenter,
  ScatterChart as BklitScatterChart,
  Scatter as BklitScatter,
  ComposedChart as BklitComposedChart,
  SeriesBar as BklitSeriesBar,
  TrendLine as BklitTrendLine,
  FunnelChart as BklitFunnelChart,
  LiveLineChart as BklitLiveLineChart,
  LiveLine as BklitLiveLine,
  LiveXAxis as BklitLiveXAxis,
  LiveYAxis as BklitLiveYAxis,
  CandlestickChart as BklitCandlestickChart,
  Candlestick as BklitCandlestick,
  AreaSparkline as BklitAreaSparkline,
  LineSparkline as BklitLineSparkline,
  BarSparkline as BklitBarSparkline,
  Grid as BklitGrid,
  XAxis as BklitXAxis,
  ChartTooltip as BklitChartTooltip,
  curveNatural,
  curveMonotoneX,
  curveStep,
  curveLinear,
} from '../components/Charts/bklit';
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
  DndContext, closestCenter, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';

// ─── Chart color palette ───────────────────────────────────────────────────
const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#fb923c', '#a78bfa'];
const getColor = (i) => COLORS[i % COLORS.length];

export const MULTI_SERIES_TYPES = [
  'line', 'area', 'bar', 'radar', 'radial', 'scatter', 'composed',
  'barsquares', 'band', 'patternarea', 'projection', 'donut', 'pie',
  'candlestick', 'liveline', 'sparkline', 'funnel',
];
export const NUMERIC_TYPES = [
  'stat', 'gauge', 'line', 'bar', 'area', 'barsquares', 'band',
  'patternarea', 'projection', 'pie', 'donut', 'radar', 'radial',
  'scatter', 'composed', 'funnel', 'liveline', 'candlestick', 'sparkline',
];

export const CHART_VARIANTS = {
  container: [
    { id: 'grid-2', label: 'Grid 2 Kolom', short: '2 Col', desc: 'Dua kolom responsif berdampingan' },
    { id: 'grid-3', label: 'Grid 3 Kolom', short: '3 Col', desc: 'Tiga kolom rapi berdampingan' },
    { id: 'stack', label: 'Vertikal Stack', short: 'Stack', desc: 'Satu kolom bertumpuk ke bawah' },
    { id: 'flex-row', label: 'Baris Fleksibel', short: 'Wrap', desc: 'Aliran horizontal fleksibel' },
  ],
  gauge: [
    { id: 'notches', label: 'Notch Arc Dial', short: 'Notches', desc: 'Takik presisi melingkar dengan pendaran glow' },
    { id: 'needle', label: 'Speedometer Needle', short: 'Needle', desc: 'Jarum penunjuk + penggaris skala + zona aman' },
    { id: 'solid', label: 'Solid Neon Ring', short: 'Solid Arc', desc: 'Busur utuh dengan sektor gradien & progress ring' },
    { id: 'dots', label: 'Radar Dots Matrix', short: 'Radar Dots', desc: 'Cincin titik-titik matriks konsentris' },
    { id: 'linear', label: 'Linear Track Bar', short: 'Linear', desc: 'Bar indikator segmen horizontal presisi' },
  ],
  bar: [
    { id: 'rounded', label: 'Neon Rounded', short: 'Rounded', desc: 'Batang membulat halus standar' },
    { id: 'squares', label: 'Matrix Equalizer', short: 'Matrix', desc: 'Blok matriks digital audio/telemetri (BarSquares)' },
    { id: 'perspective', label: '3D Depth', short: '3D Depth', desc: 'Efek kedalaman isometrik 3D' },
    { id: 'minimal', label: 'Flat Minimal', short: 'Flat', desc: 'Garis batang sudut datar presisi' },
  ],
  line: [
    { id: 'glow', label: 'Cyberpunk Glow', short: 'Neon Glow', desc: 'Glow neon bercahaya luar' },
    { id: 'natural', label: 'Smooth Spline', short: 'Smooth', desc: 'Kurva lengkung halus alami' },
    { id: 'stepped', label: 'Digital Step', short: 'Step Pulse', desc: 'Undakan digital (relay/state sensor)' },
    { id: 'linear', label: 'Linear Direct', short: 'Linear', desc: 'Garis lurus presisi point-to-point' },
  ],
  area: [
    { id: 'smooth', label: 'Smooth Gradient', short: 'Smooth', desc: 'Ombak gelombang gradien halus' },
    { id: 'stepped', label: 'Digital Wave', short: 'Step Wave', desc: 'Area undakan digital bertingkat' },
    { id: 'linear', label: 'Geometric Polygon', short: 'Polygon', desc: 'Poligon tajam langsung' },
  ],
  pie: [
    { id: 'solid', label: 'Solid Pie', short: 'Solid', desc: 'Diagram lingkaran penuh interaktif' },
    { id: 'exploded', label: 'Exploded Slices', short: 'Exploded', desc: 'Potongan membulat berjarak dengan label tengah' },
    { id: 'semi', label: 'Semi-Circle Dial', short: 'Semi Arc', desc: 'Setengah lingkaran setengah busur' },
  ],
  donut: [
    { id: 'rings', label: 'Activity Rings', short: 'Rings', desc: 'Cincin konsentris berlapis (Bklit RingChart)' },
    { id: 'grid', label: 'Technical Ring Grid', short: 'Ring Grid', desc: 'Cincin dengan garis kisi & label metrik' },
    { id: 'donut', label: 'Hollow Donut', short: 'Donut', desc: 'Lingkaran cincin tengah berlubang' },
  ],
  radar: [
    { id: 'glow', label: 'Neon Polygon', short: 'Neon Glow', desc: 'Jaring laba-laba poligon dengan titik menyala' },
    { id: 'minimal', label: 'Wireframe Mesh', short: 'Wireframe', desc: 'Garis vektor jaring bersih' },
  ],
  radial: [
    { id: 'bars', label: 'Polar Radial Bars', short: 'Radial Bar', desc: 'Batang melingkar polar 360 derajat' },
    { id: 'dots', label: 'Polar Dot Matrix', short: 'Dot Matrix', desc: 'Titik-titik polar matriks melingkar' },
    { id: 'rings', label: 'Polar Ring Arcs', short: 'Ring Arc', desc: 'Busur cincin polar bertingkat' },
  ],
  scatter: [
    { id: 'rings', label: 'Pulse Rings', short: 'Rings', desc: 'Titik sebaran dengan cincin halo luar' },
    { id: 'jitter', label: 'Cluster Jitter', short: 'Jitter', desc: 'Sebaran klaster terdistribusi' },
  ],
  composed: [
    { id: 'barline', label: 'Bar + Line + Trend', short: 'Bar+Line', desc: 'Kombinasi batang, garis & garis tren' },
    { id: 'bararea', label: 'Bar + Area Wave', short: 'Bar+Area', desc: 'Kombinasi batang & ombak gradien' },
  ],
  funnel: [
    { id: 'horizontal', label: 'Horizontal Halo', short: 'Horizontal', desc: 'Corong tahapan berlapis horizontal' },
    { id: 'vertical', label: 'Vertical Cascade', short: 'Vertical', desc: 'Corong tahapan bertingkat vertikal' },
  ],
  liveline: [
    { id: 'smooth', label: 'Live Smooth Stream', short: 'Smooth', desc: 'Aliran kurva real-time bergerak' },
    { id: 'step', label: 'Live Step Pulse', short: 'Step', desc: 'Pulsa digital real-time bergerak' },
  ],
  sparkline: [
    { id: 'area', label: 'Area Sparkline', short: 'Area', desc: 'Sparkline gradien area kompak' },
    { id: 'line', label: 'Line Sparkline', short: 'Line', desc: 'Sparkline garis dengan titik akhir' },
    { id: 'bar', label: 'Bar Sparkline', short: 'Bar', desc: 'Sparkline batang mikro' },
  ],
  band: [
    { id: 'gradient', label: 'Soft Gradient', short: 'Gradient', desc: 'Gradien pendaran batas toleransi' },
    { id: 'solid', label: 'Solid Fill', short: 'Solid', desc: 'Pewarnaan zona batas tegas' },
  ],
  patternarea: [
    { id: 'diagonal', label: 'Diagonal Lines', short: 'Diagonal', desc: 'Arsir garis miring presisi' },
    { id: 'dots', label: 'Matrix Dots', short: 'Dots', desc: 'Pola titik-titik matriks modern' },
    { id: 'grid', label: 'Tech Grid', short: 'Grid', desc: 'Kisi-kisi mesh teknik' },
  ],
  projection: [
    { id: 'forecast', label: 'Forecast Horizon', short: 'Forecast', desc: 'Garis proyeksi prediksi masa depan' },
    { id: 'momentum', label: 'Linear Slope', short: 'Slope', desc: 'Kemiringan momentum linier' },
  ],
  barsquares: [
    { id: 'matrix', label: 'Equalizer Blocks', short: 'Matrix', desc: 'Blok equalizer audio digital' },
    { id: 'compact', label: 'Compact Cubes', short: 'Compact', desc: 'Kubus kubik telemetri padat' },
  ],
};

export const CHART_TYPES = [
  // ── Kurva Waktu & Aliran ──
  { value: 'line', label: 'Line Chart', icon: LineChartIcon, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Kurva telemetri glow neon / smooth' },
  { value: 'area', label: 'Area Wave', icon: AreaChartIcon, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Ombak gradien telemetri terisi' },
  { value: 'band', label: 'Tolerance Band', icon: Layers, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Rentang toleransi batas atas & bawah' },
  { value: 'patternarea', label: 'Pattern Mesh', icon: Sparkles, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Arsiran tekstur geometris teknikal' },
  { value: 'projection', label: 'Projection Line', icon: TrendingUp, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Prediksi tren dan estimasi waktu depan' },
  { value: 'liveline', label: 'Live Stream Line', icon: Activity, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Aliran live streaming dengan denyut pulsa' },
  { value: 'sparkline', label: 'Micro Sparkline', icon: Zap, category: 'chart', group: 'curves', badge: 'Bklit', desc: 'Sparkline mini hemat ruang interaktif' },

  // ── Batang & Hybrid ──
  { value: 'bar', label: 'Bar Chart', icon: BarChartIcon, category: 'chart', group: 'bars', badge: 'Bklit', desc: 'Batang membulat atau perspektif 3D' },
  { value: 'barsquares', label: 'Matrix Equalizer', icon: BarChart3, category: 'chart', group: 'bars', badge: 'Bklit', desc: 'Blok equalizer audio digital telemetri' },
  { value: 'composed', label: 'Composed Hybrid', icon: Layers, category: 'chart', group: 'bars', badge: 'Bklit', desc: 'Kombinasi batang + garis + tren linier' },
  { value: 'candlestick', label: 'Candlestick OHLC', icon: BarChartIcon, category: 'chart', group: 'bars', badge: 'Bklit', desc: 'Grafik lilin dinamika rentang fluktuasi' },

  // ── Distribusi & Polar ──
  { value: 'pie', label: 'Pie Chart', icon: PieChartIcon, category: 'chart', group: 'distribution', badge: 'Bklit', desc: 'Diagram lingkaran solid atau exploded' },
  { value: 'donut', label: 'Ring / Donut Chart', icon: CircleDashed, category: 'chart', group: 'distribution', badge: 'Bklit', desc: 'Cincin konsentris aktivitas (RingChart)' },
  { value: 'radar', label: 'Radar Spider', icon: RadarChartIcon, category: 'chart', group: 'distribution', badge: 'Bklit', desc: 'Jaring laba-laba multi-dimensi metrik' },
  { value: 'radial', label: 'Polar Radial Chart', icon: RadarChartIcon, category: 'chart', group: 'distribution', badge: 'Bklit', desc: 'Batang melingkar radial polar 360°' },
  { value: 'scatter', label: 'Scatter Plot', icon: CircleDashed, category: 'chart', group: 'distribution', badge: 'Bklit', desc: 'Sebaran titik korelasi & klaster jitter' },
  { value: 'funnel', label: 'Funnel Stage', icon: TrendingUp, category: 'chart', group: 'distribution', badge: 'Bklit', desc: 'Corong tahapan proses bertingkat' },

  // ── Kontrol & Telemetri IoT ──
  { value: 'gauge', label: 'Gauge Meter', icon: GaugeIcon, category: 'widget', group: 'controls', badge: 'Bklit', desc: 'Speedometer takik melingkar / jarum' },
  { value: 'stat', label: 'Value / Stat + Spark', icon: Hash, category: 'widget', group: 'controls', badge: 'Bklit', desc: 'Nilai angka besar + mini sparkline' },
  { value: 'status', label: 'Status Indicator', icon: Radio, category: 'widget', group: 'controls', badge: null, desc: 'Indikator normal / waspada / bahaya' },
  { value: 'switch', label: 'Relay Switch', icon: ToggleRight, category: 'widget', group: 'controls', badge: null, desc: 'Saklar toggle pengontrol relay MQTT' },
  { value: 'container', label: 'Container Group', icon: Boxes, category: 'widget', group: 'controls', badge: 'Multi-Drop', desc: 'Wadah grup untuk mengelompokkan & drag beberapa widget ke dalamnya' },
  { value: 'map', label: 'GPS Geolocation', icon: MapPin, category: 'widget', group: 'controls', badge: null, desc: 'Peta pelacakan koordinat GPS leaflet' },
  { value: 'slider', label: 'Analog Slider', icon: SlidersHorizontal, category: 'widget', group: 'controls', badge: null, desc: 'Penggeser rentang nilai analog realtime' },
  { value: 'action', label: 'Action Button', icon: Zap, category: 'widget', group: 'controls', badge: null, desc: 'Tombol eksekusi perintah payload instan' },
  { value: 'log', label: 'Log Console', icon: Terminal, category: 'widget', group: 'controls', badge: null, desc: 'Terminal konsol streaming log sensor' },
];

const SIZE_OPTIONS = [
  { value: '1', label: 'Small (1 col)', cols: 1 },
  { value: '2', label: 'Medium (2 cols)', cols: 2 },
  { value: '3', label: 'Large (3 cols)', cols: 3 },
];

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(parseFloat(value) || 0);

  useEffect(() => {
    const target = parseFloat(value);
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }
    const start = prevRef.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.001) {
      setDisplayValue(value);
      return;
    }

    const duration = 800; // ms
    const startTime = performance.now();

    let animationFrameId;
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // EaseOutCubic function: 1 - Math.pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * ease;

      // Keep matching decimals
      const isDecimal = String(value).includes('.');
      const decimals = isDecimal ? String(value).split('.')[1].length : 0;
      setDisplayValue(decimals > 0 ? current.toFixed(Math.min(decimals, 2)) : Math.round(current));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <span>{displayValue}</span>;
}

// ─── Stateful Widget Components (Vision UI Style) ──────────────────────────
function SwitchWidget({ widget, latestVal }) {
  const initialIsOn = String(latestVal).toLowerCase() === '1' || String(latestVal).toLowerCase() === 'on' || String(latestVal) === 'true';
  const switchColor = widget.config?.color || 'rgb(var(--primary-500))';

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

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const activeArc = isOn ? arcLength : arcLength * 0.08;

  return (
    <div className="flex items-center justify-between gap-4 h-full px-2">
      <div className="flex flex-col gap-2.5 w-[48%]">
        <div className="vision-inner-box p-3">
          <p className="text-[10px] font-medium text-slate-400">State</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[14px] font-extrabold text-slate-100">
              {isOn ? (widget.config?.onLabel || 'ON') : (widget.config?.offLabel || 'OFF')}
            </span>
          </div>
        </div>
        <div className="vision-inner-box p-3">
          <p className="text-[10px] font-medium text-slate-400">Field</p>
          <p className="text-[12px] font-bold text-slate-200 uppercase truncate mt-0.5">{widget.field}</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center flex-1">
        <svg width="132" height="132" viewBox="0 0 132 132" className="transform rotate-[135deg]">
          <circle
            cx="66" cy="66" r={radius}
            fill="none" stroke="rgb(var(--surface-700))" strokeWidth="9"
            strokeDasharray={`${arcLength} ${circumference}`} strokeLinecap="round"
          />
          <circle
            cx="66" cy="66" r={radius}
            fill="none" stroke={switchColor} strokeWidth="9"
            strokeDasharray={`${activeArc} ${circumference}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease-out', opacity: isOn ? 1 : 0.3 }}
          />
        </svg>
        <button
          onClick={handleToggle}
          disabled={sending}
          className={`absolute w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 focus:outline-none cursor-pointer disabled:opacity-50 active:scale-95 ${
            isOn ? 'text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
          style={isOn ? { backgroundColor: switchColor, boxShadow: `0 0 20px ${switchColor}80` } : {}}
        >
          <Zap size={18} />
          <span className="text-[9px] font-extrabold uppercase mt-0.5">
            {isOn ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
}

function SliderWidget({ widget, latestVal }) {
  const min = parseFloat(widget.config?.min) || 0;
  const max = parseFloat(widget.config?.max) || 100;
  const step = parseFloat(widget.config?.step) || 1;
  const sliderColor = widget.config?.color || 'rgb(var(--primary-500))';

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

  const percent = Math.max(0, Math.min(100, ((sliderVal - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col justify-between h-full px-3 py-2 w-full">
      <div className="vision-inner-box p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{widget.field}</p>
          <p className="text-[28px] font-extrabold text-slate-100 leading-tight mt-0.5 tabular-nums">
            {sliderVal}
            {widget.unit && <span className="text-[14px] font-bold text-primary-400 ml-1">{widget.unit}</span>}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
          style={{ background: sliderColor, boxShadow: `0 4px 12px ${sliderColor}60` }}
        >
          <SlidersHorizontal size={18} />
        </div>
      </div>

      <div className="my-auto pt-4">
        <input
          type="range"
          min={min} max={max} step={step}
          value={sliderVal}
          onChange={(e) => setSliderVal(parseFloat(e.target.value))}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={sending}
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer disabled:opacity-50 outline-none transition-all duration-300"
          style={{
            background: `linear-gradient(to right, ${sliderColor} ${percent}%, rgb(var(--surface-700)) ${percent}%)`,
          }}
        />
        <div className="flex justify-between w-full text-[11px] text-slate-400 font-semibold mt-2.5">
          <span>{min}{widget.unit || ''}</span>
          <span className="text-primary-400 font-bold">{Math.round(percent)}%</span>
          <span>{max}{widget.unit || ''}</span>
        </div>
      </div>
    </div>
  );
}

function ActionWidget({ widget }) {
  const btnColor = widget.config?.color || 'rgb(var(--primary-500))';
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
    <div className="flex flex-col items-center justify-between h-full py-2 gap-3">
      <div className="my-auto flex items-center justify-center">
        <button
          onClick={handleClick}
          disabled={sending}
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 focus:outline-none"
          style={{
            background: btnColor,
            boxShadow: `0 0 28px ${btnColor}70`,
          }}
        >
          {sending ? (
            <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <Zap size={28} className="mb-1" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">PUSH</span>
            </>
          )}
        </button>
      </div>
      <div className="vision-inner-box w-full px-4 py-2.5 flex items-center justify-between">
        <span className="text-[12px] font-bold text-slate-200 truncate">
          {widget.config?.btnLabel || 'Trigger Action'}
        </span>
        <span className="text-[10px] font-mono text-primary-400">
          payload: {widget.config?.payload || '1'}
        </span>
      </div>
    </div>
  );
}

// ─── Single Widget Renderer (Vision UI Style) ───────────────────────────────
export function WidgetChart({ widget, chartData: rawChartData, color, overrideVariant }) {
  const isTall = widget?.h === 'tall';
  const isCompact = widget?.h === 'compact';
  const h = isTall ? 290 : isCompact ? 135 : 200;
  const unit = widget?.unit || '';

  // 1. Ensure chartData is safely formatted with valid Date objects, numeric fields, and strictly chronological order
  const chartData = useMemo(() => {
    if (!rawChartData || !Array.isArray(rawChartData) || rawChartData.length === 0) return [];

    const getMs = (item) => {
      if (item?.date instanceof Date && !isNaN(item.date.getTime())) return item.date.getTime();
      const raw = item?.timestamp || item?.recorded_at || item?.created_at;
      if (raw) {
        const t = new Date(raw).getTime();
        if (!isNaN(t)) return t;
      }
      return null;
    };

    // Sort strictly chronological (oldest to newest) to avoid reverse oscillations and loops
    const list = [...rawChartData].sort((a, b) => {
      const ta = getMs(a);
      const tb = getMs(b);
      if (ta !== null && tb !== null && ta !== tb) return ta - tb;
      if (a?.id && b?.id && a.id !== b.id) return a.id - b.id;
      return 0;
    });

    const lastItem = list[list.length - 1];
    const lastRaw = lastItem?.timestamp || lastItem?.recorded_at || lastItem?.created_at;
    const parsedLast = lastRaw ? new Date(lastRaw).getTime() : NaN;
    const endMs = !isNaN(parsedLast)
      ? parsedLast
      : (lastItem?.date instanceof Date && !isNaN(lastItem.date.getTime()) ? lastItem.date.getTime() : Date.now());
    const intervalMs = 60000; // 1-minute uniform spacing avoids multi-hour gaps compressing points into vertical line spikes

    const result = list.map((r, idx) => {
      // Equidistant date across width prevents clustering and vertical tail drops
      const d = new Date(endMs - (list.length - 1 - idx) * intervalMs);

      const point = {
        ...r,
        date: d,
        timestamp: r?.timestamp || r?.recorded_at || r?.created_at || `#${idx + 1}`,
      };

      // Ensure ALL numeric telemetry fields are converted to float numbers (no string parsing drops to 0)
      Object.keys(point).forEach((k) => {
        if (!['id', 'bucket_id', 'date', 'timestamp', 'created_at', 'updated_at', 'recorded_at', 'is_mock'].includes(k)) {
          if (point[k] !== undefined && point[k] !== null && typeof point[k] !== 'object') {
            const num = parseFloat(point[k]);
            if (!isNaN(num)) {
              point[k] = num;
            }
          }
        }
      });

      return point;
    });

    // Ensure at least 2 points for time-series charts to prevent single-point domain collapse
    if (result.length === 1) {
      const p0 = result[0];
      const priorDate = new Date(p0.date.getTime() - 60000);
      return [{ ...p0, date: priorDate, timestamp: '1m ago' }, p0];
    }

    return result;
  }, [rawChartData, widget?.config?.fields, widget?.field]);

  if (widget?.type === 'container') {
    const layout = overrideVariant || widget.config?.layout || 'grid-2';
    return (
      <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed border-primary-500/30 bg-gradient-to-b from-primary-500/5 to-transparent">
        <div className="w-12 h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(var(--primary-500),0.25)]">
          <Boxes size={24} />
        </div>
        <h5 className="text-sm font-extrabold text-slate-100 mb-1">{widget.title || 'Container Group'}</h5>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Wadah grup multi-widget • Layout: <span className="text-primary-400 font-semibold">{layout}</span>. Tarik widget lain ke dalam container ini pada dashboard.
        </p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6">
        <Database size={24} className="mb-2 opacity-40 animate-pulse text-primary-400" />
        <p className="text-xs font-semibold text-slate-400">Belum ada data telemetri</p>
      </div>
    );
  }

  const isMulti = MULTI_SERIES_TYPES.includes(widget?.type);

  // Available telemetry sensor keys in chartData (ignoring system timestamps and IDs)
  const availableSensorFields = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return Object.keys(chartData[0]).filter(k =>
      !['id', 'bucket_id', 'date', 'timestamp', 'created_at', 'updated_at', 'recorded_at', 'is_mock'].includes(k) &&
      typeof chartData[0][k] !== 'object'
    );
  }, [chartData]);

  // For charts (MULTI_SERIES_TYPES): Combine all available sensors unless user explicitly checked specific fields
  // For sensor widgets: Strictly single target field
  const renderFields = useMemo(() => {
    if (isMulti) {
      if (widget?.config?.fields && Array.isArray(widget.config.fields) && widget.config.fields.length > 0) {
        return widget.config.fields;
      }
      if (availableSensorFields.length > 0) {
        return availableSensorFields;
      }
      if (widget?.field && widget.field !== 'multi') {
        return [widget.field];
      }
      return ['value'];
    }
    // Single sensor widget
    const singleField = (widget?.field && widget.field !== 'multi')
      ? widget.field
      : (availableSensorFields[0] || 'value');
    return [singleField];
  }, [isMulti, widget?.config?.fields, widget?.field, availableSensorFields]);

  const primaryField = widget?.field !== 'multi' && widget?.field ? widget.field : renderFields[0];
  const latestVal = chartData[chartData.length - 1]?.[primaryField] ?? '-';
  const numVal = parseFloat(latestVal) || 0;

  // ── Alert Threshold Override ──
  let activeColor = color || '#22d3ee';
  const isNumeric = NUMERIC_TYPES.includes(widget?.type);
  const val = parseFloat(latestVal);
  const threshold = parseFloat(widget?.config?.alertThreshold);
  let isAlertActive = false;

  if (isNumeric && !isNaN(val) && !isNaN(threshold) && val >= threshold) {
    activeColor = widget.config?.alertColor || '#ef4444';
    isAlertActive = true;
  }

  const getFieldColor = (f, i) => {
    if (widget?.config?.fieldColors?.[f]) return widget.config.fieldColors[f];
    return renderFields.length > 1 ? getColor(i) : activeColor;
  };

  // Compact multi-sensor legend pills for charts
  const renderMultiLegend = () => {
    if (!isMulti || renderFields.length <= 1) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 mb-1.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm shrink-0">
        {renderFields.map((f, i) => {
          const c = getFieldColor(f, i);
          const rawV = chartData[chartData.length - 1]?.[f];
          const valDisplay = typeof rawV === 'number' ? rawV.toLocaleString() : (rawV ?? '-');
          return (
            <div
              key={f}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border"
              style={{
                backgroundColor: `${c}15`,
                borderColor: `${c}40`,
                color: '#f8fafc',
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c }} />
              <span className="text-slate-300 font-semibold">{f}:</span>
              <span className="font-mono text-white">{valDisplay}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (widget.type === 'stat') {
    return (
      <div className="flex flex-col justify-between h-full min-h-0 py-0.5">
        <div className="px-2 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {widget.field}
          </p>
          <span
            className={`text-4xl sm:text-5xl font-extrabold flex items-baseline gap-1.5 tracking-tight ${
              isAlertActive ? 'animate-bounce text-rose-500' : 'text-slate-100'
            }`}
          >
            <AnimatedNumber value={latestVal} />
            {widget.unit && (
              <span className="text-xl font-bold" style={{ color: activeColor }}>
                {widget.unit}
              </span>
            )}
          </span>
        </div>

        {/* Embedded Bklit Area Sparkline */}
        <div className="px-2 my-1 flex-1 min-h-[40px] max-h-[56px] flex items-center">
          <BklitAreaSparkline
            data={chartData}
            dataKey={widget.field}
            color={activeColor}
            height={44}
            endDot={true}
          />
        </div>

        <div className="vision-inner-box px-4 py-2 flex items-center justify-between shrink-0 mt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-medium text-slate-400">Live Telemetry</span>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-400">ACTIVE</span>
        </div>
      </div>
    );
  }

  if (widget.type === 'gauge') {
    const numVal = parseFloat(latestVal) || 0;
    const min = parseFloat(widget.config?.min) || 0;
    const max = parseFloat(widget.config?.max) || 100;
    const normalized = Math.max(min, Math.min(max, numVal));
    const percentVal = Math.round(Math.max(0, Math.min(100, ((normalized - min) / (max - min || 1)) * 100)));
    const variant = overrideVariant || widget.config?.variant || 'notches';

    return (
      <div className="flex flex-col justify-between h-full min-h-0 w-full">
        <div className="flex-1 min-h-0 flex items-center justify-center w-full py-0.5 overflow-hidden">
          {variant === 'linear' ? (
            <div className="w-full px-2">
              <BklitGauge
                orientation="linear"
                value={percentVal}
                centerValue={numVal}
                totalNotches={32}
                defaultLabel={widget.field}
                suffix={widget.unit ? ` ${widget.unit}` : ''}
                activeFill={activeColor}
                glow={true}
                linearHeight={isTall ? 36 : 28}
              />
            </div>
          ) : (
            <BklitGauge
              value={percentVal}
              centerValue={numVal}
              totalNotches={variant === 'needle' ? 44 : 38}
              defaultLabel={widget.field}
              suffix={widget.unit ? ` ${widget.unit}` : ''}
              activeFill={activeColor}
              arcStyle={variant === 'solid' ? 'solid' : 'notches'}
              needle={variant === 'needle' ? 'gradient' : false}
              ruler={variant === 'needle'}
              dots={variant === 'dots'}
              sector={variant === 'solid'}
              progressRing={variant === 'solid' || variant === 'notches'}
              centerDisc={variant === 'needle'}
              glow={true}
              zones={
                variant === 'needle'
                  ? [
                      { from: 0, to: 60, color: '#10b981' },
                      { from: 60, to: 85, color: '#f59e0b' },
                      { from: 85, to: 100, color: '#ef4444' },
                    ]
                  : undefined
              }
              height={isTall ? 190 : 135}
              minWidth={100}
            />
          )}
        </div>

        <div className="vision-inner-box px-3.5 py-2 flex items-center justify-between shrink-0 mt-1">
          <span className="text-[11px] font-medium text-slate-500">Min: {min}{widget.unit || ''}</span>
          <span className={`text-[11px] font-extrabold ${isAlertActive ? 'text-rose-400 animate-pulse' : ''}`} style={{ color: isAlertActive ? undefined : activeColor }}>
            {percentVal}% Kapasitas
          </span>
          <span className="text-[11px] font-medium text-slate-500">Max: {max}{widget.unit || ''}</span>
        </div>
      </div>
    );
  }

  if (widget.type === 'status') {
    const valStr = String(latestVal).toLowerCase();
    const isOk = valStr === '1' || valStr === 'true' || valStr === 'on' || valStr === 'normal' || valStr === 'online';
    const isBad = valStr === '0' || valStr === 'false' || valStr === 'off' || valStr === 'bahaya' || valStr === 'offline';

    let stateColor = '#64748b';
    let label = latestVal;

    if (isOk) {
      stateColor = widget.config?.color || '#10b981';
      label = widget.config?.onLabel || 'Normal / Online';
    } else if (isBad) {
      stateColor = '#ef4444';
      label = widget.config?.offLabel || 'Bahaya / Offline';
    }

    const r = 54;
    const circ = 2 * Math.PI * r;
    const arc = circ * 0.75;

    return (
      <div className="flex items-center justify-between gap-4 h-full px-2">
        <div className="flex flex-col gap-2.5 w-[48%]">
          <div className="vision-inner-box p-3.5">
            <p className="text-[10px] font-medium text-slate-400">Status</p>
            <p className="text-[15px] font-extrabold text-slate-100 mt-1 truncate">{label}</p>
          </div>
          <div className="vision-inner-box p-3.5">
            <p className="text-[10px] font-medium text-slate-400">Sensor Field</p>
            <p className="text-[12px] font-bold text-slate-300 uppercase truncate mt-0.5">{widget.field}</p>
          </div>
        </div>

        <div className="relative flex items-center justify-center flex-1">
          <svg width="136" height="136" viewBox="0 0 136 136" className="transform rotate-[135deg]">
            <circle
              cx="68" cy="68" r={r}
              fill="none" stroke="rgb(var(--surface-700))" strokeWidth="10"
              strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
            />
            <circle
              cx="68" cy="68" r={r}
              fill="none" stroke={stateColor} strokeWidth="10"
              strokeDasharray={`${isOk ? arc : arc * 0.35} ${circ}`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="w-3 h-3 rounded-full animate-pulse mb-1" style={{ backgroundColor: stateColor }} />
            <span className="text-[13px] font-extrabold text-slate-100">{isOk ? 'OK' : isBad ? 'ALERT' : String(latestVal)}</span>
          </div>
        </div>
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

  // Bklit Pie Chart — solid / exploded / semi
  if (widget.type === 'pie') {
    const variant = overrideVariant || widget.config?.variant || 'solid';
    const slice = chartData.slice(-6);
    const pieData = slice.map((d, i) => ({
      label: d.timestamp || `#${i + 1}`,
      value: Math.max(0.01, Math.abs(parseFloat(d[widget.field]) || 1)),
      color: COLORS[i % COLORS.length],
    }));
    const isSemi = variant === 'semi';
    const chartSize = h >= 300 ? 275 : 195;
    return (
      <div className="w-full flex items-center justify-center overflow-hidden transition-[height] duration-300 ease-out" style={{ height: h }}>
        <BklitPieChart
          data={pieData}
          size={chartSize}
          innerRadius={variant === 'exploded' ? (h >= 300 ? 46 : 34) : isSemi ? (h >= 300 ? 56 : 42) : (h >= 300 ? 38 : 28)}
          padAngle={variant === 'exploded' ? 0.06 : 0.025}
          cornerRadius={6}
          startAngle={isSemi ? -Math.PI / 2 : -Math.PI / 2}
          endAngle={isSemi ? Math.PI / 2 : (3 * Math.PI) / 2}
          hoverOffset={variant === 'exploded' ? 14 : 8}
        >
          {pieData.map((entry, idx) => (
            <BklitPieSlice
              key={idx}
              index={idx}
              color={entry.color}
              showGlow={true}
              hoverEffect={variant === 'exploded' ? 'translate' : 'grow'}
            />
          ))}
          <BklitPieCenter
            defaultLabel={widget.field}
            suffix={unit ? ` ${unit}` : ''}
          />
        </BklitPieChart>
      </div>
    );
  }

  // Bklit Ring / Concentric Donut Chart — rings / grid / donut
  if (widget.type === 'donut') {
    const variant = overrideVariant || widget.config?.variant || 'rings';
    const chartSize = h >= 300 ? 275 : 195;
    if (variant === 'donut') {
      const slice = chartData.slice(-6);
      const pieData = slice.map((d, i) => ({
        label: d.timestamp || `#${i + 1}`,
        value: Math.max(0.01, Math.abs(parseFloat(d[widget.field]) || 1)),
        color: COLORS[i % COLORS.length],
      }));
      return (
        <div className="w-full flex items-center justify-center overflow-hidden transition-[height] duration-300 ease-out" style={{ height: h }}>
          <BklitPieChart
            data={pieData}
            size={chartSize}
            innerRadius={chartSize * 0.28}
            padAngle={0.03}
            cornerRadius={8}
          >
            {pieData.map((entry, idx) => (
              <BklitPieSlice key={idx} index={idx} color={entry.color} showGlow={true} />
            ))}
            <BklitPieCenter defaultLabel={widget.field} suffix={unit ? ` ${unit}` : ''} />
          </BklitPieChart>
        </div>
      );
    }

    const slice = chartData.slice(-4);
    const vals = slice.map(d => Math.abs(parseFloat(d[widget.field]) || 0));
    const maxRingVal = Math.max(...vals, 100) * 1.15;
    const ringData = slice.map((d, i) => ({
      label: d.timestamp || `#${i + 1}`,
      value: Math.max(1, Math.abs(parseFloat(d[widget.field]) || 10)),
      maxValue: maxRingVal,
      color: COLORS[i % COLORS.length],
    }));
    return (
      <div className="w-full flex items-center justify-center overflow-hidden transition-[height] duration-300 ease-out" style={{ height: h }}>
        <BklitRingChart
          data={ringData}
          size={chartSize}
          strokeWidth={h >= 300 ? 12 : 10}
          ringGap={h >= 300 ? 6 : 5}
          baseInnerRadius={h >= 300 ? 48 : 38}
        >
          {variant === 'grid' && <BklitRingGrid showLabels={false} />}
          {ringData.map((r, idx) => (
            <BklitRing key={idx} index={idx} color={r.color} showGlow={true} lineCap="round" />
          ))}
          <BklitRingCenter defaultLabel={widget.field} suffix={unit ? ` ${unit}` : ''} />
        </BklitRingChart>
      </div>
    );
  }

  // Bklit Radar Chart — glow / minimal
  if (widget.type === 'radar') {
    const variant = overrideVariant || widget.config?.variant || 'glow';
    const slice = chartData.slice(-6);
    const metrics = slice.map((d, i) => ({
      key: `m${i}`,
      label: String(d.timestamp || `#${i + 1}`).slice(-5),
    }));
    const radarData = renderFields.map((f, idx) => {
      const values = {};
      const rawNums = slice.map(d => Math.abs(parseFloat(d[f]) || 0));
      const maxM = Math.max(...rawNums, 1);
      slice.forEach((d, i) => {
        values[`m${i}`] = Math.round(((Math.abs(parseFloat(d[f]) || 0)) / maxM) * 100);
      });
      return {
        label: f,
        color: getFieldColor(f, idx),
        values,
      };
    });
    return (
      <div className="w-full flex items-center justify-center overflow-hidden transition-[height] duration-300 ease-out" style={{ height: h }}>
        <BklitRadarChart
          data={radarData}
          metrics={metrics}
          size={h >= 300 ? 285 : 205}
          levels={4}
          margin={h >= 300 ? 38 : 30}
        >
          <BklitRadarGrid showLabels={false} />
          <BklitRadarAxis />
          <BklitRadarLabels fontSize={10} offset={14} />
          {radarData.map((r, idx) => (
            <BklitRadarArea
              key={idx}
              index={idx}
              color={r.color}
              showPoints={variant === 'glow'}
              showGlow={variant === 'glow'}
            />
          ))}
        </BklitRadarChart>
      </div>
    );
  }

  // Bklit Radial Chart — bars / dots / rings
  if (widget.type === 'radial') {
    const variant = overrideVariant || widget.config?.variant || 'bars';
    const slice = chartData.slice(-12);
    const radialSeries = renderFields.map((f, idx) => ({
      dataKey: f,
      label: f,
      color: getFieldColor(f, idx),
    }));
    const isRing = variant === 'rings' || variant === 'ring';
    return (
      <div className="w-full flex items-center justify-center overflow-hidden transition-[height] duration-300 ease-out" style={{ height: h }}>
        <BklitRadialChart
          data={isRing ? slice.slice(-5) : slice}
          xDataKey="timestamp"
          series={radialSeries}
          angleType="band"
          orientation={isRing ? 'angular' : 'radial'}
          trackNow={false}
          maxWidth={h >= 300 ? 290 : 205}
          className="w-full h-full flex items-center justify-center"
        >
          <BklitRadialAxis labels={false} showValueLabels={false} />
          {variant === 'dots' || variant === 'dot' ? (
            <BklitRadialDotBar rows={8} />
          ) : isRing ? (
            <BklitRadialRingBar cornerRadius="round" />
          ) : (
            <BklitRadialBar cornerRadius={3} />
          )}
          <BklitRadialCenter defaultLabel={widget.field} suffix={unit ? ` ${unit}` : ''} />
        </BklitRadialChart>
      </div>
    );
  }

  // Bklit Scatter Chart — rings / jitter
  if (widget.type === 'scatter') {
    const variant = overrideVariant || widget.config?.variant || 'rings';
    return (
      <div style={{ height: h }} className="w-full transition-[height] duration-300 ease-out">
        <BklitScatterChart
          data={chartData}
          xDataKey="date"
          aspectRatio=""
          className="w-full h-full"
          margin={{ top: 10, right: 12, left: 12, bottom: 22 }}
          jitter={variant === 'jitter'}
        >
          <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
          {renderFields.map((f, i) => {
            const c = getFieldColor(f, i);
            return <BklitScatter key={f} dataKey={f} fill={c} radius={5} />;
          })}
          <BklitXAxis />
          <BklitChartTooltip />
        </BklitScatterChart>
      </div>
    );
  }

  // Bklit Composed Chart — barline / bararea
  if (widget.type === 'composed') {
    const variant = overrideVariant || widget.config?.variant || 'barline';
    const primaryField = renderFields[0] || widget.field;
    const secondaryField = renderFields[1] || primaryField;
    const c1 = getFieldColor(primaryField, 0);
    const c2 = renderFields.length > 1 ? getFieldColor(secondaryField, 1) : '#22d3ee';
    return (
      <div style={{ height: h }} className="w-full transition-[height] duration-300 ease-out">
        <BklitComposedChart
          data={chartData}
          xDataKey="date"
          aspectRatio=""
          className="w-full h-full"
          margin={{ top: 10, right: 12, left: 12, bottom: 22 }}
        >
          <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
          <BklitSeriesBar dataKey={primaryField} fill={c1} radius={4} />
          {variant === 'bararea' || variant === 'bar-area' ? (
            <BklitArea dataKey={secondaryField} stroke={c2} fill={c2} fillOpacity={0.28} strokeWidth={2} />
          ) : (
            <BklitLine dataKey={secondaryField} stroke={c2} strokeWidth={2.5} />
          )}
          <BklitTrendLine dataKey={primaryField} stroke="#fbbf24" strokeStyle="dashed" strokeWidth={2} />
          <BklitXAxis />
          <BklitChartTooltip />
        </BklitComposedChart>
      </div>
    );
  }

  // Bklit Funnel Chart — horizontal / vertical / straight
  if (widget.type === 'funnel') {
    const variant = overrideVariant || widget.config?.variant || 'horizontal';
    const slice = chartData.slice(-5);
    const funnelStages = slice.map((d, i) => ({
      label: String(d.timestamp || `Stage ${i + 1}`).slice(-8),
      value: Math.max(1, Math.abs(parseFloat(d[widget.field]) || (5 - i) * 20)),
      color: COLORS[i % COLORS.length],
    }));
    return (
      <div style={{ height: h }} className="w-full flex items-center justify-center p-2 overflow-hidden transition-[height] duration-300 ease-out">
        <BklitFunnelChart
          data={funnelStages}
          orientation={variant === 'vertical' ? 'vertical' : 'horizontal'}
          edges={variant === 'straight' ? 'straight' : 'curved'}
          color={activeColor}
          layers={3}
          className="w-full h-full"
          style={{ height: h - 16 }}
        />
      </div>
    );
  }

  // Bklit Live Streaming Line Chart — smooth / step
  if (widget.type === 'liveline') {
    const variant = overrideVariant || widget.config?.variant || 'smooth';
    const nowSec = Math.floor(Date.now() / 1000);
    const slice = chartData.slice(-25);
    const livePoints = slice.map((d, i) => ({
      time: nowSec - (slice.length - 1 - i) * 2,
      value: parseFloat(d[widget.field]) || 0,
    }));
    const currentVal = livePoints.length > 0 ? livePoints[livePoints.length - 1].value : numVal;
    return (
      <div style={{ height: h }} className="w-full transition-[height] duration-300 ease-out">
        <BklitLiveLineChart
          data={livePoints}
          value={currentVal}
          window={Math.max(20, slice.length * 2)}
          exaggerate={true}
          className="w-full h-full"
          style={{ height: h }}
          margin={{ top: 14, right: 56, bottom: 24, left: 12 }}
        >
          <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
          <BklitLiveLine
            dataKey="value"
            stroke={activeColor}
            strokeWidth={2.5}
            curve={variant === 'step' ? curveStep : curveMonotoneX}
            pulse={true}
            badge={true}
          />
          <BklitLiveXAxis />
          <BklitLiveYAxis position="right" />
          <BklitChartTooltip />
        </BklitLiveLineChart>
      </div>
    );
  }

  // Bklit OHLC Candlestick Chart
  if (widget.type === 'candlestick') {
    const slice = chartData.slice(-20);
    const ohlcData = slice.map((d, i) => {
      const prev = i > 0 ? parseFloat(slice[i - 1][widget.field]) || 0 : parseFloat(d[widget.field]) || 0;
      const close = parseFloat(d[widget.field]) || 0;
      const open = prev;
      const spread = Math.max(Math.abs(close - open) * 0.6, Math.abs(close) * 0.04, 1);
      const high = Math.max(open, close) + spread;
      const low = Math.min(open, close) - spread;
      return {
        date: d.date instanceof Date ? d.date : new Date(Date.now() - (slice.length - i) * 60000),
        open,
        high,
        low,
        close,
      };
    });
    return (
      <div style={{ height: h }} className="w-full transition-[height] duration-300 ease-out">
        <BklitCandlestickChart
          data={ohlcData}
          xDataKey="date"
          aspectRatio=""
          className="w-full h-full"
          style={{ height: h }}
          margin={{ top: 10, right: 14, left: 14, bottom: 22 }}
        >
          <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
          <BklitCandlestick animate={true} insideStrokeWidth={1} />
          <BklitXAxis />
          <BklitChartTooltip />
        </BklitCandlestickChart>
      </div>
    );
  }

  // Bklit Interactive Sparkline Widget — area / line / bar
  if (widget.type === 'sparkline') {
    const variant = overrideVariant || widget.config?.variant || 'area';
    return (
      <div style={{ height: h }} className="w-full flex flex-col justify-between p-3 vision-inner-box transition-[height] duration-300 ease-out">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{widget.field}</span>
          <span className="text-xl font-black" style={{ color: activeColor }}>
            {typeof latestVal === 'number' ? latestVal.toLocaleString() : latestVal}
            {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
          </span>
        </div>
        <div className="flex-1 flex items-center w-full pt-2">
          {variant === 'bar' ? (
            <BklitBarSparkline data={chartData} dataKey={widget.field} color={activeColor} height={Math.max(48, h - 58)} interactive={true} />
          ) : variant === 'line' ? (
            <BklitLineSparkline data={chartData} dataKey={widget.field} color={activeColor} height={Math.max(48, h - 58)} showHighlight={true} interactive={true} />
          ) : (
            <BklitAreaSparkline data={chartData} dataKey={widget.field} color={activeColor} height={Math.max(48, h - 58)} showHighlight={true} interactive={true} />
          )}
        </div>
      </div>
    );
  }

  if (widget.type === 'bar') {
    const variant = overrideVariant || widget.config?.variant || 'rounded';
    return (
      <div className="vision-inner-box p-3 w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
        {renderMultiLegend()}
        <div className="w-full flex-1 min-h-0">
          <BklitBarChart
            data={chartData}
            xDataKey="timestamp"
            aspectRatio=""
            className="w-full h-full"
            margin={{ top: 8, right: 10, left: 10, bottom: 20 }}
            barGap={0.25}
          >
            <BklitGrid stroke="rgba(148,163,184,0.08)" />
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              if (variant === 'squares') {
                return (
                  <BklitBarSquares
                    key={f}
                    dataKey={f}
                    fill={c}
                    squareGap={2.5}
                    squareRadius={0.25}
                  />
                );
              }
              if (variant === 'perspective') {
                return (
                  <BklitBar
                    key={f}
                    dataKey={f}
                    fill={c}
                    perspective={true}
                    lineCap="round"
                  />
                );
              }
              if (variant === 'minimal') {
                return (
                  <BklitBar
                    key={f}
                    dataKey={f}
                    fill={c}
                    lineCap="butt"
                  />
                );
              }
              return <BklitBar key={f} dataKey={f} fill={c} lineCap="round" />;
            })}
            <BklitChartTooltip />
          </BklitBarChart>
        </div>
      </div>
    );
  }

  if (widget.type === 'area') {
    const variant = overrideVariant || widget.config?.variant || 'smooth';
    const curve = variant === 'stepped' ? curveStep : variant === 'linear' ? curveLinear : curveMonotoneX;
    return (
      <div className="w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
        {renderMultiLegend()}
        <div className="w-full flex-1 min-h-0">
          <BklitAreaChart
            data={chartData}
            xDataKey="date"
            aspectRatio=""
            className="w-full h-full"
            margin={{ top: 8, right: 12, left: 20, bottom: 20 }}
          >
            <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return (
                <BklitArea
                  key={f}
                  dataKey={f}
                  stroke={c}
                  strokeWidth={2.5}
                  fill={c}
                  fillOpacity={0.35}
                  curve={curve}
                />
              );
            })}
            <BklitXAxis />
            <BklitChartTooltip />
          </BklitAreaChart>
        </div>
      </div>
    );
  }

  if (widget.type === 'barsquares') {
    const variant = overrideVariant || widget.config?.variant || 'matrix';
    const sqGap = variant === 'compact' ? 1.5 : 2.5;
    return (
      <div className="vision-inner-box p-3 w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
        {renderMultiLegend()}
        <div className="w-full flex-1 min-h-0">
          <BklitBarChart
            data={chartData}
            xDataKey="timestamp"
            aspectRatio=""
            className="w-full h-full"
            margin={{ top: 8, right: 10, left: 10, bottom: 20 }}
            barGap={0.25}
          >
            <BklitGrid stroke="rgba(148,163,184,0.08)" />
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return (
                <BklitBarSquares
                  key={f}
                  dataKey={f}
                  fill={c}
                  squareGap={sqGap}
                  squareRadius={0.25}
                />
              );
            })}
            <BklitChartTooltip />
          </BklitBarChart>
        </div>
      </div>
    );
  }

  if (widget.type === 'band') {
    const variant = overrideVariant || widget.config?.variant || 'gradient';
    const fillType = variant === 'solid' ? 'solid' : 'gradient';
    // Calculate tolerance bounds
    const bandData = chartData.map(d => {
      const row = { ...d };
      renderFields.forEach(f => {
        const val = typeof d[f] === 'number' ? d[f] : parseFloat(d[f]) || 0;
        const delta = Math.abs(val) * 0.15 || 5;
        row[`${f}_upper`] = parseFloat((val + delta).toFixed(2));
        row[`${f}_lower`] = parseFloat((Math.max(0, val - delta)).toFixed(2));
      });
      return row;
    });

    return (
      <div className="w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
        {renderMultiLegend()}
        <div className="w-full flex-1 min-h-0">
          <BklitLineChart
            data={bandData}
            xDataKey="date"
            aspectRatio=""
            className="w-full h-full"
            margin={{ top: 8, right: 12, left: 20, bottom: 20 }}
        >
          <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
          {renderFields.map((f, i) => {
            const c = getFieldColor(f, i);
            return (
              <BklitBand
                key={`band_${f}`}
                upperKey={`${f}_upper`}
                lowerKey={`${f}_lower`}
                fill={c}
                fillOpacity={0.25}
                fillType={fillType}
                curve={curveMonotoneX}
              />
            );
          })}
          {renderFields.map((f, i) => {
            const c = getFieldColor(f, i);
            return (
              <BklitLine
                key={f}
                dataKey={f}
                stroke={c}
                strokeWidth={2.5}
                curve={curveMonotoneX}
                glow={{ blur: 6, opacity: 0.6 }}
              />
            );
          })}
          <BklitXAxis />
          <BklitChartTooltip />
        </BklitLineChart>
        </div>
      </div>
    );
  }

  if (widget.type === 'patternarea') {
    const variant = overrideVariant || widget.config?.variant || 'diagonal';
    const presetId = variant === 'dots' ? 'dots' : variant === 'grid' ? 'grid' : 'diagonal-up';
    return (
      <div className="w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
        {renderMultiLegend()}
        <div className="w-full flex-1 min-h-0">
          <BklitAreaChart
            data={chartData}
            xDataKey="date"
            aspectRatio=""
            className="w-full h-full"
            margin={{ top: 8, right: 12, left: 20, bottom: 20 }}
          >
            <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              const patId = `pat_${widget.id}_${f}`;
              return (
                <BklitPatternPreset
                  key={`preset_${f}`}
                  id={patId}
                  preset={presetId}
                  color={c}
                />
              );
            })}
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              const patId = `pat_${widget.id}_${f}`;
              return (
                <BklitPatternArea
                  key={`pat_${f}`}
                  dataKey={f}
                  fill={`url(#${patId})`}
                  curve={curveMonotoneX}
                  fillOpacity={0.75}
                />
              );
            })}
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return (
                <BklitArea
                  key={f}
                  dataKey={f}
                  stroke={c}
                  strokeWidth={2.5}
                  fillOpacity={0}
                  curve={curveMonotoneX}
                />
              );
            })}
            <BklitXAxis />
            <BklitChartTooltip />
          </BklitAreaChart>
        </div>
      </div>
    );
  }

  if (widget.type === 'projection') {
    const targetField = renderFields[0] || widget.field;
    const lastPoints = chartData.slice(-6);
    let projPoints = [];
    if (lastPoints.length >= 2) {
      const p1 = lastPoints[lastPoints.length - 2];
      const p2 = lastPoints[lastPoints.length - 1];
      const v1 = parseFloat(p1[targetField]) || 0;
      const v2 = parseFloat(p2[targetField]) || 0;
      const slope = v2 - v1;
      const t2 = p2.date instanceof Date ? p2.date.getTime() : Date.now();
      const dt = 60000;
      projPoints = [
        { date: new Date(t2), value: v2 },
        { date: new Date(t2 + dt), value: parseFloat((v2 + slope).toFixed(2)) },
        { date: new Date(t2 + dt * 2), value: parseFloat((v2 + slope * 1.7).toFixed(2)) },
        { date: new Date(t2 + dt * 3), value: parseFloat((v2 + slope * 2.3).toFixed(2)) },
      ];
    }

    return (
      <div className="w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
        {renderMultiLegend()}
        <div className="w-full flex-1 min-h-0">
          <BklitLineChart
            data={chartData}
            xDataKey="date"
            aspectRatio=""
            className="w-full h-full"
            margin={{ top: 8, right: 10, left: 10, bottom: 20 }}
          >
            <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
            {renderFields.map((f, i) => {
              const c = getFieldColor(f, i);
              return (
                <BklitLine
                  key={f}
                  dataKey={f}
                  stroke={c}
                  strokeWidth={2.5}
                  curve={curveMonotoneX}
                />
              );
            })}
            {projPoints.length > 0 && (
              <BklitProjectionLine
                data={projPoints}
                stroke="rgb(var(--primary-400))"
                strokeDasharray="6,4"
                showEndMarker={true}
                strokeWidth={2}
              />
            )}
            <BklitXAxis />
            <BklitChartTooltip />
          </BklitLineChart>
        </div>
      </div>
    );
  }

  // Default: Line
  const lineVariant = overrideVariant || widget.config?.variant || 'glow';
  const lineCurve = lineVariant === 'stepped' ? curveStep : lineVariant === 'linear' ? curveLinear : curveMonotoneX;
  const isGlow = lineVariant === 'glow';
  return (
    <div className="w-full flex flex-col justify-between transition-[height] duration-300 ease-out" style={{ height: h }}>
      {renderMultiLegend()}
      <div className="w-full flex-1 min-h-0">
        <BklitLineChart
          data={chartData}
          xDataKey="date"
          aspectRatio=""
          className="w-full h-full"
          margin={{ top: 8, right: 12, left: 20, bottom: 20 }}
        >
          <BklitGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />
          {renderFields.map((f, i) => {
            const c = getFieldColor(f, i);
            return (
              <BklitLine
                key={f}
                dataKey={f}
                stroke={c}
                strokeWidth={2.5}
                curve={lineCurve}
                glow={isGlow ? { blur: 8, opacity: 0.75 } : false}
              />
            );
          })}
          <BklitXAxis />
          <BklitChartTooltip />
        </BklitLineChart>
      </div>
    </div>
  );
}

// ─── Resize Dimensions Calculation Helper ────────────────────────────────────
function computeResizeDimensions(mode, dx, dy, startW, startH) {
  const numStartW = parseInt(startW) || 1;
  let targetW = numStartW;
  let targetH = startH || 'normal';
  let activeAxis = mode;

  // 1. Calculate responsive width targets with symmetrical low-drag thresholds
  let newW = numStartW;
  if (numStartW === 1) {
    if (dx > 150) newW = 3;
    else if (dx > 40) newW = 2;
    else newW = 1;
  } else if (numStartW === 2) {
    if (dx > 40) newW = 3;
    else if (dx < -40) newW = 1;
    else newW = 2;
  } else if (numStartW >= 3) {
    if (dx < -150) newW = 1;
    else if (dx < -40) newW = 2;
    else newW = 3;
  }

  // 2. Calculate responsive height targets with symmetrical low-drag thresholds
  let newH = startH;
  if (startH === 'tall') {
    if (dy < -35) newH = 'normal';
    else newH = 'tall';
  } else {
    if (dy > 35) newH = 'tall';
    else newH = 'normal';
  }

  // 3. Mode enforcement & Dominant Axis Protection
  if (mode === 'height') {
    targetW = numStartW; // Width is 100% locked!
    targetH = newH;
    activeAxis = 'height';
  } else if (mode === 'width') {
    targetW = newW;
    targetH = startH; // Height is 100% locked!
    activeAxis = 'width';
  } else {
    // mode === 'both' (Corner Handle)
    if (dx <= 0 && dy <= 0) {
      // Shrinking inward: allow both dimensions to shrink smoothly and effortlessly!
      targetW = newW;
      targetH = newH;
      activeAxis = (newW !== numStartW && newH !== startH) ? 'both' : (newW !== numStartW ? 'width' : 'height');
    } else if (dy > 0 && dy > Math.abs(dx) * 1.5) {
      // Dragging downward dominates expansion: lock horizontal width from expanding sideways
      targetW = numStartW;
      targetH = newH;
      activeAxis = 'height';
    } else if (dx > 0 && dx > Math.abs(dy) * 1.5) {
      // Dragging rightward dominates expansion: lock vertical height
      targetW = newW;
      targetH = startH;
      activeAxis = 'width';
    } else {
      targetW = newW;
      targetH = newH;
      activeAxis = 'both';
    }
  }

  return { targetW, targetH, activeAxis };
}

// ─── Sortable Widget Card (Vision UI Style) ─────────────────────────────────
function SortableWidget({
  widget,
  index,
  chartData,
  onDelete,
  onEdit,
  onResize,
  editMode,
  containers = [],
  onMoveToContainer,
  onTogglePin,
  isPinned = false,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const color = widget.config?.color || getColor(index);
  const WidgetIcon = CHART_TYPES.find(c => c.value === widget.type)?.icon || Activity;

  // Local state for instant visual resizing
  const [localW, setLocalW] = useState(widget.w || '1');
  const [localH, setLocalH] = useState(widget.h || 'normal');
  const [resizing, setResizing] = useState(false);
  const [ghostSize, setGhostSize] = useState(null);
  const startDragRef = useRef(null);

  // Dynamic Bklit UI Chart Variant
  const defaultVar =
    widget.config?.variant ||
    (widget.type === 'line'
      ? 'glow'
      : widget.type === 'bar'
      ? 'rounded'
      : widget.type === 'gauge'
      ? 'notches'
      : widget.type === 'container'
      ? 'grid-2'
      : 'smooth');
  const [activeVariant, setActiveVariant] = useState(defaultVar);

  useEffect(() => {
    setActiveVariant(widget.config?.variant || defaultVar);
  }, [widget.config?.variant, widget.type]);

  // Sync local state when widget prop changes (e.g. from modal)
  useEffect(() => {
    setLocalW(widget.w || '1');
    setLocalH(widget.h || 'normal');
  }, [widget.w, widget.h]);

  const changeSize = (newW, newH) => {
    const targetW = (newW ?? localW).toString();
    const targetH = (newH ?? localH);
    setLocalW(targetW);
    setLocalH(targetH);
    if (onResize) {
      onResize(widget.id, { w: targetW, h: targetH });
    }
  };

  const handlePointerDown = (e, mode = 'both') => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}
    setResizing(true);

    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: parseInt(localW) || 1,
      startH: localH,
      baseWidth: rect.width,
      baseHeight: rect.height,
      handleEl,
      mode,
    };

    setGhostSize({
      w: rect.width,
      h: rect.height,
      targetW: localW,
      targetH: localH,
      activeAxis: mode === 'height' ? 'height' : mode === 'width' ? 'width' : 'both',
    });

    const handlePointerMove = (moveEvent) => {
      if (!startDragRef.current) return;
      const { mode, startW, startH, baseWidth, baseHeight } = startDragRef.current;

      const dx = moveEvent.clientX - startDragRef.current.x;
      const dy = moveEvent.clientY - startDragRef.current.y;

      const { targetW, targetH, activeAxis } = computeResizeDimensions(mode, dx, dy, startW, startH);

      setGhostSize({
        w: activeAxis === 'height' ? baseWidth : Math.max(160, baseWidth + dx),
        h: activeAxis === 'width' ? baseHeight : Math.max(160, baseHeight + dy),
        targetW: targetW.toString(),
        targetH,
        activeAxis,
      });
    };

    const handlePointerUp = (upEvent) => {
      if (startDragRef.current?.handleEl) {
        try {
          startDragRef.current.handleEl.releasePointerCapture(upEvent.pointerId);
        } catch {}
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (!startDragRef.current) return;
      const { mode, startW, startH } = startDragRef.current;
      const dx = upEvent.clientX - startDragRef.current.x;
      const dy = upEvent.clientY - startDragRef.current.y;

      const { targetW, targetH } = computeResizeDimensions(mode, dx, dy, startW, startH);

      setGhostSize(null);
      setResizing(false);
      changeSize(targetW.toString(), targetH);
      startDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const colSpanClass =
    localW === '3'
      ? 'col-span-1 md:col-span-2 xl:col-span-3'
      : localW === '2'
      ? 'col-span-1 md:col-span-2'
      : 'col-span-1';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ? `${transition}, min-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)` : 'min-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: isDragging ? 0.5 : 1,
    minWidth: 0,
    maxWidth: '100%',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`vision-card p-6 relative group flex flex-col justify-between transition-all duration-300 ease-out overflow-hidden min-w-0 max-w-full ${colSpanClass} ${localH === 'tall' ? 'h-[420px] min-h-[420px]' : 'h-[320px] min-h-[320px]'}`}
    >
      {/* Ghost Resize Box with target dimension indicator */}
      {ghostSize && (
        <div
          className={`absolute top-0 left-0 rounded-2xl border-2 border-dashed z-50 pointer-events-none backdrop-blur-[2px] transition-none flex items-center justify-center ${
            ghostSize.activeAxis === 'height'
              ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
              : ghostSize.activeAxis === 'width'
              ? 'border-primary-400 bg-primary-500/15 shadow-[0_0_30px_rgba(var(--primary-500),0.3)]'
              : 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
          }`}
          style={{ width: `${ghostSize.w}px`, height: `${ghostSize.h}px` }}
        >
          <span
            className={`px-3.5 py-1.5 rounded-xl bg-slate-900/95 border text-xs font-black shadow-2xl tracking-wider uppercase animate-pulse flex items-center gap-1.5 ${
              ghostSize.activeAxis === 'height'
                ? 'border-amber-400 text-amber-300'
                : ghostSize.activeAxis === 'width'
                ? 'border-primary-400 text-primary-300'
                : 'border-cyan-400 text-cyan-300'
            }`}
          >
            {ghostSize.activeAxis === 'height' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Tinggi: {ghostSize.targetH === 'tall' ? 'Tall (420px)' : 'Normal (320px)'}
              </>
            ) : ghostSize.activeAxis === 'width' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping" />
                Lebar: {ghostSize.targetW} Kolom
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {ghostSize.targetW} Kolom • {ghostSize.targetH === 'tall' ? 'Tall' : 'Normal'}
              </>
            )}
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
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
          <div className="min-w-0">
            <h4 className="text-[15px] font-extrabold text-slate-100 leading-tight truncate">{widget.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <span>{CHART_TYPES.find(c => c.value === widget.type)?.label || widget.type}</span>
              {widget.type !== 'container' && (
                <>
                  <span>•</span>
                  <span className="font-mono text-primary-400">
                    {MULTI_SERIES_TYPES.includes(widget.type)
                      ? (widget.config?.fields?.length > 0 ? widget.config.fields.join(' + ') : (widget.field || 'all'))
                      : `${widget.field || 'field'}${widget.unit ? ` (${widget.unit})` : ''}`}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Pin to Dashboard Button (Always available) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin && onTogglePin(widget);
            }}
            className={`p-1.5 rounded-xl border transition-all ${
              isPinned
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20 hover:bg-amber-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700/60'
            }`}
            title={isPinned ? 'Lepas dari Sidebar Dashboard' : 'Kirim / Sematkan ke Sidebar Kanan Dashboard'}
          >
            <Pin size={14} className={isPinned ? 'fill-amber-400 text-amber-400' : ''} />
          </button>

          {editMode ? (
            <>
              {/* Quick Size Toggle Pills (Columns & Height) */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 shadow-inner">
                {(['1', '2', '3']).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => changeSize(sz, null)}
                    className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all ${
                      localW === sz
                        ? 'bg-primary-500 text-white shadow-sm ring-1 ring-primary-400/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={`Ubah ukuran: ${sz} Kolom`}
                  >
                    {sz}x
                  </button>
                ))}
                <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                <button
                  type="button"
                  onClick={() => changeSize(null, localH === 'tall' ? 'normal' : 'tall')}
                  className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all ${
                    localH === 'tall'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={localH === 'tall' ? 'Tinggi: Tall (Klik untuk Normal)' : 'Tinggi: Normal (Klik untuk Tall)'}
                >
                  {localH === 'tall' ? 'Tall' : 'Norm'}
                </button>
              </div>

              {containers && containers.length > 0 && (
                <div className="relative group/menu">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-primary-400 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    title="Pindahkan ke Container..."
                  >
                    <FolderInput size={14} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-52 py-1.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md hidden group-hover/menu:block z-50 animate-fade-in">
                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      Pindah ke Container
                    </p>
                    {containers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onMoveToContainer && onMoveToContainer(widget.id, c.id)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-primary-500/20 flex items-center gap-2 transition-colors"
                      >
                        <Boxes size={13} className="text-primary-400 shrink-0" />
                        <span className="truncate">{c.title || 'Container'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => onEdit(widget)}
                className="text-slate-400 hover:text-primary-400 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title="Edit widget"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => onDelete(widget.id)}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/15 transition-colors"
                title="Delete widget"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.4)',
              }}
            >
              <WidgetIcon size={14} />
            </div>
          )}
        </div>
      </div>

      {/* Chart Variant Quick Switcher (Bklit UI) */}
      {editMode && CHART_VARIANTS[widget.type] && (
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-slate-900/60 rounded-xl border border-slate-800/80 -mt-1 mb-1 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Style:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CHART_VARIANTS[widget.type].map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setActiveVariant(v.id);
                  // Persist the chosen style (debounced auto-save)
                  onResize && onResize(widget.id, { config: { ...(widget.config || {}), variant: v.id } });
                }}
                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg transition-all whitespace-nowrap ${
                  activeVariant === v.id
                    ? 'bg-primary-500 text-white shadow-[0_2px_8px_rgba(var(--primary-500),0.4)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={v.desc}
              >
                {v.short}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart / Widget Content */}
      <div className={`flex-1 min-h-0 w-full overflow-hidden flex flex-col justify-center transition-[height] duration-300 ease-out ${resizing ? 'pointer-events-none select-none' : ''}`}>
        <WidgetChart widget={{ ...widget, w: localW, h: localH }} chartData={chartData} color={color} overrideVariant={activeVariant} />
      </div>

      {/* ── Separate Drag Handles for Independent Axes ── */}
      {editMode && (
        <>
          {/* Bottom Edge Handle: Height only ("Panjang") */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'height')}
            className="absolute inset-x-12 bottom-0 h-4 cursor-ns-resize z-20 flex items-center justify-center group/b-handle touch-none select-none"
            title="Tarik ke bawah / atas: Mengubah tinggi (panjang) saja"
          >
            <div className="w-12 h-1 rounded-full bg-slate-600/70 group-hover/b-handle:bg-amber-400 group-hover/b-handle:w-16 group-hover/b-handle:shadow-[0_0_10px_rgba(251,191,36,0.7)] group-active/b-handle:bg-amber-300 transition-all duration-200" />
          </div>

          {/* Right Edge Handle: Width only ("Lebar / Kolom") */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'width')}
            className="absolute inset-y-12 right-0 w-4 cursor-ew-resize z-20 flex items-center justify-center group/r-handle touch-none select-none"
            title="Tarik ke kanan / kiri: Mengubah lebar (kolom) saja"
          >
            <div className="h-12 w-1 rounded-full bg-slate-600/70 group-hover/r-handle:bg-primary-400 group-hover/r-handle:h-16 group-hover/r-handle:shadow-[0_0_10px_rgba(var(--primary-500),0.7)] group-active/r-handle:bg-primary-300 transition-all duration-200" />
          </div>

          {/* Corner Handle: Corner resize with Intent Locking */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'both')}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 text-slate-500 hover:text-cyan-400 active:text-cyan-300 transition-colors z-20 select-none touch-none"
            title="Tarik sudut: Mengubah ukuran (otomatis mengunci arah dominan)"
          >
            <div className="w-4 h-4 flex items-end justify-end pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L0 12H12V0Z" fill="currentColor" opacity="0.4" />
                <path d="M12 6L6 12H12V6Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Container Empty Dropzone ────────────────────────────────────────────────
function ContainerEmptyDropZone({ containerId }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `container-drop-${containerId}`,
    data: { containerId }
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full py-8 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 ${
        isOver
          ? 'border-primary-400 bg-primary-500/20 scale-[1.01] shadow-[0_0_25px_rgba(var(--primary-500),0.3)]'
          : 'border-slate-800/90 bg-slate-900/40 hover:border-slate-700'
      }`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-2.5 transition-all ${isOver ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/40' : 'bg-slate-800/80 text-slate-400'}`}>
        <Boxes size={22} />
      </div>
      <p className="text-xs font-bold text-slate-200">
        {isOver ? 'Lepaskan untuk memasukkan widget ke Container ini' : 'Container Masih Kosong'}
      </p>
      <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
        Tarik (drag) widget dari dashboard dan lepaskan di area ini, atau klik tombol <strong>+ Tambah</strong> di header container.
      </p>
    </div>
  );
}

// ─── Sortable Container Child Widget ─────────────────────────────────────────
function SortableContainerChild({ widget, index, chartData, onDelete, onEdit, onEject, onResize, editMode, onTogglePin, isPinned = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const color = widget.config?.color || getColor(index);
  const WidgetIcon = CHART_TYPES.find(c => c.value === widget.type)?.icon || Activity;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}
    const startY = e.clientY;
    const currentH = widget.h || 'normal';

    const handlePointerUp = (upEvent) => {
      try {
        handleEl.releasePointerCapture(upEvent.pointerId);
      } catch {}
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      const dy = upEvent.clientY - startY;
      if (currentH === 'tall' && dy < -30) {
        onResize && onResize(widget.id, { h: 'normal' });
      } else if (currentH !== 'tall' && dy > 30) {
        onResize && onResize(widget.id, { h: 'tall' });
      }
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`vision-inner-box p-3.5 relative group flex flex-col justify-between transition-all duration-200 border border-slate-800/90 hover:border-slate-700/80 overflow-hidden min-w-0 max-w-full ${
        isDragging ? 'ring-2 ring-primary-500 shadow-2xl z-30' : ''
      }`}
    >
      {/* Child Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2 min-w-0">
          {editMode && (
            <button
              {...listeners}
              {...attributes}
              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-slate-700/50"
              title="Drag untuk susun urutan atau keluarkan dari container"
            >
              <GripVertical size={14} />
            </button>
          )}
          <div className="w-6 h-6 rounded-lg bg-primary-500/15 text-primary-400 flex items-center justify-center shrink-0">
            <WidgetIcon size={12} />
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-200 truncate">{widget.title}</h5>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {MULTI_SERIES_TYPES.includes(widget.type)
                ? (widget.config?.fields?.length > 0 ? widget.config.fields.join(' + ') : (widget.field || 'all'))
                : `${widget.field || 'field'}${widget.unit ? ` (${widget.unit})` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Pin to Dashboard */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin && onTogglePin(widget);
            }}
            className={`p-1 rounded-lg border transition-all ${
              isPinned
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300 border-transparent hover:bg-slate-800'
            }`}
            title={isPinned ? 'Lepas dari Sidebar Dashboard' : 'Kirim ke Sidebar Dashboard'}
          >
            <Pin size={12} className={isPinned ? 'fill-amber-400 text-amber-400' : ''} />
          </button>

          {editMode && (
            <>
              <button
                type="button"
                onClick={() => onResize && onResize(widget.id, { h: widget.h === 'tall' ? 'normal' : 'tall' })}
                className={`px-1.5 py-0.5 text-[10px] font-black rounded-lg transition-colors ${
                  widget.h === 'tall'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700'
                }`}
                title={widget.h === 'tall' ? 'Tinggi: Tall (Klik untuk Normal)' : 'Tinggi: Normal (Klik untuk Tall)'}
              >
                {widget.h === 'tall' ? 'Tall' : 'Norm'}
              </button>
              <button
                type="button"
                onClick={() => onEject(widget.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 transition-colors"
                title="Keluarkan ke Dashboard Utama"
              >
                <LogOut size={13} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(widget)}
                className="p-1 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-700/50 transition-colors"
                title="Edit Widget"
              >
                <Settings size={13} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(widget.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                title="Hapus Widget"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Chart / Stat */}
      <div className="w-full flex-1 min-h-[140px]">
        <WidgetChart widget={{ ...widget, h: widget.h || 'normal' }} chartData={chartData} color={color} />
      </div>

      {/* Drag Height Handle */}
      {editMode && (
        <div
          onPointerDown={handlePointerDown}
          className="absolute inset-x-8 bottom-0 h-3.5 cursor-ns-resize z-20 flex items-center justify-center group/b-handle touch-none select-none"
          title="Tarik ke bawah / atas: Mengubah tinggi (panjang) saja"
        >
          <div className="w-10 h-1 rounded-full bg-slate-700/60 group-hover/b-handle:bg-amber-400 group-hover/b-handle:w-14 group-hover/b-handle:shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-all duration-200" />
        </div>
      )}
    </div>
  );
}

// ─── Container Widget (Vision UI Group Card) ─────────────────────────────────
function ContainerWidget({
  container,
  children = [],
  index,
  chartData,
  onDelete,
  onEdit,
  onResize,
  onLayoutChange,
  onAddChild,
  onEjectChild,
  editMode,
  onTogglePin,
  pinnedWidgetIds,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: container.id });
  const { isOver: isCardOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `container-card-${container.id}`,
    data: { containerId: container.id }
  });

  const [localW, setLocalW] = useState(container.w || '3');
  const [localH, setLocalH] = useState(container.h || 'normal');
  const [resizing, setResizing] = useState(false);
  const [ghostSize, setGhostSize] = useState(null);
  const startDragRef = useRef(null);

  useEffect(() => {
    setLocalW(container.w || '3');
    setLocalH(container.h || 'normal');
  }, [container.w, container.h]);

  const changeSize = (newW, newH) => {
    const targetW = (newW ?? localW).toString();
    const targetH = (newH ?? localH);
    setLocalW(targetW);
    setLocalH(targetH);
    if (onResize) {
      onResize(container.id, { w: targetW, h: targetH });
    }
  };

  const layout = container.config?.layout || 'grid-2';

  // Smart responsive layout: if container is narrow (1 col), stack vertically to prevent squishing child widgets
  const isNarrow = localW === '1';
  const layoutClass =
    isNarrow
      ? 'flex flex-col gap-3.5'
      : layout === 'grid-3'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
      : layout === 'stack'
      ? 'flex flex-col gap-3.5'
      : layout === 'flex-row'
      ? 'flex flex-wrap gap-3.5'
      : 'grid grid-cols-1 md:grid-cols-2 gap-3.5';

  const colSpanClass =
    localW === '3'
      ? 'col-span-1 md:col-span-2 xl:col-span-3'
      : localW === '2'
      ? 'col-span-1 md:col-span-2'
      : 'col-span-1';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ? `${transition}, min-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)` : 'min-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: isDragging ? 0.5 : 1,
    minWidth: 0,
    maxWidth: '100%',
  };

  const handlePointerDown = (e, mode = 'both') => {
    e.stopPropagation();
    e.preventDefault();
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}
    setResizing(true);
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: parseInt(localW) || 3,
      startH: localH,
      baseWidth: rect.width,
      baseHeight: rect.height,
      handleEl,
      mode,
    };
    setGhostSize({
      w: rect.width,
      h: rect.height,
      targetW: localW,
      targetH: localH,
      activeAxis: mode === 'height' ? 'height' : mode === 'width' ? 'width' : 'both',
    });

    const handlePointerMove = (moveEvent) => {
      if (!startDragRef.current) return;
      const { mode, startW, startH, baseWidth, baseHeight } = startDragRef.current;
      const dx = moveEvent.clientX - startDragRef.current.x;
      const dy = moveEvent.clientY - startDragRef.current.y;

      const { targetW, targetH, activeAxis } = computeResizeDimensions(mode, dx, dy, startW, startH);

      setGhostSize({
        w: activeAxis === 'height' ? baseWidth : Math.max(180, baseWidth + dx),
        h: activeAxis === 'width' ? baseHeight : Math.max(180, baseHeight + dy),
        targetW: targetW.toString(),
        targetH,
        activeAxis,
      });
    };

    const handlePointerUp = (upEvent) => {
      if (startDragRef.current?.handleEl) {
        try {
          startDragRef.current.handleEl.releasePointerCapture(upEvent.pointerId);
        } catch {}
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (!startDragRef.current) return;
      const { mode, startW, startH } = startDragRef.current;
      const dx = upEvent.clientX - startDragRef.current.x;
      const dy = upEvent.clientY - startDragRef.current.y;

      const { targetW, targetH } = computeResizeDimensions(mode, dx, dy, startW, startH);

      setGhostSize(null);
      setResizing(false);
      changeSize(targetW.toString(), targetH);
      startDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div
      ref={node => {
        setNodeRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={`vision-card p-5 sm:p-6 relative group flex flex-col gap-3.5 transition-all duration-300 ease-out overflow-hidden min-w-0 max-w-full ${colSpanClass} ${localH === 'tall' ? 'min-h-[460px]' : 'min-h-[340px]'} ${
        isCardOver ? 'ring-2 ring-primary-400 border-primary-500 shadow-[0_0_30px_rgba(var(--primary-500),0.3)] bg-primary-500/5' : ''
      }`}
    >
      {/* Ghost Resize Box with target dimension indicator */}
      {ghostSize && (
        <div
          className={`absolute top-0 left-0 rounded-2xl border-2 border-dashed z-50 pointer-events-none backdrop-blur-[2px] transition-none flex items-center justify-center ${
            ghostSize.activeAxis === 'height'
              ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
              : ghostSize.activeAxis === 'width'
              ? 'border-primary-400 bg-primary-500/15 shadow-[0_0_30px_rgba(var(--primary-500),0.3)]'
              : 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
          }`}
          style={{ width: `${ghostSize.w}px`, height: `${ghostSize.h}px` }}
        >
          <span
            className={`px-3.5 py-1.5 rounded-xl bg-slate-900/95 border text-xs font-black shadow-2xl tracking-wider uppercase animate-pulse flex items-center gap-1.5 ${
              ghostSize.activeAxis === 'height'
                ? 'border-amber-400 text-amber-300'
                : ghostSize.activeAxis === 'width'
                ? 'border-primary-400 text-primary-300'
                : 'border-cyan-400 text-cyan-300'
            }`}
          >
            {ghostSize.activeAxis === 'height' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Tinggi: {ghostSize.targetH === 'tall' ? 'Tall (460px)' : 'Normal (340px)'}
              </>
            ) : ghostSize.activeAxis === 'width' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping" />
                Lebar: {ghostSize.targetW} Kolom
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {ghostSize.targetW} Kolom • {ghostSize.targetH === 'tall' ? 'Tall' : 'Normal'}
              </>
            )}
          </span>
        </div>
      )}

      {/* Top Laser Accent Glow */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/80 to-transparent pointer-events-none" />

      {/* Container Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {editMode && (
            <button
              {...listeners}
              {...attributes}
              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing flex-shrink-0 p-1 -ml-1 rounded hover:bg-slate-700/50"
              title="Drag container untuk atur urutan di dashboard"
            >
              <GripVertical size={16} />
            </button>
          )}

          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
              boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.4)',
            }}
          >
            <Boxes size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[15px] font-extrabold text-slate-100 tracking-tight truncate">
                {container.title || 'Container Group'}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-500/15 text-primary-400 border border-primary-500/30">
                {children.length} {children.length === 1 ? 'Widget' : 'Widgets'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Grup Wadah IoT • Layout: <span className="text-primary-400 font-semibold">{layout}</span>
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Size Toggle Pills in Edit Mode */}
          {editMode && (
            <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 shadow-inner">
              {(['1', '2', '3']).map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => changeSize(sz, null)}
                  className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all ${
                    localW === sz
                      ? 'bg-primary-500 text-white shadow-sm ring-1 ring-primary-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={`Ubah ukuran: ${sz} Kolom`}
                >
                  {sz}x
                </button>
              ))}
              <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
              <button
                type="button"
                onClick={() => changeSize(null, localH === 'tall' ? 'normal' : 'tall')}
                className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all ${
                  localH === 'tall'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={localH === 'tall' ? 'Tinggi: Tall (Klik untuk Normal)' : 'Tinggi: Normal (Klik untuk Tall)'}
              >
                {localH === 'tall' ? 'Tall' : 'Norm'}
              </button>
            </div>
          )}

          {/* Quick Layout Pill (edit mode only) */}
          {editMode && (
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
            {[
              { id: 'grid-2', label: '2 Col' },
              { id: 'grid-3', label: '3 Col' },
              { id: 'stack', label: 'Stack' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onLayoutChange(container.id, tab.id)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  layout === tab.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          )}

          <button
            type="button"
            onClick={() => onAddChild(container.id)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30 hover:bg-primary-500/25 transition-all shadow-sm"
            title="Tambah widget baru langsung ke container ini"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Tambah</span>
          </button>

          {editMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(container)}
                className="text-slate-400 hover:text-primary-400 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title="Edit Container"
              >
                <Settings size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(container.id)}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/15 transition-colors"
                title="Hapus Container (Widget di dalamnya aman dikeluarkan)"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: Empty Dropzone or Sortable Children */}
      <div className="flex-1">
        {children.length === 0 ? (
          <ContainerEmptyDropZone containerId={container.id} />
        ) : (
          <SortableContext items={children.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className={layoutClass}>
              {children.map((child, i) => (
                <SortableContainerChild
                  key={child.id}
                  widget={child}
                  index={i}
                  chartData={chartData}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onEject={onEjectChild}
                  onResize={onResize}
                  editMode={editMode}
                  onTogglePin={onTogglePin}
                  isPinned={pinnedWidgetIds ? pinnedWidgetIds.has(child.id) : false}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* ── Separate Drag Handles for Independent Axes ── */}
      {editMode && (
        <>
          {/* Bottom Edge Handle: Height only ("Panjang") */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'height')}
            className="absolute inset-x-12 bottom-0 h-4 cursor-ns-resize z-20 flex items-center justify-center group/b-handle touch-none select-none"
            title="Tarik ke bawah / atas: Mengubah tinggi (panjang) saja"
          >
            <div className="w-12 h-1 rounded-full bg-slate-600/70 group-hover/b-handle:bg-amber-400 group-hover/b-handle:w-16 group-hover/b-handle:shadow-[0_0_10px_rgba(251,191,36,0.7)] group-active/b-handle:bg-amber-300 transition-all duration-200" />
          </div>

          {/* Right Edge Handle: Width only ("Lebar / Kolom") */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'width')}
            className="absolute inset-y-12 right-0 w-4 cursor-ew-resize z-20 flex items-center justify-center group/r-handle touch-none select-none"
            title="Tarik ke kanan / kiri: Mengubah lebar (kolom) saja"
          >
            <div className="h-12 w-1 rounded-full bg-slate-600/70 group-hover/r-handle:bg-primary-400 group-hover/r-handle:h-16 group-hover/r-handle:shadow-[0_0_10px_rgba(var(--primary-500),0.7)] group-active/r-handle:bg-primary-300 transition-all duration-200" />
          </div>

          {/* Corner Handle: Corner resize with Intent Locking */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'both')}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 text-slate-500 hover:text-cyan-400 active:text-cyan-300 transition-colors z-20 select-none touch-none"
            title="Tarik sudut: Mengubah ukuran (otomatis mengunci arah dominan)"
          >
            <div className="w-4 h-4 flex items-end justify-end pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L0 12H12V0Z" fill="currentColor" opacity="0.4" />
                <path d="M12 6L6 12H12V6Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </>
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
  const [formVariant, setFormVariant] = useState('glow');
  const [modalStep, setModalStep] = useState(1);
  const [previewWidget, setPreviewWidget] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'curves' | 'bars' | 'distribution' | 'controls'
  const [targetContainerId, setTargetContainerId] = useState(null);
  const lastUpdateRef = useRef(0);
  const resizeSaveTimerRef = useRef(null);

  // ── Pinned Bucket Widgets (Synced with Dashboard Right Sidebar, Per-User) ──
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState(() => {
    try {
      const list = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
      return new Set(Array.isArray(list) ? list.map(i => i.widgetId) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const syncPinned = () => {
      try {
        const list = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
        setPinnedWidgetIds(new Set(Array.isArray(list) ? list.map(i => i.widgetId) : []));
      } catch {}
    };
    window.addEventListener('bucket-widgets-updated', syncPinned);
    window.addEventListener('dashboard-prefs-updated', syncPinned);
    window.addEventListener('storage', syncPinned);
    return () => {
      window.removeEventListener('bucket-widgets-updated', syncPinned);
      window.removeEventListener('dashboard-prefs-updated', syncPinned);
      window.removeEventListener('storage', syncPinned);
    };
  }, []);

  const handleTogglePinToDashboard = (widget) => {
    try {
      const pinId = `${bucket?.id || id}_${widget.id}`;
      let list = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
      if (!Array.isArray(list)) list = [];
      const exists = list.some(item => item.id === pinId);
      let updated;
      if (exists) {
        updated = list.filter(item => item.id !== pinId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Widget dilepas dari Sidebar Dashboard',
          showConfirmButton: false,
          timer: 1600,
          background: '#0f172a',
          color: '#f8fafc',
          iconColor: '#38bdf8',
        });
      } else {
        const newItem = {
          id: pinId,
          widgetId: widget.id,
          bucketId: bucket?.id || id,
          bucketName: bucket?.name || 'Data Bucket',
          widget: {
            ...widget,
            title: widget.title || `${widget.field} ${widget.type}`,
            field: widget.field,
            type: widget.type,
            unit: widget.unit,
            color: widget.config?.color,
            config: widget.config,
          },
          pinnedAt: new Date().toISOString(),
        };
        updated = [...list, newItem];
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Widget berhasil dikirim ke Sidebar Dashboard!',
          showConfirmButton: false,
          timer: 2000,
          background: '#0f172a',
          color: '#f8fafc',
          iconColor: '#34d399',
        });
      }
      setUserJsonPref(PREF_KEYS.PINNED_BUCKETS, updated);
      setPinnedWidgetIds(new Set(updated.map(i => i.widgetId)));
      window.dispatchEvent(new CustomEvent('bucket-widgets-updated'));
    } catch (e) {
      console.error("Pin toggle error:", e);
    }
  };

  const selectType = (newType) => {
    setFormType(newType);
    const defaultVariant = CHART_VARIANTS[newType]?.[0]?.id || 'glow';
    setFormVariant(defaultVariant);
    const isCont = newType === 'container';
    const isMulti = MULTI_SERIES_TYPES.includes(newType);
    setPreviewWidget(prev => ({
      ...(prev || {}),
      id: 'preview',
      type: newType,
      field: isCont ? 'container' : isMulti ? 'multi' : (prev?.field && prev.field !== 'multi' ? prev.field : (bucket?.fields?.[0] || 'field')),
      title: prev?.title || (isCont ? 'Container Group' : isMulti ? 'Gabungan Data Sensor' : `${bucket?.fields?.[0] || 'Sensor'} ${newType}`),
      w: isCont ? '3' : isMulti ? '2' : (prev?.w || '1'),
      h: prev?.h || 'normal',
      config: {
        ...(prev?.config || {}),
        variant: defaultVariant,
        color: formColor || undefined,
        layout: isCont ? 'grid-2' : undefined,
        fields: isMulti ? (prev?.config?.fields?.length > 0 ? prev.config.fields : (bucket?.fields || [])) : undefined,
      }
    }));
  };

  const selectColor = (newColor) => {
    setFormColor(newColor);
    setPreviewWidget(prev => ({
      ...(prev || {}),
      config: {
        ...(prev?.config || {}),
        color: newColor || undefined,
      }
    }));
  };

  const selectSize = (dimension, value) => {
    setPreviewWidget(prev => ({
      ...(prev || {}),
      [dimension]: value,
    }));
  };

  const handleVariantChange = (newVariant) => {
    setFormVariant(newVariant);
    setPreviewWidget(prev => prev ? {
      ...prev,
      config: {
        ...(prev.config || {}),
        variant: newVariant
      }
    } : prev);
  };

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

      // Protect local layout changes: never overwrite widgets if in editMode or if modified within 8s
      if (!editMode && (Date.now() - lastUpdateRef.current > 8000)) {
        setWidgets(prev => {
          if (fetchStartTime < lastUpdateRef.current) return prev;

          const next = bucketRes.data.widgets || [];
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });
      }
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
    if (!Array.isArray(recs) || recs.length === 0) return [];
    // Sort strictly chronological (oldest to newest) to avoid reverse oscillations
    const sorted = [...recs].sort((a, b) => {
      const ta = a.timestamp || a.recorded_at || a.created_at;
      const tb = b.timestamp || b.recorded_at || b.created_at;
      const da = ta ? new Date(ta).getTime() : NaN;
      const db = tb ? new Date(tb).getTime() : NaN;
      if (!isNaN(da) && !isNaN(db) && da !== db) return da - db;
      if (a.id && b.id && a.id !== b.id) return a.id - b.id;
      return 0;
    });

    const lastRec = sorted[sorted.length - 1];
    const lastRawTime = lastRec?.timestamp || lastRec?.recorded_at || lastRec?.created_at;
    const parsedLastTime = lastRawTime ? new Date(lastRawTime).getTime() : NaN;
    const endMs = !isNaN(parsedLastTime) ? parsedLastTime : Date.now();
    const intervalMs = 60000; // 1-minute uniform spacing prevents points from bunching into a vertical line

    return sorted.map((r, idx) => {
      // Equidistant date across width
      const syntheticDate = new Date(endMs - (sorted.length - 1 - idx) * intervalMs);
      const point = {
        ...r,
        timestamp: r.timestamp || r.recorded_at || `#${idx + 1}`,
        date: syntheticDate,
      };
      // Ensure all fields are numerical float values
      Object.keys(point).forEach((k) => {
        if (!['id', 'bucket_id', 'date', 'timestamp', 'created_at', 'updated_at', 'recorded_at', 'is_mock'].includes(k)) {
          if (point[k] !== undefined && point[k] !== null && typeof point[k] !== 'object') {
            const num = parseFloat(point[k]);
            if (!isNaN(num)) {
              point[k] = num;
            }
          }
        }
      });
      return point;
    });
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

  // ── Drag end (Root & Multi-Container Drag-and-Drop) ──
  const handleDragEnd = (event) => {
    lastUpdateRef.current = Date.now();
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;
    const activeWidget = widgets.find(w => w.id === activeId);
    if (!activeWidget) return;

    let targetContainerId = activeWidget.containerId || null;

    if (typeof overId === 'string' && (overId.startsWith('container-drop-') || overId.startsWith('container-card-'))) {
      const cId = overId.replace(/^container-(drop|card)-/, '');
      if (activeWidget.type !== 'container') {
        targetContainerId = cId;
      }
    } else {
      const overWidget = widgets.find(w => w.id === overId);
      if (overWidget) {
        if (overWidget.type === 'container') {
          if (activeWidget.type !== 'container') {
            targetContainerId = overWidget.id;
          } else {
            targetContainerId = null;
          }
        } else if (overWidget.containerId) {
          if (activeWidget.type !== 'container') {
            targetContainerId = overWidget.containerId;
          } else {
            targetContainerId = null;
          }
        } else {
          targetContainerId = null;
        }
      }
    }

    // Containers cannot be inside other containers
    if (activeWidget.type === 'container') {
      targetContainerId = null;
    }

    setWidgets(prev => {
      const activeIndex = prev.findIndex(w => w.id === activeId);
      if (activeIndex === -1) return prev;

      // Update target containerId
      const updated = prev.map((w, i) => i === activeIndex ? { ...w, containerId: targetContainerId } : w);

      let reordered = [...updated];
      const overWidget = prev.find(w => w.id === overId);
      if (overWidget && overWidget.id !== activeId) {
        const fromIdx = reordered.findIndex(w => w.id === activeId);
        const toIdx = reordered.findIndex(w => w.id === overWidget.id);
        if (fromIdx !== -1 && toIdx !== -1) {
          reordered = arrayMove(reordered, fromIdx, toIdx);
        }
      }

      saveWidgets(reordered);
      return reordered;
    });
  };

  // ── Container Action Helpers ──
  const handleContainerLayoutChange = async (containerId, newLayout) => {
    const updated = widgets.map(w => {
      if (w.id === containerId) {
        return {
          ...w,
          config: { ...(w.config || {}), layout: newLayout }
        };
      }
      return w;
    });
    setWidgets(updated);
    try {
      await saveWidgets(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEjectWidget = async (childId) => {
    const updated = widgets.map(w => w.id === childId ? { ...w, containerId: null } : w);
    setWidgets(updated);
    try {
      await saveWidgets(updated);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Widget dikeluarkan ke dashboard!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveWidgetToContainer = async (widgetId, containerId) => {
    const updated = widgets.map(w => w.id === widgetId ? { ...w, containerId } : w);
    setWidgets(updated);
    try {
      await saveWidgets(updated);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Widget dimasukkan ke container!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWidgetToContainer = (containerId) => {
    setTargetContainerId(containerId);
    handleAddWidget();
  };

  // ── Add / Edit Widget Submit ──
  const handleFormChange = (e) => {
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    const multiFields = fd.getAll('multiFields');

    const currentType = data.type || formType;
    const isMulti = MULTI_SERIES_TYPES.includes(currentType);
    const isCont = currentType === 'container';

    const fieldColors = {};
    if (isMulti) {
      multiFields.forEach(f => {
        if (data[`color_${f}`]) fieldColors[f] = data[`color_${f}`];
      });
    }

    setPreviewWidget({
      id: 'preview',
      type: currentType,
      field: data.field || (isCont ? 'container' : isMulti ? 'multi' : bucket?.fields?.[0]),
      title: data.title || (isCont ? 'Container Group' : isMulti ? 'Gabungan Data Sensor' : `${data.field || bucket?.fields?.[0] || 'Sensor'} ${currentType}`),
      w: data.w || (isCont ? '3' : isMulti ? '2' : '1'),
      h: data.h || 'normal',
      unit: data.unit || null,
      config: isCont ? {
        layout: data.layout || 'grid-2',
        color: data.color || formColor || null,
      } : {
        fields: isMulti ? (multiFields.length > 0 ? multiFields : (bucket?.fields || [])) : undefined,
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
        variant: data.variant || formVariant,
      }
    });
  };

  const handleWidgetSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    const multiFields = fd.getAll('multiFields');
    const isMulti = MULTI_SERIES_TYPES.includes(data.type);
    const isCont = data.type === 'container';

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
        field: data.field || (isCont ? 'container' : isMulti ? 'multi' : ''),
        title: data.title || (isCont ? 'Container Group' : isMulti ? 'Gabungan Data Sensor' : `${data.field} ${data.type}`),
        w: data.w || previewWidget?.w || editingWidget?.w || (isCont ? '3' : isMulti ? '2' : '1'),
        h: data.h || previewWidget?.h || editingWidget?.h || 'normal',
        unit: data.unit || null,
        containerId: targetContainerId || (editingWidget ? editingWidget.containerId : null),
        config: isCont ? {
          layout: data.layout || 'grid-2',
          color: data.color || null,
          variant: data.layout || 'grid-2',
        } : {
          fields: isMulti ? (multiFields.length > 0 ? multiFields : (bucket?.fields || [])) : undefined,
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
          showIn3D: !!data.showIn3D,
          variant: data.variant || formVariant,
        }
      };

      if (editingWidget) {
        // Edit existing
        const updated = widgets.map(w => w.id === editingWidget.id ? { ...w, ...widgetPayload } : w);
        setWidgets(updated);
        await saveWidgets(updated);
        setEditingWidget(null);
        setTargetContainerId(null);
        setShowWidgetModal(false);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Widget updated!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
      } else {
        // Add new
        const newWidget = { id: Date.now().toString(), ...widgetPayload };
        const newWidgets = [...widgets, newWidget];
        setWidgets(newWidgets);
        await saveWidgets(newWidgets);
        setTargetContainerId(null);
        setShowWidgetModal(false);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: isCont ? 'Container dibuat! Tarik widget ke dalamnya' : 'Widget added!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Widget (Safe Container Child Eject) ──
  const handleDeleteWidget = async (widgetId) => {
    const target = widgets.find(w => w.id === widgetId);
    const isContainer = target?.type === 'container';

    const result = await Swal.fire({
      title: isContainer ? 'Hapus Container?' : 'Remove widget?',
      text: isContainer
        ? 'Widget di dalam container ini akan tetap aman dan otomatis dikeluarkan ke dashboard utama.'
        : 'Apakah Anda yakin ingin menghapus widget ini dari dashboard?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;

    let newWidgets;
    if (isContainer) {
      newWidgets = widgets
        .filter(w => w.id !== widgetId)
        .map(w => w.containerId === widgetId ? { ...w, containerId: null } : w);
    } else {
      newWidgets = widgets.filter(w => w.id !== widgetId);
    }

    setWidgets(newWidgets);
    try {
      await saveWidgets(newWidgets);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: isContainer ? 'Container dihapus & widget dikeluarkan!' : 'Widget removed!', showConfirmButton: false, timer: 2000, timerProgressBar: true, background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399' });
    } catch {
      setWidgets(widgets); // Revert on failure
    }
  };

  // ── Resize Widget (Instant Optimistic UI + Debounced Auto-Save) ──
  const handleResizeWidget = (widgetId, updates) => {
    lastUpdateRef.current = Date.now();
    setWidgets(prev => {
      const updated = prev.map(w => {
        if (w.id === widgetId) {
          const nextConfig = updates.config ? { ...(w.config || {}), ...updates.config } : w.config;
          return { ...w, ...updates, config: nextConfig };
        }
        return w;
      });

      // Also sync pinned widget cache in per-user storage if pinned
      try {
        const pinnedList = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
        if (Array.isArray(pinnedList) && pinnedList.length > 0) {
          let changed = false;
          const nextPinned = pinnedList.map(item => {
            if (item.widgetId === widgetId || item.id === `${id}_${widgetId}`) {
              changed = true;
              const nextCfg = updates.config ? { ...(item.widget?.config || {}), ...updates.config } : item.widget?.config;
              return {
                ...item,
                widget: {
                  ...item.widget,
                  ...updates,
                  config: nextCfg,
                },
              };
            }
            return item;
          });
          if (changed) {
            setUserJsonPref(PREF_KEYS.PINNED_BUCKETS, nextPinned);
            window.dispatchEvent(new CustomEvent('bucket-widgets-updated'));
          }
        }
      } catch {}

      if (resizeSaveTimerRef.current) clearTimeout(resizeSaveTimerRef.current);
      resizeSaveTimerRef.current = setTimeout(async () => {
        try {
          await saveWidgets(updated);
        } catch (err) {
          console.error("Auto-save resize failed:", err);
        }
      }, 350);
      return updated;
    });
  };

  // ── Open edit modal ──
  const handleEditWidget = (widget) => {
    setEditingWidget(widget);
    setFormType(widget.type);
    setFormColor(widget.config?.color || '');
    setFormVariant(widget.config?.variant || (widget.type === 'line' ? 'glow' : widget.type === 'bar' ? 'rounded' : 'smooth'));
    setModalStep(1);
    setPreviewWidget(widget);
    setShowWidgetModal(true);
  };

  // ── Open add modal ──
  const handleAddWidget = () => {
    setEditingWidget(null);
    setFormType('line');
    setFormColor('');
    setFormVariant('glow');
    setModalStep(1);
    setPreviewWidget({
      id: 'preview',
      type: 'line',
      field: 'multi',
      title: 'Gabungan Data Sensor',
      w: '2',
      h: 'normal',
      config: {
        variant: 'glow',
        fields: bucket?.fields || [],
      }
    });
    setShowWidgetModal(true);
  };

  const rootWidgets = useMemo(() => widgets.filter(w => !w.containerId), [widgets]);
  const containers = useMemo(() => widgets.filter(w => w.type === 'container'), [widgets]);

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
        <Link to="/app/buckets" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editMode
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
              className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === tab.id
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
              <span><strong>Edit Mode:</strong> Drag widget untuk mengatur posisi atau drag langsung ke dalam <strong>Container Group</strong> · Klik <Boxes size={13} className="inline mx-1 text-primary-400" /> untuk wadah multi-widget</span>
            </div>
          )}

          {/* Widget Grid */}
          {widgets.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <SortableContext items={rootWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                  {rootWidgets.map((widget, i) => {
                    if (widget.type === 'container') {
                      const childWidgets = widgets.filter(w => w.containerId === widget.id);
                      return (
                        <ContainerWidget
                          key={widget.id}
                          container={widget}
                          children={childWidgets}
                          index={i}
                          chartData={chartData}
                          onDelete={handleDeleteWidget}
                          onEdit={handleEditWidget}
                          onResize={handleResizeWidget}
                          onLayoutChange={handleContainerLayoutChange}
                          onAddChild={handleAddWidgetToContainer}
                          onEjectChild={handleEjectWidget}
                          editMode={editMode}
                          onTogglePin={handleTogglePinToDashboard}
                          pinnedWidgetIds={pinnedWidgetIds}
                        />
                      );
                    }
                    return (
                      <SortableWidget
                        key={widget.id}
                        widget={widget}
                        index={i}
                        chartData={chartData}
                        containers={containers}
                        onMoveToContainer={handleMoveWidgetToContainer}
                        onDelete={handleDeleteWidget}
                        onEdit={handleEditWidget}
                        onResize={handleResizeWidget}
                        editMode={editMode}
                        onTogglePin={handleTogglePinToDashboard}
                        isPinned={pinnedWidgetIds.has(widget.id)}
                      />
                    );
                  })}
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
                    {`curl -X POST https://videalink.my.id/api/v1/mqtt/publish \\
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

      {/* ─── Add/Edit Widget Modal (Vision UI Studio Style) ─── */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-6xl my-auto bg-gradient-to-b from-slate-900/98 via-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row max-h-[92vh] overflow-hidden">
            
            {/* Top Laser Accent Glow */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/80 to-transparent pointer-events-none z-30" />

            {/* ══════════════════════════════════════════════════════════════
                LEFT SIDE: WIDGET CONFIGURATION STUDIO
            ══════════════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-[55%] flex flex-col border-slate-700/60 lg:border-r overflow-y-auto custom-scrollbar">
              
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-slate-700/60 flex justify-between items-start shrink-0 bg-slate-900/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary-500/15 text-primary-400 border border-primary-500/30">
                      <Sparkles size={11} className="text-primary-400 animate-pulse" />
                      Widget Studio
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[200px]">{bucket.name}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                    {editingWidget ? 'Pengaturan Widget Dashboard' : 'Buat Widget Baru'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Kustomisasi visualisasi IoT, dimensi grid, dan pemetaan telemetri sensor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowWidgetModal(false); setEditingWidget(null); }}
                  className="text-slate-400 hover:text-slate-100 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all hover:scale-105"
                  title="Tutup dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Clickable Segmented Stepper Tabs */}
              <div className="px-5 sm:px-6 pt-4 pb-2 shrink-0">
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80">
                  {[
                    { step: 1, label: 'Tipe Widget', sub: '25 Visualisasi', icon: LayoutGrid },
                    { step: 2, label: 'Gaya & Grid', sub: 'Warna & Ukuran', icon: Palette },
                    { step: 3, label: 'Data & Sensor', sub: 'Mapping Parameter', icon: SlidersHorizontal },
                  ].map(s => {
                    const Icon = s.icon;
                    const isActive = modalStep === s.step;
                    const isDone = modalStep > s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setModalStep(s.step)}
                        className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl text-left transition-all relative ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/50 shadow-md shadow-primary-500/10'
                            : 'hover:bg-slate-800/40 text-slate-400'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          isActive
                            ? 'bg-primary-500 text-white shadow-[0_0_10px_rgba(var(--primary-500),0.5)]'
                            : isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}>
                          {isDone ? <Check size={13} strokeWidth={3} /> : s.step}
                        </div>
                        <div className="min-w-0 hidden sm:block">
                          <p className={`text-[12px] font-extrabold leading-tight truncate ${isActive ? 'text-primary-300' : 'text-slate-200'}`}>
                            {s.label}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Form Body */}
              <form
                onChange={handleFormChange}
                onSubmit={handleWidgetSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName === 'INPUT' && modalStep < 3) {
                    e.preventDefault();
                    setModalStep(s => s + 1);
                  }
                }}
                className="p-5 sm:p-6 flex-1 flex flex-col justify-between"
              >
                {/* ─────────────────────────────────────────────────────────────
                    STEP 1: WIDGET TYPE SELECTION WITH CATEGORY FILTER
                ───────────────────────────────────────────────────────────── */}
                <div className={modalStep === 1 ? 'block space-y-4 animate-fade-in' : 'hidden'}>
                  
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: 'all',          label: 'Semua', count: CHART_TYPES.length },
                      { id: 'charts',       label: 'Grafik Telemetri', count: CHART_TYPES.filter(c => c.category === 'chart').length },
                      { id: 'sensors',      label: 'Kontrol & IoT', count: CHART_TYPES.filter(c => c.category === 'widget' && c.value !== 'container').length },
                      { id: 'container',    label: 'Container Group', count: CHART_TYPES.filter(c => c.value === 'container').length },
                      { id: 'curves',       label: 'Kurva & Aliran', count: CHART_TYPES.filter(c => c.group === 'curves').length },
                      { id: 'bars',         label: 'Batang & Hybrid', count: CHART_TYPES.filter(c => c.group === 'bars').length },
                      { id: 'distribution', label: 'Polar & Distribusi', count: CHART_TYPES.filter(c => c.group === 'distribution').length },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTypeFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          typeFilter === f.id
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                          typeFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {CHART_TYPES
                      .filter(ct => {
                        if (typeFilter === 'all') return true;
                        if (typeFilter === 'charts') return ct.category === 'chart';
                        if (typeFilter === 'sensors') return ct.category === 'widget' && ct.value !== 'container';
                        if (typeFilter === 'container') return ct.value === 'container';
                        return ct.group === typeFilter;
                      })
                      .map(ct => {
                        const Icon = ct.icon;
                        const isSelected = formType === ct.value;
                        const isChartMulti = MULTI_SERIES_TYPES.includes(ct.value);
                        return (
                          <div
                            key={ct.value}
                            onClick={() => selectType(ct.value)}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative group flex flex-col justify-between min-h-[96px] ${
                              isSelected
                                ? 'border-primary-500 bg-gradient-to-br from-primary-500/15 via-primary-500/5 to-slate-900 shadow-[0_0_20px_rgba(var(--primary-500),0.25)] ring-1 ring-primary-500'
                                : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="type"
                              value={ct.value}
                              checked={isSelected}
                              onChange={() => {}}
                              className="sr-only"
                            />

                            <div className="flex items-start justify-between gap-1.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                isSelected
                                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                              }`}>
                                <Icon size={16} strokeWidth={1.8} />
                              </div>

                              <div className="flex items-center gap-1">
                                {ct.badge && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                                    {ct.badge}
                                  </span>
                                )}
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm">
                                    <Check size={10} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-2">
                              <p className={`text-[12px] font-black leading-tight ${isSelected ? 'text-primary-300' : 'text-slate-100'}`}>
                                {ct.label}
                              </p>
                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                                {ct.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STEP 2: APPEARANCE (COLOR THEMES & GRID SIZE)
                ───────────────────────────────────────────────────────────── */}
                <div className={modalStep === 2 ? 'block space-y-6 animate-fade-in' : 'hidden'}>
                  
                  {/* Color Palette Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <Palette size={14} className="text-primary-400" />
                        Palet Warna Widget
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">Pilih tema aksen visual</span>
                    </div>

                    <input type="hidden" name="color" value={formColor} />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Auto (Tema Sistem)', value: '', preview: 'linear-gradient(135deg, rgb(var(--primary-500)), #22d3ee)' },
                        { label: 'Cyber Cyan',        value: '#22d3ee', preview: '#22d3ee' },
                        { label: 'Bio Emerald',       value: '#10b981', preview: '#10b981' },
                        { label: 'Royal Blue',        value: '#3b82f6', preview: '#3b82f6' },
                        { label: 'Electric Violet',   value: '#8b5cf6', preview: '#8b5cf6' },
                        { label: 'Sunset Amber',      value: '#f59e0b', preview: '#f59e0b' },
                        { label: 'Neon Rose',         value: '#f43f5e', preview: '#f43f5e' },
                        { label: 'Bright Sky',        value: '#06b6d4', preview: '#06b6d4' },
                      ].map(c => {
                        const isSelected = formColor === c.value;
                        return (
                          <button
                            type="button"
                            key={c.label}
                            onClick={() => selectColor(c.value)}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500/15 shadow-md shadow-primary-500/10 ring-1 ring-primary-500'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/50'
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-white/20"
                              style={{ background: c.preview }}
                            />
                            <div className="min-w-0">
                              <p className={`text-[11px] font-extrabold truncate ${isSelected ? 'text-primary-300' : 'text-slate-200'}`}>
                                {c.label}
                              </p>
                              <p className="text-[9px] font-mono text-slate-400 truncate">
                                {c.value || 'System Var'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Color Picker input */}
                    <div className="mt-3 flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                        <input
                          type="color"
                          value={formColor || '#22d3ee'}
                          onChange={(e) => selectColor(e.target.value)}
                          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => selectColor(e.target.value)}
                        placeholder="Kustom Hex Code (misal: #00f2fe)"
                        className="bg-transparent border-0 text-xs font-mono text-slate-200 focus:outline-none flex-1 placeholder-slate-500"
                      />
                      {formColor && (
                        <button
                          type="button"
                          onClick={() => selectColor('')}
                          className="text-[11px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                        >
                          Reset Auto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid Width Selection */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-2.5">
                      <LayoutGrid size={14} className="text-primary-400" />
                      Lebar Kolom Grid
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: '1', title: '1 Kolom', sub: 'Kompak (1/3 Lebar)', cols: 1 },
                        { value: '2', title: '2 Kolom', sub: 'Sedang (2/3 Lebar)', cols: 2 },
                        { value: '3', title: '3 Kolom', sub: 'Penuh (Full Banner)', cols: 3 },
                      ].map(sz => {
                        const isSelected = (previewWidget?.w || editingWidget?.w || '1') === sz.value;
                        return (
                          <label key={sz.value} className="relative cursor-pointer">
                            <input
                              type="radio"
                              name="w"
                              value={sz.value}
                              checked={isSelected}
                              onChange={() => selectSize('w', sz.value)}
                              className="sr-only"
                            />
                            <div className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500/15 shadow-md shadow-primary-500/10 ring-1 ring-primary-500'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/50'
                            }`}>
                              {/* 3-column Visual Grid Graphic */}
                              <div className="grid grid-cols-3 gap-1 w-full max-w-[80px] h-6 p-1 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className={`rounded-sm transition-colors ${sz.cols >= 1 ? 'bg-primary-500 shadow-[0_0_6px_rgba(var(--primary-500),0.6)]' : 'bg-slate-800'}`} />
                                <div className={`rounded-sm transition-colors ${sz.cols >= 2 ? 'bg-primary-500 shadow-[0_0_6px_rgba(var(--primary-500),0.6)]' : 'bg-slate-800'}`} />
                                <div className={`rounded-sm transition-colors ${sz.cols >= 3 ? 'bg-primary-500 shadow-[0_0_6px_rgba(var(--primary-500),0.6)]' : 'bg-slate-800'}`} />
                              </div>

                              <div>
                                <p className={`text-[12px] font-black leading-tight ${isSelected ? 'text-primary-300' : 'text-slate-100'}`}>
                                  {sz.title}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{sz.sub}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Height Selection */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-2.5">
                      <Move size={14} className="text-primary-400" />
                      Tinggi Kartu Visualisasi
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'normal', title: 'Normal (220px)', sub: 'Standar hemat ruang untuk grafik tunggal & gauge', icon: Minimize2 },
                        { value: 'tall',   title: 'Tinggi / Tall (320px)', sub: 'Ekspansi lega untuk multi-series & detail radar', icon: Maximize2 },
                      ].map(hOpt => {
                        const isSelected = (previewWidget?.h || editingWidget?.h || 'normal') === hOpt.value;
                        const Icon = hOpt.icon;
                        return (
                          <label key={hOpt.value} className="relative cursor-pointer">
                            <input
                              type="radio"
                              name="h"
                              value={hOpt.value}
                              checked={isSelected}
                              onChange={() => selectSize('h', hOpt.value)}
                              className="sr-only"
                            />
                            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500/15 shadow-md shadow-primary-500/10 ring-1 ring-primary-500'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/50'
                            }`}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[12px] font-black leading-tight ${isSelected ? 'text-primary-300' : 'text-slate-100'}`}>
                                  {hOpt.title}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{hOpt.sub}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STEP 3: DATA MAPPING & PARAMETERS
                ───────────────────────────────────────────────────────────── */}
                <div className={modalStep === 3 ? 'block space-y-5 animate-fade-in' : 'hidden'}>
                  
                  {formType !== 'container' ? (
                    <>
                      {/* Widget Title */}
                      <div className="vision-inner-box p-3.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-2">
                          <Tag size={14} className="text-primary-400" />
                          Judul Kartu Widget
                        </label>
                        <input
                          name="title"
                          type="text"
                          defaultValue={editingWidget?.title || ''}
                          placeholder="e.g. Suhu Ruang Server • Bklit Gauge"
                          className="input-field w-full"
                        />
                      </div>

                      {/* Data Field Selection */}
                      {MULTI_SERIES_TYPES.includes(formType) ? (
                        <div className="vision-inner-box p-3.5">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center justify-between mb-2">
                            <span className="flex items-center gap-2">
                              <Database size={14} className="text-primary-400" />
                              Pilih Field Telemetri
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">Centang field yang ingin ditampilkan</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {bucket.fields?.map((f, idx) => {
                              const isCheckedByDefault = editingWidget
                                ? (editingWidget.config?.fields?.includes(f) ?? (editingWidget.field === f))
                                : true;
                              return (
                                <div key={f} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
                                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer flex-1">
                                    <input
                                      type="checkbox"
                                      name="multiFields"
                                      value={f}
                                      defaultChecked={isCheckedByDefault}
                                      className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-primary-500 focus:ring-primary-500/50"
                                    />
                                    <span className="truncate">{f}</span>
                                  </label>
                                  <input
                                    type="color"
                                    name={`color_${f}`}
                                    defaultValue={editingWidget?.config?.fieldColors?.[f] || getColor(idx)}
                                    className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent shrink-0"
                                    title={`Warna untuk ${f}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="vision-inner-box p-3.5">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-2">
                            <Database size={14} className="text-primary-400" />
                            Sumber Field Telemetri
                          </label>
                          <select
                            name="field"
                            defaultValue={editingWidget?.field || bucket.fields?.[0] || ''}
                            className="input-field w-full text-sm font-semibold"
                            required={formType !== 'container'}
                          >
                            {bucket.fields?.map(f => (
                              <option key={f} value={f}>
                                {f} (Data Stream)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Bklit UI Chart Variant selector */}
                      {CHART_VARIANTS[formType] && (
                        <div className="vision-inner-box p-3.5">
                          <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                              Bklit UI Style Variant
                            </label>
                            <span className="text-[11px] font-bold text-primary-400">Pilih Model Visual</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {CHART_VARIANTS[formType]?.map(v => {
                              const isSelected = formVariant === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleVariantChange(v.id)}
                                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? 'border-primary-500 bg-primary-500/20 shadow-md shadow-primary-500/20 ring-1 ring-primary-500'
                                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="variant"
                                    value={v.id}
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="sr-only"
                                  />
                                  <span className={`text-[11px] font-black ${isSelected ? 'text-primary-300' : 'text-slate-200'}`}>
                                    {v.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                    {v.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Unit & Range */}
                      {(formType === 'stat' || formType === 'gauge' || NUMERIC_TYPES.includes(formType)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 block">Satuan Unit</label>
                            <input
                              name="unit"
                              type="text"
                              defaultValue={editingWidget?.unit || ''}
                              placeholder="e.g. °C, %, bar, ppm"
                              className="input-field w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 block">Nilai Min</label>
                            <input
                              name="min"
                              type="number"
                              defaultValue={editingWidget?.config?.min || 0}
                              className="input-field w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 block">Nilai Max</label>
                            <input
                              name="max"
                              type="number"
                              defaultValue={editingWidget?.config?.max || 100}
                              className="input-field w-full text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Critical Threshold Alert */}
                      {NUMERIC_TYPES.includes(formType) && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame size={14} className="text-amber-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-amber-300">Batas Kritis / Alert Threshold</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] text-slate-400 mb-1">Picu alert jika nilai &ge; batas ini</p>
                              <input
                                name="alertThreshold"
                                type="number"
                                step="any"
                                defaultValue={editingWidget?.config?.alertThreshold || ''}
                                placeholder="Contoh: 85"
                                className="input-field w-full text-xs"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 mb-1">Warna saat batas terlampaui</p>
                              <div className="flex items-center gap-2.5">
                                <input
                                  name="alertColor"
                                  type="color"
                                  defaultValue={editingWidget?.config?.alertColor || '#ef4444'}
                                  className="w-9 h-9 rounded-xl cursor-pointer bg-slate-800 border border-slate-700 p-0.5 shrink-0"
                                />
                                <span className="text-xs font-mono text-rose-400">Peringatan Bahaya</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status / Switch / Action Control Configs */}
                      {formType === 'status' && (
                        <div className="grid grid-cols-2 gap-3 vision-inner-box p-3.5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Label On (1, true)</label>
                            <input name="onLabel" type="text" defaultValue={editingWidget?.config?.onLabel || 'Online'} className="input-field w-full text-xs" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Label Off (0, false)</label>
                            <input name="offLabel" type="text" defaultValue={editingWidget?.config?.offLabel || 'Offline'} className="input-field w-full text-xs" />
                          </div>
                        </div>
                      )}

                      {formType === 'switch' && (
                        <div className="vision-inner-box p-3.5">
                          <label className="text-[11px] font-bold text-slate-300 mb-1 block">Target MQTT Publish Topic</label>
                          <input name="topic" type="text" defaultValue={editingWidget?.config?.topic || `iot/device/${bucket.id}/set`} className="input-field w-full text-xs font-mono" />
                        </div>
                      )}

                      {formType === 'action' && (
                        <div className="space-y-3 vision-inner-box p-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-300 mb-1 block">Target MQTT Topic</label>
                              <input name="topic" type="text" defaultValue={editingWidget?.config?.topic || `iot/device/${bucket.id}/set`} className="input-field w-full text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-300 mb-1 block">Label Tombol</label>
                              <input name="btnLabel" type="text" defaultValue={editingWidget?.config?.btnLabel || 'Trigger'} className="input-field w-full text-xs" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Payload Perintah</label>
                            <input name="payload" type="text" defaultValue={editingWidget?.config?.payload || '1'} className="input-field w-full text-xs font-mono" />
                          </div>
                        </div>
                      )}

                      {/* 3D Floor Plan Integration */}
                      {formType !== 'container' && formType !== 'map' && formType !== 'log' && (
                        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              name="showIn3D"
                              defaultChecked={editingWidget?.config?.showIn3D || false}
                              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-primary-500 focus:ring-primary-500/50 mt-1"
                            />
                            <div>
                              <span className="block text-xs font-black text-slate-200 group-hover:text-primary-300 flex items-center gap-1.5">
                                <Box size={13} className="text-primary-400" />
                                Tampilkan di 3D Room Floor Plan
                              </span>
                              <span className="block text-[11px] text-slate-400 mt-0.5">
                                Metrik widget ini akan otomatis muncul pada pop-up interaktif perangkat di peta ruang 3D.
                              </span>
                            </div>
                          </label>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Container Setup */
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent border border-primary-500/30">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-500),0.3)]">
                            <Boxes size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-100">Container Group IoT</h4>
                            <p className="text-[11px] text-primary-400 font-semibold">Wadah Multi-Widget Drag & Drop</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">
                          Container ini berfungsi sebagai bingkai grup untuk menampung beberapa widget IoT. Anda dapat men-drag widget dari dashboard ke dalam container ini, atau mengklik tombol <strong>+ Tambah</strong> di dalam kartu container.
                        </p>
                      </div>

                      <div className="vision-inner-box p-3.5 space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                          <Tag size={14} className="text-primary-400" />
                          Judul Container
                        </label>
                        <input
                          name="title"
                          type="text"
                          defaultValue={editingWidget?.title || 'Container Group'}
                          placeholder="e.g. Panel Ruang Server, Stasiun Pompa A"
                          className="input-field w-full"
                          required
                        />
                      </div>

                      <div className="vision-inner-box p-3.5 space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                          <LayoutGrid size={14} className="text-primary-400" />
                          Tata Letak (Layout) Sub-Widget
                        </label>
                        <select name="layout" defaultValue={editingWidget?.config?.layout || 'grid-2'} className="input-field w-full">
                          <option value="grid-2">Grid 2 Kolom (Berdampingan Responsif)</option>
                          <option value="grid-3">Grid 3 Kolom (Tiga Kolom)</option>
                          <option value="stack">Stack Vertikal (Tumpuk Satu Kolom)</option>
                          <option value="flex-row">Baris Fleksibel (Wrap Otomatis)</option>
                        </select>
                      </div>

                      <input type="hidden" name="field" value="container" />
                    </div>
                  )}

                </div>

                {/* ─────────────────────────────────────────────────────────────
                    MODAL FOOTER ACTIONS
                ───────────────────────────────────────────────────────────── */}
                <div className="pt-5 mt-5 flex items-center justify-between gap-3 border-t border-slate-800">
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
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    disabled={submitting}
                  >
                    {modalStep > 1 ? '← Kembali' : 'Batal'}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 mr-2 hidden sm:inline">
                      Langkah {modalStep} dari 3
                    </span>

                    {modalStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => setModalStep(s => s + 1)}
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-lg shadow-primary-500/25 transition-all flex items-center gap-1.5"
                      >
                        <span>Lanjut</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 min-w-[140px] justify-center"
                        disabled={!bucket.fields || bucket.fields.length === 0 || submitting}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} strokeWidth={3} />
                            <span>{editingWidget ? 'Simpan Perubahan' : 'Pasang Widget'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                RIGHT SIDE: REALISTIC LIVE DEVICE MOCKUP CANVAS
            ══════════════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-[45%] p-5 sm:p-6 flex flex-col justify-between bg-slate-950/70 relative border-t lg:border-t-0 border-slate-800">
              
              {/* Studio Canvas Top Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                    Live Canvas Preview
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-primary-400 border border-slate-700/60">
                    {previewWidget?.w || '1'} Col • {previewWidget?.h || 'normal'}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    {formType}
                  </span>
                </div>
              </div>

              {/* Realistic Blueprint / Device Frame Preview */}
              <div className="flex-1 flex items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 relative overflow-hidden bg-grid min-h-[340px]">
                {/* Ambient Center Glow */}
                <div
                  className="absolute w-44 h-44 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-500"
                  style={{ backgroundColor: formColor || '#22d3ee' }}
                />

                {previewWidget ? (() => {
                  const fieldsToMock = [
                    previewWidget.field,
                    previewWidget.config?.widgetA?.field,
                    previewWidget.config?.widgetB?.field,
                    ...(bucket?.fields || [])
                  ].filter(Boolean);

                  const previewData = (chartData && chartData.length > 0)
                    ? chartData
                    : Array.from({ length: 12 }).map((_, i) => {
                        const row = {
                          timestamp: `10:${i < 10 ? '0' + i : i}`,
                          date: new Date(Date.now() - (11 - i) * 60000),
                        };
                        fieldsToMock.forEach(f => {
                          row[f] = Math.round(24 + Math.sin(i / 2) * 12 + i * 2);
                        });
                        return row;
                      });

                  const currentVariant = previewWidget.config?.variant || formVariant;
                  const WidgetIcon = CHART_TYPES.find(c => c.value === previewWidget.type)?.icon || Activity;

                  return (
                    <div className="w-full max-w-sm vision-card p-5 transition-all shadow-2xl relative z-10">
                      {/* Mock Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-black text-slate-100 truncate">
                            {previewWidget.title || `${previewWidget.field || 'Field'} ${previewWidget.type}`}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {MULTI_SERIES_TYPES.includes(previewWidget.type)
                              ? (previewWidget.config?.fields?.length > 0 ? previewWidget.config.fields.join(' + ') : 'Multi-Series')
                              : `field: ${previewWidget.field || bucket?.fields?.[0] || 'telemetry'}`}
                          </p>
                        </div>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{
                            background: formColor || 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                          }}
                        >
                          <WidgetIcon size={14} />
                        </div>
                      </div>

                      {/* Mock Chart Render */}
                      <div className="w-full pt-1">
                        <WidgetChart
                          widget={previewWidget}
                          chartData={previewData}
                          color={formColor || previewWidget?.config?.color || undefined}
                          overrideVariant={currentVariant}
                        />
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center text-slate-500 animate-pulse">
                    <Maximize2 size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Pilih tipe widget untuk melihat live preview</p>
                  </div>
                )}
              </div>

              {/* Bottom Canvas Notice */}
              <div className="pt-3 text-center">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Info size={13} className="text-primary-400" />
                  {chartData?.length > 0
                    ? 'Kanvas terhubung langsung ke telemetri aktif data bucket Anda.'
                    : 'Simulasi data sensor aktif (menunggu transmisi broker IoT).'}
                </p>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
