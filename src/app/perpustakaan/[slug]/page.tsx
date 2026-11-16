'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface BookDetail {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  level: string;
  year: number | null;
  pages: number | null;
  description: string | null;
  cover_drive_id: string | null;
  is_premium: boolean;
}

export default function BookReaderPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [pdfDriveId, setPdfDriveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (slug) loadBookAndSource(slug);
  }, [slug]);

  async function loadBookAndSource(bookSlug: string) {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    setIsLoggedIn(Boolean(authData?.user));

    const { data: bookData } = await supabase
      .from('books')
      .select('id, slug, title, author, category, level, year, pages, description, cover_drive_id, is_premium')
      .eq('slug', bookSlug)
      .eq('is_published', true)
      .single();

    if (bookData) {
      setBook(bookData as BookDetail);

      const { data: sourceData } = await supabase
        .from('book_sources')
        .select('pdf_drive_id')
        .eq('book_id', bookData.id)
        .maybeSingle();

      setPdfDriveId(sourceData?.pdf_drive_id || null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>Memuat dokumen perpustakaan...</span>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Buku tidak ditemukan atau belum dipublikasikan.
        </p>
        <Link
          href="/perpustakaan"
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center transition"
        >
          Kembali ke Perpustakaan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Reader Navbar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Kiri: Tombol Kembali & Breadcrumb Judul Buku */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/perpustakaan"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Kembali ke Perpustakaan</span>
              <span className="sm:hidden">Katalog</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {book.title}
              </h1>
              <span
                className={`hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                  book.is_premium
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60'
                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60'
                }`}
              >
                {book.is_premium ? 'Premium' : 'Gratis'}
              </span>
            </div>
          </div>

          {/* Kanan: Info Penulis Ringkas, Mode Fokus & Toggle Tema */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden xl:inline-block text-[11px] text-slate-400 dark:text-slate-500 mr-1 max-w-64 truncate">
              {book.author}
              {book.year ? ` · ${book.year}` : ''}
              {book.pages ? ` · ${book.pages} Hal` : ''}
            </span>

            {pdfDriveId && (
              <button
                type="button"
                onClick={() => setFocusMode((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  focusMode
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
                  />
                </svg>
                <span>Mode Fokus</span>
              </button>
            )}

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

      {/* Area Pembaca PDF atau Paywall */}
      <main
        className={`flex-1 w-full mx-auto transition-all duration-200 ${
          focusMode
            ? 'max-w-none px-0 pt-0 pb-0'
            : 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 pb-10'
        }`}
      >
        {pdfDriveId ? (
          <div
            className={`relative bg-white dark:bg-slate-900 overflow-hidden ${
              focusMode
                ? 'rounded-none border-0'
                : 'rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'
            }`}
          >
            {/* Watermark TheoQED sekaligus menutup tombol pop-out Google Drive secara penuh */}
            <div
              aria-hidden="true"
              title="TheoQED Digital Library"
              className="absolute top-2.5 right-[18px] w-[58px] h-[54px] z-10 rounded-xl bg-[#202124] border border-white/10 shadow-md flex items-center justify-center pointer-events-auto select-none"
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="32" height="32" rx="8" fill="#2563EB" />
                <path
                  d="M7.5 17.5L11.5 22.5L16.5 10.5H24.5"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <iframe
              src={`https://drive.google.com/file/d/${pdfDriveId}/preview`}
              title={book.title}
              className={`w-full border-0 transition-all duration-200 ${
                focusMode ? 'h-[calc(100vh-3.5rem)]' : 'h-[85vh]'
              }`}
              allow="autoplay"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 max-w-2xl mx-auto text-center space-y-4 my-10">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
              Koleksi Khusus Member Premium
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Upgrade ke Premium untuk Membaca Buku Ini
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {book.description ||
                'Buku dan diktat pilihan ini tersedia secara penuh untuk anggota TheoQED Premium.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center"
                >
                  Masuk Akun
                </Link>
              )}
              <Link
                href="/premium"
                className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black inline-flex items-center transition"
              >
                Lihat Paket Premium
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}