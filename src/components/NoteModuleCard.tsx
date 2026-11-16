'use client';

import React from 'react';
import Link from 'next/link';
import { getModuleStyle } from '@/lib/note-styles';

export interface NoteModuleCardData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  topic?: string | null;
  is_premium?: boolean | null;
  note_chapters?: { id: string; parent_id?: string | null }[] | null;
}

export function NoteModuleCard({ module }: { module: NoteModuleCardData }) {
  const chapters = module.note_chapters || [];
  const rootChapters = chapters.filter((c) => !c.parent_id);
  const chapterCount = rootChapters.length > 0 ? rootChapters.length : chapters.length;

  const { bg, svg } = getModuleStyle(module.topic || undefined, module.title);
  const isPremium = Boolean(module.is_premium);

  return (
    <Link
      href={`/notes/${module.slug}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-2.5 sm:p-3.5 flex flex-col justify-between gap-2.5 sm:gap-3 transition shadow-2xs hover:shadow-md"
    >
      <div className="space-y-2.5 sm:space-y-3">
        {/* Sampul Kartu dari lib/note-styles.tsx */}
        <div
          className={`relative aspect-[3/4] w-full rounded-xl overflow-hidden ${bg} p-2.5 sm:p-4 flex flex-col items-center justify-between text-center text-white select-none`}
        >
          {/* Layer Ambient Glow */}
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none"
          />

          {/* Header Atas: THEONOTES & Judul */}
          <div className="relative z-10 w-full space-y-0.5">
            <span className="block text-[8px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/80">
              TheoNotes
            </span>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wide leading-tight line-clamp-2 drop-shadow-xs">
              {module.title}
            </p>
          </div>

          {/* Ilustrasi Vektor dari lib/note-styles.tsx */}
          <div className="relative z-10 my-auto flex items-center justify-center scale-[0.8] sm:scale-95 group-hover:scale-[0.86] sm:group-hover:scale-100 transition-transform duration-300">
            {svg}
          </div>

          {/* Badge Jumlah Bab di Bawah Tengah (Anti-Terpotong di Mobile) */}
          <div className="relative z-10 inline-flex items-center justify-center gap-1 sm:gap-1.5 max-w-full px-2 sm:px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs border border-white/15 text-[9px] sm:text-[11px] font-bold text-white whitespace-nowrap">
            <svg
              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0 opacity-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            <span className="truncate">{chapterCount} Bab Pembahasan</span>
          </div>
        </div>

        {/* Judul & Deskripsi Singkat */}
        <div className="space-y-0.5 px-0.5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            {module.title}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            {module.description || 'Catatan materi & pembahasan terstruktur'}
          </p>
        </div>
      </div>

      {/* Footer Label Topik + Gratis/Premium & Tombol CTA */}
      <div className="space-y-2 sm:space-y-2.5 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-1.5 px-0.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {module.topic || 'Umum'}
          </span>

          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold shrink-0 ${
              isPremium
                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60'
            }`}
          >
            {isPremium ? 'Premium' : 'Gratis'}
          </span>
        </div>

        <div className="w-full h-8 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 sm:gap-1.5 transition">
          <span>Baca Modul</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}