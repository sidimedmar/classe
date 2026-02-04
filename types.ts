
export type Role = 'TEACHER' | 'STUDENT' | null;

export enum AppStatus {
  IDLE = 'IDLE',
  ANSWERING = 'ANSWERING',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
  PODIUM = 'PODIUM'
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TEXT' | 'MULTIPLE_TEXT';

export interface StudentInfo {
  name: string;
  phone: string;
}

export interface QuestionItem {
  id: string;
  type: QuestionType;
  text: string;
  // For QCM
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  // For Multiple Text / Text
  textInputCount?: number; 
}

export interface Question {
  id: string;
  items: QuestionItem[]; // Changed to support multiple questions in one go
}

export interface ResponseRecord {
  pseudo: string;
  displayName?: string;
  phone?: string;
  
  // New structure for multiple answers
  itemDetails: Record<string, {
    score: number;
    textAnswer?: string;
    textAnswers?: string[];
    selectedOptionIds?: string[];
  }>;

  score: number; // Global Percent 0-100
  speedBonus: number; // 0 to 1
  totalPoints: number; // Calculated combined score
  timestamp: number;
}

export interface CompetitionState {
  status: AppStatus;
  currentQuestion: Question | null;
  questionStartTime: number | null;
  responses: Record<string, ResponseRecord>;
  players: string[];
  studentList: StudentInfo[];
  teacherPin: string;
}

export interface Translation {
  title: string;
  chooseRole: string;
  teacher: string;
  student: string;
  pseudoLabel: string;
  join: string;
  startCompetition: string;
  questionPlaceholder: string;
  optionLabel: string;
  correct: string;
  validate: string;
  leaderboard: string;
  podium: string;
  successRate: string;
  speedBonus: string;
  nextQuestion: string;
  waitingForTeacher: string;
  rank: string;
  points: string;
  generateWithAI: string;
  finishSession: string;
  classManagement: string;
  importStudents: string;
  studentDetails: string;
  answered: string;
  thinking: string;
  notConnected: string;
  importExcel: string;
  exit: string;
  back: string;
  reset: string;
  selectName: string;
  selectPhone: string;
  enterNickname: string;
  addOption: string;
  removeOption: string;
  userGuide: string;
  guideSteps: string[];
  nextStudent: string;
  voted: string;
  pointsAndPercent: string;
  phoneLabel: string;
  whatsappMsg: string;
  shareAppLink: string;
  inviteGroup: string;
  inviteIndividual: string;
  enterPin: string;
  wrongPin: string;
  securityNotice: string;
  qcm: string;
  textResponse: string;
  multipleTextResponse: string;
  numberOfFields: string;
  writeAnswer: string;
  writeAnswerNum: string;
  viewAnswer: string;
  addQuestion: string;
  questionNum: string;
  deleteQuestion: string;
  globalScore: string;
  sortByPoints: string;
  sortBySuccess: string;
  details: string;
  close: string;
}

export const LANGUAGES: Record<string, Translation> = {
  fr: {
    title: "ClassMatch",
    chooseRole: "Choisissez votre rôle",
    teacher: "Professeur",
    student: "Élève",
    pseudoLabel: "Pseudo",
    join: "Rejoindre",
    startCompetition: "Lancer le Quiz",
    questionPlaceholder: "Énoncé de la question...",
    optionLabel: "Option",
    correct: "Vrai",
    validate: "Envoyer mes réponses",
    leaderboard: "Classement en Direct",
    podium: "Le Podium Final",
    successRate: "Réussite",
    speedBonus: "Bonus vitesse",
    nextQuestion: "Nouveau Quiz",
    waitingForTeacher: "En attente du professeur...",
    rank: "Rang",
    points: "Points",
    generateWithAI: "Générer avec Gemini",
    finishSession: "Clôturer la séance",
    classManagement: "Gestion de la Classe",
    importStudents: "Saisie : Nom, Téléphone (ou juste Téléphone)",
    studentDetails: "Suivi des élèves (cliquez pour détails)",
    answered: "Terminé",
    thinking: "En cours...",
    notConnected: "Absent",
    importExcel: "Importer Excel (.xlsx)",
    exit: "Quitter l'App",
    back: "Retour",
    reset: "Réinitialiser",
    selectName: "Sélectionne ton nom",
    selectPhone: "Ton Numéro",
    enterNickname: "Ton Prénom (Pseudo)",
    addOption: "Ajouter l'Option",
    removeOption: "Supprimer",
    userGuide: "Mode d'emploi",
    guideSteps: [
      "Importez la liste des élèves (Format: Nom, Téléphone).",
      "Sécurisez l'accès prof avec un code PIN personnalisé.",
      "Partagez le lien 'Élève' via WhatsApp (Bouton Inviter).",
      "Utilisez WhatsApp pour contacter les gagnants individuellement."
    ],
    nextStudent: "Élève suivant",
    voted: "Réponses envoyées !",
    pointsAndPercent: "Score : {pts} pts ({pct}%)",
    phoneLabel: "N° Téléphone",
    whatsappMsg: "Bonjour {name}, c'est votre professeur. Félicitations pour votre participation sur ClassMatch !",
    shareAppLink: "Partager l'App",
    inviteGroup: "Inviter le groupe WhatsApp",
    inviteIndividual: "Envoyer le lien par WhatsApp",
    enterPin: "Code PIN Professeur",
    wrongPin: "Code incorrect !",
    securityNotice: "L'accès Professeur est protégé pour éviter la triche.",
    qcm: "QCM",
    textResponse: "Texte Unique",
    multipleTextResponse: "Textes Multiples",
    numberOfFields: "Nb. Réponses",
    writeAnswer: "Écris ta réponse ici...",
    writeAnswerNum: "Réponse {num}",
    viewAnswer: "Voir la réponse",
    addQuestion: "Ajouter une Question",
    questionNum: "Question {num}",
    deleteQuestion: "Supprimer Question",
    globalScore: "Score Global",
    sortByPoints: "Trier par Points",
    sortBySuccess: "Trier par % Réussite",
    details: "Détails",
    close: "Fermer"
  },
  ar: {
    title: "كلاس ماتش",
    chooseRole: "اختر دورك",
    teacher: "معلم",
    student: "طالب",
    pseudoLabel: "الاسم المستعار",
    join: "انضمام",
    startCompetition: "ابدأ الاختبار",
    questionPlaceholder: "نص السؤال...",
    optionLabel: "خيار",
    correct: "صحيح",
    validate: "إرسال الإجابات",
    leaderboard: "جدول الترتيب المباشر",
    podium: "منصة التتويج النهائية",
    successRate: "نسبة النجاح",
    speedBonus: "مكافأة السرعة",
    nextQuestion: "اختبار جديد",
    waitingForTeacher: "في انتظار المعلم...",
    rank: "الرتبة",
    points: "نقاط",
    generateWithAI: "توليد باستخدام Gemini",
    finishSession: "إنهاء الجلسة",
    classManagement: "إدارة الفصل",
    importStudents: "الإدخال: الاسم، الهاتف (أو الهاتف فقط)",
    studentDetails: "تفاصيل كل طالب",
    answered: "انتهى",
    thinking: "جارٍ الحل...",
    notConnected: "غير متصل",
    importExcel: "استيراد إكسيل (.xlsx)",
    exit: "خروج من التطبيق",
    back: "العودة",
    reset: "إعادة ضبط",
    selectName: "اختر اسمك",
    selectPhone: "رقم هاتفك",
    enterNickname: "اسمك الأول (كنية)",
    addOption: "إضافة خيار",
    removeOption: "حذف",
    userGuide: "دليل الاستخدام",
    guideSteps: [
      "استورد قائمة الطلاب (التنسيق: الاسم، الهاتف).",
      "قم بتأمين وصول المعلم برمز PIN مخصص.",
      "شارك رابط 'الطالب' عبر واتساب (زر دعوة).",
      "استخدم واتساب للتواصل مع الفائزين بشكل فردي."
    ],
    nextStudent: "الطالب التالي",
    voted: "تم إرسال الإجابات!",
    pointsAndPercent: "النتيجة: {pts} نقطة ({pct}%)",
    phoneLabel: "رقم الهاتف",
    whatsappMsg: "مرحباً {name}، أنا معلمك. تهانينا على مشاركتك في ClassMatch!",
    shareAppLink: "مشاركة التطبيق",
    inviteGroup: "دعوة مجموعة واتساب",
    inviteIndividual: "إرسال الرابط عبر واتساب",
    enterPin: "رمز PIN للمعلم",
    wrongPin: "الرمز غير صحيح!",
    securityNotice: "وصول المعلم محمي لمنع الغش.",
    qcm: "متعدد الخيارات",
    textResponse: "نص واحد",
    multipleTextResponse: "نصوص متعددة",
    numberOfFields: "عدد الإجابات",
    writeAnswer: "اكتب إجابتك هنا...",
    writeAnswerNum: "إجابة {num}",
    viewAnswer: "عرض الإجابة",
    addQuestion: "إضافة سؤال",
    questionNum: "سؤال {num}",
    deleteQuestion: "حذف السؤال",
    globalScore: "النتيجة الإجمالية",
    sortByPoints: "ترتيب حسب النقاط",
    sortBySuccess: "ترتيب حسب النسبة %",
    details: "تفاصيل",
    close: "أغلق"
  }
};
