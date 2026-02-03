
import React, { useState, useRef } from 'react';
import { CompetitionState, Translation, AppStatus, Question, ResponseRecord, StudentInfo, QuestionType, QuestionItem } from '../types';
import { generateQuizQuestion } from '../services/geminiService';
import Leaderboard from './Leaderboard';
import Podium from './Podium';
import UserGuide from './UserGuide';

interface Props {
  state: CompetitionState;
  updateState: (s: CompetitionState) => void;
  t: Translation;
  lang: string;
  onReset: () => void;
  onExit: () => void;
}

const TeacherView: React.FC<Props> = ({ state, updateState, t, lang, onReset, onExit }) => {
  // We now manage a list of questions being created
  const [pendingQuestions, setPendingQuestions] = useState<QuestionItem[]>([
    {
      id: 'q1',
      type: 'MULTIPLE_CHOICE',
      text: '',
      textInputCount: 1,
      options: [
        { id: 'o1', text: '', isCorrect: false },
        { id: 'o2', text: '', isCorrect: false }
      ]
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [studentListText, setStudentListText] = useState(state.studentList.map(s => s.name === s.phone ? s.phone : `${s.name}, ${s.phone}`).join('\n'));
  const [showConfig, setShowConfig] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Question Management ---
  const addQuestionBlock = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setPendingQuestions([...pendingQuestions, {
      id: newId,
      type: 'MULTIPLE_CHOICE',
      text: '',
      textInputCount: 1,
      options: [
        { id: `opt-${newId}-1`, text: '', isCorrect: false },
        { id: `opt-${newId}-2`, text: '', isCorrect: false }
      ]
    }]);
  };

  const removeQuestionBlock = (index: number) => {
    if (pendingQuestions.length > 1) {
      const n = [...pendingQuestions];
      n.splice(index, 1);
      setPendingQuestions(n);
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionItem, value: any) => {
    const n = [...pendingQuestions];
    // @ts-ignore
    n[index][field] = value;
    setPendingQuestions(n);
  };

  const updateOption = (qIndex: number, optIndex: number, field: 'text' | 'isCorrect', value: any) => {
    const n = [...pendingQuestions];
    if (n[qIndex].options) {
      // @ts-ignore
      n[qIndex].options[optIndex][field] = value;
      setPendingQuestions(n);
    }
  };

  const addOptionToQuestion = (qIndex: number) => {
    const n = [...pendingQuestions];
    if (n[qIndex].options && n[qIndex].options!.length < 8) {
       n[qIndex].options!.push({ id: `opt-${Math.random()}`, text: '', isCorrect: false });
       setPendingQuestions(n);
    }
  };

  const removeOptionFromQuestion = (qIndex: number, optIndex: number) => {
    const n = [...pendingQuestions];
    if (n[qIndex].options && n[qIndex].options!.length > 2) {
       n[qIndex].options!.splice(optIndex, 1);
       setPendingQuestions(n);
    }
  };

  // --- Logic ---

  const handleStart = () => {
    const question: Question = {
      id: Math.random().toString(36).substr(2, 9),
      items: pendingQuestions
    };
    updateState({
      ...state,
      status: AppStatus.ANSWERING,
      currentQuestion: question,
      questionStartTime: Date.now(),
      responses: {}
    });
  };

  const handleShowResults = () => {
    updateState({
      ...state,
      status: AppStatus.SHOWING_RESULTS
    });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // @ts-ignore
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // @ts-ignore
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const students: StudentInfo[] = data
          .map((row: any) => {
             // Prioritize phone numbers if only one column or second column empty
             if (row.length === 1 || !row[1]) {
               const val = row[0]?.toString().trim() || '';
               // Treat single column as phone number (and name = phone for detection in StudentView)
               return { name: val, phone: val };
             }
             return {
               name: row[0]?.toString().trim() || '',
               phone: row[1]?.toString().trim() || ''
             };
          })
          .filter((s: StudentInfo) => s.name && s.name.length > 1);
        
        setStudentListText(students.map(s => s.name === s.phone ? s.phone : `${s.name}, ${s.phone}`).join('\n'));
        alert(`${students.length} élèves importés.`);
      } catch (err) {
        alert("Erreur Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const saveStudentList = () => {
    const list = studentListText.split('\n').map(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length === 1 && parts[0]) {
        return { name: parts[0], phone: parts[0] };
      }
      return {
        name: parts[0] || '',
        phone: parts[1] || ''
      };
    }).filter(s => s.name !== '');
    
    updateState({ ...state, studentList: list });
    setShowConfig(false);
  };

  const getStudentUrl = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?role=student`;
  };

  const shareWithGroup = () => {
    const url = getStudentUrl();
    const msg = lang === 'fr' 
      ? `📢 Bonjour la classe ! Rejoignez la compétition ClassMatch ici : ${url}`
      : `📢 مرحباً يا فصل! انضموا إلى مسابقة ClassMatch هنا: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const inviteIndividual = (student: StudentInfo) => {
    if (!student.phone) return;
    const url = getStudentUrl();
    const msg = lang === 'fr'
      ? `👋 Salut, connecte-toi pour le défi ClassMatch : ${url}`
      : `👋 مرحباً، سجل دخولك لتحدي ClassMatch: ${url}`;
    const cleanPhone = student.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openWhatsApp = (name: string, phone: string) => {
    if (!phone) {
      alert(lang === 'fr' ? "Pas de numéro de téléphone enregistré." : "لا يوجد رقم هاتف مسجل.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = t.whatsappMsg.replace('{name}', name);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const StudentMonitoringTable = () => (
    <div className="glass p-6 rounded-3xl border border-white/10 shadow-xl overflow-hidden mt-6 animate-fade-in">
      <h3 className="text-xl font-black mb-6 flex items-center space-x-3 uppercase tracking-tight">
        <span>🔍</span>
        <span>{t.studentDetails}</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase tracking-widest font-black">
              <th className="py-4 px-4">{t.student}</th>
              <th className="py-4 px-4 text-center">{t.phoneLabel}</th>
              <th className="py-4 px-4 text-center">Status</th>
              <th className="py-4 px-4 text-right">{t.globalScore}</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-bold">
            {(state.studentList.length > 0 ? state.studentList : state.players.map(p => ({name: p, phone: ''}))).map(student => {
              const resp = state.responses[student.name] as ResponseRecord | undefined;
              const isConnected = state.players.includes(student.name);
              const isPhoneOnly = student.name === student.phone;
              const displayName = resp?.displayName ? `${resp.displayName} ${isPhoneOnly ? '' : `(${student.name})`}` : (isPhoneOnly ? '...' : student.name);
              
              return (
                <tr key={student.name} className={`transition group hover:bg-white/5 ${resp ? 'bg-emerald-500/5' : ''}`}>
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}></div>
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-white/40 text-xs font-mono">{student.phone || '-'}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {resp ? (
                      <span className="text-emerald-400 uppercase text-[10px] tracking-widest font-black">✅ {t.answered}</span>
                    ) : isConnected ? (
                      <span className="text-amber-400 animate-pulse text-[10px] uppercase tracking-widest font-black">✍️ {t.thinking}</span>
                    ) : (
                      <span className="text-white/10 text-[10px] uppercase tracking-widest font-black">💤 {t.notConnected}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {resp ? (
                      <span className="text-indigo-400 font-black text-lg">
                        {resp.totalPoints} <span className="text-[10px] opacity-40">({resp.score}%)</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {!isConnected && student.phone && (
                        <button 
                          onClick={() => inviteIndividual(student)}
                          className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"
                          title={t.inviteIndividual}
                        >
                          📩
                        </button>
                      )}
                      {student.phone && (
                        <button 
                          onClick={() => openWhatsApp(student.name, student.phone)}
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition"
                          title="Contact WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.12.54 4.188 1.583 6.033L0 24l6.105-1.602a11.83 11.83 0 005.937 1.606h.005c6.632 0 12.028-5.394 12.03-12.03a11.85 11.85 0 00-3.527-8.503z"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (state.status === AppStatus.PODIUM) {
    return <Podium state={state} t={t} onRestart={onReset} />;
  }

  const QuestionBlock = ({ q, index }: { q: QuestionItem, index: number }) => (
    <div className="glass p-6 rounded-3xl border border-white/10 mb-6 relative animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-white/50 font-black uppercase text-xs tracking-widest">{t.questionNum.replace('{num}', (index + 1).toString())}</h4>
        {pendingQuestions.length > 1 && (
          <button onClick={() => removeQuestionBlock(index)} className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-widest">
            {t.deleteQuestion} ✕
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Type Switcher */}
        <div className="flex bg-black/30 p-1.5 rounded-2xl w-full md:w-fit overflow-x-auto">
          <button onClick={() => updateQuestion(index, 'type', 'MULTIPLE_CHOICE')} className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${q.type === 'MULTIPLE_CHOICE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>{t.qcm}</button>
          <button onClick={() => updateQuestion(index, 'type', 'TEXT')} className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${q.type === 'TEXT' ? 'bg-rose-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>{t.textResponse}</button>
          <button onClick={() => updateQuestion(index, 'type', 'MULTIPLE_TEXT')} className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${q.type === 'MULTIPLE_TEXT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>{t.multipleTextResponse}</button>
        </div>

        {/* Count Input for Multiple Text */}
        {(q.type === 'MULTIPLE_TEXT' || q.type === 'MULTIPLE_CHOICE') && (
           <div className="flex items-center space-x-2 bg-white/5 p-1.5 px-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-white/60 whitespace-nowrap">{t.numberOfFields}</span>
              <div className="flex items-center bg-black/40 rounded-lg">
                <button onClick={() => updateQuestion(index, 'textInputCount', Math.max(1, (q.textInputCount || 1) - 1))} className="w-8 h-8 text-white hover:bg-white/10 rounded-l-lg font-bold">-</button>
                <span className="w-8 text-center font-black text-sm">{q.textInputCount || 1}</span>
                <button onClick={() => updateQuestion(index, 'textInputCount', Math.min(10, (q.textInputCount || 1) + 1))} className="w-8 h-8 text-white hover:bg-white/10 rounded-r-lg font-bold">+</button>
              </div>
           </div>
        )}
      </div>

      <textarea
        value={q.text}
        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
        placeholder={t.questionPlaceholder}
        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xl mb-6 min-h-[100px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/10 transition-all focus:bg-black/60"
      />

      {q.type === 'MULTIPLE_CHOICE' && q.options && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt, optIdx) => (
              <div key={opt.id} className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all ${opt.isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'bg-white/5 border-transparent'}`}>
                <input 
                  type="checkbox" 
                  checked={opt.isCorrect} 
                  onChange={(e) => updateOption(index, optIdx, 'isCorrect', e.target.checked)} 
                  className="w-5 h-5 rounded bg-black/40 border-white/10 text-emerald-500 cursor-pointer focus:ring-0" 
                />
                <input 
                  type="text" 
                  value={opt.text} 
                  onChange={(e) => updateOption(index, optIdx, 'text', e.target.value)} 
                  placeholder={`${t.optionLabel} ${optIdx+1}`} 
                  className="flex-1 bg-transparent border-none outline-none font-bold text-sm placeholder-white/20" 
                />
                {q.options!.length > 2 && (
                  <button onClick={() => removeOptionFromQuestion(index, optIdx)} className="text-white/20 hover:text-rose-500 transition text-lg">✕</button>
                )}
              </div>
            ))}
          </div>
          <button 
            onClick={() => addOptionToQuestion(index)} 
            disabled={q.options.length >= 8}
            className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/30 text-xs font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition"
          >
            + {t.addOption}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <UserGuide t={t} lang={lang} isOpen={showGuide} onClose={() => setShowGuide(false)} defaultTab="TEACHER" />
      
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 glass p-6 rounded-[2.5rem] border border-white/10 gap-4">
        {/* ... Header content same as before ... */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 border-indigo-800">👨‍🏫</div>
          <div>
             <h2 className="text-2xl font-black uppercase tracking-tight">{t.teacher}</h2>
             <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{t.classManagement}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
           <button onClick={() => setShowGuide(true)} className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold transition flex items-center space-x-2">
             <span>📖</span> <span>{t.userGuide}</span>
           </button>
           <button onClick={() => setShowConfig(!showConfig)} className="px-5 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold transition flex items-center space-x-2">
             <span>👥</span> <span>{t.classManagement}</span>
           </button>
           <button onClick={onReset} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-5 py-2.5 rounded-xl font-bold transition flex items-center space-x-2">
             <span>🔄</span> <span>{t.reset}</span>
           </button>
           <button onClick={onExit} className="bg-white/5 hover:bg-white/10 text-white/60 px-5 py-2.5 rounded-xl font-bold transition flex items-center space-x-2">
             <span>🔙</span> <span>{t.back}</span>
           </button>
        </div>
      </header>

      {showConfig && (
        <div className="mb-10 glass p-8 rounded-[2.5rem] border border-indigo-500/30 shadow-2xl animate-fade-in relative">
          <button onClick={() => setShowConfig(false)} className="absolute top-6 right-6 text-white/20 hover:text-white transition text-xl">✕</button>
          {/* ... Config content same as before ... */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center space-x-3">
               <span>👥</span> <span>{t.classManagement}</span>
            </h3>
            <div className="flex gap-2">
              <button onClick={shareWithGroup} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-sm font-black transition flex items-center space-x-2 shadow-lg active:scale-95"><span>📢</span> <span>{t.inviteGroup}</span></button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-sm font-black transition flex items-center space-x-2 shadow-lg active:scale-95"><span>📊</span> <span>{t.importExcel}</span></button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleExcelImport} accept=".xlsx" className="hidden" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs text-white/40 mb-3 font-bold uppercase tracking-widest">{t.importStudents}</p>
              <textarea value={studentListText} onChange={(e) => setStudentListText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm min-h-[150px] font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-black/60" placeholder="Ex: 0601020304" />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-3 font-bold uppercase tracking-widest">{t.enterPin}</p>
              <input type="text" value={state.teacherPin} onChange={(e) => updateState({...state, teacherPin: e.target.value.substring(0,4)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-2xl font-black tracking-[0.5em] text-center" maxLength={4} />
            </div>
          </div>
          <button onClick={saveStudentList} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-xl transition shadow-xl">✅ {lang === 'fr' ? 'Enregistrer' : 'حفظ'}</button>
        </div>
      )}

      {(state.status === AppStatus.IDLE || state.status === AppStatus.SHOWING_RESULTS) ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {state.status === AppStatus.SHOWING_RESULTS && <Leaderboard responses={state.responses} t={t} />}

            <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between mb-8 items-start md:items-center gap-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'fr' ? 'Édition du Quiz' : 'تحرير الاختبار'}</h3>
                
                <button 
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      // Generate a single question for now, appending to list
                      const q = await generateQuizQuestion();
                      // The service returns a Question object, we extract the items
                      setPendingQuestions([...pendingQuestions, ...q.items]);
                    } catch (e) { alert("Erreur génération IA."); }
                    setLoading(false);
                  }} 
                  className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>{loading ? '...' : 'IA GENERATIVE'}</span> <span>✨</span>
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-8">
                {pendingQuestions.map((q, idx) => (
                  <QuestionBlock key={q.id} q={q} index={idx} />
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <button 
                   onClick={addQuestionBlock} 
                   className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 text-white/50 font-black uppercase text-sm tracking-widest hover:bg-white/5 hover:text-white transition"
                >
                   + {t.addQuestion}
                </button>

                <button 
                  onClick={handleStart} 
                  disabled={pendingQuestions.some(q => !q.text)} 
                  className={`w-full py-6 rounded-[2.5rem] font-black text-3xl shadow-2xl transition-all transform hover:-translate-y-2 active:scale-95 ${pendingQuestions.some(q => !q.text) ? 'bg-white/5 text-white/10' : 'bg-indigo-600 text-white hover:bg-indigo-500 border-b-8 border-indigo-800'}`}
                >
                  🚀 {t.startCompetition}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass p-8 rounded-[2.5rem] sticky top-6 shadow-2xl border border-white/5">
               <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mb-8 flex justify-between">
                 <span>{lang === 'fr' ? 'Fiche de Classe' : 'قائمة الفصل'}</span>
                 <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">{state.players.length} élèves</span>
               </h4>
               <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                  {state.players.map(p => (
                    <div key={p} className="flex items-center p-3.5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition animate-fade-in">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-300 mr-3 border border-indigo-500/10">
                        {p.length > 5 && !isNaN(Number(p.charAt(0))) ? '#' : p.charAt(0)}
                      </div>
                      <span className="font-black flex-1 text-sm">{state.responses[p]?.displayName || (p.length > 10 && !isNaN(Number(p)) ? '...' : p)}</span>
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  ))}
                  {state.players.length === 0 && <div className="text-white/10 text-xs italic font-bold text-center py-10">Aucun élève connecté...</div>}
               </div>
               <button onClick={() => updateState({...state, status: AppStatus.PODIUM})} className="w-full mt-10 bg-gradient-to-r from-yellow-600 to-amber-500 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:scale-105 transition active:scale-95 border-b-4 border-amber-700">🏆 {t.podium}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="text-center py-20 glass rounded-[5rem] border-4 border-indigo-500/20 max-w-5xl mx-auto relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-3 bg-indigo-500/10">
               <div className="h-full bg-indigo-500 animate-[timer_30s_linear_forwards] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
             </div>
             <div className="text-9xl mb-8 animate-float">📢</div>
             <h3 className="text-5xl font-black mb-6 uppercase tracking-tight">{lang === 'fr' ? 'DÉFI LANCÉ !' : 'تم إطلاق التحدي!'}</h3>
             <p className="text-3xl text-indigo-300 font-black mb-16 italic px-12 leading-tight">"{state.currentQuestion?.items[0].text}"...</p>
             <div className="flex justify-center gap-16 mb-16">
                <div className="text-center">
                   <div className="text-7xl font-black text-white">{Object.keys(state.responses).length}</div>
                   <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mt-2">{lang === 'fr' ? 'Réponses' : 'إجابات'}</div>
                </div>
             </div>
             <div className="flex flex-col md:flex-row justify-center gap-6 px-10">
                <button onClick={handleShowResults} className="bg-white text-indigo-900 py-6 px-20 rounded-[2rem] font-black text-3xl shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:scale-105 transition active:scale-95 border-b-8 border-indigo-100">📊 {lang === 'fr' ? 'RÉSULTATS' : 'النتائج'}</button>
             </div>
          </div>
          <StudentMonitoringTable />
        </div>
      )}
    </div>
  );
};

export default TeacherView;
