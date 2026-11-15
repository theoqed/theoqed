'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  getMembershipState,
  getRemainingDays,
  formatIndonesianDate,
  MembershipState,
} from '@/lib/premium';

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M17 7H8M17 7v9" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
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

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function ShieldCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

function LockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CrownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function ReceiptIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function KeyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function ExclamationCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  const [role, setRole] = useState<string>('user');
  const [authProvider, setAuthProvider] = useState<string>('email');
  const [joinedAt, setJoinedAt] = useState<string | null>(null);

  // State Keanggotaan Premium
  const [membershipState, setMembershipState] = useState<MembershipState>('free');
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [pendingInvoiceCode, setPendingInvoiceCode] = useState<string | null>(null);

  // State Statistik Kontribusi
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });

  // State Form Profil & Kata Sandi
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const u = session.user;
        setUser(u);
        setEmail(u.email || '');
        setAvatarUrl(u.user_metadata?.avatar_url || u.user_metadata?.picture || '');
        setAuthProvider(u.app_metadata?.provider || 'email');
        setJoinedAt(u.created_at || null);

        const [{ data: profile }, { data: submissions }, { data: pendingBill }] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, avatar_url, role, is_premium, premium_until')
            .eq('id', u.id)
            .maybeSingle(),
          supabase
            .from('solution_submissions')
            .select('status')
            .eq('user_id', u.id),
          supabase
            .from('payments')
            .select('invoice_code')
            .eq('user_id', u.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (profile?.full_name) {
          setFullName(profile.full_name);
        } else {
          setFullName(u.user_metadata?.full_name || u.user_metadata?.name || '');
        }

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }

        if (profile?.role) {
          setRole(profile.role);
        }

        setPremiumUntil(profile?.premium_until || null);
        setMembershipState(getMembershipState(profile));
        setPendingInvoiceCode(pendingBill?.invoice_code || null);

        if (submissions) {
          const total = submissions.length;
          const approved = submissions.filter((s) => s.status === 'approved').length;
          const pending = submissions.filter((s) => s.status === 'pending').length;
          setStats({ total, approved, pending });
        }
      }

      setLoading(false);
    }

    loadProfileData();
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (authError) throw authError;

      setMessage({ type: 'success', text: 'Profil Anda berhasil diperbarui.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal memperbarui profil: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Kata sandi akun berhasil diperbarui.' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: `Gagal mengubah kata sandi: ${err.message}` });
    } finally {
      setSavingPassword(false);
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

  const formatJoinDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const remainingDays = getRemainingDays(premiumUntil);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Header Navigation — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Profil Akun
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 px-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition border border-red-200/70 dark:border-red-900/50 inline-flex items-center gap-1.5 cursor-pointer"
                title="Keluar Akun"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {!user && !loading ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto mt-12">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200/80 dark:border-indigo-900">
              <LockIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Masuk ke Akun Diperlukan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Silakan masuk ke akun TheoQED terlebih dahulu untuk mengelola profil dan status langganan Anda.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              Masuk di Beranda
            </Link>
          </div>
        ) : loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat informasi profil...</span>
          </div>
        ) : (
          <>
            {/* KARTU 1: IDENTITAS PENGGUNA & RINGKASAN KONTRIBUSI */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                {/* Foto & Nama */}
                <div className="flex items-center gap-4 min-w-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Foto Profil"
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                      {getInitials(fullName, email)}
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                        {fullName.trim() || 'Pengguna TheoQED'}
                      </h1>
                      {membershipState === 'active' ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 rounded-lg border border-amber-500/40 inline-flex items-center gap-1">
                          <CrownIcon className="w-3 h-3 text-amber-500" />
                          <span>Premium</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700">
                          Gratis
                        </span>
                      )}

                      {role === 'admin' ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg border border-indigo-200/70 dark:border-indigo-900/70 inline-flex items-center gap-1">
                          <ShieldCheckIcon className="w-3 h-3" />
                          <span>Administrator</span>
                        </span>
                      ) : (
                        stats.approved >= 1 && (
                          <span className="px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg border border-indigo-200/70 dark:border-indigo-900/70 inline-flex items-center gap-1">
                            <ShieldCheckIcon className="w-3 h-3" />
                            <span>Kontributor</span>
                          </span>
                        )
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {email}
                    </p>
                  </div>
                </div>

                {/* ID Akun */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    ID Akun
                  </span>
                  <code className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {user.id.slice(0, 14)}...
                  </code>
                </div>
              </div>

              {/* Statistik Kontribusi dalam 1 Baris */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Total Usulan
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {stats.total}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    <DocumentTextIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Disetujui
                    </span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {stats.approved}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Menunggu
                    </span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      {stats.pending}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ClockIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Rasio Acc
                    </span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      {approvalRate}%
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <ChartBarIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </section>

            {/* KARTU 2: STATUS KEANGGOTAAN & PAKET */}
            <section
              className={`p-6 sm:p-8 rounded-2xl border space-y-4 ${
                membershipState === 'active'
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-12">
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <CrownIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Status Keanggotaan</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {membershipState === 'active'
                      ? 'Paket Premium Aktif'
                      : membershipState === 'expired'
                      ? 'Masa Aktif Premium Berakhir'
                      : 'Paket Gratis'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {membershipState === 'active'
                      ? `Aktif hingga ${formatIndonesianDate(premiumUntil)}${
                          remainingDays !== null ? ` (tersisa ${remainingDays} hari)` : ''
                        }.`
                      : membershipState === 'expired'
                      ? `Masa aktif terakhir berakhir pada ${formatIndonesianDate(
                          premiumUntil
                        )}. Perbarui paket untuk membuka kembali seluruh soal dan folder Premium.`
                      : 'Tingkatkan ke akun Premium untuk membuka seluruh folder soal eksklusif, petunjuk penyelesaian, dan kunci jawaban lengkap.'}
                  </p>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {membershipState !== 'active' ? (
                    <Link
                      href="/upgrade?redirect=/profile"
                      className="h-9 px-4 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                    >
                      <CrownIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Upgrade ke Premium</span>
                    </Link>
                  ) : (
                    <Link
                      href="/upgrade?redirect=/profile"
                      className="h-9 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
                    >
                      <span>Perpanjang Durasi</span>
                      <ArrowUpRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <Link
                    href="/transactions"
                    className="h-9 px-4 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    <ReceiptIcon className="w-3.5 h-3.5" />
                    <span>Riwayat Transaksi</span>
                  </Link>
                </div>
              </div>

              {/* Banner Notifikasi Tagihan Pending */}
              {pendingInvoiceCode && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <ClockIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Tagihan <strong className="font-mono">{pendingInvoiceCode}</strong> sedang menunggu konfirmasi pembayaran.
                    </span>
                  </div>
                  <Link
                    href="/upgrade?redirect=/profile"
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Lihat Detail Tagihan</span>
                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </section>

            {/* KARTU 3: FORMULIR INFORMASI PROFIL PUBLIK */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Informasi Profil Publik
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nama ini ditampilkan sebagai kredit penulis pada pembahasan solusi yang disetujui.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {message && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                      message.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckIcon className="w-4 h-4 shrink-0" />
                    ) : (
                      <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama tampilan Anda"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Alamat Email</span>
                      <span className="text-[11px] font-normal text-slate-400 inline-flex items-center gap-1">
                        <LockIcon className="w-3 h-3" />
                        <span>Terkunci</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200/70 dark:border-slate-800 rounded-xl text-xs cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
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
            </section>

            {/* KARTU 4: DETAIL AKUN & KEAMANAN */}
            <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Detail Akun & Keamanan
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Informasi autentikasi dan pengelolaan kata sandi akun Anda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    Metode:{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {authProvider === 'google' ? 'Google OAuth' : 'Email & Sandi'}
                    </strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    Bergabung:{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {formatJoinDate(joinedAt)}
                    </strong>
                  </span>
                </div>
              </div>

              {authProvider === 'google' ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <KeyIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Akun ini terhubung dengan <strong className="text-slate-800 dark:text-slate-200">Google</strong>. Pengelolaan kata sandi dan verifikasi dua langkah dilakukan langsung melalui pengaturan keamanan akun Google Anda.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {passwordMessage && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                        passwordMessage.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                          : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? (
                        <CheckIcon className="w-4 h-4 shrink-0" />
                      ) : (
                        <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                      )}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Ulangi kata sandi baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="h-9 px-5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                    >
                      {savingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}