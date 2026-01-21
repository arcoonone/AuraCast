import React, { useState, useEffect } from 'react';

// Define a local interface for the injected object to ensure type safety in this file
interface AIStudioClient {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

interface ApiKeySelectorProps {
  onReady: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);

  const checkKey = async () => {
    try {
      // Use type casting to avoid conflict with global Window interface definitions
      const aistudio = (window as any).aistudio as AIStudioClient | undefined;
      if (aistudio && await aistudio.hasSelectedApiKey()) {
        setHasKey(true);
        onReady();
      }
    } catch (e) {
      console.error("Error checking API key", e);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Assume success if no error thrown, proceed immediately
        setHasKey(true);
        onReady();
      } catch (e) {
        console.error("Key selection failed or cancelled", e);
      }
    }
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">API Key Required</h2>
        <p className="text-slate-300 mb-6 leading-relaxed">
          To generate high-quality fashion visualizations and real-time weather data, this app requires a Google Gemini API key.
        </p>
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6 text-sm text-blue-200">
          We use <strong>gemini-3-pro-image-preview</strong> for visuals and <strong>gemini-3-pro-preview</strong> for search grounding.
        </div>
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-600/20"
        >
          Select Google API Key
        </button>
        <div className="mt-4 text-xs text-slate-500">
          Learn more about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ai.google.dev</a>
        </div>
      </div>
    </div>
  );
};