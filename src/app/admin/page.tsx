'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Footer } from '@/components/Footer';

// --- SVG ICON HELPERS ---
function FolderIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function BookOpenIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function AcademicCapIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function CheckBadgeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

interface StatsData {
  tryoutsCount: number;
  problemsCount: number;
  notesCount: number;
  submissionsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    tryoutsCount: 0,
    problemsCount: 0,
    notesCount: 0,
    submissionsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const [tryoutRes, problemsRes, notesRes, subRes] = await Promise.all([
      supabase.from('tryouts').select('id', { count: 'exact', head: true }),
      supabase.from('problems').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('solution_submissions').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      tryoutsCount: tryoutRes.count || 0,
      problemsCount: problemsRes.count || 0,
      notesCount: notesRes.count || 0,
      submissionsCount: subRes.count || 0,
    });

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        
        {/* Dedicated Admin Navbar */}
        <AdminNavbar />

        {/* Main Dashboard Layout */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 my-8 space-y-8">

          {/* Hero Banner Greeting */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white p-6 sm:p-9 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-indigo-100 border border-white/20">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>TheoQED Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Selamat Datang di Portal Admin
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium">
                Pusat manajemen terpadu untuk menyusun simulasi Try Out, mengelola arsip Bank Soal olimpiade, menerbitkan materi TheoNotes, dan memoderasi solusi dari komunitas.
              </p>
            </div>
            
            <div className="absolute right-[-10px] bottom-[-30px] opacity-10 text-white pointer-events-none select-none font-serif text-9xl font-black">
              √QED
            </div>
          </div>

          {/* STATS OVERVIEW CARDS */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Paket Try Out
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? '...' : stats.tryoutsCount}
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  Paket
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Database Soal
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? '...' : stats.problemsCount}
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
                  Soal
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Modul TheoNotes
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? '...' : stats.notesCount}
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-100 dark:border-purple-900">
                  Modul
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Pengajuan Solusi
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? '...' : stats.submissionsCount}
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900">
                  Submisi
                </span>
              </div>
            </div>
          </section>

          {/* BENTO GRID: 4 CORE ADMIN MODULES */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Modul Utama Manajemen Platform
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Katalog Try Out CMS */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 hover:border-indigo-500 dark:hover:border-indigo-500 transition group">
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 w-fit">
                    <AcademicCapIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      Katalog Try Out CMS
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Kelola paket simulasi ujian matematika, alokasi waktu, pembuatan bundel soal, serta pemantauan hasil skor peserta secara *real-time*.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/tryout"
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
                >
                  <span>Kelola Paket Try Out</span>
                  <ArrowRightIcon />
                </Link>
              </div>

              {/* Card 2: Bank Soal CMS */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 hover:border-blue-500 dark:hover:border-blue-500 transition group">
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 w-fit">
                    <FolderIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      Bank Soal & Folder CMS
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Kelola repositori soal olimpiade (ONMIPA/KNMIPA), hirarki folder berstruktur Google Drive style, serta penyusunan multi-metode pembahasan.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/problems"
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
                >
                  <span>Kelola Bank Soal & Folder</span>
                  <ArrowRightIcon />
                </Link>
              </div>

              {/* Card 3: TheoNotes CMS */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 hover:border-purple-500 dark:hover:border-purple-500 transition group">
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 w-fit">
                    <BookOpenIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      TheoNotes CMS
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Penyusunan modul ringkasan materi perkuliahan terstruktur, penataan bab & subbab hierarkis, serta dual-panel editor KaTeX *live preview*.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/notes"
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-purple-600 dark:bg-slate-800 dark:hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
                >
                  <span>Kelola Modul TheoNotes</span>
                  <ArrowRightIcon />
                </Link>
              </div>

              {/* Card 4: Moderasi Solusi Komunitas */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 hover:border-amber-500 dark:hover:border-amber-500 transition group">
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 w-fit">
                    <CheckBadgeIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      Moderasi Solusi Komunitas
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Tinjau kiriman solusi dari mahasiswa/pengguna, validasi kebenaran notasi KaTeX, serta setujui untuk dipublikasikan ke Bank Soal utama.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/submissions"
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-between shadow-sm"
                >
                  <span>Buka Panel Moderasi</span>
                  <ArrowRightIcon />
                </Link>
              </div>

            </div>
          </section>

          {/* QUICK SHORTCUTS TO PUBLIC SITE */}
          <section className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pintas Tampilan Publik (Siswa & Pengunjung)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              <Link
                href="/tryout"
                target="_blank"
                className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between transition text-slate-800 dark:text-slate-200"
              >
                <span>📝 Portal Try Out Publik</span>
                <span className="text-slate-400">↗</span>
              </Link>
              <Link
                href="/arsip"
                target="_blank"
                className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between transition text-slate-800 dark:text-slate-200"
              >
                <span>🌐 Bank Soal & Arsip Publik</span>
                <span className="text-slate-400">↗</span>
              </Link>
              <Link
                href="/notes"
                target="_blank"
                className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between transition text-slate-800 dark:text-slate-200"
              >
                <span>📖 TheoNotes Reader Publik</span>
                <span className="text-slate-400">↗</span>
              </Link>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}