'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DocumentCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function LogOutIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4m0 0v4m0-4h4m-4 0H1m15 4v4m0 0v4m0-4h4m-4 0h-4M10 3v4m0 0v4m0-4h4m-4 0H6" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // State Statistik Kontribusi
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const u = session.user;
        setUser(u);
        setEmail(u.email || '');
        setAvatarUrl(u.user_metadata?.avatar_url || '');

        // 1. Ambil nama dari tabel profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', u.id)
          .maybeSingle();

        if (profile?.full_name) {
          setFullName(profile.full_name);
        } else {
          setFullName(u.user_metadata?.full_name || u.user_metadata?.name || '');
        }

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }

        // 2. Ambil statistik kontribusi dari solution_submissions
        const { data: submissions } = await supabase
          .from('solution_submissions')
          .select('status')
          .eq('user_id', u.id);

        if (submissions) {
          const total = submissions.length;
          const approved = submissions.filter(s => s.status === 'approved').length;
          const pending = submissions.filter(s => s.status === 'pending').length;
          setStats({ total, approved, pending });
        }
      }

      setLoading(false);
    }

    loadProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // 1. Update/insert ke tabel profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // 2. Update user_metadata pada Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (authError) throw authError;

      setMessage({ type: 'success', text: 'Profil Anda berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal memperbarui profil: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    }
  };

  const getInitials = (name: string, mail: string) => {
    const text = name.trim() || mail.split('@')[0] || 'U';
    const parts = text.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  };

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      
      {/* Header Navigation */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
              <span className="sm:hidden">Beranda</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Pengaturan Profil
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 px-3 py-1.5 rounded-xl transition border border-red-200/60 dark:border-red-900/40 flex items-center gap-1.5"
                title="Keluar Akun"
              >
                <LogOutIcon />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {!user && !loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200 dark:border-indigo-900">
              <LockIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Akses Dibatasi</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Kamu harus masuk (login) ke akun TheoQED terlebih dahulu untuk melihat dan mengedit profil pengguna.
            </p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow">
              Kembali ke Beranda
            </Link>
          </div>
        ) : loading ? (
          <div className="py-24 text-center text-xs font-bold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span>Memuat data profil & statistik kontribusi...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KARTU 1: HEADER IDENTITAS PENGGUNA & AVATAR */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative z-10">
                
                {/* AVATAR PHOTO ATAU INITIALS */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto Profil"
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border-2 border-indigo-200 dark:border-indigo-900 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                    {getInitials(fullName, email)}
                  </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                      {fullName.trim() || 'Pengguna TheoQED'}
                    </h1>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 rounded-md border border-indigo-200 dark:border-indigo-900 inline-flex items-center gap-1">
                      <ShieldCheckIcon className="w-3 h-3" />
                      <span>Kontributor</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {email}
                  </p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>ID Akun: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{user.id.slice(0, 16)}...</code></span>
                  </div>
                </div>
              </div>

              {/* STATISTIK RINGKAS KONTRIBUSI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                  <div className="text-slate-400 dark:text-slate-500 flex justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white block">{stats.total}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Usulan</span>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center space-y-1">
                  <div className="text-emerald-600 dark:text-emerald-400 flex justify-center">
                    <DocumentCheckIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">{stats.approved}</span>
                  <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider block">Disetujui</span>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-center space-y-1">
                  <div className="text-amber-600 dark:text-amber-400 flex justify-center">
                    <ClockIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">{stats.pending}</span>
                  <span className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider block">Menunggu</span>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-center space-y-1">
                  <div className="text-indigo-600 dark:text-indigo-400 flex justify-center">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block">{approvalRate}%</span>
                  <span className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider block">Akurasi Acc</span>
                </div>

              </div>
            </div>

            {/* KARTU 2: FORMULIR EDIT PROFIL */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Informasi Profil Publik
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Perbarui nama tampilan yang akan tertera secara resmi pada pembahasan solusi yang disetujui.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                
                {message && (
                  <div
                    className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                      message.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                    }`}
                  >
                    {message.type === 'success' && <CheckIcon className="w-4 h-4 shrink-0" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Nama Lengkap / Nama Tampilan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dave Marcellino Sancia"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition font-medium"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Nama ini otomatis digunakan sebagai penanda hak cipta/penulis saat pembahasan disetujui admin.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Alamat Email (Terkunci)</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <LockIcon className="w-3 h-3" /> Supabase OAuth
                    </span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Alamat email terhubung langsung dengan akun autentikasi Google / Supabase milikmu.
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}
      </main>

    </div>
  );
}