'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';
import { Problem } from '@/types';

// --- SVG CUSTOM ICONS ---
function SunIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FlagIcon({ className = 'w-4 h-4', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function GridIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function XIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: true,
              output: 'html',
            });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1 font-sans [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">
                {part}
              </code>
            );
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
              output: 'html',
            });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return (
              <code key={index} className="text-red-500 font-mono text-xs">
                {part}
              </code>
            );
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
  is_premium?: boolean;
  problem_configs: ProblemConfigItem[];
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params?.slug as string;
  const supabase = useMemo(() => createClient(), []);

  const [tryout, setTryout] = useState<TryoutData | null>(null);
  const [examProblems, setExamProblems] = useState<ExamProblem[]>([]);
  const [user, setUser] = useState<any>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [probId: string]: string }>({});
  const [doubtfuls, setDoubtfuls] = useState<{ [probId: string]: boolean }>({});

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('SEMUA');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);

  // Synchronous Locks & Latest-State Refs (mencegah stale closure saat timer habis)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const timeLeftRef = useRef(0);
  const answersRef = useRef<{ [probId: string]: string }>({});
  const doubtfulsRef = useRef<{ [probId: string]: boolean }>({});
  const examProblemsRef = useRef<ExamProblem[]>([]);
  const tryoutRef = useRef<TryoutData | null>(null);
  const userRef = useRef<any>(null);

  // Sinkronisasi awal tema Light/Dark
  useEffect(() => {
    setThemeMounted(true);
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    const hasDarkClass = root.classList.contains('dark');

    if (savedTheme === 'dark' || (!savedTheme && hasDarkClass)) {
      root.classList.add('dark');
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      setIsDarkMode(hasDarkClass);
    }
  }, []);

  const handleToggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !isDarkMode;
    const nextTheme = nextIsDark ? 'dark' : 'light';

    if (nextIsDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('theme', nextTheme);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'theme', newValue: nextTheme })
      );
    } catch {
      // Abaikan jika localStorage diblokir browser
    }

    setIsDarkMode(nextIsDark);
  };

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    doubtfulsRef.current = doubtfuls;
  }, [doubtfuls]);

  useEffect(() => {
    examProblemsRef.current = examProblems;
  }, [examProblems]);

  useEffect(() => {
    tryoutRef.current = tryout;
  }, [tryout]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    async function initExam() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        alert('Silakan login terlebih dahulu untuk mengakses Try Out.');
        router.push(`/tryout/${slugOrId}`);
        return;
      }
      setUser(session.user);
      userRef.current = session.user;

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

      // Cek hak akses jika paket Try Out bertanda Premium
      if (tryoutData.is_premium) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!checkPremiumAccess(profile)) {
          alert('Paket Try Out ini khusus untuk anggota Premium.');
          router.push(`/tryout/${tryoutData.slug || tryoutData.id}`);
          return;
        }
      }

      let configs: ProblemConfigItem[] = [];
      if (typeof tryoutData.problem_configs === 'string') {
        try {
          configs = JSON.parse(tryoutData.problem_configs);
        } catch {
          configs = [];
        }
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
      tryoutRef.current = tryoutData;

      setExamProblems(combined);
      examProblemsRef.current = combined;

      const storageKey = `theoqed_exam_state_${tryoutData.id}_${session.user.id}`;
      const savedState = localStorage.getItem(storageKey);

      let initialTime = (tryoutData.duration_minutes || 60) * 60;

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          const restoredAnswers = parsed.answers || {};
          const restoredDoubtfuls = parsed.doubtfuls || {};
          setAnswers(restoredAnswers);
          answersRef.current = restoredAnswers;
          setDoubtfuls(restoredDoubtfuls);
          doubtfulsRef.current = restoredDoubtfuls;

          if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) {
            initialTime = parsed.timeLeft;
          }
        } catch {
          // Abaikan jika JSON localStorage korup
        }
      }

      setTimeLeft(initialTime);
      timeLeftRef.current = initialTime;
      setLoading(false);
    }

    initExam();
  }, [slugOrId, router, supabase]);

  const handleFinalSubmit = useCallback(
    async (isAuto = false) => {
      if (isSubmittingRef.current) return;

      const currentTryout = tryoutRef.current;
      const currentUser = userRef.current;
      const currentProblems = examProblemsRef.current;
      const latestAnswers = { ...answersRef.current };
      const latestDoubtfuls = { ...doubtfulsRef.current };

      if (!currentTryout || !currentUser) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setShowSubmitModal(false);

      if (timerRef.current) clearInterval(timerRef.current);

      let totalScore = 0;
      const scoreDetails: { [probId: string]: { score: number; isCorrect: boolean } } = {};

      currentProblems.forEach((item) => {
        const probId = item.config.problem_id;
        const userAns = (latestAnswers[probId] || '').trim().toUpperCase();
        const cfg = item.config;

        if (cfg.scoring_type === 'weighted_tkp') {
          const weights = cfg.option_weights || { A: 5, B: 4, C: 3, D: 2, E: 1 };
          const gained = userAns ? weights[userAns] || 0 : 0;
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

      const totalDurationSeconds = (currentTryout.duration_minutes || 60) * 60;
      const timeSpentSeconds = isAuto
        ? totalDurationSeconds
        : Math.max(1, totalDurationSeconds - timeLeftRef.current);

      const { data: subData, error } = await supabase
        .from('tryout_submissions')
        .insert([
          {
            user_id: currentUser.id,
            tryout_id: currentTryout.id,
            answers: latestAnswers,
            doubtfuls: latestDoubtfuls,
            score_total: totalScore,
            score_details: scoreDetails,
            time_spent_seconds: timeSpentSeconds,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Submit Error:', error);
        alert(`Gagal menyimpan hasil ujian: ${error.message}. Silakan coba klik Selesaikan lagi.`);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      localStorage.removeItem(`theoqed_exam_state_${currentTryout.id}_${currentUser.id}`);

      const subId = subData?.id || 'latest';
      router.push(`/tryout/${currentTryout.slug || currentTryout.id}/result?submission_id=${subId}`);
    },
    [router, supabase]
  );

  // TIMER LOGIC
  useEffect(() => {
    if (loading || !tryout || !user || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            handleFinalSubmit(true);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, tryout, user, handleFinalSubmit]);

  // AUTO-SAVE STATE KE LOCALSTORAGE
  useEffect(() => {
    if (!tryout || !user || loading || isSubmitting) return;
    const storageKey = `theoqed_exam_state_${tryout.id}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify({ answers, doubtfuls, timeLeft }));
  }, [answers, doubtfuls, timeLeft, tryout, user, loading, isSubmitting]);

  const handleSelectAnswer = useCallback(
    (probId: string, val: string) => {
      if (isSubmitting) return;
      setAnswers((prev) => {
        const next = {
          ...prev,
          [probId]: prev[probId] === val ? '' : val,
        };
        answersRef.current = next;
        return next;
      });
    },
    [isSubmitting]
  );

  const handleClearAnswer = (probId: string) => {
    if (isSubmitting) return;
    setAnswers((prev) => {
      const next = { ...prev, [probId]: '' };
      answersRef.current = next;
      return next;
    });
  };

  const handleInputAnswer = (probId: string, val: string) => {
    if (isSubmitting) return;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [probId]: val,
      };
      answersRef.current = next;
      return next;
    });
  };

  const handleToggleDoubtful = useCallback(
    (probId: string) => {
      if (isSubmitting) return;
      setDoubtfuls((prev) => {
        const next = {
          ...prev,
          [probId]: !prev[probId],
        };
        doubtfulsRef.current = next;
        return next;
      });
    },
    [isSubmitting]
  );

  // KEYBOARD SHORTCUTS (Panah Kiri/Kanan, A-E, R)
  useEffect(() => {
    if (loading || !tryout || examProblems.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || showSubmitModal) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(examProblems.length - 1, prev + 1));
      } else {
        const activeProblem = examProblems[currentIndex];
        if (!activeProblem) return;
        const pId = activeProblem.config.problem_id;
        const upperKey = e.key.toUpperCase();

        if (upperKey === 'R') {
          e.preventDefault();
          handleToggleDoubtful(pId);
        } else if (
          activeProblem.detail.problem_type === 'multiple_choice' &&
          ['A', 'B', 'C', 'D', 'E'].includes(upperKey)
        ) {
          const opts = (activeProblem.detail as any).options || {};
          const hasAnyOpt = Object.values(opts).some((v) => String(v || '').trim() !== '');
          if (!hasAnyOpt || String(opts[upperKey] || '').trim() !== '') {
            e.preventDefault();
            handleSelectAnswer(pId, upperKey);
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    loading,
    tryout,
    examProblems,
    currentIndex,
    isSubmitting,
    showSubmitModal,
    handleSelectAnswer,
    handleToggleDoubtful,
  ]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !tryout) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center gap-3 text-xs font-semibold">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span className="text-slate-500 dark:text-slate-400">
          Menyiapkan Lembar Soal &amp; Timer CBT...
        </span>
      </div>
    );
  }

  const currentProblem = examProblems[currentIndex];
  const isPG = currentProblem.detail.problem_type === 'multiple_choice';
  const options = (currentProblem.detail as any).options || {};
  const hasDefinedOptions = Object.values(options).some(
    (val) => val !== undefined && val !== null && String(val).trim() !== ''
  );
  const currentProbId = currentProblem.config.problem_id;
  const currentAnswer = (answers[currentProbId] || '').trim();
  const isCurrentDoubtful = Boolean(doubtfuls[currentProbId]);
  const isLastQuestion = currentIndex === examProblems.length - 1;

  const availableSections = [
    'SEMUA',
    ...Array.from(new Set(examProblems.map((p) => (p.config.section || 'UMUM').toUpperCase()))),
  ];

  const answeredCount = Object.values(answers).filter((v) => String(v || '').trim() !== '').length;
  const doubtfulCount = Object.values(doubtfuls).filter(Boolean).length;
  const unansweredCount = examProblems.length - answeredCount;
  const completionPct =
    examProblems.length > 0 ? Math.round((answeredCount / examProblems.length) * 100) : 0;

  const isCriticalTime = timeLeft < 300;
  const isWarningTime = timeLeft >= 300 && timeLeft < 600;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between select-none transition-colors duration-200">
      {/* OVERLAY AUTO-SUBMIT SAAT WAKTU HABIS / MENYIMPAN */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-3 text-white">
          <div className="w-9 h-9 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-sm sm:text-base font-black">Menyimpan Lembar Jawaban...</p>
          <p className="text-xs text-slate-300 max-w-xs">
            Mohon tunggu sebentar, sistem sedang menghitung skor dan menyiapkan pembahasan.
          </p>
        </div>
      )}

      {/* TOP BAR FOCUS MODE */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="font-black text-base sm:text-lg text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-1.5 shrink-0">
              <span>TheoQED</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 uppercase">
                CBT
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate min-w-0">
              {tryout.title}
            </h1>
          </div>

          {/* TOGGLE THEME, TIMER & SELESAI */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0 cursor-pointer"
            >
              {themeMounted ? (
                isDarkMode ? (
                  <SunIcon className="w-4 h-4 text-amber-400" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-slate-600" />
                )
              ) : (
                <span className="w-4 h-4" />
              )}
            </button>

            <div
              className={`h-9 px-3 rounded-xl font-mono text-xs sm:text-sm font-black flex items-center gap-1.5 border transition-colors ${
                isCriticalTime
                  ? 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 animate-pulse'
                  : isWarningTime
                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                  : 'bg-slate-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <ClockIcon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  isCriticalTime
                    ? 'text-red-500'
                    : isWarningTime
                    ? 'text-amber-500'
                    : 'text-indigo-500'
                }`}
              />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowSubmitModal(true)}
              className="h-9 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Selesaikan Ujian</span>
              <span className="sm:hidden">Selesai</span>
            </button>
          </div>
        </div>

        {/* PROGRESS BAR TIPIS DI BAWAH HEADER */}
        <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 my-6 sm:my-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
        {/* PANEL SOAL */}
        <main className="lg:col-span-3 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 min-h-[540px]">
          <div className="space-y-6">
            {/* HEADER SOAL */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                  Soal {currentIndex + 1} / {examProblems.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                  {currentProblem.config.section || 'UMUM'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentAnswer && (
                  <button
                    type="button"
                    onClick={() => handleClearAnswer(currentProbId)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex items-center gap-1 cursor-pointer"
                  >
                    <XIcon className="w-3 h-3" />
                    <span>Hapus Jawaban</span>
                  </button>
                )}

                {isCurrentDoubtful ? (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Ditandai Ragu
                  </span>
                ) : currentAnswer ? (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Terjawab
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Belum Dijawab
                  </span>
                )}
              </div>
            </div>

            {/* STATEMENT SOAL */}
            <div className="text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              <MathText text={currentProblem.detail.statement} />
            </div>

            {/* OPSI JAWABAN */}
            <div className="pt-2 space-y-2.5">
              {isPG ? (
                ['A', 'B', 'C', 'D', 'E'].map((opt) => {
                  const optText = options[opt];
                  const isEmptyOption =
                    optText === undefined || optText === null || String(optText).trim() === '';
                  if (hasDefinedOptions && isEmptyOption) return null;

                  const isSelected = answers[currentProbId] === opt;

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectAnswer(currentProbId, opt)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {opt}
                      </span>
                      <div className="flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 py-0.5">
                        <MathText text={optText || `Pilihan Opsi ${opt}`} />
                      </div>
                    </button>
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
                    onChange={(e) => handleInputAnswer(currentProbId, e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono transition"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BAR TOMBOL AKSI */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3 mt-8">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-none h-10 px-3 sm:px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleDoubtful(currentProbId)}
              className={`flex-1 sm:flex-none h-10 px-3 sm:px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 border whitespace-nowrap cursor-pointer ${
                isCurrentDoubtful
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <FlagIcon className="w-3.5 h-3.5 shrink-0" filled={isCurrentDoubtful} />
              <span className="hidden sm:inline">
                {isCurrentDoubtful ? 'Ragu-Ragu (Aktif)' : 'Tandai Ragu-Ragu'}
              </span>
              <span className="sm:hidden">Ragu</span>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(true)}
                className="flex-1 sm:flex-none h-10 px-3.5 sm:px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Selesaikan Ujian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(examProblems.length - 1, prev + 1))}
                className="flex-1 sm:flex-none h-10 px-3 sm:px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Berikutnya</span>
                <ArrowRightIcon className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </main>

        {/* SIDEBAR NAVIGASI SOAL */}
        <aside className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 lg:sticky lg:top-20">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <GridIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Navigasi Soal</span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {completionPct}% Selesai
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                <span className="block text-[10px] text-indigo-500/80 dark:text-indigo-400/80 font-semibold">
                  Dijawab
                </span>
                <span className="text-sm font-black">{answeredCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400">
                <span className="block text-[10px] text-amber-600/80 dark:text-amber-400/80 font-semibold">
                  Ragu
                </span>
                <span className="text-sm font-black">{doubtfulCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span className="block text-[10px] text-slate-400 font-semibold">Sisa</span>
                <span className="text-sm font-black">{unansweredCount}</span>
              </div>
            </div>
          </div>

          {availableSections.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {availableSections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSectionFilter(sec)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition border cursor-pointer ${
                    selectedSectionFilter === sec
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          <div className="p-1 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
              {examProblems.map((prob, idx) => {
                const secName = (prob.config.section || 'UMUM').toUpperCase();
                if (selectedSectionFilter !== 'SEMUA' && selectedSectionFilter !== secName) {
                  return null;
                }

                const pId = prob.config.problem_id;
                const hasAns = Boolean(String(answers[pId] || '').trim());
                const isDoubt = Boolean(doubtfuls[pId]);
                const isCurrent = idx === currentIndex;

                let btnStyle =
                  'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800';
                if (isDoubt) {
                  btnStyle = 'bg-amber-500 text-white border-amber-500 font-bold';
                } else if (hasAns) {
                  btnStyle = 'bg-indigo-600 text-white border-indigo-600 font-bold';
                }

                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs flex items-center justify-center border transition relative cursor-pointer ${btnStyle} ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 font-black z-10'
                        : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                <span>Sudah Dijawab</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Ragu-Ragu</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{doubtfulCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700" />
                <span>Belum Dijawab</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{unansweredCount}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL KONFIRMASI SUBMIT */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Selesaikan Ujian Sekarang?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pastikan seluruh jawaban telah diperiksa kembali.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Total Soal</span>
                <strong className="text-slate-900 dark:text-white">{examProblems.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sudah Dijawab</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Ragu-Ragu</span>
                <strong className="text-amber-600 dark:text-amber-400">{doubtfulCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Belum Dijawab</span>
                <strong className="text-red-600 dark:text-red-400">{unansweredCount}</strong>
              </div>
            </div>

            {(unansweredCount > 0 || doubtfulCount > 0) && (
              <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Masih terdapat{' '}
                {unansweredCount > 0 && <strong>{unansweredCount} soal belum dijawab</strong>}
                {unansweredCount > 0 && doubtfulCount > 0 && ' dan '}
                {doubtfulCount > 0 && <strong>{doubtfulCount} soal ragu-ragu</strong>}.
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Setelah dikirim, jawaban tidak dapat diubah lagi. Rapor nilai dan pembahasan lengkap
              akan langsung ditampilkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="h-10 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Lanjutkan Ujian
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit(false)}
                className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Ya, Selesaikan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}