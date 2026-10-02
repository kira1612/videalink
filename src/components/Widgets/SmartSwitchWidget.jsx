import React, { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { mqttApi } from '../../services/api';

export default function SmartSwitchWidget({ title, initialState = false, topic = 'home/light' }) {
  const [isOn, setIsOn] = useState(initialState);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSwitch = async () => {
    setIsProcessing(true);
    const newState = !isOn;
    
    try {
      // Mengirim payload ke MQTT (misal: "ON" atau "OFF")
      await mqttApi.publish(topic, newState ? 'ON' : 'OFF');
      // Jika berhasil, update UI
      setIsOn(newState);
    } catch (err) {
      console.error('Failed to send command:', err);
      // Fallback: anggap gagal, jangan ubah state atau tampilkan alert
      // alert('Gagal mengirim perintah ke perangkat');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
        isOn 
          ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(var(--primary-500),0.15)]' 
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h3 className={`font-bold text-lg ${isOn ? 'text-primary-400' : 'text-slate-300'}`}>{title}</h3>
          <p className="text-xs text-slate-500 mt-1">Status: {isOn ? 'Menyala' : 'Mati'}</p>
        </div>
        
        <button
          onClick={toggleSwitch}
          disabled={isProcessing}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-inner transition-all duration-300 outline-none
            ${isOn 
              ? 'bg-primary-500 shadow-[0_0_15px_rgba(var(--primary-500),0.6)]' 
              : 'bg-slate-800 hover:bg-slate-700'
            }
          `}
        >
          {isProcessing ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <Power size={24} className={isOn ? 'text-white' : 'text-slate-400'} />
          )}
        </button>
      </div>

      {/* Efek Glow kalau Nyala */}
      {isOn && (
        <div 
          className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-50"
          style={{ background: 'rgb(var(--primary-500))' }}
        />
      )}
    </div>
  );
}
