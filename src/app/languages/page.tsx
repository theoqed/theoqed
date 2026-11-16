'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AppSwitcher } from '@/components/AppSwitcher';

interface LanguageItem {
  id: string;
  code: string;
  name: string;
  native_name: string;
  region_tag: string;
  speech_lang: string;
  direction: 'ltr' | 'rtl';
  accent_gradient: string;
  description: string | null;
  lang_modules?: { id: string }[] | null;
}

const REGION_FILTERS = ['Semua', 'Asia Timur', 'Eropa', 'Timur Tengah', 'Global'];

export default function LanguagesCatalogPage() {
  const supabase = useMemo(() => createClient(), []);

  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Semua');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    loadLanguages();
  }, []);

  async function loadLanguages() {
    setLoading(true);
    const { data } = await supabase
      .from('languages')
      .select('id, code, name, native_name, region_tag, speech_lang, direction, accent_gradient, description, lang_modules(id)')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    setLanguages((data as LanguageItem[]) || []);
    setLoading(false);
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Abaikan jika storage tidak tersedia
    }
  }

  const filteredLanguages = useMemo(() => {
    return languages.filter((lang) => {
      const matchRegion = selectedRegion === 'Semua' || lang.region_tag === selectedRegion;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.native_name.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        (lang.description || '').toLowerCase().includes(q);
      return matchRegion && matchSearch;
    });
  }, [languages, selectedRegion, search]);

  const totalModules = useMemo(() => {
    return languages.reduce((acc, item) => acc + (item.lang_modules?.length || 0), 0);
  }, [languages]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar Khusus TheoQED Lingo */}
      <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AppSwitcher />

            <Link href="/languages" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
                <span className="text-indigo-600 dark:text-indigo-400">√</span>
                <span>TheoQED</span>
                <span className="text-indigo-600 dark:text-indigo-400">.</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-900">
                Lingo
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <span>← TheoQED Math</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah tema"
              className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition cursor-pointer"
            >
              {isDark ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Editorial Ringkas */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/70 dark:border-indigo-900 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Ruang Studi Bahasa &amp; Linguistik
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Eksplorasi Bahasa Dunia Terstruktur
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Catatan tata bahasa ringkas, daftar kosakata dengan pelafalan suara otomatis, serta kartu hafalan interaktif untuk memperluas literasi lintas bahasa.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-center min-w-24">
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {languages.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Bahasa
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-center min-w-24">
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {totalModules}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Modul Aktif
              </div>
            </div>
          </div>
        </section>

        {/* Filter Kawasan & Pencarian */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {REGION_FILTERS.map((region) => {
              const active = selectedRegion === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`h-8 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bahasa atau aksara..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
          </div>
        </section>

        {/* Grid Kartu Bahasa */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Bahasa tidak ditemukan
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coba ubah kata kunci pencarian atau pilih filter kawasan lain.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLanguages.map((lang) => {
              const moduleCount = lang.lang_modules?.length || 0;
              return (
                <Link
                  key={lang.id}
                  href={`/languages/${lang.code}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-4 flex flex-col justify-between gap-4 transition shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3.5">
                    {/* Header Aksara Asli */}
                    <div
                      className={`relative h-28 rounded-xl bg-gradient-to-br ${lang.accent_gradient} p-4 flex flex-col justify-between text-white overflow-hidden select-none`}
                    >
                      <div
                        aria-hidden="true"
                        className="absolute -right-6 -bottom-6 text-6xl font-black text-white/10 pointer-events-none"
                      >
                        {lang.native_name}
                      </div>

                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-[10px] font-extrabold uppercase tracking-wider">
                          {lang.code.toUpperCase()} · {lang.region_tag}
                        </span>
                        {lang.direction === 'rtl' && (
                          <span className="px-1.5 py-0.5 rounded bg-black/25 text-[9px] font-bold">
                            RTL
                          </span>
                        )}
                      </div>

                      <div
                        dir={lang.direction}
                        className="relative z-10 text-2xl font-black tracking-tight truncate drop-shadow-xs"
                      >
                        {lang.native_name}
                      </div>
                    </div>

                    {/* Info Bahasa */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          Bahasa {lang.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {lang.description || `Modul pembelajaran, kosakata, dan flashcard Bahasa ${lang.name}.`}
                      </p>
                    </div>
                  </div>

                  {/* Footer Modul & Tombol */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {moduleCount} Modul
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      <span>Buka Ruang</span>
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}