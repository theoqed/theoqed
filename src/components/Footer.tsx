'use client';

import Link from 'next/link';

function MailIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-colors duration-200 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Info & Contact Buttons */}
          <div className="space-y-4 md:col-span-6">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-900 dark:text-white inline-flex items-center gap-0.5"
            >
              <span className="text-indigo-600 dark:text-indigo-400">√</span>
              <span>TheoQED</span>
              <span className="text-indigo-600 dark:text-indigo-400">.</span>
            </Link>

            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              Platform arsip soal olimpiade matematika (ONMIPA-PT, OSN, IMC), kelas terstruktur, direktori teorema beserta pembuktian, catatan kuliah (TheoNotes), serta simulasi ujian Try Out CBT.
            </p>

            {/* Tombol Email & Instagram */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <a
                href="mailto:theoqed@gmail.com"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition"
              >
                <MailIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>theoqed@gmail.com</span>
              </a>

              <a
                href="https://instagram.com/theoqed.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>@theoqed.id</span>
              </a>

              <a
                href="https://instagram.com/davemarcellino_"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>@davemarcellino_</span>
              </a>
            </div>
          </div>

          {/* Navigasi Bank Soal */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Koleksi Soal
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/arsip" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  ONMIPA-PT
                </Link>
              </li>
              <li>
                <Link href="/arsip" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  MIT Integration Bee
                </Link>
              </li>
              <li>
                <Link href="/arsip" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  International Math Competition
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Koleksi Bookmarks Saya
                </Link>
              </li>
            </ul>
          </div>

          {/* Ekosistem & Modul */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Ekosistem Belajar
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Courses &amp; Silabus
                </Link>
              </li>
              <li>
                <Link href="/notes" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  TheoNotes Library
                </Link>
              </li>
              <li>
                <Link href="/teorema" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Kumpulan Teorema
                </Link>
              </li>
              <li>
                <Link href="/tryout" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Simulasi Try Out CBT
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Kontribusi Solusi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <p>© 2026 TheoQED. All rights reserved.</p>
          <a
            href="https://instagram.com/davemarcellino_"
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Developed by @davemarcellino_
          </a>
        </div>
      </div>
    </footer>
  );
}