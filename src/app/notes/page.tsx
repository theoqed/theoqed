'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { NoteModuleCard, NoteModuleCardData } from '@/components/NoteModuleCard';

interface NoteModule extends NoteModuleCardData {
  created_at?: string;
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export default function NotesCatalogPage() {
  const supabase = useMemo(() => createClient(), []);

  const [modules, setModules] = useState<NoteModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    async function fetchModules() {
      setLoading(true);
      const { data } = await supabase
        .from('notes')
        .select('id, title, slug, description, topic, is_premium, created_at, note_chapters(id, parent_id)')
        .order('created_at', { ascending: false });

      if (data) setModules(data as NoteModule[]);
      setLoading(false);
    }

    fetchModules();
  }, [supabase]);

  const availableTopics = useMemo(
    () => [
      'Semua',
      ...Array.from(new Set(modules.map((m) => m.topic).filter(Boolean) as string[])),
    ],
    [modules]
  );

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.topic || '').toLowerCase().includes(q);

      const matchesTopic =
        selectedTopic === 'Semua' || m.topic?.toLowerCase() === selectedTopic.toLowerCase();

      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'free' && !m.is_premium) ||
        (accessFilter === 'premium' && Boolean(m.is_premium));

      return matchesSearch && matchesTopic && matchesAccess;
    });
  }, [modules, searchQuery, selectedTopic, accessFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      <Navbar />

      {/* Control Panel Katalog TheoNotes */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              TheoNotes Library
            </h1>

            {/* Input Pencarian Modul */}
            <div className="relative w-full sm:w-72 md:w-80">
              <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul modul atau materi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Filter Akses & Topik Modul */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            {availableTopics.length > 2 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                  Topik:
                </span>
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(topic)}
                    className={`h-8 px-3 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                      selectedTopic.toLowerCase() === topic.toLowerCase()
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* Filter Akses Gratis vs Premium */}
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
          </div>
        </div>
      </div>

      {/* GRID KATALOG MODUL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat modul TheoNotes...</span>
          </div>
        ) : filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredModules.map((module) => (
              <NoteModuleCard key={module.id} module={module} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
            Tidak ada modul materi yang sesuai dengan pencarian.
          </div>
        )}
      </div>
    </div>
  );
}