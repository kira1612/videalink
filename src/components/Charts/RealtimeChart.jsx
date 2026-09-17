import { useState, useEffect, useId } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { generateChartData } from '../../data/mockData';

/* ── Custom Tooltip ──────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-500 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: <span className="text-slate-300">{entry.value}{entry.unit || ''}</span>
        </p>
      ))}
    </div>
  );
};

/* shared axis / grid props */
const axisStyle = { fontSize: 10, fill: 'rgb(100,116,139)' };
const gridStyle = { strokeDasharray: '3 3', stroke: 'rgba(148,163,184,0.08)' };

/* ── Realtime Area Chart ─────────────────────────────────────────────────── */
export function RealtimeLineChart({ title, color = 'rgb(6,182,212)', unit = '', baseValue = 25, variance = 5 }) {
  // Generate a stable, valid SVG element ID (no special chars)
  const uid = useId().replace(/:/g, '');
  const gradientId = `rta-${uid}`;

  const [data, setData] = useState(() => generateChartData(20, baseValue, variance));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: parseFloat((baseValue + (Math.random() - 0.5) * variance * 2).toFixed(1)),
        };
        return [...prev.slice(-19), newPoint];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [baseValue, variance]);

  // Resolve actual computed color from CSS variable if needed
  const resolvedColor = color.startsWith('rgb(var(') ? `rgb(var(--primary-500))` : color;

  return (
    <div className="glass-card p-5">
      {title && (
        <h3 className="text-[13px] font-semibold text-slate-400 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {/* Use primary CSS var for stops so it follows the theme */}
              <stop offset="0%"  stopColor="rgb(var(--primary-500))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="rgb(var(--primary-500))" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            name={title || 'Value'}
            unit={unit}
            stroke="rgb(var(--primary-500))"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: 'rgb(var(--primary-400))', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Multi Line Chart ────────────────────────────────────────────────────── */
export function MultiLineChart({ title, series = [] }) {
  // Curated colors that work in both light and dark
  const lineColors = [
    'rgb(var(--primary-500))',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
  ];

  const [data, setData] = useState(() => {
    const points = 20;
    const now = Date.now();
    return Array.from({ length: points }, (_, i) => {
      const obj = {
        time: new Date(now - (points - i) * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      series.forEach(s => {
        obj[s.key] = parseFloat((s.base + (Math.random() - 0.5) * s.variance * 2).toFixed(1));
      });
      return obj;
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const obj = {
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        series.forEach(s => {
          obj[s.key] = parseFloat((s.base + (Math.random() - 0.5) * s.variance * 2).toFixed(1));
        });
        return [...prev.slice(-19), obj];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-5">
      {title && (
        <h3 className="text-[13px] font-semibold text-slate-400 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: 'rgb(100,116,139)' }}
            iconType="circle"
            iconSize={8}
          />
          {series.map((s, idx) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={lineColors[idx % lineColors.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
