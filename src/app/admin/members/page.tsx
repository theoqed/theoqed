'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';
import { UserProfile } from '@/types';
import {
  getMembershipState,
  getRemainingDays,
  formatIndonesianDate,
} from '@/lib/premium';

interface PaymentBill {
  id: string;
  invoice_code: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  plan_id: string;
  plan_name: string;
  duration_months: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'rejected';
  created_at: string;
  approved_at: string | null;
}

// --- SVG ICON HELPERS ---
function RefreshIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ReceiptIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12h6m-6 4h6m2 5l-3-2-3 2-3-2-3 2V5a2 2 0 012-2h10a2 2 0 012 2v16z"
      />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
      />
    </svg>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminMembersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [processingBillId, setProcessingBillId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'free' | 'expired'>('all');
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    setFeedback(null);

    const [profilesRes, paymentsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, role, is_premium, premium_until, updated_at')
        .order('updated_at', { ascending: false, nullsFirst: false }),
      supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (profilesRes.error) {
      setFeedback({
        type: 'error',
        text: `Gagal memuat daftar member: ${profilesRes.error.message}`,
      });
    } else if (profilesRes.data) {
      setMembers(profilesRes.data as UserProfile[]);
    }

    if (paymentsRes.error) {
      setFeedback({
        type: 'error',
        text: `Gagal memuat daftar tagihan: ${paymentsRes.error.message}`,
      });
    } else if (paymentsRes.data) {
      setPayments(paymentsRes.data as PaymentBill[]);
    }

    setLoading(false);
  }

  async function handleApproveBill(bill: PaymentBill) {
    setProcessingBillId(bill.id);
    setFeedback(null);

    try {
      // Ambil data profil terbaru pengguna agar perpanjangan tidak menimpa sisa hari aktif
      const { data: currentProfile, error: profFetchErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_premium, premium_until')
        .eq('id', bill.user_id)
        .single();

      if (profFetchErr || !currentProfile) {
        throw new Error(profFetchErr?.message || 'Profil pengguna tidak ditemukan.');
      }

      const baseTime =
        currentProfile.is_premium &&
        currentProfile.premium_until &&
        new Date(currentProfile.premium_until).getTime() > Date.now()
          ? new Date(currentProfile.premium_until).getTime()
          : Date.now();

      const addedDays = bill.duration_months * 30;
      const nextUntil = new Date(baseTime + addedDays * 24 * 60 * 60 * 1000).toISOString();
      const nowIso = new Date().toISOString();

      // 1. Aktifkan status Premium pada profil pengguna
      const { data: updatedProfiles, error: profUpdateErr } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_until: nextUntil,
          updated_at: nowIso,
        })
        .eq('id', bill.user_id)
        .select('id');

      if (profUpdateErr) throw profUpdateErr;
      if (!updatedProfiles || updatedProfiles.length === 0) {
        throw new Error(
          'Gagal memperbarui profil (0 baris terubah). Pastikan akunmu memiliki role = "admin".'
        );
      }

      // 2. Tandai tagihan sebagai lunas (paid)
      const { error: payUpdateErr } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          approved_at: nowIso,
        })
        .eq('id', bill.id);

      if (payUpdateErr) throw payUpdateErr;

      // Perbarui state lokal
      setMembers((prev) =>
        prev.map((m) =>
          m.id === bill.user_id
            ? { ...m, is_premium: true, premium_until: nextUntil, updated_at: nowIso }
            : m
        )
      );

      setPayments((prev) =>
        prev.map((p) =>
          p.id === bill.id ? { ...p, status: 'paid', approved_at: nowIso } : p
        )
      );

      const displayName = bill.user_name || bill.user_email || bill.user_id.slice(0, 8);
      setFeedback({
        type: 'success',
        text: `Tagihan ${bill.invoice_code} disetujui! Akses Premium untuk ${displayName} aktif selama +${addedDays} hari (${bill.plan_name}).`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setFeedback({
        type: 'error',
        text: `Gagal menyetujui tagihan: ${message}`,
      });
    } finally {
      setProcessingBillId(null);
    }
  }

  async function handleRejectBill(bill: PaymentBill) {
    if (!confirm(`Tolak tagihan ${bill.invoice_code} dari ${bill.user_name || bill.user_email}?`)) {
      return;
    }

    setProcessingBillId(bill.id);
    setFeedback(null);

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', bill.id);

      if (error) throw error;

      setPayments((prev) =>
        prev.map((p) => (p.id === bill.id ? { ...p, status: 'rejected' } : p))
      );

      setFeedback({
        type: 'success',
        text: `Tagihan ${bill.invoice_code} telah ditolak.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setFeedback({
        type: 'error',
        text: `Gagal menolak tagihan: ${message}`,
      });
    } finally {
      setProcessingBillId(null);
    }
  }

  async function handleSetPremium(member: UserProfile, days: number | 'lifetime' | 'revoke') {
    setUpdatingId(member.id);
    setFeedback(null);

    try {
      let nextIsPremium = false;
      let nextUntil: string | null = null;

      if (days === 'revoke') {
        nextIsPremium = false;
        nextUntil = null;
      } else if (days === 'lifetime') {
        nextIsPremium = true;
        nextUntil = null;
      } else {
        const baseTime =
          member.is_premium &&
          member.premium_until &&
          new Date(member.premium_until).getTime() > Date.now()
            ? new Date(member.premium_until).getTime()
            : Date.now();

        nextIsPremium = true;
        nextUntil = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const { data: updatedRows, error } = await supabase
        .from('profiles')
        .update({
          is_premium: nextIsPremium,
          premium_until: nextUntil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id)
        .select('id');

      if (error) throw error;

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          'Perubahan ditolak oleh database (0 baris diperbarui). Pastikan akunmu memiliki role = "admin" di tabel profiles.'
        );
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? { ...m, is_premium: nextIsPremium, premium_until: nextUntil }
            : m
        )
      );

      const labelName = member.full_name || member.email || member.id.slice(0, 8);
      setFeedback({
        type: 'success',
        text:
          days === 'revoke'
            ? `Status Premium untuk ${labelName} berhasil dicabut.`
            : `Status Premium untuk ${labelName} berhasil diperbarui (${
                days === 'lifetime' ? 'Lifetime' : `+${days} hari`
              }).`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setFeedback({
        type: 'error',
        text: `Gagal mengubah status member: ${message}`,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingBills = useMemo(
    () => payments.filter((p) => p.status === 'pending'),
    [payments]
  );

  const completedBills = useMemo(
    () => payments.filter((p) => p.status !== 'pending'),
    [payments]
  );

  const counts = useMemo(() => {
    let active = 0;
    let expired = 0;
    let free = 0;
    members.forEach((m) => {
      const state = getMembershipState(m);
      if (state === 'active') active++;
      else if (state === 'expired') expired++;
      else free++;
    });
    return {
      total: members.length,
      active,
      expired,
      free,
      pendingBills: pendingBills.length,
    };
  }, [members, pendingBills]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const state = getMembershipState(m);
      if (filterStatus !== 'all' && state !== filterStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (m.full_name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [members, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 pb-16">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Admin Panel
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Member &amp; Tagihan
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setShowPaymentHistory((prev) => !prev)}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ReceiptIcon />
              <span>
                {showPaymentHistory
                  ? 'Tutup Riwayat'
                  : `Riwayat Tagihan (${completedBills.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={fetchAllData}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshIcon />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* RINGKASAN STATISTIK */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div
            className={`p-4 rounded-2xl border ${
              counts.pendingBills > 0
                ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Tagihan Masuk
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
              {counts.pendingBills}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Premium Aktif
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {counts.active}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Akun
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {counts.total}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Akun Gratis
            </span>
            <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 block">
              {counts.free}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-200/70 dark:border-red-900/50 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">
              Kedaluwarsa
            </span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block">
              {counts.expired}
            </span>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold border flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] font-bold opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* BAGIAN TAGIHAN MASUK (PENDING BILLS) */}
        {!loading && pendingBills.length > 0 && (
          <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/80 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Menunggu Konfirmasi Pembayaran
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Tagihan Masuk ({pendingBills.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Cocokkan kode tagihan dari DM Instagram @theoqed.id
              </span>
            </div>

            <div className="space-y-3">
              {pendingBills.map((bill) => {
                const isBusy = processingBillId === bill.id;
                const addedDays = bill.duration_months * 30;

                return (
                  <div
                    key={bill.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 text-[11px] font-mono font-black rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                          {bill.invoice_code}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {bill.plan_name}
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          • {formatRupiah(bill.amount)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>{bill.user_name || 'Tanpa Nama'}</strong>{' '}
                        <span className="text-slate-400 font-mono">
                          ({bill.user_email || bill.user_id})
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Dibuat pada:{' '}
                        {new Date(bill.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApproveBill(bill)}
                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        {isBusy
                          ? 'Memproses...'
                          : `Setujui & Aktifkan (+${addedDays} Hari)`}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRejectBill(bill)}
                        className="h-9 px-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* RIWAYAT TAGIHAN SELESAI / DITOLAK (OPSIONAL TOGGLE) */}
        {showPaymentHistory && (
          <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Riwayat Tagihan Terproses ({completedBills.length})
            </h2>

            {completedBills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada riwayat tagihan yang selesai atau ditolak.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {completedBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {bill.invoice_code}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {bill.user_name || bill.user_email}
                      </span>
                      <span className="text-slate-400">
                        • {bill.plan_name} ({formatRupiah(bill.amount)})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {new Date(bill.approved_at || bill.created_at).toLocaleDateString('id-ID')}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          bill.status === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : bill.status === 'rejected'
                            ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {bill.status === 'paid'
                          ? 'Lunas'
                          : bill.status === 'rejected'
                          ? 'Ditolak'
                          : 'Dibatalkan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FILTER & PENCARIAN MEMBER */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <SearchIcon className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari nama pengguna, email, atau ID akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'active', label: 'Premium' },
                { id: 'free', label: 'Gratis' },
                { id: 'expired', label: 'Expired' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`h-8 px-3 rounded-xl transition cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* DAFTAR PENGGUNA */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Tidak ada pengguna yang cocok dengan filter pencarian.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const state = getMembershipState(member);
              const daysLeft = getRemainingDays(member.premium_until);
              const isBusy = updatingId === member.id;

              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {member.full_name?.trim() || 'Tanpa Nama'}
                      </span>

                      {state === 'active' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          ★ Premium Aktif
                        </span>
                      )}
                      {state === 'expired' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                          Expired
                        </span>
                      )}
                      {state === 'free' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Free
                        </span>
                      )}

                      {member.role === 'admin' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                      {member.email || `ID: ${member.id}`}
                    </div>

                    {member.is_premium && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Berlaku sampai:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatIndonesianDate(member.premium_until)}
                        </strong>
                        {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} hari lagi)`}
                      </p>
                    )}
                  </div>

                  {/* TOMBOL AKSI MANUAL CEPAT */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPremium(member, 30)}
                      className="h-8 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      +30 Hari
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPremium(member, 90)}
                      className="h-8 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      +90 Hari
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPremium(member, 180)}
                      className="h-8 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      +180 Hari
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPremium(member, 360)}
                      className="h-8 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      +360 Hari
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPremium(member, 'lifetime')}
                      className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Lifetime
                    </button>

                    {member.is_premium && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (confirm('Cabut akses premium pengguna ini?')) {
                            handleSetPremium(member, 'revoke');
                          }
                        }}
                        className="h-8 px-3 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        Cabut
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}