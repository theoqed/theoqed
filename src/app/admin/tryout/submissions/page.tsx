'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Footer } from '@/components/Footer';

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function TrophyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4a5 5 0 005 5h4a5 5 0 005-5V3M5 3h14M5 3H3m16 0h2m-4 9a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
    </svg>
  );
}

function ChartBarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 100 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

interface SubmissionRecord {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  tryout_id: string;
  score_total: number;
  time_spent_seconds: number;
  created_at: string;
  tryout_title?: string;
  tryout_slug?: string;
}

interface TryoutSimple {
  id: string;
  title: string;
  slug: string;
}

interface ProfileSimple {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

export default function AdminTryoutSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [tryouts, setTryouts] = useState<TryoutSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [selectedTryoutId, setSelectedTryoutId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubmissionsData();
  }, []);

  async function fetchSubmissionsData() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    const [subRes, tryoutRes, profilesRes] = await Promise.all([
      supabase.from('tryout_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('tryouts').select('id, title, slug').order('title', { ascending: true }),
      supabase.from('profiles').select('id, full_name, name, email, avatar_url'),
    ]);

    const tryoutList = (tryoutRes.data || []) as TryoutSimple[];
    const tryoutMap = new Map(tryoutList.map((t) => [t.id, t]));

    const profileList = (profilesRes.data || []) as ProfileSimple[];
    const profileMap = new Map(profileList.map((p) => [p.id, p]));

    const rawSubmissions = subRes.data || [];

    const formatted: SubmissionRecord[] = rawSubmissions.map((sub: any) => {
      const matchedTryout = tryoutMap.get(sub.tryout_id);
      const matchedProfile = profileMap.get(sub.user_id);

      let resolvedName = matchedProfile?.full_name || matchedProfile?.name || matchedProfile?.email?.split('@')[0];
      let resolvedEmail = matchedProfile?.email || '';
      let resolvedAvatar = matchedProfile?.avatar_url || '';

      // Fallback ke Auth Metadata jika user_id adalah user aktif
      if (currentUser && sub.user_id === currentUser.id) {
        resolvedName =
          resolvedName ||
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split('@')[0];
        resolvedEmail = resolvedEmail || currentUser.email || '';
        resolvedAvatar = resolvedAvatar || currentUser.user_metadata?.avatar_url || '';
      }

      if (!resolvedName) {
        resolvedName = `User #${sub.user_id?.slice(0, 8)}`;
      }

      return {
        ...sub,
        user_name: resolvedName,
        user_email: resolvedEmail,
        user_avatar: resolvedAvatar,
        tryout_title: matchedTryout?.title || sub.tryout_id,
        tryout_slug: matchedTryout?.slug || sub.tryout_id,
      };
    });

    setTryouts(tryoutList);
    setSubmissions(formatted);
    setLoading(false);
  }

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus attempt pengerjaan ini?')) return;

    const { error } = await supabase.from('tryout_submissions').delete().eq('id', id);

    if (!error) {
      setSubmissions((prev) => prev.filter((item) => item.id !== id));
      alert('Attempt pengerjaan berhasil dihapus.');
    } else {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const filteredSubmissions = submissions.filter((item) => {
    const matchTryout = selectedTryoutId === 'ALL' || item.tryout_id === selectedTryoutId;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (item.user_name || '').toLowerCase().includes(q) ||
      (item.user_email || '').toLowerCase().includes(q) ||
      (item.tryout_title || '').toLowerCase().includes(q) ||
      (item.user_id || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q);
    return matchTryout && matchSearch;
  });

  const totalSubmissions = filteredSubmissions.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(filteredSubmissions.reduce((acc, curr) => acc + (curr.score_total || 0), 0) / totalSubmissions)
    : 0;
  const highestScore = totalSubmissions > 0
    ? Math.max(...filteredSubmissions.map((s) => s.score_total || 0))
    : 0;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <AdminNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Statistik & Riwayat Pengerjaan Peserta
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kelola attempt pengerjaan, pantau perolehan skor peserta, dan bersihkan attempt yang tidak valid.
              </p>
            </div>

            <Link
              href="/admin/tryout"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <ArrowLeftIcon />
              <span>Kelola Racikan Paket</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Attempt</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{totalSubmissions}</div>
                <span className="text-[10px] text-slate-400">Pengerjaan tercatat</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900">
                <UsersIcon />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-Rata Skor</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{avgScore} Poin</div>
                <span className="text-[10px] text-slate-400">Dari hasil filter</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-900">
                <ChartBarIcon />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skor Tertinggi</span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{highestScore} Poin</div>
                <span className="text-[10px] text-slate-400">Skor maksimum</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
                <TrophyIcon />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Paket:</span>
              <select
                value={selectedTryoutId}
                onChange={(e) => setSelectedTryoutId(e.target.value)}
                className="p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-full sm:w-64"
              >
                <option value="ALL">Semua Paket Try Out</option>
                {tryouts.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama peserta / email / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-full"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                Memuat riwayat attempt pengerjaan peserta...
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Nama Peserta</th>
                      <th className="p-4">Paket Try Out</th>
                      <th className="p-4">Skor Akhir</th>
                      <th className="p-4">Durasi Terpakai</th>
                      <th className="p-4">Waktu Ujian</th>
                      <th className="p-4 text-center">Aksi / Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {sub.user_avatar ? (
                              <img src={sub.user_avatar} alt="Avatar" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200/80 dark:border-indigo-900">
                                {getInitials(sub.user_name || 'U')}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {sub.user_name}
                              </div>
                              {sub.user_email ? (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {sub.user_email}
                                </div>
                              ) : (
                                <div className="text-[10px] font-mono text-slate-400 truncate">
                                  ID: {sub.user_id.slice(0, 12)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">
                            {sub.tryout_title}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                            {sub.score_total} Poin
                          </span>
                        </td>

                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                          {formatDuration(sub.time_spent_seconds || 0)}
                        </td>

                        <td className="p-4 text-slate-500 text-[11px]">
                          {new Date(sub.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/tryout/${sub.tryout_slug}/result?submission_id=${sub.id}`}
                              target="_blank"
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl transition inline-flex items-center gap-1 font-bold text-[11px]"
                              title="Buka & Intip Rapor"
                            >
                              <EyeIcon />
                              <span>Buka Rapor</span>
                            </Link>
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition"
                              title="Hapus Attempt Ini"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada data pengerjaan (attempt) yang tersimpan atau sesuai dengan filter pencarian.
              </div>
            )}
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}