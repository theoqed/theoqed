'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MathText } from '@/components/MathText';
import { Theorem } from '@/types/theorem';

// --- SVG ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
  const [theorems, setTheorems] = useState<Theorem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const supabase = createClient();

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
  }, []);

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
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-20 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Hero Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider border border-blue-200/80 dark:border-blue-900/80">
              <BookOpenIcon className="w-3.5 h-3.5" />
              <span>Perpustakaan Teorema</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Kumpulan Teorema
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Teorema, lemma, dan prinsip fundamental yang sering digunakan dalam soal ONMIPA-PT dan kompetisi matematika, lengkap dengan syarat, intuisi, serta pembuktian formal.
            </p>
          </div>

          {!loading && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs">
                <span className="font-black text-slate-900 dark:text-white">{theorems.length}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Teorema</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs">
                <span className="font-black text-slate-900 dark:text-white">{fields.length}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Bidang</span>
              </div>
            </div>
          )}
        </header>

        {/* Filter Bar & Search */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Field Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedField('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedField === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                Semua Bidang
              </button>
              {fields.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setSelectedField(field)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedField === field
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari teorema atau tokoh..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Daftar Teorema Dikelompokkan per Bidang (Grid 2 Kolom di Desktop) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : Object.keys(groupedByField).length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpenIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">
              Tidak ada teorema yang cocok
            </p>
            <p className="text-xs text-slate-500">
              Coba ubah kata kunci pencarian atau pilih opsi &ldquo;Semua Bidang&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedByField).map(([fieldName, items]) => (
              <section key={fieldName} className="space-y-4">
                {/* Judul Bidang + Jumlah */}
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    {fieldName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {items.length}
                  </span>
                </div>

                {/* Grid Kartu Teorema */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((theorem) => (
                    <Link
                      key={theorem.id}
                      href={`/teorema/${theorem.slug}`}
                      className="group flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="space-y-3">
                        {/* Baris Judul, Tag Topik & Tokoh */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                              {theorem.topic}
                            </span>
                            {theorem.mathematicians && (
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                {theorem.mathematicians}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {theorem.title}
                          </h3>
                        </div>

                        {/* Pernyataan Teorema (KaTeX) */}
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          <MathText text={theorem.statement} />
                        </div>
                      </div>

                      {/* Link Footer */}
                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          <span>Baca intuisi &amp; pembuktian</span>
                          <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}