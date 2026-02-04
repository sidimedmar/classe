
import React, { useState } from 'react';
import { ResponseRecord, Translation } from '../types';

interface Props {
  responses: Record<string, ResponseRecord>;
  t: Translation;
}

const Leaderboard: React.FC<Props> = ({ responses, t }) => {
  const [sortMode, setSortMode] = useState<'POINTS' | 'PERCENT'>('POINTS');

  const sorted = (Object.values(responses) as ResponseRecord[]).sort((a, b) => {
    if (sortMode === 'POINTS') {
      return b.totalPoints - a.totalPoints;
    }
    return b.score - a.score; // Sort by percentage
  });

  const getRankStyle = (idx: number) => {
    if (idx === 0) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)] scale-[1.02]';
    if (idx === 1) return 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/40';
    if (idx === 2) return 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border-orange-700/40';
    return 'bg-white/5 border-white/5';
  };

  const getBadgeStyle = (idx: number) => {
    if (idx === 0) return 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.6)] w-12 h-12 text-2xl';
    if (idx === 1) return 'bg-slate-300 text-slate-900 shadow-[0_0_15px_rgba(203,213,225,0.4)] w-11 h-11 text-xl';
    if (idx === 2) return 'bg-orange-400 text-orange-900 shadow-[0_0_15px_rgba(251,146,60,0.4)] w-10 h-10 text-lg';
    return 'bg-white/10 text-white w-10 h-10 text-lg';
  };

  return (
    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-4xl">📊</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter">{t.leaderboard}</h2>
        </div>
        
        <div className="flex bg-black/30 p-1 rounded-xl">
          <button 
            onClick={() => setSortMode('POINTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${sortMode === 'POINTS' ? 'bg-indigo-600 text-white shadow' : 'text-white/40 hover:text-white'}`}
          >
            {t.sortByPoints}
          </button>
          <button 
            onClick={() => setSortMode('PERCENT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${sortMode === 'PERCENT' ? 'bg-emerald-600 text-white shadow' : 'text-white/40 hover:text-white'}`}
          >
            {t.sortBySuccess}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((res, idx) => (
          <div 
            key={res.pseudo} 
            className={`flex flex-col md:flex-row items-center justify-between p-4 md:p-5 rounded-2xl transition-all duration-500 border group hover:bg-white/10 ${getRankStyle(idx)}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center space-x-4 mb-2 md:mb-0 w-full md:w-auto">
              <span className={`flex items-center justify-center rounded-xl font-black shrink-0 ${getBadgeStyle(idx)}`}>
                {idx + 1}
              </span>
              <div className="flex flex-col">
                 <span className="text-xl font-black truncate max-w-[150px] md:max-w-none">{res.displayName || res.pseudo}</span>
                 {idx === 0 && <span className="text-[10px] uppercase font-black text-yellow-400 tracking-widest animate-pulse">Leader</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <div className="text-lg font-black text-white">{res.totalPoints} <span className="text-[10px] text-white/40 uppercase font-bold">{t.points}</span></div>
                <div className={`text-xs font-bold uppercase tracking-widest ${res.score >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{res.score}% {t.successRate}</div>
              </div>
              
              <div className="hidden lg:block w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${res.score >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${res.score}%` }}></div>
              </div>
            </div>
          </div>
        ))}
        
        {sorted.length === 0 && (
            <div className="text-center py-12 glass rounded-3xl border-dashed border-white/10">
               <div className="text-5xl mb-4 opacity-20">🕒</div>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">En attente des premiers votes...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
