
import React from 'react';
import { ResponseRecord, Translation } from '../types';

interface Props {
  responses: Record<string, ResponseRecord>;
  t: Translation;
}

const Leaderboard: React.FC<Props> = ({ responses, t }) => {
  const sorted = (Object.values(responses) as ResponseRecord[]).sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
      <div className="flex items-center space-x-4 mb-8">
        <span className="text-4xl">📊</span>
        <h2 className="text-3xl font-black uppercase tracking-tighter">{t.leaderboard}</h2>
      </div>

      <div className="space-y-4">
        {sorted.map((res, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl transition-all duration-500 border border-white/5 group hover:scale-[1.01] ${
              idx === 0 ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-white/5'
            }`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-auto">
              <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg ${
                idx === 0 ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-white/10 text-white'
              }`}>
                {idx + 1}
              </span>
              <span className="text-xl font-black truncate">{res.displayName || res.pseudo}</span>
            </div>
            
            <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <div className="text-lg font-black text-white">{res.totalPoints} <span className="text-[10px] text-white/40 uppercase font-bold">{t.points}</span></div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{res.score}% {t.successRate}</div>
              </div>
              
              <div className="hidden lg:block w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${res.score}%` }}></div>
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
