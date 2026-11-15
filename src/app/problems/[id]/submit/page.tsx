'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';
import { Problem, Folder } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';

type ProblemWithAccess = Problem & {
  is_premium?: boolean;
  problem_type?: 'multiple_choice' | 'short_answer';
  options?: { [key: string]: string };
};

type FolderWithAccess = Folder & {
  is_premium?: boolean;
};

// --- SVG ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function EyeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function LightbulbIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function KeyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function LockClosedIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function CheckIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
function MathText({ text }: { text?: string }) {
  if (!text) return null;

  const hasMathDelimiter = text.includes('$');
  const formattedText =
    !hasMathDelimiter && text.trim().length > 0 && !text.includes(' ')
      ? `$${text.trim()}$`
      : text;

  const parts = formattedText.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

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

export default function SubmitSolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;
  const supabase = useMemo(() => createClient(), []);

  const [problem, setProblem] = useState<ProblemWithAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authorName, setAuthorName] = useState<string>('');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [isRestrictedContent, setIsRestrictedContent] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [content, setContent] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function initData() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      // Cek profil pengguna (status premium, role, dan nama tampilan)
      let userCanAccessPremium = false;
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        userCanAccessPremium = checkPremiumAccess(profileData);
        setAuthorName(
          profileData?.full_name ||
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split('@')[0] ||
            'Pengguna TheoQED'
        );
      }
      setHasPremiumAccess(userCanAccessPremium);

      // Ambil data soal & seluruh folder untuk mengecek pembatasan berantai
      const [{ data: probData }, { data: folderData }] = await Promise.all([
        supabase.from('problems').select('*').eq('id', problemId).single(),
        supabase.from('folders').select('id, parent_id, is_premium'),
      ]);

      if (probData) {
        const typedProblem = probData as ProblemWithAccess;
        setProblem(typedProblem);

        let restricted = Boolean(typedProblem.is_premium);
        if (!restricted && typedProblem.folder_id && folderData) {
          const allFolders = folderData as FolderWithAccess[];
          let currFolder = allFolders.find((f) => f.id === typedProblem.folder_id);
          while (currFolder) {
            if (currFolder.is_premium) {
              restricted = true;
              break;
            }
            currFolder = allFolders.find((f) => f.id === currFolder?.parent_id);
          }
        }
        setIsRestrictedContent(restricted);
      }

      setLoading(false);
    }

    initData();
  }, [problemId]);

  const isLocked = isRestrictedContent && !hasPremiumAccess;
  const isPG = problem?.problem_type === 'multiple_choice';
  const options = problem?.options || {};
  const hasOptions = Object.keys(options).some((k) => options[k]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || isLocked) return;

    setSubmitting(true);
    const { error } = await supabase.from('solution_submissions').insert({
      problem_id: problemId,
      user_id: user.id,
      title: title.trim() || 'Solusi Komunitas',
      brief: brief.trim() || null,
      content: content,
      final_answer: finalAnswer.trim() || null,
    });

    if (!error) {
      setSubmitted(true);
    } else {
      alert(`Gagal mengirim solusi: ${error.message}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Header Navigation — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/problems/${problemId}`}
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali ke Soal</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Kontribusi Solusi
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Workspace Container — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat workspace kontribusi...</span>
          </div>
        ) : !user ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto mt-12">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200/80 dark:border-indigo-900">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Masuk ke Akun Diperlukan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Silakan masuk ke akun TheoQED terlebih dahulu untuk mengajukan pembahasan solusi.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              Masuk di Beranda
            </Link>
          </div>
        ) : isLocked ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-amber-500/40 text-center space-y-4 max-w-lg mx-auto mt-12">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
              <CrownIcon className="w-3 h-3 text-amber-500" />
              <span>Konten Premium</span>
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Kontribusi Solusi Terkunci
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Soal ini termasuk dalam arsip <strong className="text-slate-700 dark:text-slate-300">Premium</strong>. Pengajuan pembahasan komunitas pada soal ini hanya tersedia untuk anggota dengan akses Premium.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href={`/problems/${problemId}`}
                className="h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition inline-flex items-center justify-center"
              >
                Kembali ke Soal
              </Link>
              <Link
                href={`/upgrade?redirect=/problems/${problemId}/submit`}
                className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center"
              >
                Upgrade ke Premium
              </Link>
            </div>
          </div>
        ) : submitted ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto mt-12">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900 flex items-center justify-center mx-auto">
              <CheckIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Solusi Berhasil Terkirim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Terima kasih atas kontribusi Anda di TheoQED. Pembahasan telah masuk ke antrean peninjauan Admin sebelum diterbitkan secara publik.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/profile"
                className="h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition inline-flex items-center justify-center"
              >
                Lihat Status di Profil
              </Link>
              <Link
                href={`/problems/${problemId}`}
                className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center"
              >
                Kembali ke Detail Soal
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KARTU 1: PERNYATAAN SOAL */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {problem?.competition && (
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                      {problem.competition} {problem.year}
                    </span>
                  )}
                  {problem?.level && (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {problem.level}
                    </span>
                  )}
                  {problem?.topic && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {problem.topic}
                    </span>
                  )}
                  {isRestrictedContent && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-lg uppercase tracking-wider inline-flex items-center gap-1">
                      <CrownIcon className="w-3 h-3 text-amber-500" />
                      <span>Premium</span>
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  ID: {problem?.id}
                </span>
              </div>

              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Pernyataan Soal
                </span>
                <div className="text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50/80 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 whitespace-pre-line">
                  <MathText text={problem?.statement} />
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
              </div>
            </section>

            {/* KARTU 2: FORMULIR PENGISIAN & LIVE PREVIEW */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Tuliskan Pembahasan Solusi
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pembahasan yang Anda ajukan akan ditinjau oleh Admin sebelum diterbitkan ke publik.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Judul Solusi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Judul Solusi / Metode (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Solusi via Induksi Matematika / Ketaksamaan AM-GM"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Ide Ringkas / Hint */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Ide Ringkas / Hint (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Gunakan substitusi u = x^2 + 1 atau analisis modulo 4"
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Langkah Pembahasan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Langkah Pembahasan (Wajib, gunakan{' '}
                    <code className="text-indigo-600 dark:text-indigo-400">$...$</code> untuk KaTeX)
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Tuliskan langkah penyelesaian di sini. Contoh:&#10;Perhatikan bahwa untuk $x > 0$, kita peroleh:&#10;$$\int_0^\infty f(x)dx$$"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed transition"
                  />
                </div>

                {/* Hasil Akhir / Jawaban */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Hasil Akhir / Jawaban (LaTeX Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: \frac{1}{3} atau \blacksquare"
                    value={finalAnswer}
                    onChange={(e) => setFinalAnswer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono transition"
                  />
                </div>

                {/* LIVE PREVIEW SECTION */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <EyeIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Pratinjau Hasil Render (Live Preview)</span>
                  </div>

                  <div className="p-5 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-4">
                    {/* Header Live Preview */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {title.trim() || 'Solusi Komunitas'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Oleh: <strong className="text-slate-700 dark:text-slate-200">{authorName}</strong>
                      </span>
                    </div>

                    {/* Brief Preview */}
                    {brief.trim() && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          <LightbulbIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Ide Ringkas / Clue</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-500/10 text-xs text-slate-700 dark:text-slate-300 border border-amber-500/40">
                          <MathText text={brief} />
                        </div>
                      </div>
                    )}

                    {/* Steps / Content Preview */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Pembahasan
                      </span>
                      {content.trim() ? (
                        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <MathText text={content} />
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Teks langkah pembahasan akan dirender di sini...
                        </p>
                      )}
                    </div>

                    {/* Final Answer Preview */}
                    {finalAnswer.trim() && (
                      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                          <KeyIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Hasil Akhir / Jawaban</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          <MathText text={finalAnswer} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/problems/${problemId}`}
                    className="h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition inline-flex items-center justify-center"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim Solusi...</span>
                      </>
                    ) : (
                      <span>Kirim Pembahasan</span>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}