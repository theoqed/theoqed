'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

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

function HistoryIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ExclamationCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RefreshIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

function LightbulbIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function FlagIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 4a1 1 0 011-1h6.5l1 1H20a1 1 0 01.894 1.447L18.618 10l2.276 4.553A1 1 0 0120 16h-7.5l-1-1H6v5a1 1 0 11-2 0V4z" />
    </svg>
  );
}

function ChartBarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUpIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
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

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
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

interface SubmissionItem {
  id: string;
  user_id: string;
  tryout_id: string;
  answers: { [probId: string]: string };
  doubtfuls: { [probId: string]: boolean };
  score_total: number;
  score_details: { [probId: string]: { score: number; isCorrect: boolean } };
  time_spent_seconds: number;
  created_at: string;
}

interface ParticipantInfo {
  name: string;
  email: string;
  avatar?: string;
  id: string;
}

interface SolutionObj {
  id?: string;
  author_id?: string;
  author_name?: string;
  brief?: string;
  steps?: string[];
  final_answer?: string;
  created_at?: string;
}

interface TryoutItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  problem_configs: ProblemConfigItem[];
}

function extractProblemSolutions(problem: any): SolutionObj[] {
  if (!problem) return [];

  if (Array.isArray(problem.solutions) && problem.solutions.length > 0) {
    return problem.solutions.map((sol: any) => ({
      id: sol.id,
      author_id: sol.author_id,
      author_name: sol.author_name || 'Tim TheoQED',
      brief: sol.brief || sol.solution_brief || '',
      steps: Array.isArray(sol.steps)
        ? sol.steps
        : typeof sol.steps === 'string'
        ? sol.steps.split('\n').filter(Boolean)
        : [],
      final_answer: sol.final_answer || '',
      created_at: sol.created_at,
    }));
  }

  const stepsFallback = Array.isArray(problem.solution_steps)
    ? problem.solution_steps
    : typeof problem.solution_steps === 'string'
    ? problem.solution_steps.split('\n').filter(Boolean)
    : [];

  if (problem.solution_brief || stepsFallback.length > 0 || problem.final_answer) {
    return [
      {
        author_name: 'Tim TheoQED',
        brief: problem.solution_brief || '',
        steps: stepsFallback,
        final_answer: problem.final_answer || '',
      },
    ];
  }

  return [];
}

function ResultContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slugOrId = params?.slug as string;
  const submissionId = searchParams.get('submission_id');
  const supabase = useMemo(() => createClient(), []);

  const [tryout, setTryout] = useState<TryoutItem | null>(null);
  const [submission, setSubmission] = useState<SubmissionItem | null>(null);
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [problemsMap, setProblemsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // State Filter Pembahasan
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'BENAR' | 'SALAH' | 'KOSONG' | 'RAGU'>('SEMUA');
  const [expandedSolutionId, setExpandedSolutionId] = useState<string | null>(null);

  // Theme State (konsisten dengan subpage lain)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);

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

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/tryout/${slugOrId}`);
    }
  };

  useEffect(() => {
    async function initResult() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push(`/tryout/${slugOrId}`);
        return;
      }

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
        alert('Data Try Out tidak ditemukan.');
        router.push('/tryout');
        return;
      }

      let subQuery = supabase.from('tryout_submissions').select('*');
      if (submissionId && submissionId !== 'latest') {
        subQuery = subQuery.eq('id', submissionId);
      } else {
        subQuery = subQuery
          .eq('user_id', session.user.id)
          .eq('tryout_id', tryoutData.id)
          .order('created_at', { ascending: false })
          .limit(1);
      }

      const { data: subData } = await subQuery.maybeSingle();

      if (!subData) {
        alert('Hasil pengerjaan tidak ditemukan.');
        router.push(`/tryout/${slugOrId}`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, name, email, avatar_url')
        .eq('id', subData.user_id)
        .maybeSingle();

      let resolvedName = profile?.full_name || profile?.name || profile?.email?.split('@')[0];
      let resolvedEmail = profile?.email || '';
      let resolvedAvatar = profile?.avatar_url || '';

      if (session.user.id === subData.user_id) {
        resolvedName =
          resolvedName ||
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split('@')[0];
        resolvedEmail = resolvedEmail || session.user.email || '';
        resolvedAvatar = resolvedAvatar || session.user.user_metadata?.avatar_url || '';
      }

      if (!resolvedName) {
        resolvedName = `User #${subData.user_id?.slice(0, 8)}`;
      }

      setParticipant({
        id: subData.user_id,
        name: resolvedName,
        email: resolvedEmail,
        avatar: resolvedAvatar,
      });

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

      const problemIds = configs.map((c) => c.problem_id);
      const { data: rawProblems } = await supabase
        .from('problems')
        .select('*')
        .in('id', problemIds);

      const pMap: Record<string, any> = {};
      (rawProblems || []).forEach((p) => {
        pMap[p.id] = p;
      });

      setTryout(tryoutData);
      setSubmission(subData as SubmissionItem);
      setProblemsMap(pMap);
      setLoading(false);
    }

    initResult();
  }, [slugOrId, submissionId, router, supabase]);

  const getConfigs = (): ProblemConfigItem[] => {
    if (!tryout || !tryout.problem_configs) return [];
    if (typeof tryout.problem_configs === 'string') {
      try {
        return JSON.parse(tryout.problem_configs);
      } catch {
        return [];
      }
    }
    return Array.isArray(tryout.problem_configs) ? tryout.problem_configs : [];
  };

  const configs = getConfigs();

  const formatTimeSpent = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m} menit ${s} detik`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Subpage Sticky Navbar (konsisten dengan halaman Profile, History, dll.)
  const renderSubpageNavbar = () => (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
              Rapor Hasil Try Out
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/tryout/history"
            className="h-9 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>

          <Link
            href="/tryout"
            className="h-9 px-3 sm:px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <GridIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog Try Out</span>
            <span className="sm:hidden">Katalog</span>
          </Link>

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
        </div>
      </div>
    </header>
  );

  if (loading || !tryout || !submission) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
        {renderSubpageNavbar()}
        <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Menyiapkan rapor hasil ujian...</span>
        </div>
      </div>
    );
  }

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let doubtfulCount = 0;
  let maxTotalScore = 0;
  const sectionStats: Record<string, { score: number; total: number; correct: number }> = {};

  configs.forEach((cfg) => {
    const pId = cfg.problem_id;
    const userAns = (submission.answers?.[pId] || '').trim();
    const secName = (cfg.section || 'UMUM').toUpperCase();

    if (submission.doubtfuls?.[pId]) {
      doubtfulCount++;
    }

    if (!sectionStats[secName]) {
      sectionStats[secName] = { score: 0, total: 0, correct: 0 };
    }
    sectionStats[secName].total += 1;

    if (cfg.scoring_type === 'weighted_tkp') {
      const w = cfg.option_weights || { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const weightsList = Object.values(w).map(Number).filter((n) => !Number.isNaN(n));
      maxTotalScore += weightsList.length > 0 ? Math.max(...weightsList) : 5;
    } else {
      maxTotalScore += typeof cfg.weight_correct === 'number' ? cfg.weight_correct : 5;
    }

    const detailScore = submission.score_details?.[pId];
    if (detailScore) {
      sectionStats[secName].score += detailScore.score || 0;
      if (detailScore.isCorrect) sectionStats[secName].correct += 1;
    }

    if (!userAns) {
      unansweredCount++;
    } else if (cfg.scoring_type === 'weighted_tkp') {
      const w = cfg.option_weights || { A: 5, B: 4, C: 3, D: 2, E: 1 };
      if ((w[userAns.toUpperCase()] || 0) === 5) correctCount++;
      else wrongCount++;
    } else {
      const correctKey = (cfg.correct_answer || 'A').trim().toUpperCase();
      if (userAns.toUpperCase() === correctKey) correctCount++;
      else wrongCount++;
    }
  });

  const accuracy = configs.length > 0 ? Math.round((correctCount / configs.length) * 100) : 0;

  const filteredConfigs = configs
    .map((cfg, idx) => ({ cfg, idx }))
    .filter(({ cfg }) => {
      const probId = cfg.problem_id;
      const userAns = (submission.answers?.[probId] || '').trim().toUpperCase();
      const isDoubt = Boolean(submission.doubtfuls?.[probId]);
      const isTKP = cfg.scoring_type === 'weighted_tkp';
      const tkpWeights = cfg.option_weights || { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const isCorrect = isTKP
        ? Boolean(userAns) && Number(tkpWeights[userAns] ?? 0) === 5
        : Boolean(submission.score_details?.[probId]?.isCorrect);

      if (filterStatus === 'BENAR') return isCorrect;
      if (filterStatus === 'SALAH') return !isCorrect && Boolean(userAns);
      if (filterStatus === 'KOSONG') return !userAns;
      if (filterStatus === 'RAGU') return isDoubt;
      return true;
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {renderSubpageNavbar()}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* HEADER JUDUL RAPOR + KARTU NAMA PESERTA */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          {/* TOP BAR: BADGE TANGGAL DI KIRI | TOMBOL ULANGI TRY OUT DI KANAN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Selesai Dikerjakan</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {new Date(submission.created_at).toLocaleString('id-ID', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            {/* TOMBOL AKSI */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <Link
                href={`/tryout/${tryout.slug || tryout.id}`}
                className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
                <span>Ulangi Try Out</span>
              </Link>
            </div>
          </div>

          {/* MIDDLE: JUDUL UTAMA */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            Rapor Hasil Try Out: {tryout.title}
          </h1>

          {/* BOTTOM: INFO PESERTA UJIAN */}
          {participant && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200/80 dark:border-indigo-900">
                  {getInitials(participant.name)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Peserta Ujian</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {participant.name}
                </div>
                {participant.email && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {participant.email}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KARTU STATISTIK UTAMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 sm:p-6 rounded-2xl flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-85">
              Skor Total Perolehan
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black">{submission.score_total}</span>
              <span className="text-xs font-semibold opacity-80">/ {maxTotalScore} Poin</span>
            </div>
            <span className="text-[11px] opacity-80">Akurasi Jawaban Benar: {accuracy}%</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Durasi Terpakai</span>
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {formatTimeSpent(submission.time_spent_seconds || 0)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Dari total {tryout.duration_minutes || 60} menit
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Statistik Jawaban
            </span>
            <div className="flex items-center gap-3 text-sm font-black">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckIcon className="w-4 h-4" />
                <span>{correctCount} Benar</span>
              </span>
              <span className="text-red-500 flex items-center gap-1">
                <XIcon className="w-4 h-4" />
                <span>{wrongCount} Salah</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {unansweredCount} soal tidak dijawab
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Jumlah Soal
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {configs.length} Soal
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Terbagi dalam {Object.keys(sectionStats).length} seksi
            </span>
          </div>
        </div>

        {/* BREAKDOWN RINCIAN PER SEKSI */}
        {Object.keys(sectionStats).length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-indigo-500" />
              <span>Perolehan Skor Berdasarkan Seksi Sub-tes</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {Object.entries(sectionStats).map(([secName, stat]) => (
                <div
                  key={secName}
                  className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {secName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {stat.correct}/{stat.total} Benar
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {stat.score} <span className="text-xs font-semibold text-slate-400">Poin</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION PEMBAHASAN SOAL LENGKAP */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Pembahasan Rinci &amp; Solusi Soal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pelajari kunci jawaban dan pembahasan untuk setiap nomor soal.
              </p>
            </div>

            {/* FILTER TAB PEMBAHASAN */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[
                { id: 'SEMUA', label: 'Semua', count: configs.length },
                { id: 'BENAR', label: 'Benar', count: correctCount },
                { id: 'SALAH', label: 'Salah', count: wrongCount },
                { id: 'KOSONG', label: 'Kosong', count: unansweredCount },
                { id: 'RAGU', label: 'Ragu-Ragu', count: doubtfulCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id as typeof filterStatus)}
                  className={`h-7 px-3 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* DAFTAR SOAL & PEMBAHASAN */}
          {filteredConfigs.length > 0 ? (
            <div className="space-y-4">
              {filteredConfigs.map(({ cfg, idx }) => {
                const probId = cfg.problem_id;
                const problemDetail = problemsMap[probId];
                const userAns = (submission.answers?.[probId] || '').trim().toUpperCase();
                const isDoubt = Boolean(submission.doubtfuls?.[probId]);
                const detailScore = submission.score_details?.[probId];

                const isPG = problemDetail?.problem_type === 'multiple_choice';
                const options = problemDetail?.options || {};
                const hasDefinedOptions = Object.values(options).some(
                  (val) => val !== undefined && val !== null && String(val).trim() !== ''
                );

                const isTKP = cfg.scoring_type === 'weighted_tkp';
                const tkpWeights = cfg.option_weights || { A: 5, B: 4, C: 3, D: 2, E: 1 };
                const correctKey = (cfg.correct_answer || 'A').trim().toUpperCase();

                const gainedScore = detailScore?.score ?? 0;
                const userTkpScore = isTKP && userAns ? Number(tkpWeights[userAns] ?? gainedScore) : 0;

                const isCorrect = isTKP
                  ? Boolean(userAns) && userTkpScore === 5
                  : Boolean(detailScore?.isCorrect);

                // Kategori warna khusus TKP:
                // Poin 5 -> Hijau (Benar), Poin 2-4 -> Kuning/Amber (Salah), Poin 1 -> Merah (Salah)
                const isTkpMidWrong = isTKP && Boolean(userAns) && userTkpScore > 1 && userTkpScore < 5;
                const isTkpLowestWrong = isTKP && Boolean(userAns) && userTkpScore <= 1;

                const solutionsList = extractProblemSolutions(problemDetail);

                const isLongText =
                  isTKP ||
                  ['A', 'B', 'C', 'D', 'E'].some((opt) => {
                    const txt = options[opt] || '';
                    return txt.length > 35 || txt.includes('\n') || txt.includes('$$');
                  });

                const renderCard = (opt: string) => {
                  const optText = options[opt];
                  const isEmptyOption =
                    optText === undefined || optText === null || String(optText).trim() === '';
                  if (hasDefinedOptions && isEmptyOption) return null;

                  const isUserChoice = userAns === opt;
                  const isCorrectChoice = !isTKP && correctKey === opt;
                  const tkpWeight = isTKP ? Number(tkpWeights[opt] ?? 0) : undefined;
                  const isTkpBestOption = isTKP && tkpWeight === 5;

                  let cardBorder =
                    'border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50';
                  let letterBadgeStyle =
                    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';

                  if (isTKP && tkpWeight !== undefined) {
                    if (isUserChoice) {
                      if (tkpWeight === 5) {
                        cardBorder =
                          'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold';
                        letterBadgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                      } else if (tkpWeight <= 1) {
                        cardBorder =
                          'border-red-400 dark:border-red-500 bg-red-50/70 dark:bg-red-950/50 text-red-950 dark:text-red-100';
                        letterBadgeStyle = 'bg-red-500 text-white border-red-500';
                      } else {
                        cardBorder =
                          'border-amber-400 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100';
                        letterBadgeStyle = 'bg-amber-500 text-white border-amber-500';
                      }
                    } else if (isTkpBestOption) {
                      cardBorder =
                        'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20';
                    }
                  } else {
                    if (isUserChoice && isCorrectChoice) {
                      cardBorder =
                        'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold';
                      letterBadgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                    } else if (isUserChoice && !isCorrectChoice) {
                      cardBorder =
                        'border-red-400 dark:border-red-500 bg-red-50/70 dark:bg-red-950/50 text-red-950 dark:text-red-100';
                      letterBadgeStyle = 'bg-red-500 text-white border-red-500';
                    } else if (isCorrectChoice) {
                      cardBorder =
                        'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20';
                    }
                  }

                  const tkpPointBadgeStyle =
                    tkpWeight === 5
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : tkpWeight !== undefined && tkpWeight <= 1
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';

                  return (
                    <div
                      key={opt}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition ${cardBorder}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 border ${letterBadgeStyle}`}
                        >
                          {opt}
                        </span>
                        <div className="min-w-0 flex-1">
                          <MathText text={optText || `Opsi ${opt}`} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {isUserChoice && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                            Pilihanmu
                          </span>
                        )}
                        {isCorrectChoice && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                            Kunci Jawaban
                          </span>
                        )}
                        {isTKP && tkpWeight !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tkpPointBadgeStyle}`}
                          >
                            {tkpWeight} Poin
                          </span>
                        )}
                      </div>
                    </div>
                  );
                };

                // Status badge di kanan atas header kartu soal
                let statusBadgeClass =
                  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700';
                let statusLabel = 'Tidak Dijawab';
                let statusIcon = null;

                if (isCorrect) {
                  statusBadgeClass =
                    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
                  statusLabel = 'Jawaban Benar';
                  statusIcon = <CheckIcon className="w-3 h-3" />;
                } else if (userAns) {
                  if (isTkpMidWrong) {
                    statusBadgeClass =
                      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40';
                    statusLabel = 'Jawaban Salah';
                    statusIcon = <ExclamationCircleIcon className="w-3 h-3" />;
                  } else if (isTkpLowestWrong || !isTKP) {
                    statusBadgeClass =
                      'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
                    statusLabel = 'Jawaban Salah';
                    statusIcon = <XIcon className="w-3 h-3" />;
                  }
                }

                const scoreTextColor = isCorrect
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isTkpMidWrong
                  ? 'text-amber-600 dark:text-amber-400'
                  : userAns
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400';

                return (
                  <div
                    key={probId}
                    className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4"
                  >
                    {/* HEADER ITEM SOAL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-900">
                          Soal #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {cfg.section || 'UMUM'}
                        </span>
                        {isDoubt && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                            <FlagIcon className="w-3 h-3" />
                            <span>Ragu-Ragu</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Poin:{' '}
                          <strong className={`font-black ${scoreTextColor}`}>
                            {gainedScore >= 0 ? `+${gainedScore}` : gainedScore}
                          </strong>
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 ${statusBadgeClass}`}
                        >
                          {statusIcon}
                          <span>{statusLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Teks Soal */}
                    <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      <MathText text={problemDetail?.statement || 'Pernyataan soal tidak ditemukan.'} />
                    </div>

                    {/* OPSI JAWABAN & PERBANDINGAN LAYOUT */}
                    {isPG ? (
                      isLongText ? (
                        <div className="space-y-2 pt-1">
                          {['A', 'B', 'C', 'D', 'E'].map(renderCard)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div className="space-y-2">{['A', 'B', 'C'].map(renderCard)}</div>
                          <div className="space-y-2">{['D', 'E'].map(renderCard)}</div>
                        </div>
                      )
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold">Jawaban Kamu:</span>
                          <span
                            className={`font-mono font-bold ${
                              isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                            }`}
                          >
                            {userAns || '(Kosong / Tidak Dijawab)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            Kunci Jawaban Resmi:
                          </span>
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                            {cfg.correct_answer || 'Tidak ditentukan'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* BLOK INTIP PEMBAHASAN / SOLUSI */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSolutionId(expandedSolutionId === probId ? null : probId)
                        }
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/70 dark:hover:bg-indigo-950 transition inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-900 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <LightbulbIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {expandedSolutionId === probId
                            ? 'Sembunyikan Pembahasan'
                            : 'Lihat Pembahasan & Ide Solusi'}
                        </span>
                        {expandedSolutionId === probId ? (
                          <ChevronUpIcon className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedSolutionId === probId && (
                        <div className="mt-3 p-4 bg-indigo-50/40 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl text-xs space-y-4">
                          {solutionsList.length > 0 ? (
                            solutionsList.map((sol, sIdx) => (
                              <div
                                key={sol.id || sIdx}
                                className={`space-y-3 ${
                                  sIdx > 0
                                    ? 'pt-4 border-t border-indigo-200/60 dark:border-indigo-900/80'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>
                                      Solusi #{sIdx + 1} ({sol.author_name || 'Tim TheoQED'})
                                    </span>
                                  </span>

                                  {sol.final_answer && (
                                    <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/60 px-2 py-0.5 rounded">
                                      Kunci: {sol.final_answer}
                                    </span>
                                  )}
                                </div>

                                {sol.brief && (
                                  <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                                      Ide Ringkas / Konsep Utama:
                                    </span>
                                    <div className="text-slate-800 dark:text-slate-200 pl-3">
                                      <MathText text={sol.brief} />
                                    </div>
                                  </div>
                                )}

                                {sol.steps && sol.steps.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                      Langkah Penyelesaian:
                                    </span>
                                    <div className="space-y-1 pl-3 border-l-2 border-indigo-300 dark:border-indigo-800">
                                      {sol.steps.map((step: string, stepIdx: number) => (
                                        <div key={stepIdx} className="leading-relaxed">
                                          <MathText text={step} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 italic">
                              Pembahasan rinci belum dituliskan untuk soal ini.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada soal pada kategori filter ini.
              </p>
              <button
                type="button"
                onClick={() => setFilterStatus('SEMUA')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Tampilkan Semua Soal
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-xs font-semibold text-slate-400">
          Memuat rapor hasil...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}