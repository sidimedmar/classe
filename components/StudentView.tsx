
import React, { useState, useEffect, useCallback } from 'react';
import { CompetitionState, Translation, AppStatus, ResponseRecord } from '../types';
import UserGuide from './UserGuide';

interface Props {
  state: CompetitionState;
  updateState: (s: CompetitionState) => void;
  t: Translation;
  lang: string;
  pseudo: string;
  onJoin: (p: string) => void;
  onExit: () => void;
  isLocked?: boolean;
}

const StudentView: React.FC<Props> = ({ state, updateState, t, lang, pseudo, onJoin, onExit, isLocked }) => {
  const [inputPseudo, setInputPseudo] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<ResponseRecord | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  // Store answers for all question items
  const [answers, setAnswers] = useState<Record<string, {
    selectedOptions: string[];
    textAnswer: string;
    multipleTextAnswers: string[];
  }>>({});

  useEffect(() => {
    if (state.status === AppStatus.ANSWERING) {
      setSubmitted(false);
      setLastResult(null);
      // Initialize answers structure for all items
      const initAnswers: any = {};
      state.currentQuestion?.items.forEach(item => {
        initAnswers[item.id] = {
           selectedOptions: [],
           textAnswer: '',
           multipleTextAnswers: item.type === 'MULTIPLE_TEXT' && item.textInputCount ? new Array(item.textInputCount).fill('') : []
        };
      });
      setAnswers(initAnswers);
    }
  }, [state.currentQuestion?.id, state.status]);

  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\s/g, '');
    if (clean.length <= 4) return clean;
    return `...${clean.slice(-4)}`;
  };

  const isPhoneOnlyList = state.studentList.length > 0 && state.studentList.every(s => s.name === s.phone);
  const isSelectedNameAPhone = inputPseudo.length > 5 && !isNaN(Number(inputPseudo.replace(/\D/g,'')));

  const handleJoin = () => {
    const name = inputPseudo.trim();
    if (name) {
      if (nickname) {
        localStorage.setItem(`classmatch_nick_${name}`, nickname);
      }
      onJoin(name);
    }
  };

  const handleNextStudent = () => {
    onJoin(''); 
    setInputPseudo('');
    setNickname('');
    setSubmitted(false);
    setAnswers({});
    setLastResult(null);
  };

  // --- Input Handlers ---

  const handleOptionToggle = (itemId: string, optionId: string) => {
    setAnswers(prev => {
      const current = prev[itemId]?.selectedOptions || [];
      const newSelection = current.includes(optionId) 
        ? current.filter(id => id !== optionId) 
        : [...current, optionId];
      return { ...prev, [itemId]: { ...prev[itemId], selectedOptions: newSelection } };
    });
  };

  const handleTextChange = (itemId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], textAnswer: val } }));
  };

  const handleMultipleTextChange = (itemId: string, index: number, val: string) => {
    setAnswers(prev => {
      const currentArr = [...(prev[itemId]?.multipleTextAnswers || [])];
      currentArr[index] = val;
      return { ...prev, [itemId]: { ...prev[itemId], multipleTextAnswers: currentArr } };
    });
  };

  // --- Validation Logic ---

  const handleValidate = useCallback(() => {
    if (!state.currentQuestion || !state.questionStartTime) return;

    const studentInfo = state.studentList.find(s => s.name === pseudo);
    const phone = studentInfo?.phone || '';
    const storedNick = localStorage.getItem(`classmatch_nick_${pseudo}`);
    const finalDisplayName = storedNick || nickname || pseudo;

    let totalScoreSum = 0;
    const itemDetails: ResponseRecord['itemDetails'] = {};

    state.currentQuestion.items.forEach(item => {
      const userAns = answers[item.id];
      let itemScore = 0;

      if (item.type === 'MULTIPLE_CHOICE') {
         const totalCorrect = item.options?.filter(o => o.isCorrect).length || 0;
         const selectedCorrect = item.options?.filter(o => o.isCorrect && userAns.selectedOptions.includes(o.id)).length || 0;
         const selectedIncorrect = item.options?.filter(o => !o.isCorrect && userAns.selectedOptions.includes(o.id)).length || 0;
         
         if (totalCorrect > 0) {
           itemScore = (selectedCorrect / totalCorrect) * 100;
         }
         // Small penalty for incorrect guesses, but don't go below 0
         itemScore = Math.max(0, Math.round(itemScore - (selectedIncorrect * 25)));
      } else {
         // TEXT or MULTIPLE_TEXT -> 100% participation score
         itemScore = 100; 
      }

      totalScoreSum += itemScore;
      
      itemDetails[item.id] = {
        score: itemScore,
        textAnswer: userAns.textAnswer,
        textAnswers: userAns.multipleTextAnswers,
        selectedOptionIds: userAns.selectedOptions
      };
    });
    
    // Average score across all questions
    const averageScore = Math.round(totalScoreSum / state.currentQuestion.items.length);
    
    const elapsed = Date.now() - state.questionStartTime;
    const bonus = Math.max(0, 1 - (elapsed / 60000)); // Increased base time to 60s for multi-questions
    const points = Math.round(averageScore * (1 + bonus));

    const record: ResponseRecord = { 
      pseudo, 
      displayName: finalDisplayName,
      phone,
      itemDetails,
      score: averageScore, 
      speedBonus: bonus, 
      totalPoints: points, 
      timestamp: Date.now()
    };

    const STORAGE_KEY = 'class_match_state_v2';
    const latestRaw = localStorage.getItem(STORAGE_KEY);
    const latestState: CompetitionState = latestRaw ? JSON.parse(latestRaw) : state;
    
    const newState = { 
      ...latestState, 
      responses: { 
        ...latestState.responses, 
        [pseudo]: record 
      } 
    };
    
    updateState(newState);
    setLastResult(record);
    setSubmitted(true);
  }, [state, answers, pseudo, updateState, nickname]);

  const isFormValid = () => {
    if (!state.currentQuestion) return false;
    return state.currentQuestion.items.every(item => {
      const ans = answers[item.id];
      if (!ans) return false;
      if (item.type === 'TEXT') return ans.textAnswer.trim().length > 0;
      if (item.type === 'MULTIPLE_TEXT') return ans.multipleTextAnswers.every(s => s.trim().length > 0) && ans.multipleTextAnswers.length > 0;
      if (item.type === 'MULTIPLE_CHOICE') {
        // Enforce expected count if provided, else just > 0
        if (item.textInputCount && item.textInputCount > 0) {
           return ans.selectedOptions.length === item.textInputCount;
        }
        return ans.selectedOptions.length > 0;
      }
      return false;
    });
  };

  if (!pseudo) {
     return (
      <div className="min-h-screen flex items-center justify-center p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <UserGuide t={t} lang={lang} isOpen={showGuide} onClose={() => setShowGuide(false)} defaultTab="STUDENT" />
        <div className="max-w-md w-full glass p-10 rounded-[3rem] text-center shadow-2xl border border-white/10 relative overflow-hidden">
          <button onClick={() => setShowGuide(true)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg text-white/40 hover:bg-white/10 transition">?</button>
          <div className="text-7xl mb-6 animate-bounce">🎒</div>
          <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">{isPhoneOnlyList ? t.selectPhone : t.selectName}</h2>
          {state.studentList.length > 0 ? (
            <div className="space-y-4 mb-6">
              <div className="relative">
                <select value={inputPseudo} onChange={(e) => setInputPseudo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg outline-none focus:ring-2 focus:ring-rose-500 appearance-none text-center font-bold">
                  <option value="" className="bg-slate-900">-- {isPhoneOnlyList ? t.selectPhone : t.selectName} --</option>
                  {state.studentList.map(s => (
                    <option key={s.name} value={s.name} className="bg-slate-900" disabled={state.responses[s.name] !== undefined}>
                      {s.name === s.phone ? s.phone : `${s.name} ${s.phone ? `(${maskPhone(s.phone)})` : ''}`} {state.responses[s.name] ? '✅' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-5 pointer-events-none text-white/20">▼</div>
              </div>
              {isSelectedNameAPhone && (
                <div className="animate-fade-in">
                   <p className="text-left text-xs text-rose-400 font-bold ml-2 mb-1 uppercase tracking-widest">{t.enterNickname}</p>
                   <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ex: Batman" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-center text-lg focus:ring-2 focus:ring-rose-500" />
                </div>
              )}
            </div>
          ) : (
            <input type="text" value={inputPseudo} onChange={(e) => setInputPseudo(e.target.value)} placeholder={t.pseudoLabel} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center text-xl mb-6 focus:ring-2 focus:ring-rose-500" />
          )}
          <button onClick={handleJoin} disabled={!inputPseudo || (isSelectedNameAPhone && !nickname)} className="w-full py-5 rounded-2xl bg-rose-600 text-white font-black text-xl shadow-xl hover:bg-rose-500 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed">🚀 {t.join}</button>
          {!isLocked && <button onClick={onExit} className="mt-8 text-white/30 text-sm font-bold uppercase tracking-widest hover:text-white/60 transition flex items-center justify-center mx-auto space-x-2"><span>🔙</span><span>{t.back}</span></button>}
        </div>
      </div>
    );
  }

  const currentStudent = state.studentList.find(s => s.name === pseudo);
  const storedNick = typeof localStorage !== 'undefined' ? localStorage.getItem(`classmatch_nick_${pseudo}`) : null;
  const displayName = state.responses[pseudo]?.displayName || storedNick || pseudo;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <UserGuide t={t} lang={lang} isOpen={showGuide} onClose={() => setShowGuide(false)} defaultTab="STUDENT" />
      
      <header className="flex justify-between items-center mb-8 glass p-5 rounded-2xl border border-white/10">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-500 flex items-center justify-center font-black text-white text-xl shadow-lg">
            {displayName.charAt(0)}
          </div>
          <div>
            <span className="text-2xl font-black block">{displayName}</span>
            <span className="text-[10px] text-white/40 font-mono tracking-widest">
              {currentStudent?.phone ? `📞 ${maskPhone(currentStudent.phone)}` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowGuide(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition">?</button>
          <div className="text-right">
             <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">{t.points}</div>
             <div className="text-2xl font-black text-rose-400">{state.responses[pseudo]?.totalPoints || 0} pts</div>
          </div>
        </div>
      </header>

      {state.status === AppStatus.ANSWERING && !submitted ? (
        <div className="animate-fade-in glass p-6 md:p-10 rounded-[3rem] border-t-8 border-rose-500 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 bg-rose-500/20 w-full">
            <div className="h-full bg-rose-500 animate-[timer_60s_linear_forwards]"></div>
          </div>
          
          <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-tight text-white/80">
             {state.currentQuestion?.items.length} {lang === 'fr' ? 'Questions' : 'أسئلة'}
          </h3>

          <div className="space-y-12">
             {state.currentQuestion?.items.map((item, index) => (
                <div key={item.id} className="relative">
                   <div className="flex items-center space-x-3 mb-4">
                      <span className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">Q{index + 1}</span>
                      {item.type === 'MULTIPLE_CHOICE' && item.textInputCount && item.textInputCount > 1 && (
                        <span className="text-[10px] text-white/40 uppercase font-bold">
                          ({lang === 'fr' ? `Choisis ${item.textInputCount} réponses` : `اختر ${item.textInputCount}`})
                        </span>
                      )}
                      {item.type === 'TEXT' && (
                        <span className="text-[10px] text-white/40 uppercase font-bold">
                          ({t.textResponse})
                        </span>
                      )}
                   </div>
                   <h4 className="text-2xl font-bold mb-6">{item.text}</h4>

                   {item.type === 'TEXT' && (
                      <textarea
                        value={answers[item.id]?.textAnswer || ''}
                        onChange={(e) => handleTextChange(item.id, e.target.value)}
                        placeholder={t.writeAnswer}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl p-6 text-xl min-h-[150px] font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all focus:bg-black/50"
                      />
                   )}

                   {item.type === 'MULTIPLE_TEXT' && (
                      <div className="grid grid-cols-1 gap-4">
                        {(answers[item.id]?.multipleTextAnswers || []).map((ans, i) => (
                           <input
                              key={i}
                              type="text"
                              value={ans}
                              onChange={(e) => handleMultipleTextChange(item.id, i, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-12 text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-black/50"
                              placeholder={`${t.writeAnswerNum.replace('{num}', (i+1).toString())}...`}
                           />
                        ))}
                      </div>
                   )}

                   {item.type === 'MULTIPLE_CHOICE' && (
                      <div className="grid grid-cols-1 gap-3">
                        {item.options?.map(opt => {
                          const isSelected = answers[item.id]?.selectedOptions.includes(opt.id);
                          return (
                            <button 
                              key={opt.id} 
                              onClick={() => handleOptionToggle(item.id, opt.id)}
                              className={`flex items-center p-5 rounded-2xl border-2 transition-all ${isSelected ? 'bg-rose-500 border-rose-400 shadow-lg -translate-y-1' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-4 border-2 transition ${isSelected ? 'bg-white text-rose-500 border-white' : 'bg-black/20 border-white/10'}`}>
                                {isSelected && '✓'}
                              </div>
                              <span className="text-lg font-bold text-left">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                   )}
                   {index < (state.currentQuestion?.items.length || 0) - 1 && <div className="h-px bg-white/10 mt-12 w-full"></div>}
                </div>
             ))}
          </div>

          <button 
            onClick={handleValidate} 
            disabled={!isFormValid()} 
            className="w-full mt-12 py-6 rounded-[2rem] bg-rose-600 hover:bg-rose-500 text-white font-black text-2xl shadow-2xl transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗳️ {t.validate}
          </button>
        </div>
      ) : submitted ? (
        <div className="text-center glass p-16 rounded-[4rem] animate-fade-in border-4 border-emerald-500/20">
          <div className="text-8xl mb-6">🎯</div>
          <h3 className="text-4xl font-black mb-4 uppercase text-emerald-400">{t.voted}</h3>
          <p className="text-slate-400 mb-8 font-bold">{t.waitingForTeacher}</p>
          
          {lastResult && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 p-10 rounded-3xl border border-white/10 mb-10">
              <div className="text-7xl font-black text-white">{lastResult.totalPoints} <span className="text-xl opacity-40">pts</span></div>
              <div className="text-lg font-black text-emerald-400 mt-2 uppercase tracking-widest">({lastResult.score}%)</div>
            </div>
          )}

          {/* Individual Question Scores Display */}
          {lastResult && Object.keys(lastResult.itemDetails).length > 0 && (
             <div className="grid gap-3 mb-10 text-left max-w-sm mx-auto">
                <h4 className="text-center text-xs uppercase font-bold text-white/40 tracking-widest mb-2">Détails des scores</h4>
                {Object.values(lastResult.itemDetails).map((detail: ResponseRecord['itemDetails'][string], idx) => (
                   <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                      <span className="text-sm font-bold text-white/60 uppercase">Question {idx + 1}</span>
                      <div className="flex items-center space-x-2">
                        {detail.textAnswer || (detail.textAnswers && detail.textAnswers.length > 0) ? (
                          <span className="text-xs text-indigo-300 font-mono truncate max-w-[100px] mr-2">
                            {detail.textAnswer || (detail.textAnswers ? 'Textes' : '')}
                          </span>
                        ) : null}
                        <span className={`font-black ${detail.score >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {detail.score}%
                        </span>
                      </div>
                   </div>
                ))}
             </div>
          )}

          <div className="flex flex-col gap-4">
            <button onClick={handleNextStudent} className="w-full py-5 rounded-2xl bg-white text-indigo-900 font-black text-lg shadow-xl hover:scale-105 transition flex items-center justify-center space-x-3"><span>🤝</span><span>{t.nextStudent}</span></button>
            {!isLocked && <button onClick={onExit} className="py-4 text-white/30 text-xs font-black uppercase tracking-widest hover:text-white transition">🔙 {t.back}</button>}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 animate-fade-in flex flex-col items-center">
          <div className="text-9xl mb-10 animate-float">🕹️</div>
          <h3 className="text-4xl font-black mb-4 uppercase leading-tight">{t.waitingForTeacher}</h3>
          <p className="text-slate-400 text-xl max-w-sm mx-auto mb-10">Prépare-toi !</p>
          {!isLocked && <button onClick={onExit} className="px-8 py-3 rounded-full border border-white/10 text-white/40 font-bold uppercase text-xs tracking-widest hover:bg-white/5 transition">🔙 {t.back}</button>}
        </div>
      )}
    </div>
  );
};

export default StudentView;
