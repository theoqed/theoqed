'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface NoteModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  topic?: string;
  created_at?: string;
  note_chapters?: { id: string }[];
}

// --- TEMA WARNA & ILUSTRASI VEKTOR MINIMALIS (ASTRONOTES STYLE) ---
interface ModuleStyle {
  bg: string;
  accent: string;
  svg: React.ReactNode;
}

function getModuleStyle(topic?: string, title?: string): ModuleStyle {
  const key = (topic || title || '').toLowerCase();

  if (key.includes('logika') || key.includes('himpunan')) {
    return {
      bg: 'bg-gradient-to-b from-rose-600 via-rose-700 to-rose-900',
      accent: 'text-rose-200',
      // Diagram Venn / Lingkaran Terpotong
      svg: (
        <svg className="w-24 h-24 opacity-80 stroke-white/90 fill-none" viewBox="0 0 100 100" strokeWidth="2.5">
          <circle cx="38" cy="50" r="26" className="fill-white/10" />
          <circle cx="62" cy="50" r="26" className="fill-white/20" />
          <path d="M 50 26 A 26 26 0 0 1 50 74 A 26 26 0 0 1 50 26" className="fill-white/30" />
        </svg>
      ),
    };
  }

  if (key.includes('aljabar') || key.includes('linear')) {
    return {
      bg: 'bg-gradient-to-b from-amber-500 via-orange-600 to-orange-800',
      accent: 'text-amber-200',
      // Grid Garis Koordinat & Vektor
      svg: (
        <svg className="w-24 h-24 opacity-80 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
          <line x1="20" y1="80" x2="80" y2="80" strokeWidth="3" />
          <line x1="20" y1="80" x2="20" y2="20" strokeWidth="3" />
          <line x1="20" y1="80" x2="75" y2="25" strokeWidth="3.5" className="stroke-amber-200" />
          <polygon points="75,25 65,28 72,35" className="fill-amber-200 stroke-none" />
          <line x1="20" y1="60" x2="80" y2="60" strokeDasharray="3 3" opacity="0.4" />
          <line x1="20" y1="40" x2="80" y2="40" strokeDasharray="3 3" opacity="0.4" />
          <line x1="40" y1="20" x2="40" y2="80" strokeDasharray="3 3" opacity="0.4" />
          <line x1="60" y1="20" x2="60" y2="80" strokeDasharray="3 3" opacity="0.4" />
        </svg>
      ),
    };
  }

  if (key.includes('analisis') || key.includes('kalkulus') || key.includes('real')) {
    return {
      bg: 'bg-gradient-to-b from-blue-600 via-indigo-700 to-slate-900',
      accent: 'text-blue-200',
      // Kurva Gelombang Integral
      svg: (
        <svg className="w-24 h-24 opacity-80 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2.5">
          <path d="M 15 75 Q 35 20, 50 50 T 85 25" />
          <line x1="10" y1="75" x2="90" y2="75" strokeWidth="2" opacity="0.5" />
          <path d="M 30 75 L 30 45 A 5 5 0 0 1 70 45 L 70 75 Z" className="fill-white/15 stroke-none" />
        </svg>
      ),
    };
  }

  if (key.includes('bilangan') || key.includes('teori')) {
    return {
      bg: 'bg-gradient-to-b from-purple-600 via-purple-700 to-indigo-950',
      accent: 'text-purple-200',
      // Matrix Titik & Garis Keterbagian
      svg: (
        <svg className="w-24 h-24 opacity-80 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
          <circle cx="30" cy="30" r="6" className="fill-white" />
          <circle cx="70" cy="30" r="6" className="fill-white" />
          <circle cx="30" cy="70" r="6" className="fill-white" />
          <circle cx="70" cy="70" r="6" className="fill-white" />
          <line x1="30" y1="30" x2="70" y2="30" />
          <line x1="30" y1="30" x2="30" y2="70" />
          <line x1="70" y1="30" x2="70" y2="70" />
          <line x1="30" y1="70" x2="70" y2="70" />
          <line x1="30" y1="30" x2="70" y2="70" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      ),
    };
  }

  if (key.includes('geometri')) {
    return {
      bg: 'bg-gradient-to-b from-teal-600 via-emerald-700 to-slate-900',
      accent: 'text-teal-200',
      // Poligon / Segitiga Terinscribing Lingkaran
      svg: (
        <svg className="w-24 h-24 opacity-80 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2.5">
          <polygon points="50,20 85,75 15,75" />
          <circle cx="50" cy="55" r="20" className="fill-white/10" />
        </svg>
      ),
    };
  }

  if (key.includes('kombinatorika') || key.includes('diskrit')) {
    return {
      bg: 'bg-gradient-to-b from-pink-600 via-fuchsia-700 to-slate-900',
      accent: 'text-pink-200',
      // Graf Cabang / Pohon Keputusan
      svg: (
        <svg className="w-24 h-24 opacity-80 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
          <circle cx="50" cy="25" r="5" className="fill-white" />
          <circle cx="30" cy="55" r="5" className="fill-white" />
          <circle cx="70" cy="55" r="5" className="fill-white" />
          <circle cx="20" cy="80" r="5" className="fill-white" />
          <circle cx="40" cy="80" r="5" className="fill-white" />
          <circle cx="80" cy="80" r="5" className="fill-white" />
          <line x1="50" y1="25" x2="30" y2="55" />
          <line x1="50" y1="25" x2="70" y2="55" />
          <line x1="30" y1="55" x2="20" y2="80" />
          <line x1="30" y1="55" x2="40" y2="80" />
          <line x1="70" y1="55" x2="80" y2="80" />
        </svg>
      ),
    };
  }

  // Default Theme (Violet / Deep Indigo)
  return {
    bg: 'bg-gradient-to-b from-indigo-600 via-indigo-800 to-slate-950',
    accent: 'text-indigo-200',
    svg: (
      <svg className="w-24 h-24 opacity-80 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <circle cx="50" cy="50" r="30" />
        <line x1="20" y1="50" x2="80" y2="50" />
        <ellipse cx="50" cy="50" rx="30" ry="12" />
      </svg>
    ),
  };
}

