'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- SVG ICONS ---
function MenuIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LogOutIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function AtlasIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function MathStudioIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function GamepadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop Dropdown States
  const [openDropdown, setOpenDropdown] = useState<'tools' | 'arcade' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const photo = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';
        setAvatarUrl(photo);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        setFullName(profile?.full_name || session.user.user_metadata?.full_name || '');
        setIsAdmin(profile?.role === 'admin' || profile?.is_admin === true);
      } else {
        setUser(null);
        setAvatarUrl('');
        setIsAdmin(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const photo = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';
        setAvatarUrl(photo);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        setFullName(profile?.full_name || session.user.user_metadata?.full_name || '');
        setIsAdmin(profile?.role === 'admin' || profile?.is_admin === true);
        setShowAuthModal(false);
        resetForm();
      } else {
        setUser(null);
        setAvatarUrl('');
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Event listener untuk menutup dropdown saat klik di luar menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup menu saat rute berpindah
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

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
        setAuthError(error.message === 'Invalid login credentials' ? 'Email atau kata sandi tidak cocok.' : error.message);
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
          setAuthSuccess('Pendaftaran berhasil! Silakan periksa inbox email Anda untuk mengonfirmasi akun.');
        }
      }
    }

    setLoadingAuth(false);
  };

  // Navigasi Utama
  const mainNavLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Arsip Soal', href: '/arsip' },
    { name: 'TheoNotes', href: '/notes' },
    { name: 'Try Out', href: '/tryout' },
    { name: 'Bookmarks', href: '/bookmarks' },
  ];

  // Modul / Studio Tools
  const studioLinks = [
    {
      name: 'Knowledge Atlas',
      desc: 'Ensiklopedia & Graf Relasi Konsep',
      href: '/knowledge-atlas',
      icon: AtlasIcon,
    },
    {
      name: 'Math Studio',
      desc: 'Komputasi & Grafik 2D/3D Interaktif',
      href: '/math-studio',
      icon: MathStudioIcon,
    },
  ];

  // Arcade & Games
  const arcadeLinks = [
    {
      name: 'Puzzle Arcade',
      desc: 'Koleksi Gim Puzzle (2048, dll)',
      href: '/puzzlearcade',
      icon: GamepadIcon,
    },
    {
      name: 'Strategy Arena',
      desc: 'Gim Strategi & Taktik Matematika',
      href: '/strategy-arena',
      icon: SparklesIcon,
    },
  ];

  const getInitials = (name: string, mail?: string) => {
    const text = name.trim() || (mail ? mail.split('@')[0] : 'U');
    const parts = text.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* HEADER DESKTOP & MOBILE TRIGGER */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {/* Tombol Hamburger Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Buka Menu Navigation"
            >
              <MenuIcon />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 shrink-0">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION (Compact Dropdowns) */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center gap-6">
            {mainNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-bold transition ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* DROPDOWN 1: STUDIOS & TOOLS */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'tools' ? null : 'tools')}
                className={`flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
                  pathname.startsWith('/knowledge-atlas') || pathname.startsWith('/math-studio')
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Studios</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'tools' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'tools' && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {studioLinks.map((item) => {
                    const Icon = item.icon;
                    const isSubActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
                          isSubActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <Icon />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DROPDOWN 2: ARCADE & GAMES */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'arcade' ? null : 'arcade')}
                className={`flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
                  pathname.startsWith('/puzzlearcade') || pathname.startsWith('/strategy-arena')
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Arcade</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'arcade' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'arcade' && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {arcadeLinks.map((item) => {
                    const Icon = item.icon;
                    const isSubActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
                          isSubActive
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-purple-100/60 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mt-0.5">
                          <Icon />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* USER ACCOUNT CONTROLS */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800 transition hidden sm:flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheckIcon />
                    <span>Admin Portal</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                    pathname === '/profile'
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Profil'}
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {getInitials(fullName, user.email)}
                    </div>
                  )}

                  <span className="max-w-[120px] truncate hidden sm:inline font-semibold">
                    {fullName.trim() || user.email?.split('@')[0]}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition text-xs font-bold hidden sm:flex items-center gap-1 cursor-pointer"
                  title="Keluar / Logout"
                >
                  <LogOutIcon />
                  <span className="hidden lg:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  resetForm();
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Masuk
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWER (TERINTEGRASI LENGKAP) */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar Panel Drawer */}
        <div
          className={`relative flex flex-col w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-6 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-10 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header Drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 py-4 space-y-6 overflow-y-auto">
            {/* GRUP 1: UTAMA */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-3 mb-1">
                Akademik
              </span>
              {mainNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* GRUP 2: STUDIOS */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block px-3 mb-1">
                TheoQED Studios
              </span>
              {studioLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-500" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* GRUP 3: ARCADE */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block px-3 mb-1">
                Arcade & Games
              </span>
              {arcadeLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-purple-500" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* ADMIN LINK MOBILE */}
            {user && isAdmin && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block px-3 mb-1">
                  Administrator
                </span>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
                >
                  <ShieldCheckIcon />
                  <span>Admin Portal</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Account Status Footer Mobile */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Profil'}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {getInitials(fullName, user.email)}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {fullName.trim() || 'Pengguna'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl transition border border-red-200/60 dark:border-red-900/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOutIcon />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setAuthMode('login');
                  resetForm();
                  setShowAuthModal(true);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900">
                  <SparklesIcon />
                  <span>TheoQED Access</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {authMode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Barumu'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {authMode === 'login'
                    ? 'Akses bank soal, TheoNotes, dan fitur try out interaktif.'
                    : 'Bergabung untuk menyimpan bookmark & mengikuti pembahasan.'}
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
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
                className={`flex-1 py-2 rounded-xl transition ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Daftar Akun
              </button>
            </div>

            {authError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-medium text-red-600 dark:text-red-400">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {authSuccess}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loadingAuth}
              className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200/80 dark:border-slate-800 transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{authMode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200/80 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">atau email</span>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {authMode === 'register' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Dave Marcellino"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingAuth ? (
                  <span>Memproses...</span>
                ) : (
                  <span>{authMode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Baru'}</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {authMode === 'login' ? 'Belum punya akun? ' : 'Sudah terdaftar? '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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