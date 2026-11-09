'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Chapter {
  id: string;
  title: string;
  slug: string;
  content: string;
  order_index: number;
  parent_id?: string | null;
}

interface NoteModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  topic?: string;
}

interface ProcessedChapter extends Chapter {
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
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: true, output: 'html' });
            return (
              <span
                key={index}
                className="block my-3 text-center overflow-x-auto [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">{part}</code>;
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: false, output: 'html' });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

// --- ICONS ---
function MenuIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
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

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

export default function NoteReaderPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const supabase = createClient();

  const [module, setModule] = useState<NoteModule | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (slug) fetchModuleData();
  }, [slug]);

  async function fetchModuleData() {
    setLoading(true);
    const { data: noteData } = await supabase
      .from('notes')
      .select('id, title, slug, description, topic')
      .eq('slug', slug)
      .single();

    if (noteData) {
      setModule(noteData as NoteModule);

      const { data: chapterData } = await supabase
        .from('note_chapters')
        .select('id, title, slug, content, order_index, parent_id')
        .eq('note_id', noteData.id)
        .order('order_index', { ascending: true });

      if (chapterData) setChapters(chapterData as Chapter[]);
    }
    setLoading(false);
  }

  // PENGELOMPOKAN & PENATAAN ALUR DAFTAR ISI (ROOT + SUBBAB)
  const rootChapters = chapters
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.order_index - b.order_index);

  const processedChapters: ProcessedChapter[] = [];

  rootChapters.forEach((root, rootIdx) => {
    const rootNum = `${rootIdx + 1}`;
    processedChapters.push({
      ...root,
      displayNumber: rootNum,
      isSubchapter: false,
    });

    const subs = chapters
      .filter((c) => c.parent_id === root.id)
      .sort((a, b) => a.order_index - b.order_index);

    subs.forEach((sub, subIdx) => {
      processedChapters.push({
        ...sub,
        displayNumber: `${rootNum}.${subIdx + 1}`,
        isSubchapter: true,
        parentTitle: root.title,
      });
    });
  });

  const activeChapter = processedChapters[activeChapterIndex];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
      
      {/* Top Header Reader */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <a href="/notes" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Katalog Modul</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
              {module?.title || 'TheoNotes Reader'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle Mode Fokus */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                focusMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Sembunyikan/Tampilkan Daftar Isi (Focus Mode)"
            >
              <MenuIcon />
              <span className="hidden sm:inline">{focusMode ? 'Mode Fokus (Aktif)' : 'Mode Fokus'}</span>
            </button>

            <ThemeToggle />
          </div>

        </div>
      </header>

      {/* Main Layout (Side TOC + Main Reading Content) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR DAFTAR ISI HIERARKIS (TOC) */}
        {!focusMode && (
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm sticky top-20 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Daftar Isi Bab Materi
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {module?.title}
                </h3>
              </div>

              {processedChapters.length > 0 ? (
                <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {processedChapters.map((chap, idx) => {
                    const isActive = activeChapterIndex === idx;
                    return (
                      <button
                        key={chap.id}
                        onClick={() => setActiveChapterIndex(idx)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2.5 ${
                          chap.isSubchapter ? 'ml-3 sm:ml-4 border-l-2 border-indigo-200 dark:border-indigo-900 rounded-l-none pl-3' : ''
                        } ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {chap.displayNumber}
                        </span>
                        <span className="truncate">{chap.title}</span>
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
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
            
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-400 italic">
                Memuat isi bab materi...
              </div>
            ) : activeChapter ? (
              <>
                {/* Header Bab Active */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {activeChapter.isSubchapter ? `Subbab #${activeChapter.displayNumber}` : `Bab #${activeChapter.displayNumber}`}
                    </span>
                    {activeChapter.parentTitle && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        (Bab Induk: {activeChapter.parentTitle})
                      </span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {module?.topic || 'Umum'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeChapter.title}
                  </h2>
                </div>

                {/* Konten Teks Materi (KaTeX Math Parser) */}
                <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  <MathText text={activeChapter.content} />
                </div>

                {/* Navigasi Antar Bab (Previous / Next) */}
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setActiveChapterIndex(activeChapterIndex - 1)}
                    disabled={activeChapterIndex === 0}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
                  >
                    <ArrowLeftIcon />
                    <span>Sebelumnya</span>
                  </button>

                  <button
                    onClick={() => setActiveChapterIndex(activeChapterIndex + 1)}
                    disabled={activeChapterIndex === processedChapters.length - 1}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
                  >
                    <span>Selanjutnya</span>
                    <ArrowRightIcon />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400 italic">
                Pilih bab di daftar isi untuk mulai membaca.
              </div>
            )}

          </div>
        </main>

      </div>

    </div>
  );
}