import React, { useState } from 'react';
import { Zap, Plus, Minus, Thermometer } from 'lucide-react';

export default function ThermostatWidget({
  title = 'Living Room AC',
  min = 16,
  max = 30,
  initialValue = 22,
  unit = '°C',
  subLabel = 'Target Suhu',
  className = 'min-h-[260px]',
}) {
  const [value, setValue] = useState(initialValue);
  const [isOn, setIsOn] = useState(true);

  // Semi-circular / 240-deg Dial Math (Matches Vision UI Satisfaction Rate + Tick Dial)
  const radius = 64;
  const circumference = Math.PI * radius; // Semi-circle arc length ~201
  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const strokeDashoffset = circumference * (1 - (isOn ? percentage : 0));

  // Radial tick marks along the upper semi-circle
  const numTicks = 24;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    const ratio = i / numTicks;
    const angle = Math.PI + ratio * Math.PI; // 180deg (left) to 360deg (right)
    const x1 = 90 + Math.cos(angle) * (radius + 12);
    const y1 = 88 + Math.sin(angle) * (radius + 12);
    const x2 = 90 + Math.cos(angle) * (radius + 17);
    const y2 = 88 + Math.sin(angle) * (radius + 17);
    const isPast = isOn && ratio <= percentage;

    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isPast ? 'rgb(var(--primary-400))' : 'rgb(var(--surface-600))'}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity={isPast ? 0.95 : 0.4}
      />
    );
  }

  const handleDecrease = () => {
    if (isOn && value > min) setValue(v => v - 1);
  };

  const handleIncrease = () => {
    if (isOn && value < max) setValue(v => v + 1);
  };

  return (
    <div
      className={`vision-card p-6 w-full relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${className}`}
      style={
        isOn
          ? {
              borderColor: 'rgb(var(--primary-500) / 0.35)',
              boxShadow: '0 20px 32px rgb(var(--primary-500) / 0.16)',
            }
          : {}
      }
    >
      {/* Ambient glow when ON */}
      {isOn && (
        <div
          className="absolute -top-12 right-1/4 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ background: 'rgb(var(--primary-500))' }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="font-extrabold text-[16px] text-slate-100 leading-tight">{title}</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">{subLabel}</p>
        </div>

        {/* ON/OFF Toggle Pill */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-extrabold ${isOn ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isOn ? 'ON' : 'OFF'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isOn}
              onChange={() => setIsOn(!isOn)}
            />
            <div
              className="w-10 h-5 bg-slate-800 border border-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
              style={isOn ? { backgroundColor: 'rgb(var(--primary-500))', borderColor: 'transparent' } : {}}
            />
          </label>
        </div>
      </div>

      {/* ── Center Vision UI Semi-Circular Gauge + Tick Dial ── */}
      <div className="relative flex flex-col items-center justify-center my-1 z-10">
        <svg width="180" height="102" viewBox="0 0 180 102" className="overflow-visible">
          <defs>
            <linearGradient id="thermostatArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(var(--primary-600))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(var(--primary-500))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="rgb(var(--primary-300))" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Outer Radial Tick Marks */}
          {ticks}

          {/* Track Arc */}
          <path
            d="M 26 88 A 64 64 0 0 1 154 88"
            fill="none"
            stroke="rgb(var(--surface-700))"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d="M 26 88 A 64 64 0 0 1 154 88"
            fill="none"
            stroke="url(#thermostatArcGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.4s ease-out', opacity: isOn ? 1 : 0.25 }}
          />
        </svg>

        {/* Center Glowing Thermometer Badge */}
        <div
          className="absolute bottom-1.5 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300"
          style={
            isOn
              ? {
                  background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  boxShadow: '0 0 18px rgb(var(--primary-500) / 0.6)',
                }
              : { background: 'rgb(var(--surface-700))', color: 'rgb(var(--surface-400))' }
          }
        >
          <Thermometer size={18} />
        </div>
      </div>

      {/* ── Bottom Vision Inner Pill Box (Minus | Value | Plus) ── */}
      <div className="vision-inner-box px-4 py-3 flex items-center justify-between relative z-10">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={!isOn || value <= min}
          aria-label="Decrease temperature"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Minus size={16} />
        </button>

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[10px] font-medium text-slate-500 mr-1">{min}{unit}</span>
            <p className={`text-[22px] font-extrabold leading-none ${isOn ? 'text-slate-100' : 'text-slate-500'}`}>
              {value}
              <span className="text-[14px] font-bold text-primary-400 ml-0.5">{unit}</span>
            </p>
            <span className="text-[10px] font-medium text-slate-500 ml-1">{max}{unit}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isOn ? 'Cooling Active' : 'Standby Mode'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={!isOn || value >= max}
          aria-label="Increase temperature"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={
            isOn
              ? {
                  background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.45)',
                }
              : { background: 'rgb(var(--surface-700))', color: 'rgb(var(--surface-400))' }
          }
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
