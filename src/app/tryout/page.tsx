'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// --- SVG CUSTOM ICONS (TANPA EMOJI) ---
function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DocumentTextIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function HistoryIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.05 11a9 9 0 11.5 4m-.5-4H8m-4.95 0L6 7.05" />
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

function InboxIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
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

export default function UserTryoutsPage() {
  const [tryouts, setTryouts] = useState<TryoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPublishedTryouts();
  }, []);

  async function fetchPublishedTryouts() {
    setLoading(true);
    
    // HANYA MENGAMBIL PAKET YANG BERSTATUS 'published'
    const { data, error } = await supabase
      .from('tryouts')
      .select('*')
      .eq('status', 'published')
      .order('title', { ascending: true });

    if (!error && data) {
      setTryouts(data as TryoutItem[]);
    }
    setLoading(false);
  }

  // Helper untuk mendapatkan total jumlah soal
  const getTotalProblems = (configsRaw: any): number => {
    if (typeof configsRaw === 'string') {
      try {
        const parsed = JSON.parse(configsRaw);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        return 0;
      }
    }
    return Array.isArray(configsRaw) ? configsRaw.length : 0;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          {/* HEADER & NAVIGASI RIWAYAT */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 inline-flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Simulasi Ujian CBT</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Katalog Try Out & Simulasi Ujian
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Uji kemampuan secara intensif dengan simulasi sistem CBT yang dirancang presisi, dilengkapi timer otomatis dan analisis hasil pengerjaan.
              </p>
            </div>

            {/* TOMBOL RIWAYAT TRY OUT */}
            <div className="shrink-0">
              <Link
                href="/tryout/history"
                className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 font-bold text-xs rounded-2xl shadow-sm transition flex items-center gap-2 group"
              >
                <HistoryIcon className="w-4 h-4 text-indigo-500 group-hover:rotate-[-30deg] transition-transform" />
                <span>Riwayat Try Out Saya</span>
              </Link>
            </div>
          </div>

          {/* GRID KATALOG TRY OUT */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : tryouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {tryouts.map((item) => {
                const totalProblems = getTotalProblems(item.problem_configs);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between space-y-6 group"
                  >
                    <div className="space-y-4">
                      {/* Badge Durasi & Jumlah Soal */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{item.duration_minutes || 60} Menit</span>
                        </span>

                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                          <span>{totalProblems} Soal</span>
                        </span>
                      </div>

                      {/* Judul & Deskripsi (Bersih Tanpa Rincian Subtes) */}
                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {item.description || 'Simulasi ujian interaktif dengan alokasi waktu otomatis dan penilaian instan.'}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href={`/tryout/${item.slug || item.id}`}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 group-hover:bg-indigo-500"
                      >
                        <span>Lihat Rincian & Mulai</span>
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900">
                <InboxIcon />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Belum Ada Paket Try Out Tersedia
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Saat ini belum ada simulasi ujian yang dipublikasikan. Silakan cek kembali dalam beberapa waktu.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}