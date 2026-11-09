'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function HistoryIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrophyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function ChartBarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function FileTextIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function GridIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ChevronRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface SubmissionItem {
  id: string;
  user_id: string;
  tryout_id: string;
  score_total: number;
  time_spent_seconds: number;
  created_at: string;
  tryout?: {
    title: string;
    slug: string;
    duration_minutes: number;
  };
}

function GlobalHistoryContent() {
  const router = useRouter();
  const supabase = createClient();

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGlobalHistory() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/tryout');
        return;
      }

      // 1. Ambil semua riwayat pengerjaan milik user
      const { data: subData, error: subError } = await supabase
        .from('tryout_submissions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (subError || !subData || subData.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // 2. Ambil Try Out ID yang unik untuk kueri nama Try Out
      const tryoutIds = Array.from(new Set(subData.map((s) => s.tryout_id))).filter(Boolean);

      const { data: tryoutsData } = await supabase
        .from('tryouts')
        .select('id, title, slug, duration_minutes')
        .in('id', tryoutIds);

      const tryoutMap: Record<string, any> = {};
      (tryoutsData || []).forEach((t) => {
        tryoutMap[t.id] = t;
      });

      // 3. Gabungkan data riwayat dengan informasi Try Out
      const enrichedSubmissions: SubmissionItem[] = subData.map((sub) => ({
        ...sub,
        tryout: tryoutMap[sub.tryout_id] || {
          title: 'Try Out (Tidak Ditemukan)',
          slug: sub.tryout_id,
          duration_minutes: 0,
        },
      }));

      setSubmissions(enrichedSubmissions);
      setLoading(false);
    }

    loadGlobalHistory();
  }, []);

  const formatTimeSpent = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center animate-pulse space-y-4 w-full">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/2 mx-auto" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  // Hitung Statistik Keseluruhan (Global)
  const totalAttempts = submissions.length;
  const uniqueTryoutsCount = new Set(submissions.map((s) => s.tryout_id)).size;
  const bestScore = totalAttempts > 0 ? Math.max(...submissions.map((s) => s.score_total || 0)) : 0;
  const avgScore = totalAttempts > 0 ? Math.round(submissions.reduce((acc, s) => acc + (s.score_total || 0), 0) / totalAttempts) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          {/* HEADER KARTU UTAMA */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link
                href="/tryout"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Kembali ke Katalog Try Out</span>
              </Link>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                <Link
                  href="/tryout"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <GridIcon className="w-3.5 h-3.5" />
                  <span>Katalog Try Out</span>
                </Link>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 inline-flex items-center gap-1.5">
                  <HistoryIcon className="w-3.5 h-3.5" />
                  <span>Riwayat Pengerjaan Global</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Semua Riwayat Try Out Kamu
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rekapitulasi seluruh hasil pengerjaan Try Out yang pernah kamu ikuti di platform TheoQED.
              </p>
            </div>

          </div>

          {/* KARTU STATISTIK SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileTextIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Total Percobaan</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{totalAttempts}</span>
                <span className="text-xs font-semibold text-slate-400">Sesi</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GridIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Try Out Diikuti</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{uniqueTryoutsCount}</span>
                <span className="text-xs font-semibold text-slate-400">Paket</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-lg flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <TrophyIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Skor Tertinggi</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{bestScore}</span>
                <span className="text-xs font-semibold opacity-75">Poin</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ChartBarIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Rata-Rata Skor</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{avgScore}</span>
                <span className="text-xs font-semibold text-slate-400">Poin</span>
              </div>
            </div>
          </div>

          {/* DAFTAR RIWAYAT PENGERJAAN GLOBAL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-indigo-500" />
                <span>Daftar Sesi Pengerjaan</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                {submissions.length} Sesi Terdaftar
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-900">
                  <FileTextIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Riwayat Pengerjaan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Kamu belum pernah menyelesaikan Try Out apa pun. Pilih Try Out di katalog dan mulai sekarang!
                </p>
                <div className="pt-2">
                  <Link
                    href="/tryout"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition inline-flex items-center gap-2"
                  >
                    <span>Jelajahi Katalog Try Out</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub, idx) => {
                  const isLatest = idx === 0;
                  const isBest = sub.score_total === bestScore && bestScore > 0;
                  const tryoutSlug = sub.tryout?.slug || sub.tryout_id;
                  const tryoutTitle = sub.tryout?.title || 'Try Out';

                  return (
                    <div
                      key={sub.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 dark:hover:border-indigo-900 transition"
                    >
                      {/* INFORMASI SESI */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {tryoutTitle}
                          </h3>

                          {isLatest && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-lg">
                              Terakhir
                            </span>
                          )}

                          {isBest && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <StarIcon className="w-3 h-3 text-amber-500" />
                              <span>Skor Tertinggi</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(sub.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                            {formatTimeSpent(sub.time_spent_seconds || 0)}
                          </span>
                        </div>
                      </div>

                      {/* SKOR & AKSI */}
                      <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left md:text-right pr-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perolehan Skor</div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {sub.score_total} <span className="text-xs font-semibold text-slate-400">Poin</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tryout/${tryoutSlug}/result?submission_id=${sub.id}`}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900"
                          >
                            <FileTextIcon className="w-3.5 h-3.5" />
                            <span>Lihat Rapor</span>
                          </Link>

                          <Link
                            href={`/tryout/${tryoutSlug}`}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                          >
                            <RefreshIcon className="w-3.5 h-3.5" />
                            <span>Ulangi</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}

export default function GlobalHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-8 text-center text-xs text-slate-400">Memuat semua riwayat pengerjaan...</div>}>
      <GlobalHistoryContent />
    </Suspense>
  );
}