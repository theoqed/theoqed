'use client';

import { useState, useEffect, use } from 'react';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { Problem } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- ICONS ---
function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function LightbulbIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function KeyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
function MathText({ text }: { text?: string }) {
  if (!text) return null;

  const hasMathDelimiter = text.includes('$');
  const formattedText = !hasMathDelimiter && text.trim().length > 0 && !text.includes(' ') 
    ? `$${text.trim()}$` 
    : text;

  const parts = formattedText.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

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

export default function SubmitSolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [content, setContent] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function initData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      const { data } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .single();

      if (data) setProblem(data as Problem);
      setLoading(false);
    }

    initData();
  }, [problemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('solution_submissions').insert({
      problem_id: problemId,
      user_id: user.id,
      title: title || 'Solusi Komunitas',
      brief: brief || null,
      content: content,
      final_answer: finalAnswer || null,
    });

    if (!error) {
      setSubmitted(true);
    } else {
      alert(`Gagal mengirim solusi: ${error.message}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      
      {/* Navbar Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a
              href={`/problems/${problemId}`}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
            >
              <ArrowLeftIcon />
              <span>Kembali ke Soal</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Workspace Kontribusi Solusi
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {!user ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Akses Dibatasi</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kamu harus masuk (login) ke akun TheoQED terlebih dahulu untuk mengajukan pembahasan solusi.
            </p>
            <a href="/" className="inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
              Kembali ke Beranda untuk Login
            </a>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Memuat workspace...</div>
        ) : submitted ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Solusi Kamu Berhasil Terkirim!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Terima kasih atas kontribusimu di TheoQED. Solusi kamu telah masuk ke sistem dan akan ditinjau oleh Admin sebelum diterbitkan secara publik.
            </p>
            <div className="pt-2">
              <a href={`/problems/${problemId}`} className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
                Kembali ke Detail Soal
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KARTU 1: SOAL MATEMATIKA (POSISI DI ATAS - FULL WIDTH) */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {problem?.competition && (
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900">
                      {problem.competition} {problem.year}
                    </span>
                  )}
                  {problem?.level && (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      {problem.level}
                    </span>
                  )}
                  {problem?.topic && (
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl">
                      {problem.topic}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  ID: {problem?.id}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Pernyataan Soal:
                </span>
                <div className="text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50/60 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <MathText text={problem?.statement} />
                </div>
              </div>
            </div>

            {/* KARTU 2: FORMULIR PENGISIAN & LIVE PREVIEW (POSISI DI BAWAH) */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Tuliskan Pembahasan Solusi
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pembahasan yang kamu tulis akan ditinjau oleh admin sebelum diterbitkan ke publik.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Judul Solusi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Judul Solusi / Metode (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Solusi via Induksi Matematika / Ketaksamaan AM-GM"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Ide Ringkas / Hint */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ide Ringkas / Hint (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Gunakan substitusi u = x^2 + 1 atau analisis keterbagian modulo 4"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Langkah Pembahasan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Langkah Pembahasan (Wajib, gunakan <code className="text-blue-600 dark:text-blue-400">$...$</code> untuk KaTeX)
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Tuliskan langkah penyelesaian di sini. Contoh:&#10;Perhatikan bahwa untuk $x > 0$, kita peroleh:&#10;$$\int_0^\infty f(x)dx$$"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  />
                </div>

                {/* Hasil Akhir / Jawaban */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hasil Akhir / Jawaban (LaTeX Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: \frac{1}{3} atau \blacksquare"
                    value={finalAnswer}
                    onChange={(e) => setFinalAnswer(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* LIVE PREVIEW SECTION */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <EyeIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Pratinjau Hasil Render (Live Preview):</span>
                  </div>

                  <div className="p-5 bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                    {/* Header Live Preview */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {title.trim() || 'Solusi Komunitas'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Oleh: {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna TheoQED'}
                      </span>
                    </div>

                    {/* Brief Preview */}
                    {brief.trim() && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          <LightbulbIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Ide Ringkas / Clue:</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 text-xs text-slate-700 dark:text-slate-300 border border-amber-200/60 dark:border-amber-900/40">
                          <MathText text={brief} />
                        </div>
                      </div>
                    )}

                    {/* Steps / Content Preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Pembahasan:
                      </span>
                      {content.trim() ? (
                        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
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
                      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/20 space-y-1">
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                          <KeyIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Hasil Akhir / Jawaban:</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          <MathText text={finalAnswer} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <a
                    href={`/problems/${problemId}`}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Batal
                  </a>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    {submitting ? 'Mengirim Solusi...' : 'Kirim Pembahasan'}
                  </button>
                </div>

              </form>

            </div>

          </div>
        )}
      </main>

    </div>
  );
}