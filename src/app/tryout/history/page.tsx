'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function SunIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function HistoryIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrophyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartBarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function RefreshIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

function StarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function GridIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
  const supabase = useMemo(() => createClient(), []);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [selectedTryoutFilter, setSelectedTryoutFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Theme State (konsisten dengan subpage lain)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    const hasDarkClass = root.classList.contains('dark');

    if (savedTheme === 'dark' || (!savedTheme && hasDarkClass)) {
      root.classList.add('dark');
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      setIsDarkMode(hasDarkClass);
    }
  }, []);

  const handleToggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !isDarkMode;
    const nextTheme = nextIsDark ? 'dark' : 'light';

    if (nextIsDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('theme', nextTheme);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'theme', newValue: nextTheme })
      );
    } catch {
      // Abaikan jika localStorage diblokir browser
    }

    setIsDarkMode(nextIsDark);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/tryout');
    }
  };

  useEffect(() => {
    async function loadGlobalHistory() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
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
  }, [router, supabase]);

  const formatTimeSpent = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s}s`;
  };

  // Subpage Sticky Navbar (sejajar max-w-7xl dengan konten utama)
  const renderSubpageNavbar = () => (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
              Riwayat Try Out
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/tryout"
            className="h-9 px-3 sm:px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <GridIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog Try Out</span>
            <span className="sm:hidden">Katalog</span>
          </Link>

          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            {themeMounted ? (
              isDarkMode ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-slate-600" />
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
        {renderSubpageNavbar()}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Memuat riwayat pengerjaan...</span>
        </div>
      </div>
    );
  }

  // Hitung Statistik Keseluruhan (Global) & Skor Tertinggi per Paket Try Out
  const totalAttempts = submissions.length;
  const uniqueTryoutsMap = new Map<string, string>();
  const bestScoreByTryout: Record<string, number> = {};

  submissions.forEach((s) => {
    if (!uniqueTryoutsMap.has(s.tryout_id)) {
      uniqueTryoutsMap.set(s.tryout_id, s.tryout?.title || 'Try Out');
    }
    const currentBest = bestScoreByTryout[s.tryout_id] ?? -Infinity;
    if ((s.score_total || 0) > currentBest) {
      bestScoreByTryout[s.tryout_id] = s.score_total || 0;
    }
  });

  const uniqueTryoutsList = Array.from(uniqueTryoutsMap.entries()).map(([id, title]) => ({
    id,
    title,
  }));
  const uniqueTryoutsCount = uniqueTryoutsList.length;
  const bestScore = totalAttempts > 0 ? Math.max(...submissions.map((s) => s.score_total || 0)) : 0;
  const avgScore =
    totalAttempts > 0
      ? Math.round(submissions.reduce((acc, s) => acc + (s.score_total || 0), 0) / totalAttempts)
      : 0;

  const filteredSubmissions =
    selectedTryoutFilter === 'ALL'
      ? submissions
      : submissions.filter((s) => s.tryout_id === selectedTryoutFilter);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {renderSubpageNavbar()}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* HEADER KARTU UTAMA */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 inline-flex items-center gap-1.5">
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>Rekapitulasi Pengerjaan</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            Semua Riwayat Try Out Kamu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Pantau perkembangan skor, durasi pengerjaan, dan buka kembali rapor pembahasan dari setiap sesi yang pernah kamu selesaikan.
          </p>
        </div>

        {/* KARTU STATISTIK SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileTextIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Total Percobaan</span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {totalAttempts}
              </span>
              <span className="text-xs font-semibold text-slate-400">Sesi</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GridIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Try Out Diikuti</span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {uniqueTryoutsCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">Paket</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 rounded-2xl flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-85 flex items-center gap-1.5">
              <TrophyIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>Skor Tertinggi</span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">{bestScore}</span>
              <span className="text-xs font-semibold opacity-80">Poin</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ChartBarIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>Rata-Rata Skor</span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{avgScore}</span>
              <span className="text-xs font-semibold text-slate-400">Poin</span>
            </div>
          </div>
        </div>

        {/* DAFTAR RIWAYAT PENGERJAAN GLOBAL */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-indigo-500" />
              <span>Daftar Sesi Pengerjaan</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {filteredSubmissions.length} Sesi Terdaftar
            </span>
          </div>

          {/* FILTER PER PAKET TRY OUT (MUNCUL JIKA MENGIKUTI > 1 PAKET) */}
          {uniqueTryoutsList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => setSelectedTryoutFilter('ALL')}
                className={`h-8 px-3 rounded-xl border transition whitespace-nowrap cursor-pointer ${
                  selectedTryoutFilter === 'ALL'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                Semua Paket ({submissions.length})
              </button>
              {uniqueTryoutsList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedTryoutFilter(item.id)}
                  className={`h-8 px-3 rounded-xl border transition whitespace-nowrap max-w-[240px] truncate cursor-pointer ${
                    selectedTryoutFilter === item.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {filteredSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200/80 dark:border-indigo-900">
                <FileTextIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Belum Ada Riwayat Pengerjaan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Kamu belum pernah menyelesaikan Try Out apa pun. Pilih paket Try Out di katalog dan mulai latihan sekarang!
              </p>
              <div className="pt-2">
                <Link
                  href="/tryout"
                  className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2"
                >
                  <span>Jelajahi Katalog Try Out</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const isLatest = submissions[0]?.id === sub.id;
                const packageBest = bestScoreByTryout[sub.tryout_id] ?? 0;
                const isBest = sub.score_total === packageBest && packageBest > 0;
                const tryoutSlug = sub.tryout?.slug || sub.tryout_id;
                const tryoutTitle = sub.tryout?.title || 'Try Out';

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                  >
                    {/* INFORMASI SESI */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {tryoutTitle}
                        </h3>

                        {isLatest && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            Terakhir
                          </span>
                        )}

                        {isBest && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <StarIcon className="w-3 h-3 text-amber-500" />
                            <span>Skor Terbaik</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(sub.created_at).toLocaleString('id-ID', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                          {formatTimeSpent(sub.time_spent_seconds || 0)}
                        </span>
                      </div>
                    </div>

                    {/* SKOR & AKSI */}
                    <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left md:text-right pr-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Perolehan Skor
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {sub.score_total}{' '}
                          <span className="text-xs font-semibold text-slate-400">Poin</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tryout/${tryoutSlug}/result?submission_id=${sub.id}`}
                          className="h-9 px-3.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-slate-200/70 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                        >
                          <FileTextIcon className="w-3.5 h-3.5" />
                          <span>Lihat Rapor</span>
                        </Link>

                        <Link
                          href={`/tryout/${tryoutSlug}`}
                          className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
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
  );
}

export default function GlobalHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-xs font-semibold text-slate-400">
          Memuat semua riwayat pengerjaan...
        </div>
      }
    >
      <GlobalHistoryContent />
    </Suspense>
  );
}