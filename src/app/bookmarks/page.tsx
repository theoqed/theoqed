'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Problem } from '@/types';

type ProblemWithAccess = Problem & {
  is_premium?: boolean;
  problem_type?: 'multiple_choice' | 'short_answer';
  options?: { [key: string]: string };
};

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
    <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function ShareIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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

function LockClosedIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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

// --- HELPER UNTUK CEK KEABSAHAN SOLUSI ---
function getValidSolutions(problem: Problem): any[] {
  if (!problem.solutions || !Array.isArray(problem.solutions)) return [];
  return problem.solutions.filter((sol: any) => {
    const hasBrief = Boolean(sol.brief && sol.brief.trim());
    const hasSteps = Array.isArray(sol.steps)
      ? sol.steps.some((s: string) => s && s.trim())
      : Boolean(sol.steps && sol.steps.trim());
    const hasExplanation = Boolean(sol.explanation && sol.explanation.trim());
    const hasFinalAnswer = Boolean(sol.final_answer && sol.final_answer.trim());
    return hasBrief || hasSteps || hasExplanation || hasFinalAnswer;
  });
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
                className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0 font-sans"
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

export default function BookmarksPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [bookmarkedProblems, setBookmarkedProblems] = useState<ProblemWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUserPremium, setIsUserPremium] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lockedProblemTitle, setLockedProblemTitle] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);

    let problemIds: string[] = [];

    if (currentUser) {
      const [bmRes, profileRes] = await Promise.all([
        supabase
          .from('user_bookmarks')
          .select('problem_id, created_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
      ]);

      if (bmRes.data) {
        problemIds = bmRes.data.map((b: any) => b.problem_id);
      }
      setIsUserPremium(checkPremiumAccess(profileRes.data));
    } else {
      setIsUserPremium(false);
      try {
        const saved = localStorage.getItem('theoqed_bookmarked_problems');
        if (saved) problemIds = JSON.parse(saved);
      } catch {
        // Abaikan error localStorage
      }
    }

    if (problemIds.length > 0) {
      const { data: problemData } = await supabase
        .from('problems')
        .select('*')
        .in('id', problemIds);

      if (problemData) {
        const orderMap = new Map(problemIds.map((id, index) => [id, index]));
        const sortedProblems = [...(problemData as ProblemWithAccess[])].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
        );
        setBookmarkedProblems(sortedProblems);
      }
    } else {
      setBookmarkedProblems([]);
    }

    setLoading(false);
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/arsip');
    }
  };

  const handleRemoveBookmark = async (problemId: string) => {
    if (user) {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_id', problemId);

      if (!error) {
        setBookmarkedProblems((prev) => prev.filter((p) => p.id !== problemId));
      } else {
        alert(`Gagal menghapus bookmark: ${error.message}`);
      }
    } else {
      try {
        const saved = localStorage.getItem('theoqed_bookmarked_problems');
        const ids: string[] = saved ? JSON.parse(saved) : [];
        const updated = ids.filter((bId) => bId !== problemId);
        localStorage.setItem('theoqed_bookmarked_problems', JSON.stringify(updated));
        setBookmarkedProblems((prev) => prev.filter((p) => p.id !== problemId));
      } catch {
        // Abaikan error localStorage
      }
    }
  };

  const handleCopyLink = (problemId: string) => {
    const url = `${window.location.origin}/problems/${problemId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(problemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProblems = bookmarkedProblems.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.statement?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.competition?.toLowerCase().includes(q) ||
      p.topic?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Header Navigation — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Koleksi Bookmarks
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/arsip"
              className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition inline-flex items-center"
            >
              Arsip Soal
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Kartu Header & Pencarian */}
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0">
              <BookmarkIcon className="w-5 h-5" filled />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Soal Tersimpan
                </h1>
                {!loading && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                    {bookmarkedProblems.length} soal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar soal pilihan yang Anda simpan untuk dipelajari kembali nanti.
              </p>
            </div>
          </div>

          {bookmarkedProblems.length > 0 && (
            <div className="relative min-w-[260px] sm:min-w-[300px]">
              <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari di soal tersimpan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}
        </section>

        {/* Daftar Soal Tersimpan */}
        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat bookmark tersimpan...</span>
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="space-y-4">
            {filteredProblems.map((problem, idx) => {
              const validSolutions = getValidSolutions(problem);
              const solutionCount = validSolutions.length;
              const isProblemRestricted = Boolean(problem.is_premium) && !isUserPremium;
              const isPG = problem.problem_type === 'multiple_choice';
              const options = problem.options || {};
              const hasOptions = Object.keys(options).some((k) => options[k]);

              return (
                <div
                  key={problem.id}
                  className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
                >
                  {/* Baris Lencana & Aksi Hapus */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                        {problem.competition} {problem.year}
                        {problem.level ? ` (${problem.level})` : ''}
                      </span>
                      {isPG && (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border border-purple-200/80 dark:border-purple-900 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Pilihan Ganda
                        </span>
                      )}
                      {problem.is_premium && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
                          <LockClosedIcon className="w-2.5 h-2.5 text-amber-500" />
                          <span>Premium</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {problem.topic && (
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {problem.topic}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(problem.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                        title="Hapus dari Bookmark"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Teks Soal */}
                  <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    <MathText text={problem.statement} />
                  </div>

                  {/* Opsi Pilihan Ganda (Jika Ada) */}
                  {(isPG || hasOptions) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                        const optionText = options[opt];
                        if (!optionText) return null;
                        return (
                          <div
                            key={opt}
                            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3"
                          >
                            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center shrink-0 border border-indigo-200/80 dark:border-indigo-900">
                              {opt}
                            </span>
                            <div className="flex-1 min-w-0 py-0.5">
                              <MathText text={optionText} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer Kartu */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono">
                        ID: {problem.id}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">
                        •
                      </span>
                      {solutionCount > 0 ? (
                        <span className="hidden sm:inline-block text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                          {solutionCount} metode solusi
                        </span>
                      ) : (
                        <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                          Solusi belum ditambahkan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(problem.id)}
                        className="h-8 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] sm:text-xs cursor-pointer"
                        title="Salin Tautan Soal"
                      >
                        <ShareIcon />
                        <span
                          className={
                            copiedId === problem.id
                              ? 'inline font-bold text-indigo-600 dark:text-indigo-400'
                              : 'hidden sm:inline'
                          }
                        >
                          {copiedId === problem.id ? 'Tersalin!' : 'Bagikan'}
                        </span>
                      </button>

                      {isProblemRestricted ? (
                        <button
                          type="button"
                          onClick={() => setLockedProblemTitle(problem.title || problem.id)}
                          className="h-8 px-3 rounded-xl font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition inline-flex items-center gap-1.5 text-[11px] sm:text-xs whitespace-nowrap cursor-pointer"
                        >
                          <LockClosedIcon className="w-3 h-3 text-amber-500" />
                          <span>Solusi Premium</span>
                        </button>
                      ) : solutionCount > 0 ? (
                        <Link
                          href={`/problems/${problem.id}`}
                          className="h-8 px-3 rounded-xl font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50/90 dark:bg-indigo-950/80 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/70 transition inline-flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap"
                        >
                          <span>Buka Solusi ↗</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/problems/${problem.id}/submit`}
                          className="h-8 px-3 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition inline-flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap"
                        >
                          <span>Ajukan Solusi +</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : bookmarkedProblems.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tidak ada soal tersimpan yang cocok dengan kata kunci{' '}
              <strong className="text-slate-700 dark:text-slate-200">&ldquo;{searchQuery}&rdquo;</strong>.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
              <BookmarkIcon className="w-5 h-5" filled />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Belum Ada Soal Tersimpan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Tandai soal yang menarik saat Anda menjelajahi arsip untuk menyimpannya di halaman ini.
              </p>
            </div>
            <Link
              href="/arsip"
              className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              Jelajahi Arsip Soal
            </Link>
          </div>
        )}
      </main>

      {/* MODAL AKSES PREMIUM */}
      {lockedProblemTitle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Konten Premium
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {lockedProblemTitle}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pembahasan lengkap untuk soal ini tersedia khusus untuk anggota Premium. Upgrade akun Anda untuk membuka seluruh koleksi soal dan solusinya.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLockedProblemTitle(null)}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href="/upgrade?redirect=/bookmarks"
                className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center justify-center transition"
              >
                Upgrade ke Premium
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}