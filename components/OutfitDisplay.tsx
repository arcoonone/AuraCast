import React, { useState } from 'react';
import { OutfitGenerationResult, WeatherDay } from '../types';

interface OutfitDisplayProps {
  data: OutfitGenerationResult | null;
  isLoading: boolean;
  selectedDay: WeatherDay | null;
  onGenerate: () => void;
  city: string;
}

export const OutfitDisplay: React.FC<OutfitDisplayProps> = ({ 
  data, 
  isLoading, 
  selectedDay, 
  onGenerate,
  city 
}) => {
  const [showPrompt, setShowPrompt] = useState(false);

  if (!selectedDay) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-3xl">
        Select a day to see fashion insights
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col items-center justify-center bg-slate-800/30 rounded-3xl p-8 backdrop-blur-sm border border-slate-700">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-slate-600 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-pink-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 animate-pulse">
          Designing Outfit...
        </h3>
        <p className="text-slate-400 mt-2 text-center max-w-sm">
          Analyzing {city}'s street style trends for {selectedDay.condition} weather ({selectedDay.minTemp}°-{selectedDay.maxTemp}°C).
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 shadow-xl text-center">
        <div className="text-6xl mb-6">👗🧥</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Style?
        </h2>
        <p className="text-slate-400 max-w-md mb-8">
          See a customized outfit recommendation for <span className="text-white font-semibold">{selectedDay.date}</span> in <span className="text-white font-semibold">{city}</span>. We'll generate a lookbook and an item breakdown.
        </p>
        <button 
          onClick={onGenerate}
          className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            ✨ Generate Fit Check
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Hidden Prompt / Description */}
      <div className="mb-6 flex flex-col items-center">
        <button 
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 mb-2 uppercase tracking-widest font-bold"
        >
          {showPrompt ? 'Hide' : 'Show'} AI Fashion Insight
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${showPrompt ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {showPrompt && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-md max-w-2xl animate-fade-in-down">
            <p className="text-slate-200 font-light italic text-center text-lg leading-relaxed">
              "{data.description}"
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Outfit Card */}
        <div className="group relative rounded-3xl overflow-hidden bg-slate-900 aspect-[3/4] shadow-2xl border border-slate-700">
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider">
            The Look
          </div>
          {data.outfitImage ? (
            <img 
              src={data.outfitImage} 
              alt="Generated Outfit" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
          )}
        </div>

        {/* Breakdown Card */}
        <div className="group relative rounded-3xl overflow-hidden bg-slate-900 aspect-[3/4] shadow-2xl border border-slate-700">
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider">
            The Breakdown
          </div>
          {data.breakdownImage ? (
            <img 
              src={data.breakdownImage} 
              alt="Outfit Breakdown" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
          )}
        </div>
      </div>
    </div>
  );
};