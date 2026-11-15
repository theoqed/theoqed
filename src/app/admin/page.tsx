'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AdminNavbar } from '@/components/AdminNavbar';
import { isPremiumActive } from '@/lib/premium';

// --- SVG ICON HELPERS ---
function FolderIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function BookOpenIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function LibraryIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
}

function AcademicCapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function ClipboardCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CheckBadgeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CrownIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function DocumentTextIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function ExternalLinkIcon({ className = 'w-3.5 h-3.5 text-slate-400' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

interface StatsData {
  problemsCount: number;
  coursesCount: number;
  notesCount: number;
  theoremsCount: number;
  tryoutsCount: number;
  submissionsCount: number;
  premiumCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    problemsCount: 0,
    coursesCount: 0,
    notesCount: 0,
    theoremsCount: 0,
    tryoutsCount: 0,
    submissionsCount: 0,
    premiumCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const [problemsRes, coursesRes, notesRes, theoremsRes, tryoutRes, subRes, profilesRes] =
      await Promise.all([
        supabase.from('problems').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('theorems').select('id', { count: 'exact', head: true }),
        supabase.from('tryouts').select('id', { count: 'exact', head: true }),
        supabase.from('solution_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('is_premium, premium_until').eq('is_premium', true),
      ]);

    const activePremium = (profilesRes.data || []).filter((p) => isPremiumActive(p)).length;

    setStats({
      problemsCount: problemsRes.count || 0,
      coursesCount: coursesRes.count || 0,
      notesCount: notesRes.count || 0,
      theoremsCount: theoremsRes.count || 0,
      tryoutsCount: tryoutRes.count || 0,
      submissionsCount: subRes.count || 0,
      premiumCount: activePremium,
    });

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 pb-16">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Compact Header */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900">
              <span>TheoQED Control Center</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Dashboard Manajemen Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Kelola bank soal, kurikulum courses, catatan TheoNotes, perpustakaan teorema, paket simulasi Try Out, moderasi solusi, serta alat produksi worksheet dan kartu soal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/problems"
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-2"
            >
              <FolderIcon className="w-4 h-4" />
              <span>Bank Soal</span>
            </Link>
            <Link
              href="/admin/worksheet"
              className="h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition inline-flex items-center gap-2"
            >
              <DocumentTextIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Worksheet</span>
            </Link>
            <Link
              href="/admin/card-generator"
              className="h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition inline-flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Card Generator</span>
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Database Soal
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stats.problemsCount}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Soal
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Courses
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stats.coursesCount}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Kelas
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              TheoNotes
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stats.notesCount}
              </span>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                Modul
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Teorema
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stats.theoremsCount}
              </span>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Entri
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Paket Try Out
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stats.tryoutsCount}
              </span>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                Paket
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Pengajuan Solusi
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stats.submissionsCount}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Submisi
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-1.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Member Premium
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {loading ? '—' : stats.premiumCount}
              </span>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Aktif
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 1: MANAJEMEN KONTEN & AKADEMIK */}
        <section className="space-y-3.5">
          <h2 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Manajemen Konten &amp; Akademik
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Bank Soal */}
            <Link
              href="/admin/problems"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 w-fit">
                  <FolderIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Bank Soal &amp; Folder
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Kelola repositori soal olimpiade, struktur folder, tag topik, serta multi-metode pembahasan.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>Buka Bank Soal</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Courses */}
            <Link
              href="/admin/courses"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 w-fit">
                  <AcademicCapIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Courses &amp; Silabus
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Susun kurikulum kelas terstruktur, bab materi bacaan LaTeX, video, dan kuis latihan.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Kelola Courses</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* TheoNotes */}
            <Link
              href="/admin/notes"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 w-fit">
                  <BookOpenIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    TheoNotes CMS
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tulis catatan kuliah ringkas, susun hierarki bab &amp; subbab, serta pratinjau KaTeX.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>Kelola TheoNotes</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Teorema */}
            <Link
              href="/admin/teorema"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 w-fit">
                  <LibraryIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                    Perpustakaan Teorema
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Kelola indeks teorema klasik, intuisi penggunaan, serta langkah-langkah pembuktian formal.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                <span>Kelola Teorema</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Try Out */}
            <Link
              href="/admin/tryout"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 w-fit">
                  <ClipboardCheckIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                    Katalog Try Out CBT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Atur paket simulasi ujian berbatas waktu, durasi pengerjaan, dan bundel soal evaluasi.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <span>Kelola Try Out</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </section>

        {/* SECTION 2: KEANGGOTAAN, EVALUASI & STUDIO */}
        <section className="space-y-3.5">
          <h2 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Keanggotaan, Evaluasi &amp; Studio Produksi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Members */}
            <Link
              href="/admin/members"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 w-fit">
                  <CrownIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    Member &amp; Premium
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Aktivasi langganan pengguna, perpanjang durasi paket, dan pantau status akses premium.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>Kelola Member</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Moderasi & Hasil */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 w-fit">
                  <CheckBadgeIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Moderasi &amp; Submissions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tinjau kontribusi solusi pengguna serta rekap hasil skor peserta Try Out CBT.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold">
                <Link
                  href="/admin/submissions"
                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white text-center transition"
                >
                  Solusi
                </Link>
                <Link
                  href="/admin/tryout/submissions"
                  className="flex-1 py-2 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-white text-center transition"
                >
                  Hasil CBT
                </Link>
              </div>
            </div>

            {/* Worksheet Generator */}
            <Link
              href="/admin/worksheet"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 w-fit">
                  <DocumentTextIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Worksheet Generator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Susun lembar kerja latihan dari bank soal atau input kustom siap cetak/ekspor.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Buka Worksheet</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card Generator */}
            <Link
              href="/admin/card-generator"
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 w-fit">
                  <SparklesIcon />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Card Generator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Render soal matematika LaTeX menjadi gambar kartu grafis siap unggah media sosial.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Buka Card Generator</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </section>

        {/* QUICK SHORTCUTS TO PUBLIC SITE */}
        <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Pratinjau Halaman Publik
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-bold">
            <Link
              href="/arsip"
              target="_blank"
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 transition text-slate-700 dark:text-slate-200"
            >
              <span className="inline-flex items-center gap-2">
                <FolderIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Arsip &amp; Bank Soal</span>
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/courses"
              target="_blank"
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 transition text-slate-700 dark:text-slate-200"
            >
              <span className="inline-flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Courses Publik</span>
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/notes"
              target="_blank"
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 transition text-slate-700 dark:text-slate-200"
            >
              <span className="inline-flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>TheoNotes Reader</span>
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/teorema"
              target="_blank"
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 transition text-slate-700 dark:text-slate-200"
            >
              <span className="inline-flex items-center gap-2">
                <LibraryIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Perpustakaan Teorema</span>
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/tryout"
              target="_blank"
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 transition text-slate-700 dark:text-slate-200"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardCheckIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>Portal Try Out CBT</span>
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}