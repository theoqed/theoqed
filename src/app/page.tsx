'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { Problem } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// --- SVG CUSTOM ICONS ---
function FolderIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function BookOpenIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function BookmarkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function AcademicCapIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v6.5" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CodeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function MoonIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

// --- SVG CUSTOM ICONS UNTUK HERO SECTION ---
function GraduationCapIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
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
                className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0"
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

export default function HomePage() {
  const [stats, setStats] = useState({ problems: 0, notes: 0, tryouts: 0 });
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // 1. Load Realtime Stats (Problems, Notes, Tryouts)
      const [pRes, nRes, tRes] = await Promise.all([
        supabase.from('problems').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('tryouts').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        problems: pRes.count || 0,
        notes: nRes.count || 0,
        tryouts: tRes.count || 0,
      });

      // 2. Load Recent 4 Problems
      setLoadingProblems(true);
      const { data: problemsData } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (problemsData) {
        setRecentProblems(problemsData as Problem[]);
      }
      setLoadingProblems(false);
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      
      <div className="flex-1 pb-20">
        <Navbar />

        {/* HERO SECTION */}
        <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800 shadow-sm">
                <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Developed by @davemarcellino_</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                TheoQED<span className="text-indigo-600 dark:text-indigo-400">.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                Platform bank soal olimpiade matematika (ONMIPA/OSN), modul catatan kuliah interaktif (TheoNotes), serta simulasi Ujian Try Out CBT dengan sistem pembahasan lengkap.
              </p>

              {/* CTA BUTTONS GROUP */}
<div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-3 w-full pt-2">
  
  {/* TOMBOL UTAMA (ROW 1 DI MOBILE / TOMBOL PERTAMA DI PC) */}
  <Link
    href="/tryout"
    className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
  >
    <GraduationCapIcon className="w-4 h-4" />
    <span>Simulasi Try Out CBT</span>
    <ArrowRightIcon className="w-4 h-4" />
  </Link>

  {/* TOMBOL SEKUNDER (GRID 2 KOLOM DI MOBILE / FLEX BERJAJAR DI PC) */}
  <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 w-full sm:w-auto">
    <Link
      href="/arsip"
      className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
    >
      <FolderIcon className="w-4 h-4 text-indigo-500" />
      <span>Bank Soal</span>
    </Link>

    <Link
      href="/notes"
      className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
    >
      <BookOpenIcon className="w-4 h-4 text-indigo-500" />
      <span>TheoNotes</span>
    </Link>
  </div>

</div>

              {/* Quick Live Stats */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/80">
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">{stats.tryouts || '5+'}</strong>
                  <span>Paket Try Out</span>
                </div>
                <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">{stats.problems || '50+'}</strong>
                  <span>Soal & Pembahasan</span>
                </div>
                <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">{stats.notes || '5+'}</strong>
                  <span>Modul TheoNotes</span>
                </div>
              </div>

            </div>

            {/* Hero Right Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl relative space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    Pratinjau Ujian CBT
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Identitas Euler & Integral:
                  </span>
                  <MathText text="Hitunglah nilai integral berikut: $$\int_{0}^{\infty} \frac{x^3}{e^x - 1} dx = \frac{\pi^4}{15}$$" />
                </div>

                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between font-semibold">
                  <span>Metode: Fungsi Gamma & Zeta</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">100% Q.E.D.</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SECTION EKOSISTEM FITUR UTAMA (4 BENTO GRID) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
              Ekosistem Pembelajaran
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Akses Materi, Bank Soal, & Simulasi Ujian
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Simulasi Try Out (Fitur Baru) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 w-fit">
                  <AcademicCapIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Simulasi Try Out CBT
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Uji kemampuan dengan sistem timer real-time, seksi sub-tes TKP/SKD, dan analisis Rapor Skor perolehan instan.
                  </p>
                </div>
              </div>

              <Link
                href="/tryout"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
              >
                <span>Mulai Try Out</span>
                <ArrowRightIcon />
              </Link>
            </div>

            {/* Card 2: Bank Soal */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 w-fit">
                  <FolderIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Arsip Bank Soal
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Penjelajah hierarki folder komprehensif untuk soal ONMIPA, OSN, dan perkuliahan dengan pencarian live.
                  </p>
                </div>
              </div>

              <Link
                href="/arsip"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
              >
                <span>Buka Bank Soal</span>
                <ArrowRightIcon />
              </Link>
            </div>

            {/* Card 3: TheoNotes */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-purple-500 dark:hover:border-purple-500 transition duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 w-fit">
                  <BookOpenIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    TheoNotes Library
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Modul perkuliahan matematika terstruktur dengan gaya visual Astro-Notes dan Table of Contents dinamis.
                  </p>
                </div>
              </div>

              <Link
                href="/notes"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-purple-600 dark:bg-slate-800 dark:hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
              >
                <span>Buka TheoNotes</span>
                <ArrowRightIcon />
              </Link>
            </div>

            {/* Card 4: Bookmark */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-amber-500 dark:hover:border-amber-500 transition duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 w-fit">
                  <BookmarkIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    Soal Tersimpan
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tandai soal-soal latihan penting kamu dengan sekali klik. Tersimpan otomatis di akun milikmu.
                  </p>
                </div>
              </div>

              <Link
                href="/bookmarks"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
              >
                <span>Lihat Favorit</span>
                <ArrowRightIcon />
              </Link>
            </div>

          </div>
        </section>

        {/* SECTION RECENT PROBLEMS (SOAL TERBARU) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Soal Terbaru
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Daftar soal dan pembahasan yang baru saja diunggah ke basis data TheoQED.
              </p>
            </div>

            <Link
              href="/arsip"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              <span>Semua</span>
              <ArrowRightIcon />
            </Link>
          </div>

          {loadingProblems ? (
            <div className="space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : recentProblems.length > 0 ? (
            <div className="space-y-3.5">
              {recentProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-md transition duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                        {prob.competition} {prob.year}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {prob.topic}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {prob.id}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-normal line-clamp-2 leading-relaxed">
                      <MathText text={prob.statement} />
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-5">
                    <Link
                      href={`/problems/${prob.prob_slug || prob.id}`}
                      className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white dark:hover:text-white font-bold text-xs rounded-2xl transition inline-flex items-center gap-2 border border-indigo-100 dark:border-indigo-900/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 shadow-sm"
                    >
                      <span>Buka Solusi</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
              Belum ada soal terbaru di basis data.
            </div>
          )}
        </section>

        {/* SECTION KEUNGGULAN PEMBELAJARAN THEOQED */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
              Pengalaman Belajar Presisi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Dirancang Khusus untuk Matematika Tingkat Tinggi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 w-fit">
                <CodeIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Render KaTeX Presisi Tinggi
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Setiap simbol, matriks, dan pembuktian integral ditampilkan jernih dengan performa render kilat berbasis JavaScript & SVG.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 w-fit">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pembuktian 100% Q.E.D.
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Langkah penyelesaian disusun sistematis dari asumsi awal hingga kesimpulan akhir untuk melatih logika berpikir rigorus.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 w-fit">
                <MoonIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bebas Iklan & Dark Mode
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tampilan bersih tanpa distraksi dengan dukungan Mode Gelap (Dark Mode) yang nyaman untuk sesi belajar malam hari.
              </p>
            </div>

          </div>
        </section>

      </div>

      <Footer />

    </div>
  );
}