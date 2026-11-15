'use client';

import Link from 'next/link';
import { getModuleStyle } from '@/lib/note-styles';

export interface NoteModuleCardData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  topic?: string;
  is_premium?: boolean;
  note_chapters?: { id: string; parent_id?: string | null }[];
}

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function LockClosedIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function LayersIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

export function NoteModuleCard({ module }: { module: NoteModuleCardData }) {
  const mainChapterCount =
    module.note_chapters?.filter((ch) => !ch.parent_id)?.length || 0;
  const style = getModuleStyle(module.topic, module.title);

  return (
    <Link
      href={`/notes/${module.slug || module.id}`}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* BAGIAN ATAS: COVER CARD */}
      <div className="p-3 pb-0">
        <div
          className={`aspect-[4/5] ${style.bg} rounded-xl relative p-5 flex flex-col justify-between items-center text-center overflow-hidden`}
        >
          {/* Dekorasi Latar Halus Tanpa Warna Hitam */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-14 -left-14 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

          {/* Header Cover: THEONOTES & Judul di Tengah */}
          <div className="relative z-10 w-full space-y-1.5 pt-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              THEONOTES
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight line-clamp-2 px-1">
              {module.title}
            </h3>
          </div>

          {/* Ilustrasi Vektor Geometris di Tengah */}
          <div className="my-auto flex justify-center items-center relative z-10 transition-transform duration-300 group-hover:scale-110">
            {style.svg}
          </div>

          {/* Badge Bab Pembahasan di Bagian Bawah Cover */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/25">
              <LayersIcon className="w-3 h-3 text-white/90" />
              <span>{mainChapterCount} Bab Pembahasan</span>
            </span>
          </div>
        </div>
      </div>

      {/* BAGIAN BAWAH: JUDUL, DESKRIPSI, STATUS AKSES & TOMBOL */}
      <div className="p-4 pt-3.5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            {module.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            {module.description || 'Rangkuman dan pembuktian matematika terstruktur.'}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Baris Metadata & Label Premium/Gratis */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {module.topic || `${mainChapterCount} Bab`}
            </span>

            {module.is_premium ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 shrink-0">
                <LockClosedIcon className="w-3 h-3 text-amber-500" />
                <span>Premium</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                <span>Gratis</span>
              </span>
            )}
          </div>

          {/* Tombol Aksi Penuh */}
          <div className="w-full h-9 px-4 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition">
            <span>Baca Modul</span>
            <ArrowRightIcon className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition duration-200" />
          </div>
        </div>
      </div>
    </Link>
  );
}