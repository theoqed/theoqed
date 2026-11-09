'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { Problem } from '@/types';

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CheckSquareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SquareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GridIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function AlertTriangleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function MathText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

  return (
    <span className="leading-relaxed font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: true, output: 'html' });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1 font-sans [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">{part}</code>;
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: false, output: 'html' });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

interface ProblemConfigItem {
  problem_id: string;
  section?: string;
  scoring_type: 'standard' | 'weighted_tkp';
  correct_answer?: string;
  weight_correct: number;
  weight_wrong: number;
  weight_unanswered?: number;
  option_weights?: { [key: string]: number };
}

interface ExamProblem {
  config: ProblemConfigItem;
  detail: Problem;
}

interface TryoutData {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  problem_configs: ProblemConfigItem[];
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params?.slug as string;
  const supabase = createClient();

  const [tryout, setTryout] = useState<TryoutData | null>(null);
  const [examProblems, setExamProblems] = useState<ExamProblem[]>([]);
  const [user, setUser] = useState<any>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [probId: string]: string }>({});
  const [doubtfuls, setDoubtfuls] = useState<{ [probId: string]: boolean }>({});
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('SEMUA');

  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Synchronous Locks & Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const timeLeftRef = useRef(0);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    async function initExam() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert('Silakan login terlebih dahulu untuk mengakses Try Out.');
        router.push(`/tryout/${slugOrId}`);
        return;
      }
      setUser(session.user);

      let { data: tryoutData } = await supabase
        .from('tryouts')
        .select('*')
        .eq('slug', slugOrId)
        .maybeSingle();

      if (!tryoutData) {
        const { data: byId } = await supabase
          .from('tryouts')
          .select('*')
          .eq('id', slugOrId)
          .maybeSingle();
        tryoutData = byId;
      }

      if (!tryoutData) {
        alert('Paket Try Out tidak ditemukan.');
        router.push('/tryout');
        return;
      }

      let configs: ProblemConfigItem[] = [];
      if (typeof tryoutData.problem_configs === 'string') {
        try { configs = JSON.parse(tryoutData.problem_configs); } catch (e) { configs = []; }
      } else if (Array.isArray(tryoutData.problem_configs)) {
        configs = tryoutData.problem_configs;
      }

      if (configs.length === 0) {
        alert('Paket ini belum memiliki racikan soal.');
        router.push('/tryout');
        return;
      }

      const problemIds = configs.map((c) => c.problem_id);
      const { data: rawProblems } = await supabase
        .from('problems')
        .select('*')
        .in('id', problemIds);

      const problemMap = new Map((rawProblems || []).map((p) => [p.id, p]));

      const combined: ExamProblem[] = configs.map((cfg) => ({
        config: cfg,
        detail: problemMap.get(cfg.problem_id) || {
          id: cfg.problem_id,
          title: cfg.problem_id,
          statement: 'Soal tidak ditemukan di bank soal master.',
          competition: 'General',
          year: 2026,
          level: 'General',
          topic: 'General',
        },
      }));

      setTryout(tryoutData);
      setExamProblems(combined);

      const storageKey = `theoqed_exam_state_${tryoutData.id}_${session.user.id}`;
      const savedState = localStorage.getItem(storageKey);

      let initialTime = (tryoutData.duration_minutes || 60) * 60;

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setAnswers(parsed.answers || {});
          setDoubtfuls(parsed.doubtfuls || {});
          if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) {
            initialTime = parsed.timeLeft;
          }
        } catch (e) {}
      }

      setTimeLeft(initialTime);
      timeLeftRef.current = initialTime;
      setLoading(false);
    }

    initExam();
  }, [slugOrId]);

  // TIMER LOGIC
  useEffect(() => {
    if (loading || !tryout || !user || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, tryout, user]);

  // AUTO-SAVE STATE
  useEffect(() => {
    if (!tryout || !user || loading) return;
    const storageKey = `theoqed_exam_state_${tryout.id}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify({ answers, doubtfuls, timeLeft }));
  }, [answers, doubtfuls, timeLeft, tryout, user, loading]);

  const handleSelectAnswer = (probId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [probId]: prev[probId] === val ? '' : val,
    }));
  };

  const handleToggleDoubtful = (probId: string) => {
    setDoubtfuls((prev) => ({
      ...prev,
      [probId]: !prev[probId],
    }));
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);

    let totalScore = 0;
    const scoreDetails: { [probId: string]: { score: number; isCorrect: boolean } } = {};

    examProblems.forEach((item) => {
      const probId = item.config.problem_id;
      const userAns = (answers[probId] || '').trim().toUpperCase();
      const cfg = item.config;

      if (cfg.scoring_type === 'weighted_tkp') {
        const weights = cfg.option_weights || { A: 5, B: 4, C: 3, D: 2, E: 1 };
        const gained = userAns ? (weights[userAns] || 0) : 0;
        totalScore += gained;
        scoreDetails[probId] = { score: gained, isCorrect: gained === 5 };
      } else {
        const correctKey = (cfg.correct_answer || 'A').trim().toUpperCase();
        if (!userAns) {
          const unansScore = cfg.weight_unanswered ?? 0;
          totalScore += unansScore;
          scoreDetails[probId] = { score: unansScore, isCorrect: false };
        } else if (userAns === correctKey) {
          const correctScore = cfg.weight_correct ?? 5;
          totalScore += correctScore;
          scoreDetails[probId] = { score: correctScore, isCorrect: true };
        } else {
          const wrongScore = cfg.weight_wrong ?? 0;
          totalScore += wrongScore;
          scoreDetails[probId] = { score: wrongScore, isCorrect: false };
        }
      }
    });

    const totalDurationSeconds = (tryout?.duration_minutes || 60) * 60;
    
    let timeSpentSeconds = 0;
    if (isAuto) {
      timeSpentSeconds = totalDurationSeconds;
    } else {
      const currentRemaining = timeLeftRef.current;
      timeSpentSeconds = Math.max(1, totalDurationSeconds - currentRemaining);
    }

    const { data: subData, error } = await supabase
      .from('tryout_submissions')
      .insert([
        {
          user_id: user.id,
          tryout_id: tryout?.id,
          answers,
          doubtfuls,
          score_total: totalScore,
          score_details: scoreDetails,
          time_spent_seconds: timeSpentSeconds,
        },
      ])
      .select()
      .single();

    if (tryout && user) {
      localStorage.removeItem(`theoqed_exam_state_${tryout.id}_${user.id}`);
    }

    if (error) {
      console.error('Submit Error:', error);
    }

    const subId = subData?.id || 'latest';
    router.push(`/tryout/${tryout?.slug || tryout?.id}/result?submission_id=${subId}`);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !tryout) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-3 text-xs font-bold animate-pulse">
        <ClockIcon className="w-8 h-8 text-indigo-500 animate-spin" />
        <span>Menyiapkan Lembar Soal & Timer CBT...</span>
      </div>
    );
  }

  const currentProblem = examProblems[currentIndex];
  const isPG = currentProblem.detail.problem_type === 'multiple_choice';
  const options = (currentProblem.detail as any).options || {};
  const currentProbId = currentProblem.config.problem_id;

  const availableSections = ['SEMUA', ...Array.from(new Set(examProblems.map((p) => (p.config.section || 'UMUM').toUpperCase())))];

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const doubtfulCount = Object.values(doubtfuls).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between select-none transition-colors duration-200">
      
      {/* TOP BAR FOCUS MODE (RESPONSIF MOBILE & DESKTOP) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 shadow-sm">
        
        {/* BRAND & JUDUL PAKET (RESPONSIF PENUH) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="font-black text-base sm:text-lg text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-1 shrink-0">
            <span>TheoQED</span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 uppercase">
              CBT
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate min-w-0 max-w-[150px] xs:max-w-[220px] sm:max-w-md md:max-w-lg lg:max-w-xl">
            {tryout.title}
          </h1>
        </div>

        {/* TIMER & SELESAI */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-black flex items-center gap-1.5 border shadow-inner ${
            timeLeft < 300 
              ? 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 animate-pulse'
              : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900'
          }`}>
            <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1 shrink-0"
          >
            <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Selesaikan Ujian</span>
            <span className="sm:hidden text-[11px]">Selesai</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 my-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* PANEL SOAL */}
        <main className="lg:col-span-3 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 shadow-sm min-h-[550px]">
          
          <div className="space-y-5">
            {/* HEADER SOAL */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs">
                Soal No. {currentIndex + 1}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                Seksi: {currentProblem.config.section || 'UMUM'}
              </span>
            </div>

            {/* STATEMENT SOAL */}
            <div className="text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-line py-2">
              <MathText text={currentProblem.detail.statement} />
            </div>

            {/* OPSI JAWABAN */}
            <div className="pt-3 space-y-3">
              {isPG ? (
                ['A', 'B', 'C', 'D', 'E'].map((opt) => {
                  const optText = options[opt];
                  if (!optText && !options.A) return null;

                  const isSelected = answers[currentProbId] === opt;

                  return (
                    <div
                      key={opt}
                      onClick={() => handleSelectAnswer(currentProbId, opt)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}>
                        {opt}
                      </span>
                      <div className="flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 py-0.5">
                        <MathText text={optText || `Pilihan Opsi ${opt}`} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ketik Jawaban Isian / Angka Kamu:
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik jawaban di sini..."
                    value={answers[currentProbId] || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentProbId]: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BAR TOMBOL AKSI 1-BARIS RAPI PADA MOBILE */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 sm:gap-3 mt-8">
            {/* Tombol Sebelumnya */}
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Sebelumnya</span>
              <span className="xs:hidden">Prev</span>
            </button>

            {/* Tombol Ragu-Ragu */}
<button
  onClick={() => handleToggleDoubtful(currentProbId)}
  className={`flex-1 sm:flex-none px-2 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-2 border whitespace-nowrap ${
    doubtfuls[currentProbId]
      ? 'bg-amber-500 text-white border-amber-600 shadow'
      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
  }`}
>
  {doubtfuls[currentProbId] ? (
    <>
      <CheckSquareIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">Ragu-Ragu (Ditandai)</span>
      <span className="sm:hidden">Ragu (✓)</span>
    </>
  ) : (
    <>
      <SquareIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">Tandai Ragu-Ragu</span>
      <span className="sm:hidden">Ragu</span>
    </>
  )}
</button>

            {/* Tombol Berikutnya */}
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(examProblems.length - 1, prev + 1))}
              disabled={currentIndex === examProblems.length - 1}
              className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-40 flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <span className="hidden xs:inline">Berikutnya</span>
              <span className="xs:hidden">Next</span>
              <ArrowRightIcon className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

        </main>

        {/* SIDEBAR NAVIGASI SOAL (TAMPIL OTOMATIS DI BUKAN MODAL/TOGGLE) */}
        <aside className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 h-fit block">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <GridIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Navigasi Soal</span>
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {currentIndex + 1} / {examProblems.length}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                <span className="block text-[9px] text-indigo-400 font-normal uppercase">Dijawab</span>
                <span className="text-xs sm:text-sm font-black">{answeredCount}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400">
                <span className="block text-[9px] text-amber-400 font-normal uppercase">Ragu</span>
                <span className="text-xs sm:text-sm font-black">{doubtfulCount}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400">
                <span className="block text-[9px] text-slate-400 font-normal uppercase">Sisa</span>
                <span className="text-xs sm:text-sm font-black">{examProblems.length - answeredCount}</span>
              </div>
            </div>
          </div>

          {availableSections.length > 2 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {availableSections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSectionFilter(sec)}
                  className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition border ${
                    selectedSectionFilter === sec
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          <div className="p-1.5 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
              {examProblems.map((prob, idx) => {
                const secName = (prob.config.section || 'UMUM').toUpperCase();
                if (selectedSectionFilter !== 'SEMUA' && selectedSectionFilter !== secName) {
                  return null;
                }

                const pId = prob.config.problem_id;
                const hasAns = Boolean(answers[pId]);
                const isDoubt = Boolean(doubtfuls[pId]);
                const isCurrent = idx === currentIndex;

                let btnStyle = "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800";
                if (isDoubt) {
                  btnStyle = "bg-amber-500 text-white border-amber-600 font-black shadow-sm";
                } else if (hasAns) {
                  btnStyle = "bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm";
                }

                return (
                  <button
                    key={pId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs flex items-center justify-center border transition relative ${btnStyle} ${
                      isCurrent ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 font-black z-10' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-indigo-600" />
                <span>Sudah Dijawab</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-500" />
                <span>Ragu-Ragu</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{doubtfulCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700" />
                <span>Belum Dijawab</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{examProblems.length - answeredCount}</span>
            </div>
          </div>

        </aside>

      </div>

      {/* MODAL KONFIRMASI SUBMIT */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900">
                <AlertTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Selesaikan Ujian Sekarang?</h3>
                <p className="text-xs text-slate-400">Pastikan Anda telah memeriksa kembali jawaban Anda.</p>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Total Soal:</span>
                <strong className="text-slate-900 dark:text-white">{examProblems.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sudah Dijawab:</span>
                <strong className="text-indigo-600">{answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Ragu-Ragu:</span>
                <strong className="text-amber-500">{doubtfulCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Belum Dijawab:</span>
                <strong className="text-red-500">{examProblems.length - answeredCount}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Setelah dikirim, Anda tidak dapat mengubah jawaban lagi. Hasil perolehan skor dan pembahasan rinci akan langsung ditampilkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Lanjutkan Ujian
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow transition flex items-center gap-1.5"
              >
                <CheckIcon className="w-4 h-4" />
                <span>Ya, Selesaikan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}