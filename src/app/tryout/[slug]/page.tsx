'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';

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

function GridIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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

function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UserIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LockClosedIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CrownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 18h18M5 15l-2-9 5.5 4L12 4l3.5 6L21 6l-2 9H5z" />
    </svg>
  );
}

function ChartBarIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function InformationCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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

function ExclamationTriangleIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

interface ProblemConfigItem {
  problem_id: string;
  section?: string;
  scoring_type: 'standard' | 'weighted_tkp';
  correct_answer?: string;
  weight_correct: number;
  weight_wrong: number;
  weight_unanswered?: number;
  option_weights?: { [key: string]: number };
}

interface TryoutItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  status?: 'draft' | 'published';
  is_premium?: boolean;
  problem_configs: ProblemConfigItem[];
  created_at: string;
}

export default function TryoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params?.slug as string;
  const supabase = useMemo(() => createClient(), []);

  const [tryout, setTryout] = useState<TryoutItem | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState<boolean>(false);
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
    let isMounted = true;

    async function resolveUserAccess(sessionUser: any) {
      if (!isMounted) return;
      setUser(sessionUser || null);

      if (sessionUser?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (isMounted) {
          setHasPremiumAccess(checkPremiumAccess(profile));
        }
      } else if (isMounted) {
        setHasPremiumAccess(false);
      }
    }

    async function initPage() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      await resolveUserAccess(session?.user || null);

      if (!slugOrId) {
        if (isMounted) setLoading(false);
        return;
      }

      // Query Try Out (By Slug dulu, lalu Fallback ID)
      let { data } = await supabase
        .from('tryouts')
        .select('*')
        .eq('slug', slugOrId)
        .maybeSingle();

      if (!data) {
        const { data: dataById } = await supabase
          .from('tryouts')
          .select('*')
          .eq('id', slugOrId)
          .maybeSingle();
        data = dataById;
      }

      if (isMounted && data) {
        setTryout(data as TryoutItem);
      }

      if (isMounted) setLoading(false);
    }

    initPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveUserAccess(session?.user || null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [slugOrId, supabase]);

  // Safe Parsing untuk problem_configs
  const getParsedConfigs = (): ProblemConfigItem[] => {
    if (!tryout || !tryout.problem_configs) return [];
    if (typeof tryout.problem_configs === 'string') {
      try {
        return JSON.parse(tryout.problem_configs);
      } catch {
        return [];
      }
    }
    return Array.isArray(tryout.problem_configs) ? tryout.problem_configs : [];
  };

  const configs = getParsedConfigs();
  const totalProblems = configs.length;
  const isLockedForUser = Boolean(tryout?.is_premium && !hasPremiumAccess);
  const targetSlug = tryout?.slug || tryout?.id || slugOrId;
  const upgradeHref = `/upgrade?redirect=${encodeURIComponent(`/tryout/${targetSlug}`)}`;

  // Ringkasan Seksi Sub-tes (TWK, TIU, TKP, dsb)
  const sectionSummary = configs.reduce((acc, c) => {
    const sec = (c.section || 'Umum').toUpperCase();
    acc[sec] = (acc[sec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Handler Tombol Mulai Ujian
  const handleStartExam = () => {
    if (!user) {
      alert(
        'Anda belum masuk (login). Silakan masuk ke akun TheoQED Anda terlebih dahulu melalui halaman Katalog Try Out atau Beranda.'
      );
      return;
    }

    if (isLockedForUser) {
      router.push(upgradeHref);
      return;
    }

    if (totalProblems === 0) {
      alert('Paket Try Out ini belum memiliki racikan soal. Silakan hubungi admin.');
      return;
    }

    router.push(`/tryout/${targetSlug}/exam`);
  };

  // Extract Informasi Nama Peserta
  const getUserDisplayName = () => {
    if (!user) return null;
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Peserta Try Out'
    );
  };

  // Subpage Sticky Navbar (konsisten dengan halaman Profile, History, dan Result)
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
              Pratinjau Try Out
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <Link
              href="/tryout/history"
              className="h-9 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Riwayat</span>
            </Link>
          )}

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
        <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Memuat rincian try out...</span>
        </div>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
        {renderSubpageNavbar()}
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900">
            <ExclamationTriangleIcon />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Paket Try Out Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paket ini mungkin telah dihapus atau URL yang kamu tuju salah.
          </p>
          <Link
            href="/tryout"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog Try Out</span>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = getUserDisplayName();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      {renderSubpageNavbar()}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Header Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Simulasi Ujian CBT</span>
              </span>

              {tryout.is_premium ? (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                  <LockClosedIcon className="w-3 h-3 text-amber-500" />
                  <span>Premium</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Gratis
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {tryout.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {tryout.description ||
                'Simulasi ujian interaktif tipe Computer Based Test (CBT) dengan perhitungan skor otomatis.'}
            </p>
          </div>

          {/* METRICS METADATA (Jumlah Soal, Durasi, Profil Peserta) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                <DocumentTextIcon />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jumlah Soal
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {totalProblems} Soal
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold shrink-0">
                <ClockIcon />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Durasi Ujian
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {tryout.duration_minutes || 60} Menit
                </span>
              </div>
            </div>

            {/* STATS PESERTA REAL-TIME */}
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 min-w-0 ${
                user
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60'
              }`}
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                    user
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200'
                  }`}
                >
                  {user ? (
                    displayName ? (
                      displayName.slice(0, 2).toUpperCase()
                    ) : (
                      <UserIcon />
                    )
                  ) : (
                    <LockClosedIcon className="w-4 h-4" />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Peserta
                </span>
                {user ? (
                  <>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{hasPremiumAccess ? 'Akun Premium' : 'Akun Gratis'}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate block">
                      Tamu / Belum Login
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold truncate block">
                      Login Diperlukan
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BREAKDOWN SEKSI (TWK, TIU, TKP, DSB) */}
          {Object.keys(sectionSummary).length > 0 && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ChartBarIcon className="w-4 h-4 text-indigo-500" />
                <span>Rincian Komposisi Seksi Sub-tes:</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(sectionSummary).map(([secName, count]) => (
                  <div
                    key={secName}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-2 text-xs font-bold"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400">{secName}</span>
                    <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-slate-700 dark:text-slate-300">{count} Soal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PETUNJUK KETENTUAN UJIAN */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <InformationCircleIcon className="w-4 h-4 text-indigo-500" />
              <span>Petunjuk &amp; Ketentuan Ujian</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Waktu hitung mundur berjalan otomatis saat tombol mulai diklik.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Jawaban dapat diubah bebas selama alokasi waktu belum habis.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Sistem otomatis menyimpan &amp; menilai lembar jawaban saat waktu berakhir.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Pembahasan rinci &amp; rapor skor tersedia setelah selesai pengerjaan.</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-2">
            {!user ? (
              <button
                type="button"
                onClick={handleStartExam}
                className="w-full py-3.5 sm:py-4 px-4 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <LockClosedIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <span>
                  <span className="inline sm:hidden">Login untuk Mulai Try Out</span>
                  <span className="hidden sm:inline">
                    Silakan Login Terlebih Dahulu untuk Mulai Try Out
                  </span>
                </span>
              </button>
            ) : isLockedForUser ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/70 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                  <LockClosedIcon className="w-4 h-4" />
                  <span>Paket Try Out Khusus Premium</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Akun kamu saat ini berstatus <strong>Gratis</strong>. Upgrade ke akun{' '}
                  <strong>Premium</strong> untuk membuka akses pengerjaan simulasi ujian ini.
                </p>
                <div className="pt-1">
                  <Link
                    href={upgradeHref}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-sm hover:shadow-amber-500/25 transition group"
                  >
                    <CrownIcon className="w-4 h-4 shrink-0" />
                    <span>Upgrade ke Premium</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartExam}
                disabled={totalProblems === 0}
                className="w-full py-3.5 sm:py-4 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>
                  <span className="inline sm:hidden">Mulai Ujian Sekarang</span>
                  <span className="hidden sm:inline">Mulai Pengerjaan Ujian Sekarang</span>
                </span>
                <ArrowRightIcon className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}