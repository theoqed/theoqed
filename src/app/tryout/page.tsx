'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';

// --- SVG CUSTOM ICONS ---
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DocumentTextIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LayersIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function AcademicCapIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function LockClosedIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function HistoryIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.05 11a9 9 0 11.5 4m-.5-4H8m-4.95 0L6 7.05" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function InboxIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
  is_premium?: boolean;
  problem_configs: ProblemConfigItem[];
  created_at: string;
}

function parseProblemConfigs(configsRaw: unknown): ProblemConfigItem[] {
  if (typeof configsRaw === 'string') {
    try {
      const parsed = JSON.parse(configsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(configsRaw) ? configsRaw : [];
}

function calculateMaxScore(configs: ProblemConfigItem[]): number {
  let total = 0;
  for (const cfg of configs) {
    if (cfg.scoring_type === 'weighted_tkp' && cfg.option_weights) {
      const weights = Object.values(cfg.option_weights)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      total += weights.length > 0 ? Math.max(...weights) : 5;
    } else {
      total += typeof cfg.weight_correct === 'number' ? cfg.weight_correct : 1;
    }
  }
  return Number.isInteger(total) ? total : Number(total.toFixed(2));
}

export default function UserTryoutsPage() {
  const [tryouts, setTryouts] = useState<TryoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchPublishedTryouts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tryouts')
        .select('id, title, slug, description, duration_minutes, status, is_premium, problem_configs, created_at')
        .eq('status', 'published')
        .order('title', { ascending: true });

      if (!error && data) {
        setTryouts(data as TryoutItem[]);
      }
      setLoading(false);
    }

    fetchPublishedTryouts();
  }, [supabase]);

  const filteredTryouts = useMemo(() => {
    return tryouts.filter((item) => {
      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'free' && !item.is_premium) ||
        (accessFilter === 'premium' && Boolean(item.is_premium));

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);

      return matchesAccess && matchesQuery;
    });
  }, [tryouts, accessFilter, searchQuery]);

  const hasActiveFilters = accessFilter !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setAccessFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      <Navbar />

      {/* Control Panel Katalog Try Out */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Simulasi Ujian CBT
            </h1>

            {/* Pencarian & Riwayat Try Out */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64 md:w-72">
                <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari paket try out..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <XIcon />
                  </button>
                )}
              </div>

              <Link
                href="/tryout/history"
                className="h-9 px-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold text-xs rounded-xl transition inline-flex items-center gap-1.5 group shrink-0"
              >
                <HistoryIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:-rotate-45 transition-transform" />
                <span>Riwayat Try Out Saya</span>
              </Link>
            </div>
          </div>

          {/* Filter Akses */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'free', label: 'Gratis' },
                { id: 'premium', label: 'Premium' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAccessFilter(tab.id as typeof accessFilter)}
                  className={`h-7 px-3 rounded-lg transition cursor-pointer ${
                    accessFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            ) : (
              !loading &&
              tryouts.length > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {tryouts.length} Paket Tersedia
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* GRID KATALOG TRY OUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat paket try out...</span>
          </div>
        ) : filteredTryouts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredTryouts.map((item) => {
              const configs = parseProblemConfigs(item.problem_configs);
              const totalProblems = configs.length;
              const maxScore = calculateMaxScore(configs);
              const uniqueSections = Array.from(
                new Set(configs.map((c) => c.section?.trim()).filter(Boolean) as string[])
              );

              const headerSubtitle =
                uniqueSections.length > 0
                  ? uniqueSections.slice(0, 3).join(' • ') +
                    (uniqueSections.length > 3 ? ` +${uniqueSections.length - 3}` : '')
                  : 'Simulasi Ujian CBT';

              const formatTileLabel =
                uniqueSections.length > 1
                  ? `${uniqueSections.length} Subtes`
                  : uniqueSections.length === 1
                  ? uniqueSections[0]
                  : 'CAT CBT';

              return (
                <Link
                  key={item.id}
                  href={`/tryout/${item.slug || item.id}`}
                  className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4"
                >
                  {/* BAGIAN ATAS: KONTEKS SUBTES & STATUS AKSES */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 min-w-0">
                        <AcademicCapIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{headerSubtitle}</span>
                      </div>

                      {item.is_premium ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 inline-flex items-center gap-1 shrink-0">
                          <LockClosedIcon className="w-3 h-3 text-amber-500" />
                          <span>Premium</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          Gratis
                        </span>
                      )}
                    </div>

                    {/* JUDUL & DESKRIPSI SINGKAT */}
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                        {item.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description ||
                          'Simulasi ujian interaktif dengan timer otomatis dan analisis hasil pengerjaan.'}
                      </p>
                    </div>
                  </div>

                  {/* BAGIAN TENGAH: 3 KOTAK METRIK UJIAN */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center text-center gap-1">
                      <LayersIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {formatTileLabel}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center text-center gap-1">
                      <DocumentTextIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {totalProblems} Soal
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center text-center gap-1">
                      <ClockIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.duration_minutes || 60} Menit
                      </span>
                    </div>
                  </div>

                  {/* BAGIAN BAWAH: SKOR MAKSIMAL & TOMBOL MULAI */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                      {totalProblems > 0 ? (
                        <>
                          Skor Maksimal:{' '}
                          <strong className="font-bold text-slate-700 dark:text-slate-200">
                            {maxScore}
                          </strong>
                        </>
                      ) : (
                        'Simulasi Ujian CBT'
                      )}
                    </span>

                    <div className="h-9 px-4 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs transition inline-flex items-center justify-center gap-1.5 shrink-0">
                      <span>Mulai</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 max-w-md mx-auto">
            <div className="w-11 h-11 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700">
              <InboxIcon />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Paket Try Out Tersedia
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasActiveFilters
                ? 'Tidak ada paket try out yang sesuai dengan pencarian atau filter yang dipilih.'
                : 'Saat ini belum ada simulasi ujian yang dipublikasikan. Silakan cek kembali dalam beberapa waktu.'}
            </p>
            {hasActiveFilters && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Tampilkan Semua Paket
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}