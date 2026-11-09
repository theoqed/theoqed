'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- SVG CUSTOM ICONS (TANPA EMOJI) ---
function GlobeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
    </svg>
  );
}

function MenuIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function AdminNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Otomatis menutup sidebar HP saat berpindah halaman Rute
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Bank Soal', href: '/admin/problems' },
    { name: 'TheoNotes', href: '/admin/notes' },
    { name: 'Katalog Try Out', href: '/admin/tryout' },
    { name: 'Hasil & Submissions', href: '/admin/tryout/submissions' },
    { name: 'Moderasi Solusi', href: '/admin/submissions' },
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        
        {/* Brand Logo & Mobile Toggle Button */}
        <div className="flex items-center gap-3">
          {/* Tombol Hamburger Mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Buka Menu Navigasi"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>

          {/* Brand Logo & Badge Admin */}
          <Link href="/admin/tryout" className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
            <span className="text-indigo-600 dark:text-indigo-400">√TheoQED</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
              Admin
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs font-bold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin/tryout' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Button: Kembali ke Website Publik */}
        <div className="flex items-center gap-3">
          <Link
            href="/tryout"
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center gap-2"
          >
            <GlobeIcon />
            <span className="hidden sm:inline">Ke Website Publik</span>
          </Link>
        </div>

      </div>

      {/* MOBILE SIDEBAR / OFF-CANVAS DRAWER MENU */}
      {mobileOpen && (
        <>
          {/* Layer Backdrop Transparan */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Sidebar HP */}
          <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 lg:hidden p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                Menu Admin Portal
              </span>

              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/admin/tryout' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Tombol Akses Website Publik pada Bottom Sidebar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/tryout"
                onClick={() => setMobileOpen(false)}
                className="w-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-center gap-2"
              >
                <GlobeIcon />
                <span>Kembali ke Website Publik</span>
              </Link>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}