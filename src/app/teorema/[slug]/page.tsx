'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MathText } from '@/components/MathText';
import { ProofStep, Theorem } from '@/types/theorem';

// --- SVG ICONS ---
function ArrowLeftIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function BookOpenIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

function FileTextIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ArchiveIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function EyeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function TheoremDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const supabase = useMemo(() => createClient(), []);

  const [theorem, setTheorem] = useState<Theorem | null>(null);
  const [prevTheorem, setPrevTheorem] = useState<{ slug: string; title: string } | null>(null);
  const [nextTheorem, setNextTheorem] = useState<{ slug: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProof, setShowProof] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function fetchDetail() {
      setLoading(true);
      const { data: current } = await supabase
        .from('theorems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (current) {
        setTheorem(current as Theorem);

        const [{ data: prevData }, { data: nextData }] = await Promise.all([
          supabase
            .from('theorems')
            .select('slug, title')
            .lt('order_index', current.order_index)
            .order('order_index', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('theorems')
            .select('slug, title')
            .gt('order_index', current.order_index)
            .order('order_index', { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        setPrevTheorem(prevData || null);
        setNextTheorem(nextData || null);
      } else {
        setTheorem(null);
        setPrevTheorem(null);
        setNextTheorem(null);
      }
      setLoading(false);
    }

    fetchDetail();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
        <div>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <span>Memuat penjelasan teorema...</span>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!theorem) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
        <div>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-20">
            <div className="max-w-md mx-auto text-center p-10 sm:p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 flex items-center justify-center mx-auto">
                <BookOpenIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-base font-bold text-slate-900 dark:text-white">
                  Teorema Tidak Ditemukan
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Teorema yang Anda cari belum tersedia atau tautannya telah berubah.
                </p>
              </div>
              <Link
                href="/teorema"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                <ArrowLeftIcon />
                <span>Kembali ke Kumpulan Teorema</span>
              </Link>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const steps: ProofStep[] = Array.isArray(theorem.proof_steps)
    ? [...theorem.proof_steps].sort((a, b) => a.step - b.step)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div>
        <Navbar />

        {/* Header Teorema */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-8 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/teorema"
                className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
              >
                <ArrowLeftIcon />
                <span>Kumpulan Teorema</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider border border-indigo-200/80 dark:border-indigo-900">
                {theorem.field}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {theorem.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 text-xs pt-0.5">
                <span className="px-2.5 py-0.5 rounded-lg font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                  {theorem.topic}
                </span>
                {theorem.mathematicians && (
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {theorem.mathematicians}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Konten Utama 2 Kolom */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* KOLOM KIRI: PERNYATAAN & PEMBUKTIAN FORMAL */}
            <div className="lg:col-span-8 space-y-6">
              {/* KARTU 1: PERNYATAAN TEOREMA */}
              <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <BookOpenIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Pernyataan Teorema
                  </h2>
                </div>
                <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-sm sm:text-base text-slate-800 dark:text-slate-200">
                  <MathText text={theorem.statement} />
                </div>
              </section>

              {/* KARTU 2: PEMBUKTIAN FORMAL */}
              <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Pembuktian Formal
                    </h2>
                  </div>

                  {steps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowProof((prev) => !prev)}
                      className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      {showProof ? <EyeOffIcon /> : <EyeIcon />}
                      <span>{showProof ? 'Sembunyikan Bukti' : 'Tampilkan Bukti'}</span>
                    </button>
                  )}
                </div>

                {!showProof ? (
                  <div className="p-6 sm:p-8 text-center rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Langkah pembuktian disembunyikan agar Anda dapat mencoba menyusun buktinya secara mandiri terlebih dahulu.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowProof(true)}
                      className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <EyeIcon />
                      <span>Buka Langkah Pembuktian</span>
                    </button>
                  </div>
                ) : steps.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Pembuktian formal untuk teorema ini sedang disusun.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {steps.map((s) => (
                      <div
                        key={s.step}
                        className="flex items-start gap-3.5 p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800"
                      >
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </span>
                        <div className="space-y-1 flex-1 min-w-0">
                          {s.tag && (
                            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              {s.tag}
                            </p>
                          )}
                          <div className="text-sm text-slate-800 dark:text-slate-200">
                            <MathText text={s.content} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900 text-[11px] font-bold tracking-wider">
                        Q.E.D.
                      </span>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* KOLOM KANAN: INTUISI, LATIHAN TERKAIT & NAVIGASI */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* KARTU INTUISI & KAPAN DIPAKAI */}
              <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <LightbulbIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Intuisi &amp; Kapan Dipakai
                  </h2>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <MathText text={theorem.intuition} />
                </div>
              </section>

              {/* BANNER LATIHAN SOAL TERKAIT */}
              <Link
                href="/arsip"
                className="group block p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/15 text-white shrink-0 mt-0.5">
                      <ArchiveIcon />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 block">
                        Latihan Terkait
                      </span>
                      <p className="text-sm font-bold tracking-tight leading-snug">
                        Soal materi {theorem.topic}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-indigo-100 transition-transform group-hover:translate-x-1 shrink-0" />
                </div>
              </Link>

              {/* NAVIGASI SEBELUMNYA / BERIKUTNYA */}
              {(prevTheorem || nextTheorem) && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                    Navigasi Teorema
                  </span>
                  <div className="space-y-1.5">
                    {prevTheorem && (
                      <Link
                        href={`/teorema/${prevTheorem.slug}`}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      >
                        <ArrowLeftIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{prevTheorem.title}</span>
                      </Link>
                    )}
                    {nextTheorem && (
                      <Link
                        href={`/teorema/${nextTheorem.slug}`}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      >
                        <span className="truncate">{nextTheorem.title}</span>
                        <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}