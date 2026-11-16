'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LanguageInfo {
  id: string;
  code: string;
  name: string;
  native_name: string;
  speech_lang: string;
  direction: 'ltr' | 'rtl';
}

interface ModuleInfo {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
}

interface LessonItem {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  grammar_notes: string | null;
  sort_order: number;
}

interface VocabItem {
  id: string;
  term: string;
  phonetic: string | null;
  meaning: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_phonetic: string | null;
  example_meaning: string | null;
  sort_order: number;
}

type ActiveTab = 'materi' | 'kosakata' | 'flashcard';

// Renderer teks terstruktur ringan tanpa dependensi tambahan
function FormattedLessonContent({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  function renderInline(line: string) {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  }

  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-extrabold text-slate-900 dark:text-white pt-2">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-black text-slate-900 dark:text-white pt-3">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-black text-slate-900 dark:text-white pt-3">
              {trimmed.slice(2)}
            </h1>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-indigo-500 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-r-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200"
            >
              {renderInline(trimmed.replace(/^>\s?/gm, ''))}
            </blockquote>
          );
        }

        const lines = trimmed.split('\n');
        const isBulletList = lines.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.trim().replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        const isOrderedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
        if (isOrderedList) {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.trim().replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function LanguageModuleReaderPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ code: string; slug: string }>();
  const code = params?.code?.toLowerCase();
  const slug = params?.slug;

  const [language, setLanguage] = useState<LanguageInfo | null>(null);
  const [moduleData, setModuleData] = useState<ModuleInfo | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('materi');
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // State Pencarian Kosakata
  const [vocabSearch, setVocabSearch] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // State Flashcard
  const [deckQueue, setDeckQueue] = useState<VocabItem[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPhoneticFront, setShowPhoneticFront] = useState(true);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (code && slug) {
      loadModuleContent(code, slug);
    }
  }, [code, slug]);

  async function loadModuleContent(langCode: string, modSlug: string) {
    setLoading(true);

    const { data: lang } = await supabase
      .from('languages')
      .select('id, code, name, native_name, speech_lang, direction')
      .eq('code', langCode)
      .eq('is_published', true)
      .single();

    if (lang) {
      setLanguage(lang as LanguageInfo);

      const { data: mod } = await supabase
        .from('lang_modules')
        .select('id, slug, title, level, description')
        .eq('language_id', lang.id)
        .eq('slug', modSlug)
        .eq('is_published', true)
        .single();

      if (mod) {
        setModuleData(mod as ModuleInfo);

        const [{ data: lessonRows }, { data: vocabRows }] = await Promise.all([
          supabase
            .from('lang_lessons')
            .select('id, slug, title, content_md, grammar_notes, sort_order')
            .eq('module_id', mod.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('lang_vocab')
            .select(
              'id, term, phonetic, meaning, part_of_speech, example_sentence, example_phonetic, example_meaning, sort_order'
            )
            .eq('module_id', mod.id)
            .order('sort_order', { ascending: true }),
        ]);

        const fetchedLessons = (lessonRows as LessonItem[]) || [];
        const fetchedVocab = (vocabRows as VocabItem[]) || [];

        setLessons(fetchedLessons);
        setVocabList(fetchedVocab);
        setDeckQueue(fetchedVocab);
        setMasteredIds([]);
        setIsFlipped(false);

        if (fetchedLessons.length === 0 && fetchedVocab.length > 0) {
          setActiveTab('kosakata');
        }
      }
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

  const speakText = useCallback(
    (text: string, id: string, rate = 1) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !language) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language.speech_lang;
      utterance.rate = rate;

      utterance.onstart = () => setSpeakingId(id);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  // Filter Kosakata
  const filteredVocab = useMemo(() => {
    const q = vocabSearch.trim().toLowerCase();
    if (!q) return vocabList;
    return vocabList.filter(
      (v) =>
        v.term.toLowerCase().includes(q) ||
        (v.phonetic || '').toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q)
    );
  }, [vocabList, vocabSearch]);

  // Kontrol Flashcard
  const currentCard = deckQueue[0] || null;

  function handleCardRating(rating: 'again' | 'hard' | 'good') {
    if (!currentCard) return;
    setIsFlipped(false);

    setDeckQueue((prev) => {
      const [head, ...rest] = prev;
      if (!head) return [];

      if (rating === 'good') {
        setMasteredIds((ids) => (ids.includes(head.id) ? ids : [...ids, head.id]));
        return rest;
      }
      if (rating === 'hard') {
        return [...rest, head];
      }
      // 'again' -> sisipkan kembali setelah 2 kartu berikutnya
      const insertAt = Math.min(2, rest.length);
      const next = [...rest];
      next.splice(insertAt, 0, head);
      return next;
    });
  }

  function resetFlashcardDeck(shuffle = false) {
    const base = [...vocabList];
    if (shuffle) {
      for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
      }
    }
    setDeckQueue(base);
    setMasteredIds([]);
    setIsFlipped(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>Memuat modul pembelajaran...</span>
      </div>
    );
  }

  if (!language || !moduleData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Modul tidak ditemukan atau belum dipublikasikan.
        </p>
        <Link
          href={code ? `/languages/${code}` : '/languages'}
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center transition"
        >
          Kembali ke Silabus Bahasa
        </Link>
      </div>
    );
  }

  const currentLesson = lessons[activeLessonIndex] || null;
  const flashcardProgress =
    vocabList.length > 0 ? Math.round((masteredIds.length / vocabList.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Reader Navbar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href={`/languages/${language.code}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Bahasa {language.name}</span>
              <span className="sm:hidden">Silabus</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {moduleData.title}
              </h1>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900 shrink-0">
                {moduleData.level}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFocusMode((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                focusMode
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
              </svg>
              <span className="hidden sm:inline">Mode Fokus</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah tema"
              className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition cursor-pointer"
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

      {/* Main Content */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-all duration-200 ${
          focusMode ? 'max-w-4xl' : 'max-w-6xl'
        }`}
      >
        {/* Tab Switcher (Materi | Kosakata | Flashcard) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setActiveTab('materi')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'materi'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Materi</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeTab === 'materi'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {lessons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kosakata')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'kosakata'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Kosakata</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeTab === 'kosakata'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {vocabList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flashcard')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'flashcard'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Flashcard</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-[11px] font-semibold text-slate-400">
            <span dir={language.direction}>{language.native_name}</span>
            <span>·</span>
            <span>{language.speech_lang}</span>
          </div>
        </div>

        {/* ================= TAB 1: MATERI & TATA BAHASA ================= */}
        {activeTab === 'materi' && (
          <div className="space-y-4">
            {lessons.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {lessons.map((les, idx) => {
                  const active = idx === activeLessonIndex;
                  return (
                    <button
                      key={les.id}
                      type="button"
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`h-8 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {idx + 1}. {les.title}
                    </button>
                  );
                })}
              </div>
            )}

            {currentLesson ? (
              <article className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Bagian {activeLessonIndex + 1} dari {lessons.length}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {currentLesson.title}
                  </h2>
                </div>

                <FormattedLessonContent text={currentLesson.content_md} />

                {currentLesson.grammar_notes && (
                  <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/70 space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Catatan Tata Bahasa &amp; Pola Kalimat
                    </div>
                    <FormattedLessonContent text={currentLesson.grammar_notes} />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={activeLessonIndex === 0}
                    onClick={() => setActiveLessonIndex((i) => Math.max(0, i - 1))}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ← Materi Sebelumnya
                  </button>

                  {activeLessonIndex < lessons.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveLessonIndex((i) => i + 1)}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Materi Berikutnya →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('kosakata')}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Lanjut ke Kosakata →
                    </button>
                  )}
                </div>
              </article>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada catatan materi pada modul ini
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tambahkan catatan pada tabel <code className="font-mono">lang_lessons</code> atau buka tab Kosakata &amp; Flashcard.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: KOSAKATA + AUDIO ================= */}
        {activeTab === 'kosakata' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik ikon pengeras suara untuk mendengar pelafalan normal atau pelan.
              </p>
              <input
                type="text"
                value={vocabSearch}
                onChange={(e) => setVocabSearch(e.target.value)}
                placeholder="Cari kata, fonetik, atau arti..."
                className="w-full sm:w-72 h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {filteredVocab.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Kosakata belum tersedia
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi entri kosakata di tabel <code className="font-mono">lang_vocab</code> untuk memunculkan daftar kata &amp; flashcard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredVocab.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span
                            dir={language.direction}
                            className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white"
                          >
                            {item.term}
                          </span>
                          {item.phonetic && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {item.phonetic}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {item.meaning}
                          </span>
                          {item.part_of_speech && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {item.part_of_speech}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Suara Normal & Pelan */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakText(item.term, `${item.id}-normal`, 1)}
                          title="Putar suara (Normal)"
                          className={`h-8 px-2.5 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                            speakingId === `${item.id}-normal`
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07m2.83-9.9a9 9 0 010 12.73" />
                          </svg>
                          <span>1x</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => speakText(item.term, `${item.id}-slow`, 0.65)}
                          title="Putar suara (Pelan)"
                          className={`h-8 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            speakingId === `${item.id}-slow`
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400'
                          }`}
                        >
                          0.6x
                        </button>
                      </div>
                    </div>

                    {item.example_sentence && (
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-2">
                        <div className="space-y-0.5 text-xs">
                          <p dir={language.direction} className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.example_sentence}
                          </p>
                          {item.example_phonetic && (
                            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
                              {item.example_phonetic}
                            </p>
                          )}
                          {item.example_meaning && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.example_meaning}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => speakText(item.example_sentence!, `${item.id}-ex`, 0.95)}
                          title="Putar contoh kalimat"
                          className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 inline-flex items-center justify-center shrink-0 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: FLASHCARD INTERAKTIF ================= */}
        {activeTab === 'flashcard' && (
          <div className="max-w-2xl mx-auto space-y-5 py-2">
            {vocabList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada kartu untuk dilatih
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Flashcard dibuat otomatis dari daftar kosakata pada modul ini.
                </p>
              </div>
            ) : (
              <>
                {/* Bar Progres & Pengaturan Kartu */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Dikuasai: {masteredIds.length} / {vocabList.length} kartu ({flashcardProgress}%)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPhoneticFront((prev) => !prev)}
                        className={`h-7 px-2.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                          showPhoneticFront
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        Fonetik: {showPhoneticFront ? 'Tampil' : 'Sembunyi'}
                      </button>

                      <button
                        type="button"
                        onClick={() => resetFlashcardDeck(true)}
                        className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Acak Dek
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${flashcardProgress}%` }}
                    />
                  </div>
                </div>

                {/* Kartu Utama atau Layar Selesai */}
                {currentCard ? (
                  <div className="space-y-4">
                    <div
                      onClick={() => setIsFlipped((prev) => !prev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setIsFlipped((prev) => !prev);
                        }
                      }}
                      className="min-h-72 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-8 flex flex-col items-center justify-center text-center shadow-xs transition cursor-pointer select-none relative"
                    >
                      <span className="absolute top-4 left-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {isFlipped ? 'Arti & Konteks' : 'Sisi Depan · Klik untuk Balik'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.term, `fc-${currentCard.id}`, 0.95);
                        }}
                        title="Dengarkan pelafalan"
                        className="absolute top-3.5 right-4 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07" />
                        </svg>
                        <span>Suara</span>
                      </button>

                      {!isFlipped ? (
                        <div className="space-y-3">
                          <div
                            dir={language.direction}
                            className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
                          >
                            {currentCard.term}
                          </div>
                          {showPhoneticFront && currentCard.phonetic && (
                            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                              {currentCard.phonetic}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-md">
                          <div className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                              {currentCard.meaning}
                            </div>
                            {currentCard.phonetic && (
                              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {currentCard.term} · {currentCard.phonetic}
                              </div>
                            )}
                          </div>

                          {currentCard.example_sentence && (
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1">
                              <p dir={language.direction} className="font-bold text-slate-800 dark:text-slate-200">
                                {currentCard.example_sentence}
                              </p>
                              {currentCard.example_meaning && (
                                <p className="text-slate-500 dark:text-slate-400">
                                  {currentCard.example_meaning}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tombol Penilaian Mandiri */}
                    {isFlipped ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCardRating('again')}
                          className="h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-950 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-extrabold transition cursor-pointer"
                        >
                          Belum Hafal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardRating('hard')}
                          className="h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-950 border border-amber-200/80 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-extrabold transition cursor-pointer"
                        >
                          Ragu-Ragu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardRating('good')}
                          className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition cursor-pointer"
                        >
                          Sudah Hafal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsFlipped(true)}
                        className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition cursor-pointer"
                      >
                        Tampilkan Arti
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 p-10 text-center space-y-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
                      Sesi Selesai
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Semua {vocabList.length} Kartu Berhasil Dikuasai!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kamu dapat mengulang dek secara acak untuk memperkuat ingatan jangka panjang.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => resetFlashcardDeck(false)}
                        className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        Ulangi Berurutan
                      </button>
                      <button
                        type="button"
                        onClick={() => resetFlashcardDeck(true)}
                        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Ulangi Acak
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}