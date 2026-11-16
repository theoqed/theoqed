'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isPremiumActive } from '@/lib/premium';
import { Navbar } from '@/components/Navbar';

interface PublicBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  level: string;
  year: number | null;
  pages: number | null;
  cover_drive_id: string | null;
  is_premium: boolean;
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export default function PerpustakaanPage() {
  const supabase = useMemo(() => createClient(), []);
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIsPremium, setUserIsPremium] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    initData();
  }, [supabase]);

  async function initData() {
    setLoading(true);

    const [booksRes, authRes] = await Promise.all([
      supabase
        .from('books')
        .select('id, slug, title, author, category, level, year, pages, cover_drive_id, is_premium')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);

    if (booksRes.data) {
      setBooks(booksRes.data as PublicBook[]);
    }

    if (authRes.data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, premium_until, role')
        .eq('id', authRes.data.user.id)
        .single();

      if (profile && (profile.role?.toLowerCase() === 'admin' || isPremiumActive(profile))) {
        setUserIsPremium(true);
      }
    }

    setLoading(false);
  }

  const availableCategories = useMemo(
    () => [
      'Semua',
      ...Array.from(new Set(books.map((b) => b.category).filter(Boolean) as string[])),
    ],
    [books]
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'Semua' ||
        b.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'free' && !b.is_premium) ||
        (accessFilter === 'premium' && Boolean(b.is_premium));

      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [books, searchQuery, selectedCategory, accessFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      <Navbar />

      {/* Control Panel Katalog Perpustakaan (Identik dengan TheoNotes) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Perpustakaan Buku
            </h1>

            {/* Input Pencarian Buku */}
            <div className="relative w-full sm:w-80 md:w-96">
              <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul buku atau nama penulis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Filter Bidang & Akses */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            {availableCategories.length > 2 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                  Bidang:
                </span>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-8 px-3 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
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

      {/* GRID KATALOG BUKU (Maksimal 5 Buku per Baris) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat koleksi perpustakaan...</span>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/perpustakaan/${book.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-3.5 flex flex-col justify-between gap-3 transition shadow-2xs hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Cover Bersih */}
                  <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-200/60 dark:border-slate-800">
                    {book.cover_drive_id ? (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${book.cover_drive_id}&sz=w500`}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col justify-between text-white">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">
                          TheoQED Press
                        </span>
                        <p className="text-xs font-extrabold leading-snug line-clamp-4">
                          {book.title}
                        </p>
                        <span className="text-[10px] text-slate-400 truncate">{book.author}</span>
                      </div>
                    )}
                  </div>

                  {/* Judul & Penulis */}
                  <div className="space-y-0.5 px-0.5">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {book.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </div>

                {/* Label Jenjang + Gratis/Premium & Tombol CTA */}
                <div className="space-y-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1.5 px-0.5">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {book.level}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        book.is_premium
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60'
                      }`}
                    >
                      {book.is_premium ? 'Premium' : 'Gratis'}
                    </span>
                  </div>

                  <div className="w-full h-8 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition">
                    <span>
                      {book.is_premium && !userIsPremium ? 'Lihat Detail' : 'Baca Buku'}
                    </span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
            Tidak ada buku yang sesuai dengan pencarian.
          </div>
        )}
      </div>
    </div>
  );
}