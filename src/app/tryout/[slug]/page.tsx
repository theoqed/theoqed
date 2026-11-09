'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// --- SVG CUSTOM ICONS (TANPA EMOJI) ---
function DocumentTextIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UserIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LockClosedIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ChartBarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function InformationCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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

function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ExclamationTriangleIcon({ className = "w-8 h-8" }: { className?: string }) {
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
  problem_configs: ProblemConfigItem[];
  created_at: string;
}

export default function TryoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params?.slug as string;
  const supabase = createClient();

  const [tryout, setTryout] = useState<TryoutItem | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initPage() {
      setLoading(true);

      // 1. Sinkronisasi Auth User Real-time
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      if (!slugOrId) {
        setLoading(false);
        return () => subscription.unsubscribe();
      }

      // 2. Query Try Out (By Slug dulu, lalu Fallback ID)
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

      if (data) {
        setTryout(data as TryoutItem);
      }
      
      setLoading(false);
      return () => subscription.unsubscribe();
    }

    initPage();
  }, [slugOrId]);

  // Safe Parsing untuk problem_configs
  const getParsedConfigs = (): ProblemConfigItem[] => {
    if (!tryout || !tryout.problem_configs) return [];
    if (typeof tryout.problem_configs === 'string') {
      try {
        return JSON.parse(tryout.problem_configs);
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(tryout.problem_configs) ? tryout.problem_configs : [];
  };

  const configs = getParsedConfigs();
  const totalProblems = configs.length;

  // Ringkasan Seksi Sub-tes (TWK, TIU, TKP, dsb)
  const sectionSummary = configs.reduce((acc, c) => {
    const sec = (c.section || 'Umum').toUpperCase();
    acc[sec] = (acc[sec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Handler Tombol Mulai Ujian
  const handleStartExam = () => {
    if (!user) {
      alert('Anda belum masuk (login). Silakan masuk ke akun TheoQED Anda melalui tombol Masuk di pojok kanan atas.');
      return;
    }

    if (totalProblems === 0) {
      alert('Paket Try Out ini belum memiliki racikan soal. Silakan hubungi admin.');
      return;
    }

    const targetSlug = tryout?.slug || tryout?.id || slugOrId;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 mx-auto" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 mx-auto" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl mt-8" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900">
            <ExclamationTriangleIcon />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Paket Try Out Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Paket ini mungkin telah dihapus atau URL yang kamu tuju salah.</p>
          <Link href="/tryout" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition">
            <ArrowLeftIcon />
            <span>Kembali ke Katalog Try Out</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = getUserDisplayName();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 my-10 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Header Title */}
            <div className="space-y-3">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Paket Simulasi Try Out CBT</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {tryout.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {tryout.description || 'Simulasi ujian interaktif tipe Computer Based Test (CBT) dengan perhitungan skor otomatis.'}
              </p>
            </div>

            {/* METRICS METADATA (Jumlah Soal, Durasi, Profil Peserta) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                  <DocumentTextIcon />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Soal</span>
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Durasi Ujian</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {tryout.duration_minutes || 60} Menit
                  </span>
                </div>
              </div>

              {/* STATS PESERTA REAL-TIME */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3 min-w-0 ${
                user
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60'
              }`}>
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User Avatar" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800" />
                ) : (
                  <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                    user
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200'
                  }`}>
                    {user ? (
                      displayName ? displayName.slice(0, 2).toUpperCase() : <UserIcon />
                    ) : (
                      <LockClosedIcon className="w-4 h-4" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peserta</span>
                  {user ? (
                    <>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate block flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Terautentikasi</span>
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
                    <div key={secName} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-2 text-xs font-bold">
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
                <span>Petunjuk & Ketentuan Ujian</span>
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
                  <span>Sistem otomatis menyimpan & menilai lembar jawaban saat waktu berakhir.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Pembahasan rinci & Rapor skor tersedia setelah selesai pengerjaan.</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
<div className="pt-2">
  {user ? (
    <button
      onClick={handleStartExam}
      disabled={totalProblems === 0}
      className="w-full py-3.5 sm:py-4 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
    >
      <span>
        <span className="inline sm:hidden">Mulai Ujian Sekarang</span>
        <span className="hidden sm:inline">Mulai Pengerjaan Ujian Sekarang</span>
      </span>
      <ArrowRightIcon className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
    </button>
  ) : (
    <button
      onClick={handleStartExam}
      className="w-full py-3.5 sm:py-4 px-4 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
    >
      <LockClosedIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
      <span>
        <span className="inline sm:hidden">Login untuk Mulai Try Out</span>
        <span className="hidden sm:inline">Silakan Login Terlebih Dahulu untuk Mulai Try Out</span>
      </span>
    </button>
  )}
</div>

          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}