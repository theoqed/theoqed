'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { MathText } from '@/components/MathText';
import { Theorem } from '@/types/theorem';

// --- SVG ICONS ---
function ArrowRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
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

export default function TeoremaLibraryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [theorems, setTheorems] = useState<Theorem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function fetchTheorems() {
      setLoading(true);
      const { data, error } = await supabase
        .from('theorems')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data) {
        setTheorems(data as Theorem[]);
      }
      setLoading(false);
    }

    fetchTheorems();
  }, [supabase]);

  const fields = useMemo(() => {
    return Array.from(new Set(theorems.map((t) => t.field)));
  }, [theorems]);

  const filteredTheorems = useMemo(() => {
    return theorems.filter((t) => {
      const matchesField = selectedField === 'ALL' || t.field === selectedField;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        (t.mathematicians && t.mathematicians.toLowerCase().includes(q)) ||
        t.statement.toLowerCase().includes(q);

      return matchesField && matchesQuery;
    });
  }, [theorems, selectedField, searchQuery]);

  const groupedByField = useMemo(() => {
    const groups: Record<string, Theorem[]> = {};
    for (const item of filteredTheorems) {
      if (!groups[item.field]) {
        groups[item.field] = [];
      }
      groups[item.field].push(item);
    }
    return groups;
  }, [filteredTheorems]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      <Navbar />

      {/* Control Panel Perpustakaan Teorema */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Perpustakaan Teorema
            </h1>

            {/* Statistik & Input Pencarian */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!loading && (
                <div className="flex items-center gap-2">
                  <div className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs inline-flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{theorems.length}</span>
                    <span className="text-slate-500 dark:text-slate-400">Teorema</span>
                  </div>
                  <div className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs inline-flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{fields.length}</span>
                    <span className="text-slate-500 dark:text-slate-400">Bidang</span>
                  </div>
                </div>
              )}

              <div className="relative w-full sm:w-72 md:w-80">
                <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari teorema, topik, atau tokoh..."
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
            </div>
          </div>

          {/* Filter Bidang */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
              Bidang:
            </span>
            <button
              type="button"
              onClick={() => setSelectedField('ALL')}
              className={`h-8 px-3 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                selectedField === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua Bidang
            </button>
            {fields.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setSelectedField(field)}
                className={`h-8 px-3 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  selectedField === field
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar Teorema Dikelompokkan per Bidang */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat perpustakaan teorema...</span>
          </div>
        ) : Object.keys(groupedByField).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 max-w-md mx-auto mt-6">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/80 dark:border-slate-700">
              <BookOpenIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada teorema yang cocok
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coba ubah kata kunci pencarian atau pilih opsi &ldquo;Semua Bidang&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByField).map(([fieldName, items]) => (
              <section key={fieldName} className="space-y-4">
                {/* Judul Bidang + Jumlah */}
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {fieldName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900 text-xs font-bold">
                    {items.length}
                  </span>
                </div>

                {/* Grid Kartu Teorema */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {items.map((theorem) => (
                    <Link
                      key={theorem.id}
                      href={`/teorema/${theorem.slug}`}
                      className="group flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="space-y-3.5">
                        {/* Baris Tag Topik, Tokoh & Judul */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                              {theorem.topic}
                            </span>
                            {theorem.mathematicians && (
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {theorem.mathematicians}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {theorem.title}
                          </h3>
                        </div>

                        {/* Pernyataan Teorema (KaTeX) */}
                        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200">
                          <MathText text={theorem.statement} />
                        </div>
                      </div>

                      {/* Link Footer */}
                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 transition">
                        <span>Baca intuisi &amp; pembuktian</span>
                        <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}