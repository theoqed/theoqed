'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// --- SVG CUSTOM ICONS ---
function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function RefreshIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LightbulbIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function StarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function ChartBarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUpIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
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

function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
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
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: true, output: 'html' });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto font-sans [&_.katex-display]:my-0"
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

// HELPER PARSER SOLUSI
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
  const supabase = createClient();

  const [tryout, setTryout] = useState<TryoutItem | null>(null);
  const [submission, setSubmission] = useState<SubmissionItem | null>(null);
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [problemsMap, setProblemsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // State Filter Pembahasan
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'BENAR' | 'SALAH' | 'RAGU'>('SEMUA');
  const [expandedSolutionId, setExpandedSolutionId] = useState<string | null>(null);

  useEffect(() => {
    async function initResult() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push(`/tryout/${slugOrId}`);
        return;
      }

      // 1. Fetch Data Tryout
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

      // 2. Fetch Data Submission
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

      // 3. Fetch Profil Identitas Peserta
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, name, email, avatar_url')
        .eq('id', subData.user_id)
        .maybeSingle();

      let resolvedName = profile?.full_name || profile?.name || profile?.email?.split('@')[0];
      let resolvedEmail = profile?.email || '';
      let resolvedAvatar = profile?.avatar_url || '';

      // Fallback ke session user metadata jika peserta adalah user aktif
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

      // 4. Safe Parse Configs & Fetch Detail Soal
      let configs: ProblemConfigItem[] = [];
      if (typeof tryoutData.problem_configs === 'string') {
        try { configs = JSON.parse(tryoutData.problem_configs); } catch (e) { configs = []; }
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
  }, [slugOrId, submissionId]);

  const getConfigs = (): ProblemConfigItem[] => {
    if (!tryout || !tryout.problem_configs) return [];
    if (typeof tryout.problem_configs === 'string') {
      try { return JSON.parse(tryout.problem_configs); } catch (e) { return []; }
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

  if (loading || !tryout || !submission) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/2 mx-auto" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  // HITUNG STATISTIK UTAMA
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const sectionStats: Record<string, { score: number; total: number; correct: number }> = {};

  configs.forEach((cfg) => {
    const pId = cfg.problem_id;
    const userAns = (submission.answers?.[pId] || '').trim();
    const secName = (cfg.section || 'UMUM').toUpperCase();

    if (!sectionStats[secName]) {
      sectionStats[secName] = { score: 0, total: 0, correct: 0 };
    }
    sectionStats[secName].total += 1;

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          {/* HEADER JUDUL RAPOR + KARTU NAMA PESERTA */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* IDENTITAS PESERTA & RAPOR */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 inline-flex items-center gap-1.5">
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>Selesai Dikerjakan</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(submission.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Rapor Hasil Try Out: {tryout.title}
                </h1>

                {/* BADGE NAMA PESERTA */}
                {participant && (
                  <div className="pt-2 flex items-center gap-3">
                    {participant.avatar ? (
                      <img src={participant.avatar} alt="Avatar" className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200/80 dark:border-indigo-900">
                        {getInitials(participant.name)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Nama Peserta Ujian:</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {participant.name}
                      </div>
                      {participant.email && (
                        <div className="text-xs text-slate-400 truncate">
                          {participant.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2.5 self-start md:self-center">
                <Link
                  href={`/tryout/${tryout.slug || tryout.id}`}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshIcon className="w-3.5 h-3.5" />
                  <span>Ulangi Try Out</span>
                </Link>
                <Link
                  href="/tryout"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <GridIcon className="w-3.5 h-3.5" />
                  <span>Katalog Try Out</span>
                </Link>
              </div>

            </div>

          </div>

          {/* KARTU STATISTIK UTAMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Total Skor */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Skor Total Perolehan</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{submission.score_total}</span>
                <span className="text-xs font-semibold opacity-75">Poin</span>
              </div>
              <span className="text-[10px] opacity-75">Akurasi Soal Benar: {accuracy}%</span>
            </div>

            {/* Waktu Pengerjaan */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Durasi Terpakai</span>
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {formatTimeSpent(submission.time_spent_seconds || 0)}
              </span>
              <span className="text-[10px] text-slate-400">Dari total {tryout.duration_minutes || 60} menit</span>
            </div>

            {/* Benar vs Salah */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statistik Jawaban</span>
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
              <span className="text-[10px] text-slate-400">{unansweredCount} Soal tidak dijawab</span>
            </div>

            {/* Total Soal */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Soal</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {configs.length} Soal
              </span>
              <span className="text-[10px] text-slate-400">Terbagi dalam {Object.keys(sectionStats).length} seksi</span>
            </div>

          </div>

          {/* BREAKDOWN RINCIAN PER SEKSI */}
          {Object.keys(sectionStats).length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-indigo-500" />
                <span>Perolehan Skor Berdasarkan Seksi Sub-tes</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(sectionStats).map(([secName, stat]) => (
                  <div key={secName} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">{secName}</span>
                      <span className="text-[10px] font-bold text-slate-400">{stat.correct}/{stat.total} Benar</span>
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
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Pembahasan Rinci & Solusi Soal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pelajari kunci jawaban resmi dan pembahasan notasi KaTeX untuk setiap nomor.
                </p>
              </div>

              {/* FILTER TAB PEMBAHASAN */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold">
                {(['SEMUA', 'BENAR', 'SALAH', 'RAGU'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filterStatus === st
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {st === 'SEMUA' ? 'Semua' : st === 'BENAR' ? 'Benar' : st === 'SALAH' ? 'Salah' : 'Ragu-Ragu'}
                  </button>
                ))}
              </div>
            </div>

            {/* DAFTAR SOAL & PEMBAHASAN */}
            <div className="space-y-4">
              {configs.map((cfg, idx) => {
                const probId = cfg.problem_id;
                const problemDetail = problemsMap[probId];
                const userAns = (submission.answers?.[probId] || '').trim().toUpperCase();
                const isDoubt = Boolean(submission.doubtfuls?.[probId]);
                const detailScore = submission.score_details?.[probId];
                
                const isPG = problemDetail?.problem_type === 'multiple_choice';
                const options = problemDetail?.options || {};
                const correctKey = (cfg.correct_answer || 'A').trim().toUpperCase();
                const isCorrect = detailScore?.isCorrect || false;

                // Apply Filter Status
                if (filterStatus === 'BENAR' && !isCorrect) return null;
                if (filterStatus === 'SALAH' && (isCorrect || !userAns)) return null;
                if (filterStatus === 'RAGU' && !isDoubt) return null;

                const solutionsList = extractProblemSolutions(problemDetail);

                return (
                  <div
                    key={probId}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    {/* Header Item Soal */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                          Soal #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-lg">
                          Seksi: {cfg.section || 'UMUM'}
                        </span>
                        {isDoubt && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <StarIcon className="w-3 h-3" />
                            <span>Ragu-Ragu</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">
                          Poin: <strong className="text-indigo-600 dark:text-indigo-400">+{detailScore?.score || 0}</strong>
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1 ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                            : userAns
                            ? 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {isCorrect ? <CheckIcon className="w-3 h-3" /> : userAns ? <XIcon className="w-3 h-3" /> : null}
                          <span>{isCorrect ? 'Jawaban Benar' : userAns ? 'Jawaban Salah' : 'Tidak Dijawab'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Teks Soal */}
                    <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      <MathText text={problemDetail?.statement || 'Pernyataan soal tidak ditemukan.'} />
                    </div>

                    {/* OPSI JAWABAN & PERBANDINGAN */}
                    {isPG ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                          const optText = options[opt];
                          if (!optText && !options.A) return null;

                          const isUserChoice = userAns === opt;
                          const isCorrectChoice = correctKey === opt && cfg.scoring_type !== 'weighted_tkp';
                          const tkpWeight = cfg.option_weights?.[opt];

                          let cardBorder = "border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50";
                          if (isUserChoice && isCorrectChoice) {
                            cardBorder = "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold";
                          } else if (isUserChoice && !isCorrectChoice && cfg.scoring_type !== 'weighted_tkp') {
                            cardBorder = "border-red-400 bg-red-50/60 dark:bg-red-950/50 text-red-900 dark:text-red-200";
                          } else if (isCorrectChoice) {
                            cardBorder = "border-emerald-300 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20";
                          }

                          return (
                            <div
                              key={opt}
                              className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition ${cardBorder}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`w-7 h-7 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 border ${
                                  isUserChoice
                                    ? isCorrectChoice ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                }`}>
                                  {opt}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <MathText text={optText || `Opsi ${opt}`} />
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isUserChoice && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                                    Pilihanmu
                                  </span>
                                )}
                                {isCorrectChoice && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                                    Kunci Jawaban
                                  </span>
                                )}
                                {cfg.scoring_type === 'weighted_tkp' && tkpWeight !== undefined && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                                    {tkpWeight} Poin
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold">Jawaban Kamu:</span>
                          <span className={`font-mono font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                            {userAns || '(Kosong / Tidak Dijawab)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Kunci Jawaban Resmi:</span>
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                            {cfg.correct_answer || 'Tidak ditentukan'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* BLOK INTIP PEMBAHASAN / SOLUSI */}
                    <div className="pt-2">
                      <button
                        onClick={() => setExpandedSolutionId(expandedSolutionId === probId ? null : probId)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 px-3 py-1.5 rounded-xl"
                      >
                        <LightbulbIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{expandedSolutionId === probId ? 'Sembunyikan Pembahasan' : 'Lihat Pembahasan & Ide Solusi'}</span>
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
                                  sIdx > 0 ? 'pt-4 border-t border-indigo-200/60 dark:border-indigo-900/80' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Solusi #{sIdx + 1} ({sol.author_name || 'Tim TheoQED'})</span>
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

          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-8 text-center text-xs text-slate-400">Memuat rapor hasil...</div>}>
      <ResultContent />
    </Suspense>
  );
}