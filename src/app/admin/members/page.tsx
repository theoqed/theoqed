'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Footer } from '@/components/Footer';
import { UserProfile } from '@/types';
import {
  getMembershipState,
  getRemainingDays,
  formatIndonesianDate,
} from '@/lib/premium';

export default function AdminMembersPage() {
  const supabase = createClient();

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'free' | 'expired'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_premium, premium_until, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      setFeedback({
        type: 'error',
        text: `Gagal memuat daftar member: ${error.message}`,
      });
    } else if (data) {
      setMembers(data as UserProfile[]);
    }

    setLoading(false);
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
        // Jika sudah aktif dan punya tanggal berakhir di masa depan, tambahkan dari tanggal tsb
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
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `Gagal mengubah status member: ${err.message}`,
      });
    } finally {
      setUpdatingId(null);
    }
  }

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
    return { total: members.length, active, expired, free };
  }, [members]);

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <AdminNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 my-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Membership &amp; Access Control
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Member Premium
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Aktifkan, perpanjang, atau cabut akses langganan TheoQED Premium untuk pengguna terdaftar.
              </p>
            </div>

            <button
              onClick={fetchMembers}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-xs font-bold transition cursor-pointer w-fit"
            >
              Muat Ulang Data
            </button>
          </div>

          {/* Ringkasan Statistik */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Akun</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{counts.total}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Premium Aktif</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{counts.active}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Akun Gratis</span>
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 block">{counts.free}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-200/70 dark:border-red-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">Kedaluwarsa</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block">{counts.expired}</span>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                  : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Filter & Pencarian */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Cari nama pengguna, email, atau ID akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />

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
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Pengguna */}
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-slate-400 animate-pulse">
              Memuat daftar pengguna...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
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
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {member.full_name?.trim() || 'Tanpa Nama'}
                        </span>

                        {state === 'active' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800">
                            ★ Premium Aktif
                          </span>
                        )}
                        {state === 'expired' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                            Expired
                          </span>
                        )}
                        {state === 'free' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Free
                          </span>
                        )}

                        {member.role === 'admin' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
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

                    {/* Tombol Aksi Cepat */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        disabled={isBusy}
                        onClick={() => handleSetPremium(member, 30)}
                        className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        {state === 'active' ? '+30 Hari' : 'Aktifkan 30 Hari'}
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => handleSetPremium(member, 180)}
                        className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        +180 Hari
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => handleSetPremium(member, 'lifetime')}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        Lifetime
                      </button>

                      {member.is_premium && (
                        <button
                          disabled={isBusy}
                          onClick={() => {
                            if (confirm('Cabut akses premium pengguna ini?')) {
                              handleSetPremium(member, 'revoke');
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-900 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
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

      <Footer />
    </div>
  );
}