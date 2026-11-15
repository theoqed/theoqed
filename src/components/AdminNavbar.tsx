'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- SVG CUSTOM ICONS ---
function GlobeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
    </svg>
  );
}

function MenuIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DashboardIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zm10-3a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function FolderIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function AcademicCapIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
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

function LibraryIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
}

function ClipboardCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function InboxCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartBarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DocumentTextIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

interface NavItem {
  name: string;
  href: string;
  description?: string;
  icon: React.ReactNode;
}

const PRIMARY_LINKS: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: <DashboardIcon /> },
  { name: 'Bank Soal', href: '/admin/problems', icon: <FolderIcon /> },
  { name: 'Courses', href: '/admin/courses', icon: <AcademicCapIcon /> },
  { name: 'TheoNotes', href: '/admin/notes', icon: <BookOpenIcon /> },
  { name: 'Teorema', href: '/admin/teorema', icon: <LibraryIcon /> },
  { name: 'Try Out', href: '/admin/tryout', icon: <ClipboardCheckIcon /> },
  { name: 'Members', href: '/admin/members', icon: <UsersIcon /> },
];

const SUBMISSION_LINKS: NavItem[] = [
  {
    name: 'Moderasi Solusi',
    href: '/admin/submissions',
    description: 'Tinjau & setujui kontribusi solusi pengguna',
    icon: <InboxCheckIcon />,
  },
  {
    name: 'Hasil Try Out',
    href: '/admin/tryout/submissions',
    description: 'Rekap nilai & riwayat pengerjaan CBT',
    icon: <ChartBarIcon />,
  },
];

const STUDIO_LINKS: NavItem[] = [
  {
    name: 'Worksheet Generator',
    href: '/admin/worksheet',
    description: 'Susun paket soal & cetak lembar kerja',
    icon: <DocumentTextIcon />,
  },
  {
    name: 'Card Generator',
    href: '/admin/card-generator',
    description: 'Render soal LaTeX ke kartu grafis siap bagikan',
    icon: <SparklesIcon />,
  },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'submissions' | 'studio' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Kunci scroll body saat drawer mobile terbuka
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isRouteActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/tryout') {
      return (
        pathname === '/admin/tryout' ||
        (pathname.startsWith('/admin/tryout/') && !pathname.startsWith('/admin/tryout/submissions'))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isSubmissionsActive = SUBMISSION_LINKS.some((item) => isRouteActive(item.href));
  const isStudioActive = STUDIO_LINKS.some((item) => isRouteActive(item.href));

  return (
    <>
      <header className="sticky top-0 z-50 h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
              aria-label={mobileOpen ? 'Tutup Menu Admin' : 'Buka Menu Admin'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>

            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
                <span className="text-indigo-600 dark:text-indigo-400">√</span>
                <span>TheoQED</span>
                <span className="text-indigo-600 dark:text-indigo-400">.</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-900">
                Admin
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs font-bold">
            {PRIMARY_LINKS.map((link) => {
              const active = isRouteActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 xl:px-3 py-2 rounded-xl transition whitespace-nowrap ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Dropdown: Submissions */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === 'submissions' ? null : 'submissions')
                }
                className={`px-2.5 xl:px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSubmissionsActive || openDropdown === 'submissions'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-900'
                }`}
              >
                <span>Submissions</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    openDropdown === 'submissions' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'submissions' && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/40 p-1.5 z-50">
                  {SUBMISSION_LINKS.map((item) => {
                    const active = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
                          active
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold leading-tight">{item.name}</div>
                          {item.description && (
                            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-snug">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown: Studio & Generator */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'studio' ? null : 'studio')}
                className={`px-2.5 xl:px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isStudioActive || openDropdown === 'studio'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-900'
                }`}
              >
                <span>Studio</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    openDropdown === 'studio' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'studio' && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/40 p-1.5 z-50">
                  {STUDIO_LINKS.map((item) => {
                    const active = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
                          active
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold leading-tight">{item.name}</div>
                          {item.description && (
                            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-snug">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Action Button: Website Publik */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="h-9 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-2"
            >
              <GlobeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Website Publik</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER MENU (DI LUAR HEADER AGAR TIDAK TERPOTONG BACKDROP-BLUR) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed top-16 left-0 bottom-0 h-[calc(100dvh-4rem)] w-72 max-w-[82vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 lg:hidden p-4 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-5">
              {/* Utama & Konten */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 block">
                  Manajemen Konten
                </span>
                <nav className="space-y-1">
                  {PRIMARY_LINKS.map((link) => {
                    const active = isRouteActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          active
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Submissions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 block">
                  Evaluasi &amp; Submissions
                </span>
                <nav className="space-y-1">
                  {SUBMISSION_LINKS.map((link) => {
                    const active = isRouteActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          active
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Studio & Generator */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 block">
                  Studio &amp; Generator
                </span>
                <nav className="space-y-1">
                  {STUDIO_LINKS.map((link) => {
                    const active = isRouteActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          active
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="w-full h-10 px-3.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-center gap-2"
              >
                <GlobeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Kembali ke Website Publik</span>
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}