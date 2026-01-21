import React from 'react';
import { WeatherDay } from '../types';

interface WeatherCardProps {
  day: WeatherDay;
  isSelected: boolean;
  onClick: () => void;
}

const WeatherIcon: React.FC<{ type: string }> = ({ type }) => {
  const t = type.toLowerCase();
  if (t.includes('sun') || t.includes('clear')) return <span className="text-4xl">☀️</span>;
  if (t.includes('rain') || t.includes('drizzle')) return <span className="text-4xl">🌧️</span>;
  if (t.includes('snow')) return <span className="text-4xl">❄️</span>;
  if (t.includes('storm') || t.includes('thunder')) return <span className="text-4xl">⚡</span>;
  if (t.includes('fog') || t.includes('mist')) return <span className="text-4xl">🌫️</span>;
  return <span className="text-4xl">☁️</span>;
};

export const WeatherCard: React.FC<WeatherCardProps> = ({ day, isSelected, onClick }) => {
  const getGradient = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('sun') || t.includes('clear')) return 'from-amber-400/20 to-orange-500/20 border-amber-500/50';
    if (t.includes('rain')) return 'from-blue-700/20 to-slate-700/20 border-blue-400/50';
    if (t.includes('snow')) return 'from-sky-200/20 to-white/10 border-sky-300/50';
    if (t.includes('storm')) return 'from-indigo-900/40 to-purple-900/40 border-indigo-500/50';
    return 'from-slate-600/20 to-gray-500/20 border-slate-400/50';
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-32 p-4 rounded-2xl cursor-pointer transition-all duration-300
        border backdrop-blur-md flex flex-col items-center justify-between gap-2 group
        ${isSelected 
          ? 'bg-white/10 scale-105 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
          : `bg-slate-800/40 hover:bg-slate-700/40 border-transparent hover:border-white/20 hover:scale-105`}
      `}
    >
      {/* Background Gradient indicator */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50 ${getGradient(day.icon)} ${isSelected ? 'opacity-80' : ''}`} />
      
      <div className="relative z-10 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">{day.dayOfWeek.slice(0, 3)}</p>
        <p className="text-sm font-bold text-white mb-2">{day.date.split('-').slice(1).join('/')}</p>
        <div className="transform transition-transform group-hover:scale-110 duration-300">
          <WeatherIcon type={day.icon} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center mt-2 w-full">
        <div className="flex justify-between w-full px-1 text-sm font-bold">
           <span className="text-red-300">{Math.round(day.maxTemp)}°</span>
           <span className="text-blue-300">{Math.round(day.minTemp)}°</span>
        </div>
        <p className="text-[10px] text-slate-400 truncate w-full text-center mt-1">{day.condition}</p>
      </div>
    </div>
  );
};