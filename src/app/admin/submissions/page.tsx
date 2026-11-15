'use client';

import { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import { supabase } from '@/lib/supabase';
import { AdminNavbar } from '@/components/AdminNavbar';

// --- SVG CUSTOM ICONS ---
function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LightbulbIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function ListBulletIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function KeyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
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

// --- KATEX MATH PARSER ---
function MathText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

  return (
    <span className="leading-relaxed font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: true,
              output: 'html',
            });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto font-sans [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">
                {part}
              </code>
            );
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
              output: 'html',
            });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return (
              <code key={index} className="text-red-500 font-mono text-xs">
                {part}
              </code>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

interface SolutionSubmission {
  id: string;
  problem_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  brief?: string;
  steps?: string[];
  final_answer?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  problem_title?: string;
}

// PARSER KHUSUS UNTUK MEMBACA KOLOM 'content'
function parseContentToSteps(record: Record<string, unknown>): string[] {
  const rawData = record.content ?? record.solution_steps ?? record.steps ?? record.explanation;

  if (!rawData) return [];

  if (Array.isArray(rawData)) {
    return rawData
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          return String(obj.text || obj.content || obj.step || obj.description || JSON.stringify(obj));
        }
        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof rawData === 'string') {
    const trimmed = rawData.trim();
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseContentToSteps({ content: parsed });
      } catch {
        // Abaikan parser error jika bukan JSON array valid
      }
    }
    return trimmed
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

