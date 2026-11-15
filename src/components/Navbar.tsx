'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getMembershipState, MembershipState } from '@/lib/premium';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Daftar 6 halaman utama yang menggunakan Navbar ini
const MAIN_NAV_ROUTES = ['/', '/arsip', '/notes', '/teorema', '/courses', '/tryout'];

// --- SVG ICONS ---
function MenuIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HomeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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

function ArchiveIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function NotesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function TheoremIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CourseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function LogOutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function CrownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
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

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [membershipState, setMembershipState] = useState<MembershipState>('free');
  const [hasPendingBill, setHasPendingBill] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const supabase = createClient();

  const isMainPage = MAIN_NAV_ROUTES.includes(pathname);

  async function syncUserProfile(sessionUser: any) {
    setUser(sessionUser);
    const photo =
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      '';
    setAvatarUrl(photo);

    const [{ data: profile }, { data: pendingBill }] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, role, is_premium, premium_until')
        .eq('id', sessionUser.id)
        .maybeSingle(),
      supabase
        .from('payments')
        .select('id')
        .eq('user_id', sessionUser.id)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle(),
    ]);

    setFullName(
      profile?.full_name ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        ''
    );
    setIsAdmin(profile?.role === 'admin');
    setMembershipState(getMembershipState(profile));
    setHasPendingBill(Boolean(pendingBill));
  }

  useEffect(() => {
    if (!isMainPage) return;

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await syncUserProfile(session.user);
      } else {
        setUser(null);
        setAvatarUrl('');
        setIsAdmin(false);
        setMembershipState('free');
        setHasPendingBill(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          await syncUserProfile(session.user);
          setShowAuthModal(false);
          resetForm();
        } else {
          setUser(null);
          setAvatarUrl('');
          setIsAdmin(false);
          setMembershipState('free');
          setHasPendingBill(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isMainPage]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Jangan render Navbar utama di subpage (subpage memakai navbar tersendiri)
  if (!isMainPage) {
    return null;
  }

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRegisterName('');
    setAuthError('');
    setAuthSuccess('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleGoogleLogin = async () => {
    setLoadingAuth(true);
    setAuthError('');
    setAuthSuccess('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setAuthError(error.message);
    setLoadingAuth(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(
          error.message === 'Invalid login credentials'
            ? 'Email atau kata sandi tidak cocok.'
            : error.message
        );
      } else {
        setShowAuthModal(false);
        resetForm();
      }
    } else {
      if (!registerName.trim()) {
        setAuthError('Nama lengkap wajib diisi.');
        setLoadingAuth(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: registerName.trim(),
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        if (data.session) {
          setShowAuthModal(false);
          resetForm();
        } else {
          setAuthSuccess(
            'Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk mengonfirmasi akun.'
          );
        }
      }
    }

    setLoadingAuth(false);
  };

  const navLinks = [
    { name: 'Beranda', href: '/', icon: HomeIcon, exact: true },
    { name: 'Arsip Soal', href: '/arsip', icon: ArchiveIcon },
    { name: 'TheoNotes', href: '/notes', icon: NotesIcon },
    { name: 'Teorema', href: '/teorema', icon: TheoremIcon },
    { name: 'Course', href: '/courses', icon: CourseIcon },
    { name: 'Try Out', href: '/tryout', icon: ClipboardCheckIcon },
  ];

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const getInitials = (name: string, mail?: string) => {
    const text = name.trim() || (mail ? mail.split('@')[0] : 'U');
    const parts = text.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  };

  const isPremium = membershipState === 'active';

  return (
    <>
      {/* HEADER DESKTOP & MOBILE TRIGGER — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0">
            {/* Tombol Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              <MenuIcon />
            </button>

            {/* Brand Logo */}
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 shrink-0"
            >
              <span className="text-indigo-600 dark:text-indigo-400">√</span>
              <span>TheoQED</span>
              <span className="text-indigo-600 dark:text-indigo-400">.</span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION (6 Menu Utama) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-1 flex items-center text-xs tracking-wide whitespace-nowrap transition ${
                    active
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{item.name}</span>
                  {active && (
                    <span className="absolute -bottom-5 left-0 right-0 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* USER ACCOUNT CONTROLS — Tinggi & Bentuk Seragam (h-9 rounded-xl) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />

            {user ? (
              <>
                {hasPendingBill ? (
                  <Link
                    href={`/upgrade?bill=open&redirect=${encodeURIComponent(pathname || '/')}`}
                    className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-bold transition whitespace-nowrap"
                    title="Ada tagihan yang menunggu pembayaran"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>Tagihan Aktif</span>
                  </Link>
                ) : (
                  !isPremium && (
                    <Link
                      href={`/upgrade?redirect=${encodeURIComponent(pathname || '/')}`}
                      className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-bold transition whitespace-nowrap"
                    >
                      <CrownIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Upgrade ke Premium</span>
                    </Link>
                  )
                )}

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 text-xs font-semibold transition whitespace-nowrap"
                  >
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold transition"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Profil'}
                      className="w-5 h-5 rounded-md object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {getInitials(fullName, user.email)}
                    </div>
                  )}

                  <span className="max-w-32 truncate hidden sm:inline">
                    {fullName.trim() || user.email?.split('@')[0]}
                  </span>

                  {isPremium && (
                    <span
                      className="text-amber-500 shrink-0"
                      title="Akun Premium"
                    >
                      <CrownIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100/90 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200/80 dark:border-slate-700/80 hover:border-red-200 dark:hover:border-red-900/60 transition cursor-pointer"
                  title="Keluar Akun"
                  aria-label="Keluar Akun"
                >
                  <LogOutIcon />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  resetForm();
                  setShowAuthModal(true);
                }}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWER */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={`relative flex flex-col w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-5 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-10 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5"
            >
              <span className="text-indigo-600 dark:text-indigo-400">√</span>
              <span>TheoQED</span>
              <span className="text-indigo-600 dark:text-indigo-400">.</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Tutup Menu"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-3 mb-2">
              Navigasi
            </span>

            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}

            {user && isAdmin && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block px-3 mb-2">
                  Administrator
                </span>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50/90 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30"
                >
                  <ShieldCheckIcon />
                  <span>Admin Portal</span>
                </Link>
              </div>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            {user ? (
              <>
                {hasPendingBill ? (
                  <Link
                    href={`/upgrade?bill=open&redirect=${encodeURIComponent(pathname || '/')}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full h-9 px-3.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>Tagihan Aktif</span>
                  </Link>
                ) : (
                  !isPremium && (
                    <Link
                      href={`/upgrade?redirect=${encodeURIComponent(pathname || '/')}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full h-9 px-3.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <CrownIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Upgrade ke Premium</span>
                    </Link>
                  )
                )}

                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-indigo-400 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName || 'Profil'}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        onError={() => setAvatarUrl('')}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(fullName, user.email)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {fullName.trim() || 'Pengguna'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {isPremium ? 'Akun Premium' : 'Akun Gratis'}
                      </p>
                    </div>
                  </div>
                  {isPremium && (
                    <span className="text-amber-500 shrink-0">
                      <CrownIcon className="w-4 h-4" />
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-9 px-3.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition border border-red-200/70 dark:border-red-900/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOutIcon />
                  <span>Keluar Akun</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setAuthMode('login');
                  resetForm();
                  setShowAuthModal(true);
                }}
                className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <SparklesIcon />
                <span>Masuk / Daftar Akun</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AUTHENTICATION POPUP MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-200/80 dark:border-indigo-900">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>TheoQED Access</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight pt-1">
                  {authMode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {authMode === 'login'
                    ? 'Akses bank soal, TheoNotes, dan fitur try out interaktif.'
                    : 'Bergabung untuk menyimpan bookmark & mengikuti pembahasan.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Tutup Modal"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Daftar Akun
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-medium text-red-600 dark:text-red-400">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {authSuccess}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingAuth}
              className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-800 transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authMode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200/80 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                atau email
              </span>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {authMode === 'register' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dave Marcellino"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingAuth ? (
                  <span>Memproses...</span>
                ) : (
                  <span>{authMode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Baru'}</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {authMode === 'login' ? 'Belum punya akun? ' : 'Sudah terdaftar? '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {authMode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}