'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface UserSubmissionItem {
  id: string;
  tryout_id: string;
  score_total: number;
  time_spent_seconds: number;
  created_at: string;
  tryout_title?: string;
  tryout_slug?: string;
  duration_minutes?: number;
}

export default function UserTryoutHistoryPage() {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<UserSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserHistory() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Fetch Submissions milik user
      const { data: subData } = await supabase
        .from('tryout_submissions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (subData && subData.length > 0) {
        const tryoutIds = Array.from(new Set(subData.map((s: any) => s.tryout_id)));
        
        // Fetch Metadata Tryout
        const { data: tryoutData } = await supabase
          .from('tryouts')
          .select('id, title, slug, duration_minutes')
          .in('id', tryoutIds);

        const tryoutMap = new Map((tryoutData || []).map((t: any) => [t.id, t]));

        const formatted: UserSubmissionItem[] = subData.map((sub: any) => {
          const t = tryoutMap.get(sub.tryout_id);
          return {
            ...sub,
            tryout_title: t?.title || 'Paket Try Out',
            tryout_slug: t?.slug || sub.tryout_id,
            duration_minutes: t?.duration_minutes || 60,
          };
        });

        setSubmissions(formatted);
      }

      setLoading(false);
    }

    fetchUserHistory();
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 inline-block mb-1">
                📋 Rekam Jejak Belajar
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Riwayat Pengerjaan Try Out Saya
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tinjau kembali seluruh hasil evaluasi simulasi ujian dan evaluasi pembahasannotasi matematika kamu.
              </p>
            </div>

            <Link
              href="/tryout"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition self-start"
            >
              + Ikuti Try Out Lainnya
            </Link>
          </div>

          {/* DAFTAR RIWAYAT */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500 transition"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ujian Selesai • {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.tryout_title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>⏱️ Waktu Pengerjaan: <strong>{formatDuration(item.time_spent_seconds || 0)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Perolehan</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {item.score_total} Poin
                      </span>
                    </div>

                    <Link
                      href={`/tryout/${item.tryout_slug}/result?submission_id=${item.id}`}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                    >
                      Buka Rapor & Pembahasan →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <span className="text-3xl">📝</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Belum Ada Riwayat Pengerjaan
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Kamu belum pernah menyelesaikan simulasi Try Out. Pilih paket di katalog untuk mulai berlatih.
              </p>
              <Link
                href="/tryout"
                className="inline-block px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow mt-2"
              >
                Jelajahi Katalog Try Out
              </Link>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}