
import React, { useState } from 'react';
import { Translation } from '../types';

interface Props {
  t: Translation;
  lang: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'TEACHER' | 'STUDENT';
}

const UserGuide: React.FC<Props> = ({ t, lang, isOpen, onClose, defaultTab = 'TEACHER' }) => {
  const [activeTab, setActiveTab] = useState<'TEACHER' | 'STUDENT'>(defaultTab);

  if (!isOpen) return null;

  const teacherSteps = [
    { icon: '👥', title: 'Gestion de Classe', desc: 'Importez vos élèves via Excel. Astuce : Si vous mettez juste des numéros de téléphone dans la colonne A, l\'appli demandera aux élèves de saisir leur pseudo.' },
    { icon: '📝', title: 'Types de Questions', desc: 'Créez des QCM, des réponses Texte Unique (participation) ou Multiples Textes. Vous pouvez empiler plusieurs questions pour un Quiz complet.' },
    { icon: '✨', title: 'Questions IA', desc: 'Utilisez Gemini pour générer des questions de culture générale en un clic.' },
    { icon: '🚀', title: 'Lancement', desc: 'Lancez la séquence. Les élèves connectés verront toutes les questions défiler.' },
    { icon: '📊', title: 'Suivi & WhatsApp', desc: 'Suivez qui a répondu. Cliquez sur l\'icône WhatsApp pour féliciter ou contacter un élève.' }
  ];

  const studentSteps = [
    { icon: '🎒', title: 'Identification', desc: 'Choisis ton numéro. Si tu n\'as pas de nom affiché, saisis ton Pseudo/Prénom.' },
    { icon: '✍️', title: 'Réponses', desc: 'Réponds à toutes les questions (QCM ou Texte). Pour les textes, écris ta réponse complète.' },
    { icon: '⚡', title: 'Rapidité', desc: 'Plus tu réponds vite, plus tu gagnes de points bonus sur le score global !' },
    { icon: '🗳️', title: 'Validation', desc: 'Une fois toutes les questions remplies, valide pour envoyer. Tu verras ton score détaillé par question.' },
    { icon: '🤝', title: 'Partage', desc: 'Si tu partages ta tablette, clique sur "Élève Suivant" après ton vote.' }
  ];

  const arTeacherSteps = [
    { icon: '👥', title: 'إدارة الفصل', desc: 'استيراد عبر إكسيل. نصيحة: إذا أدخلت أرقام الهواتف فقط، سيُطلب من الطلاب إدخال أسمائهم.' },
    { icon: '📝', title: 'أنواع الأسئلة', desc: 'أنشئ أسئلة متعددة الخيارات أو نصية. يمكنك إضافة عدة أسئلة في اختبار واحد.' },
    { icon: '✨', title: 'أسئلة الذكاء الاصطناعي', desc: 'استخدم Gemini لتوليد أسئلة ثقافية ممتعة بضغطة واحدة.' },
    { icon: '🚀', title: 'الإطلاق', desc: 'ابدأ الاختبار. سيظهر للطلاب المتصلين جميع الأسئلة.' },
    { icon: '📊', title: 'المتابعة وواتساب', desc: 'تابع الإجابات. اضغط على أيقونة واتساب للتواصل مع الطالب.' }
  ];

  const arStudentSteps = [
    { icon: '🎒', title: 'تسجيل الدخول', desc: 'اختر رقمك. إذا لم يظهر اسمك، أدخل اسمك المستعار.' },
    { icon: '✍️', title: 'الإجابات', desc: 'أجب على جميع الأسئلة. بالنسبة للنصوص، اكتب إجابتك كاملة.' },
    { icon: '⚡', title: 'السرعة', desc: 'كلما كانت إجابتك أسرع، حصلت على نقاط أكثر!' },
    { icon: '🗳️', title: 'التأكيد', desc: 'بعد إكمال جميع الأسئلة، اضغط على تأكيد. سترى نتيجتك مفصلة لكل سؤال.' },
    { icon: '🤝', title: 'المشاركة', desc: 'إذا كنت تشارك الجهاز، اضغط على "الطالب التالي" بعد التصويت.' }
  ];

  const currentSteps = lang === 'fr' 
    ? (activeTab === 'TEACHER' ? teacherSteps : studentSteps)
    : (activeTab === 'TEACHER' ? arTeacherSteps : arStudentSteps);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl w-full glass rounded-[3rem] border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center space-x-4">
            <span className="text-3xl">📖</span>
            <h2 className="text-3xl font-black uppercase tracking-tight">{t.userGuide}</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-2xl transition">✕</button>
        </div>

        <div className="flex bg-black/20 p-2 m-8 rounded-2xl">
          <button 
            onClick={() => setActiveTab('TEACHER')}
            className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition ${activeTab === 'TEACHER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            👨‍🏫 {t.teacher}
          </button>
          <button 
            onClick={() => setActiveTab('STUDENT')}
            className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition ${activeTab === 'STUDENT' ? 'bg-rose-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            📱 {t.student}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentSteps.map((step, i) => (
              <div key={i} className="glass p-6 rounded-3xl border border-white/5 hover:border-white/20 transition group">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black mb-2 text-indigo-300">{step.title}</h4>
                    <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-white/10 text-center bg-white/5">
          <p className="text-xs font-bold text-white/20 uppercase tracking-[0.3em]">ClassMatch v2.1 • EdTech Expert Edition</p>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
