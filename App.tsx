
import React, { useState, useEffect, useCallback } from 'react';
import { Role, AppStatus, CompetitionState, LANGUAGES, Translation, StudentInfo } from './types';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';

const STORAGE_KEY = 'class_match_state_v2';
const DEFAULT_PIN = '1234';

const App: React.FC = () => {
  const [role, setRole] = useState<Role>(null);
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [pseudo, setPseudo] = useState<string>('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUrlLocked, setIsUrlLocked] = useState(false);

  const [state, setState] = useState<CompetitionState>({
    status: AppStatus.IDLE,
    currentQuestion: null,
    questionStartTime: null,
    responses: {},
    players: [],
    studentList: [],
    teacherPin: DEFAULT_PIN
  });

  const t: Translation = LANGUAGES[lang];
  
  const syncState = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.studentList && parsed.studentList.length > 0 && typeof parsed.studentList[0] === 'string') {
        parsed.studentList = parsed.studentList.map((name: string) => ({ name, phone: '' }));
      }
      if (!parsed.teacherPin) parsed.teacherPin = DEFAULT_PIN;
      setState(parsed);
    }
  }, []);

  useEffect(() => {
    // Check URL parameters for role locking
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'student') {
      setRole('STUDENT');
      setIsUrlLocked(true);
    }

    window.addEventListener('storage', syncState);
    syncState();
    return () => window.removeEventListener('storage', syncState);
  }, [syncState]);

  const updateGlobalState = useCallback((updater: (current: CompetitionState) => CompetitionState) => {
    const latestRaw = localStorage.getItem(STORAGE_KEY);
    const latestState: CompetitionState = latestRaw ? JSON.parse(latestRaw) : state;
    const newState = updater(latestState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
    window.dispatchEvent(new Event('storage'));
  }, [state]);

  const handleTeacherAccess = () => {
    setShowPinEntry(true);
    setPinInput('');
    setPinError(false);
  };

  const verifyPin = () => {
    if (pinInput === state.teacherPin) {
      setRole('TEACHER');
      setShowPinEntry(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleJoin = (p: string) => {
    setPseudo(p);
    if (p) {
      updateGlobalState((current) => ({
        ...current,
        players: Array.from(new Set([...current.players, p]))
      }));
    }
  };

  const resetAll = () => {
    updateGlobalState((current) => ({
      ...current,
      status: AppStatus.IDLE,
      currentQuestion: null,
      questionStartTime: null,
      responses: {},
      players: []
    }));
  };

  const handleExit = () => {
    if (isUrlLocked) return; // Prevent unlocking if role was forced by URL
    setRole(null);
  };

  const LangSwitcher = () => (
    <div className="fixed top-4 right-4 z-50 flex space-x-2 glass p-2 rounded-full">
      <button 
        onClick={() => setLang('fr')} 
        className={`px-3 py-1 rounded-full text-xs font-bold transition ${lang === 'fr' ? 'bg-indigo-600 text-white' : 'text-white/40'}`}
      >
        FR
      </button>
      <button 
        onClick={() => setLang('ar')} 
        className={`px-3 py-1 rounded-full text-xs font-bold transition ${lang === 'ar' ? 'bg-indigo-600 text-white' : 'text-white/40'}`}
      >
        AR
      </button>
    </div>
  );

  if (showPinEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full glass p-10 rounded-[3rem] border border-white/10 text-center animate-fade-in shadow-2xl">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-black mb-2 uppercase">{t.enterPin}</h2>
          <p className="text-white/40 text-sm mb-8">{t.securityNotice}</p>
          
          <input 
            type="password" 
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className={`w-full bg-black/40 border ${pinError ? 'border-rose-500' : 'border-white/10'} rounded-2xl p-6 text-center text-4xl font-black mb-6 tracking-[1em] outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
            placeholder="****"
            maxLength={4}
            onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
          />

          {pinError && <p className="text-rose-500 font-bold mb-6 text-sm animate-bounce">⚠️ {t.wrongPin}</p>}

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setShowPinEntry(false)} className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black transition">
               {t.back}
             </button>
             <button onClick={verifyPin} className="py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg transition">
               OK
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 bg-[#020617]`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <LangSwitcher />
        <div className="max-w-md w-full glass p-8 rounded-[2.5rem] shadow-2xl border border-white/10 text-center animate-fade-in">
          <h1 className="text-6xl font-black bg-gradient-to-br from-indigo-400 via-white to-rose-400 bg-clip-text text-transparent mb-4 leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-400 mb-10 text-lg">{t.chooseRole}</p>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleTeacherAccess}
              className="group bg-indigo-600 hover:bg-indigo-500 text-white py-5 px-8 rounded-2xl font-black text-xl transition transform hover:scale-105 shadow-xl flex items-center justify-between"
            >
              <span>👨‍🏫 {t.teacher}</span>
              <span className="opacity-0 group-hover:opacity-100 transition">🔒</span>
            </button>
            <button
              onClick={() => setRole('STUDENT')}
              className="group bg-rose-600 hover:bg-rose-500 text-white py-5 px-8 rounded-2xl font-black text-xl transition transform hover:scale-105 shadow-xl flex items-center justify-between"
            >
              <span>📱 {t.student}</span>
              <span className="opacity-0 group-hover:opacity-100 transition">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <LangSwitcher />
      {role === 'TEACHER' ? (
        <TeacherView 
          state={state} 
          updateState={(s) => updateGlobalState(() => s)} 
          t={t} 
          lang={lang} 
          onReset={resetAll}
          onExit={handleExit}
        />
      ) : (
        <StudentView 
          state={state} 
          updateState={(s) => updateGlobalState(() => s)} 
          t={t} 
          lang={lang} 
          pseudo={pseudo}
          onJoin={handleJoin}
          onExit={handleExit}
          isLocked={isUrlLocked}
        />
      )}
    </div>
  );
};

export default App;
