import React, { useState } from 'react';
import { Power, Loader2, Zap, Wifi } from 'lucide-react';
import { mqttApi } from '../../services/api';

export default function SmartSwitchWidget({
  title = 'Smart Switch',
  initialState = false,
  topic = 'home/light',
  powerWatt = 18,
  className = 'min-h-[260px]',
}) {
  const [isOn, setIsOn] = useState(initialState);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSwitch = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const newState = !isOn;

    try {
      await mqttApi.publish(topic, newState ? 'ON' : 'OFF');
      setIsOn(newState);
    } catch (err) {
      console.error('Failed to send command:', err);
      // Fallback update for demo/local interaction
      setIsOn(newState);
    } finally {
      setIsProcessing(false);
    }
  };

  // Circular arc math (matches Vision UI Referral/Safety circular gauge)
  const radius = 58;
  const circumference = 2 * Math.PI * radius; // ~364.4
  const arcLength = circumference * 0.75; // 270 deg sweep
  const activeArc = isOn ? arcLength : arcLength * 0.08;

  return (
    <div
      className={`vision-card relative overflow-hidden p-4 sm:p-6 flex flex-col justify-between transition-all duration-300 group w-full min-w-0 max-w-full ${className}`}
      style={
        isOn
          ? {
              borderColor: 'rgb(var(--primary-500) / 0.35)',
              boxShadow: '0 20px 32px rgb(var(--primary-500) / 0.16)',
            }
          : {}
      }
    >
      {/* Ambient background glow when ON */}
      {isOn && (
        <div
          className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-30 transition-opacity duration-500"
          style={{ background: 'rgb(var(--primary-500))' }}
        />
      )}

      {/* ── Header (Vision UI Style) ── */}
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 pr-3">
          <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight truncate">
            {title}
          </h3>
          <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Wifi size={12} className={isOn ? 'text-emerald-400' : 'text-slate-500'} />
            <span>MQTT Actuator Control</span>
          </p>
        </div>

        {/* Top-Right Vision UI Icon Badge */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={
            isOn
              ? {
                  background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.45)',
                  color: '#ffffff',
                }
              : {
                  background: 'rgb(var(--surface-800))',
                  color: 'rgb(var(--surface-400))',
                }
          }
        >
          <Zap size={16} />
        </div>
      </div>

      {/* ── Body: Left Stacked Inner Boxes + Right Circular Power Gauge ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4 my-auto pt-2 sm:pt-4 relative z-10 w-full min-w-0">
        {/* Left Stacked Vision Inner Boxes */}
        <div className="flex flex-col gap-2.5 sm:gap-3 w-full sm:w-[48%] min-w-0">
          <div className="vision-inner-box p-3 sm:p-3.5">
            <p className="text-[11px] font-medium text-slate-400">Status Perangkat</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <p className="text-[14px] sm:text-[15px] font-extrabold text-slate-100">
                {isOn ? 'Menyala' : 'Mati'}
              </p>
            </div>
          </div>

          <div className="vision-inner-box p-3 sm:p-3.5">
            <p className="text-[11px] font-medium text-slate-400">Daya & Topik</p>
            <p className="text-[13px] sm:text-[14px] font-extrabold text-slate-100 mt-1 truncate">
              {isOn ? `${powerWatt} Watt` : '0 Watt'}
            </p>
            <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5" title={topic}>
              {topic}
            </p>
          </div>
        </div>

        {/* Right Interactive Circular Arc Power Button */}
        <div className="relative flex items-center justify-center flex-shrink-0 w-[130px] h-[130px] sm:w-[146px] sm:h-[146px] mx-auto sm:mx-0">
          <svg viewBox="0 0 146 146" className="w-full h-full transform rotate-[135deg]">
            <defs>
              <linearGradient id={`swGrad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity="0.25" />
                <stop offset="50%" stopColor="rgb(var(--primary-500))" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="73"
              cy="73"
              r={radius}
              fill="none"
              stroke="rgb(var(--surface-700))"
              strokeWidth="10"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Active Arc */}
            <circle
              cx="73"
              cy="73"
              r={radius}
              fill="none"
              stroke={`url(#swGrad-${title.replace(/\s+/g, '')})`}
              strokeWidth="10"
              strokeDasharray={`${activeArc} ${circumference}`}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dasharray 0.5s ease-out, opacity 0.3s',
                opacity: isOn ? 1 : 0.35,
              }}
            />
          </svg>

          {/* Center Interactive Power Button */}
          <button
            type="button"
            onClick={toggleSwitch}
            disabled={isProcessing}
            aria-label={`Toggle ${title}`}
            className={`absolute w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 outline-none active:scale-95 ${
              isOn
                ? 'text-white'
                : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-400 border border-slate-700/80'
            }`}
            style={
              isOn
                ? {
                    background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                    boxShadow: '0 0 25px rgb(var(--primary-500) / 0.55)',
                  }
                : {}
            }
          >
            {isProcessing ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <>
                <Power size={22} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1">
                  {isOn ? 'ON' : 'OFF'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