export default function AdminSolutionSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SolutionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    setFeedback(null);

    const { data: subData, error } = await supabase
      .from('solution_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setFeedback({
        type: 'error',
        text: `Gagal memuat daftar ajuan solusi: ${error.message}`,
      });
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const rawList = (subData || []) as Record<string, unknown>[];
    const problemIds = Array.from(
      new Set(rawList.map((s) => s.problem_id as string).filter(Boolean))
    );
    const userIds = Array.from(
      new Set(rawList.map((s) => s.user_id as string).filter(Boolean))
    );

    // 1. Fetch Detail Soal Master
    let problemMap = new Map<string, string>();
    if (problemIds.length > 0) {
      const { data: probData } = await supabase
        .from('problems')
        .select('id, title')
        .in('id', problemIds);
      problemMap = new Map(
        (probData || []).map((p: { id: string; title: string }) => [p.id, p.title])
      );
    }

    // 2. Fetch Detail Profil Peserta (full_name & email)
    let profileMap = new Map<string, { full_name?: string; email?: string }>();
    if (userIds.length > 0) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      profileMap = new Map(
        (profData || []).map((p: { id: string; full_name?: string; email?: string }) => [
          p.id,
          { full_name: p.full_name, email: p.email },
        ])
      );
    }

    const formatted: SolutionSubmission[] = rawList.map((s) => {
      const parsedSteps = parseContentToSteps(s);
      const userId = String(s.user_id || '');
      const problemId = String(s.problem_id || '');
      const userProfile = profileMap.get(userId);

      return {
        id: String(s.id || ''),
        problem_id: problemId,
        user_id: userId,
        brief: String(s.brief || s.solution_brief || ''),
        steps: parsedSteps,
        final_answer: String(s.final_answer || s.correct_answer || ''),
        problem_title: problemMap.get(problemId) || problemId,
        user_name: userProfile?.full_name || 'Tanpa Nama',
        user_email: userProfile?.email || '',
        status: (s.status as SolutionSubmission['status']) || 'pending',
        created_at: String(s.created_at || ''),
      };
    });

    setSubmissions(formatted);
    setLoading(false);
  }

  // UPDATE STATUS (SETUJUI / TOLAK) & APPEND KE ARRAY solutions DI TABEL PROBLEMS
  const handleUpdateStatus = async (item: SolutionSubmission, newStatus: 'approved' | 'rejected') => {
    setProcessingId(item.id);
    setFeedback(null);

    try {
      const { error } = await supabase
        .from('solution_submissions')
        .update({ status: newStatus })
        .eq('id', item.id);

      if (error) throw error;

      // JIKA DISETUJUI, APPEND SOLUSI BARU KE ARRAY solutions (IDEMPOTEN)
      if (newStatus === 'approved') {
        const { data: probData } = await supabase
          .from('problems')
          .select('solutions')
          .eq('id', item.problem_id)
          .maybeSingle();

        const existingSolutions = Array.isArray(probData?.solutions) ? probData.solutions : [];
        const alreadyExists = existingSolutions.some(
          (sol: { id?: string }) => sol.id === item.id
        );

        if (!alreadyExists) {
          const newSolutionObj = {
            id: item.id,
            author_id: item.user_id,
            author_name: item.user_name || 'Kontributor',
            brief: item.brief || '',
            steps: item.steps || [],
            final_answer: item.final_answer || '',
            created_at: new Date().toISOString(),
          };

          const { error: updateProbError } = await supabase
            .from('problems')
            .update({
              solutions: [...existingSolutions, newSolutionObj],
            })
            .eq('id', item.problem_id);

          if (updateProbError) throw updateProbError;
        }
      }

      setSubmissions((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
      );

      setFeedback({
        type: 'success',
        text:
          newStatus === 'approved'
            ? `Solusi dari ${item.user_name} berhasil disetujui dan ditambahkan ke soal "${item.problem_title}".`
            : `Ajuan solusi dari ${item.user_name} telah ditolak.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setFeedback({
        type: 'error',
        text: `Gagal memperbarui status: ${message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ajuan solusi ini?')) return;

    setProcessingId(id);
    setFeedback(null);

    try {
      const { error } = await supabase.from('solution_submissions').delete().eq('id', id);
      if (error) throw error;

      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setFeedback({
        type: 'success',
        text: 'Ajuan solusi berhasil dihapus.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setFeedback({
        type: 'error',
        text: `Gagal menghapus ajuan: ${message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    submissions.forEach((s) => {
      if (s.status === 'pending') pending++;
      else if (s.status === 'approved') approved++;
      else if (s.status === 'rejected') rejected++;
    });
    return {
      total: submissions.length,
      pending,
      approved,
      rejected,
    };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      if (!matchStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.problem_title || '').toLowerCase().includes(q) ||
        (item.user_name || '').toLowerCase().includes(q) ||
        (item.user_email || '').toLowerCase().includes(q) ||
        (item.user_id || '').toLowerCase().includes(q) ||
        (item.brief || '').toLowerCase().includes(q) ||
        (item.steps || []).join(' ').toLowerCase().includes(q)
      );
    });
  }, [submissions, filterStatus, searchQuery]);

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
              Moderasi Ajuan Solusi Pengguna
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <span className="h-9 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-bold inline-flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Pending: {counts.pending}</span>
            </span>

            <button
              type="button"
              onClick={fetchSubmissions}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshIcon />
              <span>Muat Ulang</span>
            </button>
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

        {/* FILTER & PENCARIAN */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <SearchIcon className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari judul soal, nama kontributor, email, atau teks solusi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
            {(
              [
                { id: 'pending', label: `Menunggu (${counts.pending})` },
                { id: 'approved', label: `Disetujui (${counts.approved})` },
                { id: 'rejected', label: `Ditolak (${counts.rejected})` },
                { id: 'ALL', label: `Semua (${counts.total})` },
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

        {/* LIST AJUAN SOLUSI */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredSubmissions.map((item) => {
              const isBusy = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition space-y-4"
                >
                  {/* Top Metadata Header */}
                  <div className="flex items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Target Soal Master
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {item.problem_title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* IDENTITAS PENGGUNA LENGKAP */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.user_name}
                        </span>
                        {item.user_email && (
                          <span className="text-slate-400 hidden sm:inline">
                            ({item.user_email})
                          </span>
                        )}
                        <span className="text-slate-400 font-mono text-[11px]">
                          #{item.user_id?.slice(0, 8)}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                          item.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-900'
                            : item.status === 'rejected'
                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/80 dark:text-red-400 dark:border-red-900'
                            : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-900'
                        }`}
                      >
                        {item.status === 'approved' && <CheckIcon className="w-3 h-3" />}
                        {item.status === 'rejected' && <XIcon className="w-3 h-3" />}
                        {item.status === 'pending' && <ClockIcon className="w-3 h-3" />}
                        <span>{item.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* DETAIL ISI SOLUSI */}
                  <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
                    {/* 1. IDE RINGKAS / HINT */}
                    {item.brief && (
                      <div className="space-y-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                          <LightbulbIcon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Ide Ringkas / Konsep Utama</span>
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 pl-5">
                          <MathText text={item.brief} />
                        </div>
                      </div>
                    )}

                    {/* 2. LANGKAH-LANGKAH PENYELESAIAN LENGKAP */}
                    <div
                      className={`space-y-2.5 ${
                        item.brief ? 'pt-3 border-t border-slate-200/60 dark:border-slate-800/80' : ''
                      }`}
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <ListBulletIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          Langkah-Langkah Penyelesaian ({item.steps?.length || 0} Langkah)
                        </span>
                      </span>

                      {item.steps && item.steps.length > 0 ? (
                        <div className="space-y-2 pl-1 sm:pl-2">
                          {item.steps.map((st, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800"
                            >
                              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-900">
                                {idx + 1}
                              </span>
                              <div className="text-slate-800 dark:text-slate-200 pt-0.5 min-w-0 flex-1 leading-relaxed">
                                <MathText text={st} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-slate-400 italic text-[11px] border border-slate-200/60 dark:border-slate-800">
                          Tidak ada rincian langkah penyelesaian yang dikirimkan.
                        </div>
                      )}
                    </div>

                    {/* 3. KUNCI / HASIL AKHIR */}
                    {item.final_answer && (
                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                        <KeyIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Kunci / Jawaban Akhir:
                        </span>
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 rounded-md border border-indigo-200 dark:border-indigo-900">
                          {item.final_answer}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Diajukan pada{' '}
                      {new Date(item.created_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item, 'approved')}
                        disabled={isBusy || item.status === 'approved'}
                        className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item, 'rejected')}
                        disabled={isBusy || item.status === 'rejected'}
                        className="h-9 px-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubmission(item.id)}
                        disabled={isBusy}
                        className="h-9 w-9 inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 disabled:opacity-40 rounded-xl transition cursor-pointer shrink-0"
                        title="Hapus Ajuan"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Tidak ada ajuan solusi pengguna yang sesuai dengan filter.
          </div>
        )}
      </main>
    </div>
  );
}