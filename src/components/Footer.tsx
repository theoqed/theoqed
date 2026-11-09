'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-colors duration-200 pt-12 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Arsip soal olimpiade matematika (ONMIPA-PT, OSN, IMC), catatan perkuliahan terstruktur (TheoNotes), serta platform pembahasan solusi interaktif berbasis LaTeX.
            </p>
            <div className="pt-1 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <a href="mailto:theoqed@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                theoqed@gmail.com
              </a>
              <span> • </span>
              <a href="https://instagram.com/theoqed.id" target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                @theoqed.id
              </a>
            </div>
          </div>

          {/* Navigasi Bank Soal */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Koleksi Soal
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/arsip" className="hover:text-blue-600 dark:hover:text-blue-400 transition">ONMIPA-PT</Link>
              </li>
              <li>
                <Link href="/arsip" className="hover:text-blue-600 dark:hover:text-blue-400 transition">MIT Integration Bee</Link>
              </li>
              <li>
                <Link href="/arsip" className="hover:text-blue-600 dark:hover:text-blue-400 transition">International Math Competition</Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Koleksi Bookmarks Saya</Link>
              </li>
            </ul>
          </div>

          {/* Ekosistem & Modul */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pembelajaran
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/notes" className="hover:text-blue-600 dark:hover:text-blue-400 transition">TheoNotes Library</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Kontribusi Solusi</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <p>©2026 TheoQED. All rights reserved.</p>
          <p className="font-mono">Developed by @davemarcellino_</p>
        </div>

      </div>
    </footer>
  );
}