'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';
import { Problem, Solution } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';

type ProblemWithAccess = Problem & {
  is_premium?: boolean;
  problem_type?: 'multiple_choice' | 'short_answer';
  options?: Record<string, string> | string;
  final_answer?: string;
};

interface FolderAccessNode {
  id: string;
  name: string;
  parent_id?: string | null;
  is_premium?: boolean;
}

// --- SVG ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function BookmarkIcon({ className = 'w-4 h-4', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

function ShareIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
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

function KeyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}

function LightbulbIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function LockClosedIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function CrownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
function MathText({ text }: { text?: string }) {
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
                className="block my-3 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0 font-sans"
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

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;

  const [problem, setProblem] = useState<ProblemWithAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserPremium, setIsUserPremium] = useState(false);
  const [isParentFolderRestricted, setIsParentFolderRestricted] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!problemId) return;

    async function loadProblemAndAccess() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      // Cek status langganan pengguna
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        setIsUserPremium(checkPremiumAccess(profile));
      } else {
        setIsUserPremium(false);
      }

      // Ambil data soal
      const { data: problemData } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .maybeSingle();

      if (problemData) {
        const prob = problemData as ProblemWithAccess;
        setProblem(prob);

        // Cek apakah folder induk (atau leluhurnya) bertanda Premium
        if (prob.folder_id) {
          const { data: allFolders } = await supabase
            .from('folders')
            .select('id, name, parent_id, is_premium');

          if (allFolders) {
            const folderMap = new Map(
              (allFolders as FolderAccessNode[]).map((f) => [f.id, f])
            );
            let curr: FolderAccessNode | undefined = folderMap.get(prob.folder_id);
            let folderRestricted = false;
            while (curr) {
              if (curr.is_premium) {
                folderRestricted = true;
                break;
              }
              curr = curr.parent_id ? folderMap.get(curr.parent_id) : undefined;
            }
            setIsParentFolderRestricted(folderRestricted);
          }
        } else {
          setIsParentFolderRestricted(false);
        }
      }

      // Cek status bookmark
      if (currentUser) {
        const { data: bmData } = await supabase
          .from('user_bookmarks')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('problem_id', problemId)
          .maybeSingle();

        setIsBookmarked(!!bmData);
      } else {
        try {
          const saved = localStorage.getItem('theoqed_bookmarked_problems');
          if (saved) {
            const bookmarkedIds: string[] = JSON.parse(saved);
            setIsBookmarked(bookmarkedIds.includes(problemId));
          }
        } catch {
          // Abaikan error localStorage
        }
      }

      setLoading(false);
    }

    loadProblemAndAccess();
  }, [problemId, supabase]);

  const toggleBookmark = async () => {
    setBookmarking(true);
    try {
      if (user) {
        if (isBookmarked) {
          const { error } = await supabase
            .from('user_bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('problem_id', problemId);

          if (!error) setIsBookmarked(false);
        } else {
          const { error } = await supabase
            .from('user_bookmarks')
            .insert({ user_id: user.id, problem_id: problemId });

          if (!error) setIsBookmarked(true);
        }
      } else {
        // Fallback LocalStorage untuk pengguna tamu
        const saved = localStorage.getItem('theoqed_bookmarked_problems');
        const ids: string[] = saved ? JSON.parse(saved) : [];
        if (isBookmarked) {
          const updated = ids.filter((id) => id !== problemId);
          localStorage.setItem('theoqed_bookmarked_problems', JSON.stringify(updated));
          setIsBookmarked(false);
        } else {
          const updated = Array.from(new Set([problemId, ...ids]));
          localStorage.setItem('theoqed_bookmarked_problems', JSON.stringify(updated));
          setIsBookmarked(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWholePageBlocked = Boolean(problem) && isParentFolderRestricted && !isUserPremium;
  const isSolutionBlocked =
    Boolean(problem) && (Boolean(problem?.is_premium) || isParentFolderRestricted) && !isUserPremium;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Header Navigation — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={problem?.folder_id && !isWholePageBlocked ? `/arsip?folder=${problem.folder_id}` : '/arsip'}
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali ke Arsip</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {problem && !isWholePageBlocked
                ? `${problem.competition} ${problem.year}`
                : 'Detail & Pembahasan'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/bookmarks"
              className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <BookmarkIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Bookmarks</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Reader Workspace — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat detail soal dan pembahasan...</span>
          </div>
        ) : !problem ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto mt-12">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Soal Tidak Ditemukan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Soal yang Anda cari tidak tersedia atau telah dihapus dari arsip.
            </p>
            <Link
              href="/arsip"
              className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
            >
              Kembali ke Arsip Soal
            </Link>
          </div>
        ) : isWholePageBlocked ? (
          /* BLOKIR TOTAL JIKA FOLDER INDUK BERSIFAT PREMIUM */
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-amber-500/40 text-center space-y-4 max-w-lg mx-auto mt-12">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
              <CrownIcon className="w-3 h-3 text-amber-500" />
              <span>Koleksi Premium</span>
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Soal &amp; Pembahasan Khusus Anggota Premium
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Soal ini berada di dalam folder koleksi{' '}
              <strong className="text-slate-700 dark:text-slate-300">Premium</strong>. Upgrade akun Anda untuk membuka seluruh bank soal dan pembahasannya.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Link
                href="/arsip"
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition inline-flex items-center justify-center"
              >
                Kembali ke Arsip
              </Link>
              <Link
                href={`/upgrade?redirect=/problems/${problemId}`}
                className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition inline-flex items-center justify-center"
              >
                Upgrade ke Premium
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KARTU 1: PERNYATAAN SOAL */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                    {problem.competition} {problem.year}
                  </span>
                  {problem.level && (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {problem.level}
                    </span>
                  )}
                  {problem.topic && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {problem.topic}
                    </span>
                  )}
                  {(problem.is_premium || isParentFolderRestricted) && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/40 inline-flex items-center gap-1 uppercase tracking-wider">
                      <CrownIcon className="w-3 h-3 text-amber-500" />
                      <span>Premium</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="h-8 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition inline-flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                  >
                    {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <ShareIcon className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleBookmark}
                    disabled={bookmarking}
                    className={`h-8 px-3 rounded-xl transition inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <BookmarkIcon className="w-3.5 h-3.5" filled={isBookmarked} />
                    <span>
                      {bookmarking ? 'Proses...' : isBookmarked ? 'Tersimpan' : 'Simpan'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Pernyataan Soal
                  </span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                    ID: {problem.id}
                  </span>
                </div>

                <div className="text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal bg-slate-50/80 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <MathText text={problem.statement} />
                </div>

                {/* PILIHAN JAWABAN (UNTUK SOAL PILIHAN GANDA) */}
                {problem.options &&
                  (problem.problem_type === 'multiple_choice' ||
                    Object.keys(problem.options).length > 0) && (
                    <div className="pt-2 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Pilihan Jawaban
                      </span>

                      {(() => {
                        let parsedOptions: Record<string, string> = {};
                        if (typeof problem.options === 'string') {
                          try {
                            parsedOptions = JSON.parse(problem.options);
                          } catch {
                            parsedOptions = {};
                          }
                        } else if (
                          typeof problem.options === 'object' &&
                          problem.options !== null
                        ) {
                          parsedOptions = problem.options as Record<string, string>;
                        }

                        const isLongText = ['A', 'B', 'C', 'D', 'E'].some((opt) => {
                          const txt = parsedOptions[opt] || '';
                          return txt.length > 35 || txt.includes('\n') || txt.includes('$$');
                        });

                        const renderOptionCard = (opt: string) => {
                          const optText = parsedOptions[opt];
                          if (!optText && !parsedOptions.A) return null;

                          return (
                            <div
                              key={opt}
                              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-3"
                            >
                              <span className="w-7 h-7 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900">
                                {opt}
                              </span>
                              <div className="flex-1 min-w-0 py-0.5">
                                <MathText text={optText || `Opsi ${opt}`} />
                              </div>
                            </div>
                          );
                        };

                        return isLongText ? (
                          <div className="space-y-2.5">
                            {['A', 'B', 'C', 'D', 'E'].map(renderOptionCard)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {['A', 'B', 'C', 'D', 'E'].map(renderOptionCard)}
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </section>

            {/* KARTU 2: SEKSI PEMBAHASAN */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Pembahasan Soal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Langkah-langkah penyelesaian terstruktur dengan KaTeX rendering.
                  </p>
                </div>

                {!isSolutionBlocked && (
                  <div className="flex flex-wrap items-center gap-2">
                    {problem.solutions && problem.solutions.length > 1 && (
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                        {problem.solutions.map((sol: Solution, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveSolutionIdx(idx)}
                            className={`h-7 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                              activeSolutionIdx === idx
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Metode {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/problems/${problemId}/submit`}
                      className="h-9 px-3.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl transition border border-amber-500/40 inline-flex items-center"
                    >
                      Ajukan Solusi +
                    </Link>
                  </div>
                )}
              </div>

              {/* GERBANG AKSES PREMIUM UNTUK PEMBAHASAN */}
              {isSolutionBlocked ? (
                <div className="p-6 sm:p-8 rounded-xl bg-amber-500/10 border border-amber-500/40 text-center space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/40">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Pembahasan Khusus Anggota Premium
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Petunjuk penyelesaian, langkah pengerjaan lengkap, dan kunci jawaban untuk soal ini tersedia khusus bagi akun{' '}
                      <strong className="text-slate-800 dark:text-slate-200">Premium</strong>.
                    </p>
                  </div>
                  <div className="pt-1">
                    <Link
                      href={`/upgrade?redirect=/problems/${problemId}`}
                      className="inline-flex items-center justify-center h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                    >
                      Upgrade ke Premium
                    </Link>
                  </div>
                </div>
              ) : problem.solutions && problem.solutions.length > 0 ? (
                (() => {
                  const activeSol = problem.solutions[activeSolutionIdx] as any;

                  let fullText = '';
                  if (Array.isArray(activeSol?.steps)) fullText = activeSol.steps.join('\n\n');
                  else if (Array.isArray(activeSol?.detailed_steps))
                    fullText = activeSol.detailed_steps.join('\n\n');
                  else if (typeof activeSol?.steps === 'string') fullText = activeSol.steps;
                  else if (typeof activeSol?.detailed_steps === 'string')
                    fullText = activeSol.detailed_steps;
                  else if (typeof activeSol?.content === 'string') fullText = activeSol.content;

                  const rawFinalAnswer =
                    activeSol?.final_answer ||
                    activeSol?.answer ||
                    activeSol?.result ||
                    problem.final_answer ||
                    '';

                  return (
                    <div className="space-y-5">
                      <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {activeSol?.title || `Solusi #${activeSolutionIdx + 1}`}
                        </h3>
                        {activeSol?.author && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Oleh: <strong className="text-slate-700 dark:text-slate-200">{activeSol.author}</strong>
                          </span>
                        )}
                      </div>

                      {activeSol?.brief && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            <LightbulbIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Ide Singkat / Clue</span>
                          </div>
                          <div className="p-4 rounded-xl bg-amber-500/10 text-xs sm:text-sm text-slate-700 dark:text-slate-300 border border-amber-500/40">
                            <MathText text={activeSol.brief} />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Pembahasan Lengkap
                        </span>
                        {fullText ? (
                          <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal p-5 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                            <MathText text={fullText} />
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800">
                            Teks pembahasan lengkap untuk soal ini belum diisi.
                          </p>
                        )}
                      </div>

                      {rawFinalAnswer && (
                        <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                            <KeyIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Hasil Akhir / Jawaban</span>
                          </div>
                          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            <MathText text={String(rawFinalAnswer)} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-500 dark:text-slate-400">
                    Pembahasan resmi untuk soal ini belum tersedia.
                  </p>
                  <p>
                    Anda dapat mengajukan solusi melalui tombol <strong>&ldquo;Ajukan Solusi +&rdquo;</strong> di atas untuk ditinjau sebelum diterbitkan.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}