'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppSwitcher } from '@/components/AppSwitcher';

interface LanguageDetail {
  id: string;
  code: string;
  name: string;
  native_name: string;
  region_tag: string;
  speech_lang: string;
  direction: 'ltr' | 'rtl';
  accent_gradient: string;
  description: string | null;
}

interface ModuleItem {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  sort_order: number;
  lang_lessons?: { id: string }[] | null;
  lang_vocab?: { id: string }[] | null;
}

export default function LanguageDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ code: string }>();
  const code = params?.code?.toLowerCase();

  const [language, setLanguage] = useState<LanguageDetail | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (code) loadLanguageAndModules(code);
  }, [code]);

  async function loadLanguageAndModules(langCode: string) {
    setLoading(true);

    const { data: langData } = await supabase
      .from('languages')
      .select('id, code, name, native_name, region_tag, speech_lang, direction, accent_gradient, description')
      .eq('code', langCode)
      .eq('is_published', true)
      .single();

    if (langData) {
      setLanguage(langData as LanguageDetail);

      const { data: modData } = await supabase
        .from('lang_modules')
        .select('id, slug, title, level, description, sort_order, lang_lessons(id), lang_vocab(id)')
        .eq('language_id', langData.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      setModules((modData as ModuleItem[]) || []);
    }

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

  const levels = useMemo(() => {
    const unique = Array.from(new Set(modules.map((m) => m.level).filter(Boolean)));
    return ['Semua', ...unique];
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchLevel = selectedLevel === 'Semua' || mod.level === selectedLevel;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.level.toLowerCase().includes(q) ||
        (mod.description || '').toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [modules, selectedLevel, search]);

  const totalVocab = useMemo(
    () => modules.reduce((acc, m) => acc + (m.lang_vocab?.length || 0), 0),
    [modules]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>Memuat silabus bahasa...</span>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Bahasa tidak ditemukan atau belum dipublikasikan.
        </p>
        <Link
          href="/languages"
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center transition"
        >
          Kembali ke Katalog Bahasa
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AppSwitcher />

            <Link
              href="/languages"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Semua Bahasa</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                Bahasa {language.name}
              </span>
              <span
                dir={language.direction}
                className="hidden md:inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/70 dark:border-indigo-900 text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
              >
                {language.native_name}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ubah tema"
            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition cursor-pointer shrink-0"
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
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Bahasa */}
        <section
          className={`relative rounded-3xl bg-gradient-to-br ${language.accent_gradient} p-6 sm:p-8 text-white overflow-hidden shadow-xs`}
        >
          <div
            aria-hidden="true"
            className="absolute -right-6 -bottom-8 text-8xl sm:text-9xl font-black text-white/10 pointer-events-none select-none"
          >
            {language.native_name}
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-xs text-[10px] font-extrabold uppercase tracking-wider">
                  {language.code.toUpperCase()} · {language.region_tag}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-black/20 text-[10px] font-bold">
                  Audio: {language.speech_lang}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Bahasa {language.name}
                </h1>
                <span dir={language.direction} className="text-xl sm:text-2xl font-bold text-white/85">
                  {language.native_name}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                {language.description ||
                  `Kurikulum terstruktur Bahasa ${language.name} mencakup catatan materi, tata bahasa, daftar kosakata bersuara, dan flashcard.`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/15 text-center min-w-24">
                <div className="text-xl font-black">{modules.length}</div>
                <div className="text-[11px] font-semibold text-white/80">Modul</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/15 text-center min-w-24">
                <div className="text-xl font-black">{totalVocab}</div>
                <div className="text-[11px] font-semibold text-white/80">Kosakata</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Level & Pencarian */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {levels.map((lvl) => {
              const active = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`h-8 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul modul atau topik..."
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

        {/* Daftar Modul */}
        {filteredModules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {modules.length === 0
                ? `Belum ada modul untuk Bahasa ${language.name}`
                : 'Modul tidak ditemukan'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {modules.length === 0
                ? 'Tambahkan modul pertama di tabel lang_modules pada Supabase untuk mulai mengisi materi, kosakata, dan flashcard.'
                : 'Coba ubah kata kunci pencarian atau filter level di atas.'}
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((mod, index) => {
              const lessonCount = mod.lang_lessons?.length || 0;
              const vocabCount = mod.lang_vocab?.length || 0;

              return (
                <Link
                  key={mod.id}
                  href={`/languages/${language.code}/${mod.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-5 flex flex-col justify-between gap-4 transition shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 inline-flex items-center justify-center">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/70 dark:border-indigo-900 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {mod.level}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {mod.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {mod.description || 'Catatan tata bahasa, daftar kosakata, dan latihan flashcard.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold">
                      <span>{lessonCount} Materi</span>
                      <span>·</span>
                      <span>{vocabCount} Kosakata</span>
                    </div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      Mulai →
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