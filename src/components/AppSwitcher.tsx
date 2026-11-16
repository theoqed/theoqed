'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSwitcher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLingoActive = pathname.startsWith('/languages');

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Pindah Ruang Belajar"
        aria-expanded={open}
        title="Pindah Workspace TheoQED"
        className={`w-8 h-8 rounded-xl border inline-flex items-center justify-center transition cursor-pointer ${
          open || isLingoActive
            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="5" r="1.75" />
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="19" cy="5" r="1.75" />
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
          <circle cx="5" cy="19" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
          <circle cx="19" cy="19" r="1.75" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/40 p-2 z-50 space-y-1">
          <span className="block px-2.5 pt-1 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Ekosistem TheoQED
          </span>

          <Link
            href="/"
            className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
              !isLingoActive
                ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${
                !isLingoActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              √
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-extrabold leading-tight flex items-center gap-1.5">
                <span>TheoQED Math</span>
                {!isLingoActive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Bank Soal, TheoNotes, Teorema &amp; Perpustakaan
              </p>
            </div>
          </Link>

          <Link
            href="/languages"
            className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
              isLingoActive
                ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                isLingoActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              文A
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-extrabold leading-tight flex items-center gap-1.5">
                <span>TheoQED Lingo</span>
                {isLingoActive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Modul Bahasa, Catatan Tata Bahasa, Kosakata &amp; Flashcard
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}