'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';
import { ThemeToggle } from '@/components/ThemeToggle';

interface ChapterMeta {
  id: string;
  title: string;
  slug: string;
  order_index: number;
  parent_id?: string | null;
  is_preview?: boolean;
}

interface NoteModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  topic?: string;
  is_premium?: boolean;
}

interface ProcessedChapter extends ChapterMeta {
  displayNumber: string;
  isSubchapter: boolean;
  parentTitle?: string;
}

// --- KATEX MATH PARSER ---
function MathText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

  return (
    <span className="leading-relaxed font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: true,
              output: 'html',
            });
            return (
              <span
                key={index}
                className="block my-3 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0 font-sans"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">
                {part}
              </code>
            );
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
              output: 'html',
            });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return (
              <code key={index} className="text-red-500 font-mono text-xs">
                {part}
              </code>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

// --- SVG ICONS ---
function MenuIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

function LockClosedIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function CrownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function BookOpenIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

export default function NoteReaderPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const supabase = useMemo(() => createClient(), []);

  const [module, setModule] = useState<NoteModule | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activeContent, setActiveContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchModuleData() {
      setLoading(true);

      const [noteRes, sessionRes] = await Promise.all([
        supabase
          .from('notes')
          .select('id, title, slug, description, topic, is_premium')
          .eq('slug', slug)
          .maybeSingle(),
        supabase.auth.getSession(),
      ]);

      const noteData = noteRes.data as NoteModule | null;
      if (noteData) {
        setModule(noteData);

        const { data: chapterData } = await supabase
          .from('note_chapters')
          .select('id, title, slug, order_index, parent_id, is_preview')
          .eq('note_id', noteData.id)
          .order('order_index', { ascending: true });

        if (chapterData) setChapters(chapterData as ChapterMeta[]);
      } else {
        setModule(null);
        setChapters([]);
      }

      const sessionUser = sessionRes.data?.session?.user;
      if (sessionUser) {
        setUserId(sessionUser.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();
        setHasPremiumAccess(checkPremiumAccess(profile));
      } else {
        setUserId(null);
        setHasPremiumAccess(false);
      }

      setLoading(false);
    }

    fetchModuleData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setHasPremiumAccess(checkPremiumAccess(profile));
      } else {
        setUserId(null);
        setHasPremiumAccess(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [slug, supabase]);

  // PENGELOMPOKAN & PENATAAN ALUR DAFTAR ISI (ROOT + SUBBAB)
  const processedChapters = useMemo(() => {
    const rootChapters = chapters
      .filter((c) => !c.parent_id)
      .sort((a, b) => a.order_index - b.order_index);

    const list: ProcessedChapter[] = [];

    rootChapters.forEach((root, rootIdx) => {
      const rootNum = `${rootIdx + 1}`;
      list.push({
        ...root,
        displayNumber: rootNum,
        isSubchapter: false,
      });

      const subs = chapters
        .filter((c) => c.parent_id === root.id)
        .sort((a, b) => a.order_index - b.order_index);

      subs.forEach((sub, subIdx) => {
        list.push({
          ...sub,
          displayNumber: `${rootNum}.${subIdx + 1}`,
          isSubchapter: true,
          parentTitle: root.title,
        });
      });
    });

    return list;
  }, [chapters]);

  const firstPreviewIndex = useMemo(
    () => processedChapters.findIndex((ch) => Boolean(ch.is_preview)),
    [processedChapters]
  );

  // Jika modul Premium dan user belum berlangganan, arahkan otomatis ke bab Preview pertama (jika ada)
  useEffect(() => {
    if (!loading && module?.is_premium && !hasPremiumAccess && firstPreviewIndex > 0) {
      setActiveChapterIndex(firstPreviewIndex);
    }
  }, [loading, module?.is_premium, hasPremiumAccess, firstPreviewIndex]);

  const activeChapter = processedChapters[activeChapterIndex];

  const isChapterLocked = Boolean(
    module?.is_premium && activeChapter && !activeChapter.is_preview && !hasPremiumAccess
  );

  // Tarik isi bab hanya jika tidak terkunci
  useEffect(() => {
    if (!activeChapter || isChapterLocked) {
      setActiveContent('');
      return;
    }

    let isCancelled = false;

    async function fetchChapterContent() {
      setLoadingContent(true);
      const { data } = await supabase
        .from('note_chapters')
        .select('content')
        .eq('id', activeChapter.id)
        .single();

      if (!isCancelled) {
        setActiveContent(data?.content || '');
        setLoadingContent(false);
      }
    }

    fetchChapterContent();

    return () => {
      isCancelled = true;
    };
  }, [activeChapter?.id, isChapterLocked, supabase]);

  const handleSelectChapter = (idx: number) => {
    setActiveChapterIndex(idx);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Top Header Reader — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/notes"
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali ke Katalog</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {module?.title || 'TheoNotes Reader'}
              </h1>
              {module?.is_premium && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hidden sm:inline-flex items-center gap-1 shrink-0">
                  <CrownIcon className="w-3 h-3 text-amber-500" />
                  <span>Premium</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {module && (
              <button
                type="button"
                onClick={() => setFocusMode(!focusMode)}
                className={`h-9 px-3.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer border ${
                  focusMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200/80 dark:border-slate-700/80'
                }`}
                title="Sembunyikan/Tampilkan Daftar Isi (Mode Fokus)"
              >
                <MenuIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {focusMode ? 'Mode Fokus Aktif' : 'Mode Fokus'}
                </span>
              </button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Layout (Side TOC + Main Reading Content) */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat modul TheoNotes...</span>
          </div>
        </div>
      ) : !module ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 flex items-center justify-center mx-auto">
              <BookOpenIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Modul Tidak Ditemukan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modul catatan yang Anda cari tidak tersedia atau telah dipindahkan.
              </p>
            </div>
            <Link
              href="/notes"
              className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
            >
              Kembali ke Katalog TheoNotes
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* SIDEBAR DAFTAR ISI HIERARKIS (TOC) */}
          {!focusMode && (
            <aside className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 sticky top-24 space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Daftar Isi Materi
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {module.title}
                  </h3>
                </div>

                {processedChapters.length > 0 ? (
                  <div className="space-y-1.5 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                    {processedChapters.map((chap, idx) => {
                      const isActive = activeChapterIndex === idx;
                      const isItemLocked = Boolean(
                        module.is_premium && !chap.is_preview && !hasPremiumAccess
                      );

                      return (
                        <button
                          key={chap.id}
                          type="button"
                          onClick={() => handleSelectChapter(idx)}
                          className={`text-left p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between gap-2 cursor-pointer ${
                            chap.isSubchapter
                              ? 'w-[calc(100%-0.75rem)] ml-3 sm:w-[calc(100%-1rem)] sm:ml-4 border-l-2 border-indigo-200 dark:border-indigo-900 rounded-l-none pl-3'
                              : 'w-full'
                          } ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800'
                              : isItemLocked
                              ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {chap.displayNumber}
                            </span>
                            <span className="truncate">{chap.title}</span>
                          </div>

                          {isItemLocked ? (
                            <span className="shrink-0" title="Khusus Akun Premium">
                              <LockClosedIcon className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          ) : (
                            chap.is_preview &&
                            module.is_premium &&
                            !hasPremiumAccess && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                                Preview
                              </span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada bab di modul ini.</p>
                )}
              </div>
            </aside>
          )}

          {/* AREA UTAMA BACA MATERI */}
          <main className={focusMode ? 'lg:col-span-12 max-w-4xl mx-auto w-full' : 'lg:col-span-8'}>
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
              {activeChapter ? (
                <>
                  {/* Header Bab Aktif */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-200/80 dark:border-indigo-900">
                        {activeChapter.isSubchapter
                          ? `Subbab ${activeChapter.displayNumber}`
                          : `Bab ${activeChapter.displayNumber}`}
                      </span>
                      {activeChapter.parentTitle && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Bagian dari: {activeChapter.parentTitle}
                        </span>
                      )}
                      <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {module.topic || 'Umum'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {activeChapter.title}
                    </h2>
                  </div>

                  {/* KONTEN BAB ATAU LAYAR TERKUNCI */}
                  {isChapterLocked ? (
                    <div className="p-6 sm:p-10 rounded-xl bg-amber-500/10 border border-amber-500/40 text-center space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
                        <LockClosedIcon className="w-5 h-5" />
                      </div>

                      <div className="max-w-md mx-auto space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                          <CrownIcon className="w-3 h-3 text-amber-500" />
                          <span>Modul Premium</span>
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-1">
                          Bab Ini Khusus Anggota Premium
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {userId ? (
                            <>
                              Akun Anda saat ini berstatus{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                Gratis (Free)
                              </strong>
                              . Upgrade ke akun Premium untuk membuka seluruh bab pembahasan dalam modul{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {module.title}
                              </strong>
                              .
                            </>
                          ) : (
                            <>
                              Modul{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {module.title}
                              </strong>{' '}
                              merupakan koleksi eksklusif. Masuk atau upgrade akun Anda ke Premium untuk mengakses bab ini.
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                        {firstPreviewIndex !== -1 && firstPreviewIndex !== activeChapterIndex && (
                          <button
                            type="button"
                            onClick={() => handleSelectChapter(firstPreviewIndex)}
                            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Baca Bab Preview Gratis</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/upgrade?redirect=/notes/${slug}`}
                          className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center"
                        >
                          Upgrade ke Premium
                        </Link>
                      </div>
                    </div>
                  ) : loadingContent ? (
                    <div className="py-16 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      <span>Memuat isi bab materi...</span>
                    </div>
                  ) : activeContent ? (
                    <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      <MathText text={activeContent} />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                      Isi materi untuk bab ini sedang disusun.
                    </div>
                  )}

                  {/* Navigasi Antar Bab (Sebelumnya / Selanjutnya) */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => handleSelectChapter(activeChapterIndex - 1)}
                      disabled={activeChapterIndex === 0}
                      className="h-9 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeftIcon className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {activeChapterIndex + 1} / {processedChapters.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectChapter(activeChapterIndex + 1)}
                      disabled={activeChapterIndex === processedChapters.length - 1}
                      className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Selanjutnya</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                  Pilih bab di daftar isi untuk mulai membaca materi.
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}