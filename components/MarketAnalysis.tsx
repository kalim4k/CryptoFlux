
import React, { useEffect, useState } from 'react';
import { getMarketAnalysis } from '../services/geminiService';
import { MarketInsight } from '../types';

const MarketAnalysis: React.FC<{ currencyName: string }> = ({ currencyName }) => {
  const [insight, setInsight] = useState<MarketInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    const data = await getMarketAnalysis(currencyName);
    setInsight(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsight();
  }, [currencyName]);

  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="text-indigo-400">✨</span> Analyse IA : {currencyName}
        </h3>
        {insight?.sentiment && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            insight.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' : 
            insight.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' : 
            'bg-slate-500/20 text-slate-400'
          }`}>
            {insight.sentiment}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center space-y-2 flex-col">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 animate-pulse">L'IA analyse le marché...</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
          <p className="text-sm text-slate-300 leading-relaxed">
            {insight?.analysis}
          </p>
          
          {insight?.sources && insight.sources.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-tight">Sources de confiance :</p>
              <div className="flex flex-wrap gap-2">
                {insight.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-white/5 transition-colors inline-block max-w-[150px] truncate"
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <button 
        onClick={fetchInsight}
        className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        Actualiser l'analyse
      </button>
    </div>
  );
};

export default MarketAnalysis;
