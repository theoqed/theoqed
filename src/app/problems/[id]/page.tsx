'use client';

import { useState, useEffect, use } from 'react';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { Problem, Solution } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- ICONS ---
function ArrowLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function BookmarkIcon({ className = "", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function KeyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function LightbulbIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// --- KATEX MATH PARSER (FIXED) ---
function MathText({ text }: { text?: string }) {
  if (!text) return null;

  // Split teks langsung berdasarkan delimiter $ tanpa auto-wrap sembarangan
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
                className="block my-3 text-center overflow-x-auto [&_.katex-display]:my-0"
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

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [bookmarking, setBookmarking] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (problemId) {
      loadProblemAndBookmarkStatus();
    }
  }, [problemId]);

  async function loadProblemAndBookmarkStatus() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);

    const { data } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();

    if (data) setProblem(data as Problem);

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
      } catch (e) {}
    }

    setLoading(false);
  }

  const toggleBookmark = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu melalui beranda untuk menyimpan soal ke Cloud Bookmarks!');
      return;
    }

    setBookmarking(true);
    try {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      
      {/* Top Header Navigation */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <a
              href="/arsip"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Kembali ke Arsip</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <a href="/" className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 shrink-0">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <a
              href="https://instagram.com/davemarcellino_"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold p-2 sm:px-3.5 sm:py-2 rounded-xl transition inline-flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60"
            >
              <InstagramIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="hidden sm:inline">@davemarcellino_</span>
            </a>
          </div>

        </div>
      </header>

      {/* Main Reader Workspace */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
            Memuat detail soal dan pembahasan...
          </div>
        ) : problem ? (
          <div className="space-y-6">
            
            {/* KARTU 1: PERNYATAAN SOAL */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm">
                    {problem.competition} {problem.year}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                    {problem.level}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    {problem.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {copied ? <CheckIcon className="text-emerald-500" /> : <ShareIcon />}
                    <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
                  </button>

                  <button
                    onClick={toggleBookmark}
                    disabled={bookmarking}
                    className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                      isBookmarked
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <BookmarkIcon filled={isBookmarked} />
                    <span>{bookmarking ? 'Proses...' : isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Pernyataan Soal
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    ID: {problem.id}
                  </span>
                </div>

                <div className="text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-line font-normal bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <MathText text={problem.statement} />
                </div>

                {/* PILIHAN JAWABAN (UNTUK SOAL PILIHAN GANDA) */}
                {problem.options && (problem.problem_type === 'multiple_choice' || Object.keys(problem.options).length > 0) && (
                  <div className="pt-3 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Pilihan Jawaban
                    </span>

                    {(() => {
                      let parsedOptions: Record<string, string> = {};
                      if (typeof problem.options === 'string') {
                        try { parsedOptions = JSON.parse(problem.options); } catch (e) { parsedOptions = {}; }
                      } else if (typeof problem.options === 'object' && problem.options !== null) {
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
                            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-3.5 transition hover:border-slate-300 dark:hover:border-slate-700"
                          >
                            <span className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm">
                              {opt}
                            </span>
                            <div className="flex-1 min-w-0">
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
                          <div className="space-y-2.5">
                            {['A', 'B', 'C'].map(renderOptionCard)}
                          </div>
                          <div className="space-y-2.5">
                            {['D', 'E'].map(renderOptionCard)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>

            {/* KARTU 2: SEKSI PEMBAHASAN */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Pembahasan Soal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Langkah-langkah penyelesaian terstruktur dengan KaTeX rendering.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {problem.solutions && problem.solutions.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      {problem.solutions.map((sol: Solution, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSolutionIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            activeSolutionIdx === idx
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Metode {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* TOMBOL MENGARAH KE HALAMAN KONTRIBUSI WORKSPACE */}
                  <a
                    href={`/problems/${problemId}/submit`}
                    className="px-3.5 py-1.5 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl transition border border-amber-300/80 dark:border-amber-800 inline-block"
                  >
                    Ajukan Solusi +
                  </a>
                </div>
              </div>

              {/* Isi Pembahasan yang Aktif */}
              {problem.solutions && problem.solutions.length > 0 ? (
                (() => {
                  const activeSol = problem.solutions[activeSolutionIdx] as any;
                  
                  let fullText = '';
                  if (Array.isArray(activeSol?.steps)) fullText = activeSol.steps.join('\n\n');
                  else if (Array.isArray(activeSol?.detailed_steps)) fullText = activeSol.detailed_steps.join('\n\n');
                  else if (typeof activeSol?.steps === 'string') fullText = activeSol.steps;
                  else if (typeof activeSol?.detailed_steps === 'string') fullText = activeSol.detailed_steps;
                  else if (typeof activeSol?.content === 'string') fullText = activeSol.content;

                  const rawFinalAnswer =
                    activeSol?.final_answer || activeSol?.answer || activeSol?.result || (problem as any)?.final_answer || '';

                  return (
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {activeSol?.title || `Solusi #${activeSolutionIdx + 1}`}
                        </h3>
                        {activeSol?.author && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Oleh: {activeSol.author}
                          </span>
                        )}
                      </div>

                      {activeSol?.brief && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <LightbulbIcon className="text-amber-500 shrink-0" />
                            <span>Ide Singkat / Clue:</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 text-xs text-slate-700 dark:text-slate-300 border border-amber-200/60 dark:border-amber-900/40">
                            <MathText text={activeSol.brief} />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Pembahasan Lengkap:
                        </span>
                        {fullText ? (
                          <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal p-5 bg-slate-50/40 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                            <MathText text={fullText} />
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                            Teks pembahasan lengkap untuk soal ini belum diisi.
                          </p>
                        )}
                      </div>

                      {rawFinalAnswer && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/20 space-y-1.5 shadow-sm mt-4">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <KeyIcon className="shrink-0" />
                            <span>Hasil Akhir / Jawaban:</span>
                          </div>
                          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pl-0.5">
                            <MathText text={String(rawFinalAnswer)} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 italic space-y-3">
                  <p>Pembahasan resmi untuk soal ini belum tersedia.</p>
                  <p>Anda dapat mengajukan solusi melalui tombol "Ajukan Solusi +" di atas.</p>
                  <p>Solusi anda akan dipertimbangkan dahulu sebelum dirilis di website ini.</p>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Soal Tidak Ditemukan
            </h2>
            <a href="/arsip" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl">
              <span>Kembali ke Arsip Soal</span>
            </a>
          </div>
        )}
      </main>

    </div>
  );
}