// --- ICONS ---
function BookOpenIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

export default function NotesCatalogPage() {
  const [modules, setModules] = useState<NoteModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');

  useEffect(() => {
    fetchModules();
  }, []);

  async function fetchModules() {
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('id, title, slug, description, topic, created_at, note_chapters(id)');

    if (data) setModules(data as NoteModule[]);
    setLoading(false);
  }

  const availableTopics = [
    'Semua',
    ...Array.from(new Set(modules.map((m) => m.topic).filter(Boolean) as string[])),
  ];

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic =
      selectedTopic === 'Semua' || m.topic?.toLowerCase() === selectedTopic.toLowerCase();
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      
      <div>
        {/* Header Navigasi Reusable Konsisten */}
        <Navbar />

        {/* Control Panel Katalog TheoNotes */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-8 px-4 sm:px-6 transition-colors duration-200">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-200 dark:border-indigo-800">
                  <BookOpenIcon className="w-3.5 h-3.5" />
                  <span>TheoNotes Library</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Modul & Catatan Perkuliahan Matematika
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Kumpulan ringkasan materi, teori, dan pembuktian matematika terstruktur.
                </p>
              </div>

              {/* Input Pencarian Modul */}
              <div className="relative min-w-[260px]">
                <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari judul modul atau materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition shadow-sm"
                />
              </div>
            </div>

            {/* Filter Topik Modul */}
            {availableTopics.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                  Topik Materi:
                </span>
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      selectedTopic.toLowerCase() === topic.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* GRID KATALOG MODUL (ASTRONOTES CARD STYLE) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-10">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs shadow-sm">
              Memuat modul TheoNotes...
            </div>
          ) : filteredModules.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredModules.map((module) => {
                const chapterCount = module.note_chapters?.length || 0;
                const style = getModuleStyle(module.topic, module.title);

                return (
                  <a
                    key={module.id}
                    href={`/notes/${module.slug}`}
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    {/* BAGIAN ATAS: COVER CARD ASTRONOTES STYLE */}
                    <div className={`aspect-[4/5] ${style.bg} relative p-5 flex flex-col justify-between text-center overflow-hidden`}>
                      
                      {/* Sub-Header Tag (TheoNotes + Topic) */}
                      <div className="flex flex-col items-center gap-0.5 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                          TheoNotes
                        </span>
                        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight line-clamp-2 px-1">
                          {module.title}
                        </h3>
                      </div>

                      {/* ILUSTRASI VEKTOR GEOMETRIS DI TENGAH */}
                      <div className="my-auto flex justify-center items-center relative z-10 transition-transform duration-300 group-hover:scale-110">
                        {style.svg}
                      </div>

                      {/* BADGE HALAMAN / BAB */}
                      <div className="relative z-10">
                        <span className="inline-block text-[10px] font-bold text-white/90 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          {chapterCount} Bab Pembahasan
                        </span>
                      </div>
                    </div>

                    {/* BAGIAN BAWAH: DESKRIPSI RINGKAS & TOMBOL */}
                    <div className="p-4 space-y-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 font-medium">
                        {module.description || 'Rangkuman dan pembuktian terstruktur...'}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500">
                        <span>Baca Modul</span>
                        <ArrowRightIcon className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition duration-200" />
                      </div>
                    </div>

                  </a>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs shadow-sm">
              Tidak ada modul materi yang sesuai dengan pencarian.
            </div>
          )}
        </div>
      </div>

      {/* Footer Reusable Konsisten */}
      <Footer />
    </div>
  );
}