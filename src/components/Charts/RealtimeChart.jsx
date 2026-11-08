import { useState, useEffect, useRef, useMemo } from 'react';
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from './bklit';
import { generateChartData } from '../../data/mockData';

/* ── Realtime Area Chart (Bklit UI) ───────────────────────────────────────── */
export function RealtimeLineChart({ title, color = 'rgb(var(--primary-500))', unit = '', baseValue = 25, variance = 5 }) {
  const [data, setData] = useState(() => {
    const raw = generateChartData(20, baseValue, variance);
    const now = Date.now();
    return raw.map((d, i) => ({
      ...d,
      date: new Date(now - (raw.length - 1 - i) * 2000),
    }));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newPoint = {
          date: new Date(),
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: parseFloat((baseValue + (Math.random() - 0.5) * variance * 2).toFixed(1)),
        };
        return [...prev.slice(-19), newPoint];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [baseValue, variance]);

  const resolvedColor = color.startsWith('rgb(var(') ? 'rgb(var(--primary-500))' : color;

  return (
    <div className="vision-card p-5">
      {title && (
        <h3 className="text-[13px] font-semibold text-slate-400 mb-4">{title}</h3>
      )}
      <div className="w-full" style={{ height: 180 }}>
        <AreaChart
          data={data}
          xDataKey="date"
          className="w-full h-[180px]"
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <Grid stroke="rgba(148,163,184,0.08)" strokeDasharray="3,3" />
          <Area
            dataKey="value"
            stroke={resolvedColor}
            fill={resolvedColor}
            fillOpacity={0.35}
            strokeWidth={2.5}
          />
          <XAxis />
          <ChartTooltip />
        </AreaChart>
      </div>
    </div>
  );
}

/* ── Multi Line Chart (Bklit UI) ─────────────────────────────────────────── */
export function MultiLineChart({ title, series = [], initialData = null, isOnline = true, height = 220 }) {
  const lineColors = [
    'rgb(var(--primary-400))',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
  ];

  const generateFallbackPoints = (online) => {
    const points = 10;
    const now = Date.now();
    return Array.from({ length: points }, (_, i) => {
      const pointDate = new Date(now - (points - i) * 60000);
      const obj = {
        date: pointDate,
        time: pointDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      series.forEach(s => {
        obj[s.key] = online ? parseFloat((s.base || 0).toFixed(1)) : 0;
      });
      return obj;
    });
  };

  const [data, setData] = useState(() => {
    if (initialData && initialData.length > 0) {
      const now = Date.now();
      return initialData.map((d, i) => ({
        ...d,
        date: d.date instanceof Date ? d.date : (d.time && !isNaN(new Date(d.time).getTime()) ? new Date(d.time) : new Date(now - (initialData.length - 1 - i) * 60000)),
      }));
    }
    return generateFallbackPoints(isOnline);
  });

  const initialDataRef = useRef(JSON.stringify(initialData));

  useEffect(() => {
    const serialized = JSON.stringify(initialData);
    if (serialized !== initialDataRef.current) {
      initialDataRef.current = serialized;
      if (initialData && initialData.length > 0) {
        const now = Date.now();
        setData(initialData.map((d, i) => ({
          ...d,
          date: d.date instanceof Date ? d.date : (d.time && !isNaN(new Date(d.time).getTime()) ? new Date(d.time) : new Date(now - (initialData.length - 1 - i) * 60000)),
        })));
      } else {
        setData(generateFallbackPoints(isOnline));
      }
    }
  }, [initialData, isOnline]);

  useEffect(() => {
    if (initialData && initialData.length > 0) return;
    if (!isOnline) {
      setData(generateFallbackPoints(false));
      return;
    }

    const interval = setInterval(() => {
      setData(prev => {
        const pointDate = new Date();
        const obj = {
          date: pointDate,
          time: pointDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        series.forEach(s => {
          const base = s.base ?? 10;
          const variance = s.variance ?? 5;
          obj[s.key] = parseFloat((base + (Math.random() - 0.5) * variance * 2).toFixed(1));
        });
        return [...prev.slice(-14), obj];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOnline, initialData, series]);

  const content = (
    <div className="w-full relative" style={{ height }}>
      {title && (
        <h3 className="text-[13px] font-semibold text-slate-400 mb-4">{title}</h3>
      )}
      <div className="w-full" style={{ height: height - (title ? 40 : 0) }}>
        <AreaChart
          data={data}
          xDataKey="date"
          className="w-full"
          style={{ height: height - (title ? 40 : 0) }}
          margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
        >
          <Grid stroke="rgba(148,163,184,0.08)" strokeDasharray="3,3" />
          {series.map((s, idx) => (
            <Area
              key={s.key}
              dataKey={s.key}
              stroke={lineColors[idx % lineColors.length]}
              fill={lineColors[idx % lineColors.length]}
              fillOpacity={0.3}
              strokeWidth={2.5}
            />
          ))}
          <XAxis />
          <ChartTooltip />
        </AreaChart>
      </div>
    </div>
  );

  return title ? <div className="vision-card p-5">{content}</div> : content;
}
