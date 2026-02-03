
import React, { useEffect, useState } from 'react';
import { CompetitionState, Translation, ResponseRecord } from '../types';

interface Props {
  state: CompetitionState;
  t: Translation;
  onRestart: () => void;
}

const Podium: React.FC<Props> = ({ state, t, onRestart }) => {
  const [show, setShow] = useState(false);
  // Explicitly cast to ResponseRecord[] to fix property access errors on unknown type.
  const sorted = (Object.values(state.responses) as ResponseRecord[]).sort((a, b) => b.totalPoints - a.totalPoints);
  
  const winners = [
    sorted[1], // 2nd
    sorted[0], // 1st
    sorted[2], // 3rd
  ].filter(Boolean) as ResponseRecord[];

  useEffect(() => {
    setTimeout(() => setShow(true), 500);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] overflow-hidden">
      <h2 className="text-5xl font-black mb-16 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-600 animate-pulse">
        {t.podium}
      </h2>

      <div className="flex items-end justify-center space-x-4 md:space-x-8 h-80 max-w-4xl w-full">
        {/* Second Place */}
        {winners[0] && (winners.length >= 2) && (
          <div className={`flex flex-col items-center transition-all duration-1000 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{transitionDelay: '400ms'}}>
            <span className="text-2xl font-bold mb-2">🥈 {winners[0].displayName || winners[0].pseudo}</span>
            <div className="w-24 md:w-32 bg-slate-400/30 border-t-4 border-slate-300 h-48 rounded-t-2xl flex flex-col items-center justify-center p-4">
               <span className="text-2xl font-black text-white">{winners[0].totalPoints}</span>
            </div>
          </div>
        )}

        {/* First Place */}
        {winners[1] && (
          <div className={`flex flex-col items-center transition-all duration-1000 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{transitionDelay: '0ms'}}>
            <span className="text-4xl mb-2 animate-bounce">👑</span>
            <span className="text-3xl font-black mb-2 text-yellow-400 uppercase tracking-widest">{winners[1].displayName || winners[1].pseudo}</span>
            <div className="w-32 md:w-48 bg-yellow-500/40 border-t-8 border-yellow-400 h-64 rounded-t-3xl flex flex-col items-center justify-center p-4 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
               <span className="text-4xl font-black text-white">{winners[1].totalPoints}</span>
               <span className="text-yellow-200 text-xs font-bold mt-2">CHAMPION</span>
            </div>
          </div>
        )}

        {/* Third Place */}
        {winners[2] && (
          <div className={`flex flex-col items-center transition-all duration-1000 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{transitionDelay: '800ms'}}>
            <span className="text-2xl font-bold mb-2">🥉 {winners[2].displayName || winners[2].pseudo}</span>
            <div className="w-24 md:w-32 bg-orange-700/30 border-t-4 border-orange-600 h-32 rounded-t-2xl flex flex-col items-center justify-center p-4">
               <span className="text-2xl font-black text-white">{winners[2].totalPoints}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-20">
        <button
          onClick={onRestart}
          className="bg-white/10 hover:bg-white/20 text-white py-4 px-12 rounded-full font-bold text-xl transition-all border border-white/10"
        >
          Nouvelle Compétition 🔄
        </button>
      </div>

      {/* Background Particles Simulation */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 4}px`,
                    height: `${Math.random() * 4}px`,
                    animationDelay: `${Math.random() * 5}s`
                }}
              />
          ))}
      </div>
    </div>
  );
};

export default Podium;
