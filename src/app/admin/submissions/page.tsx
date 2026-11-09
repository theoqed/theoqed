'use client';

import { useState, useEffect } from 'react';
import katex from 'katex';
import { supabase } from '@/lib/supabase';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Footer } from '@/components/Footer';

// --- SVG CUSTOM ICONS (TANPA EMOJI) ---
function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

function LightbulbIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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

function ListBulletIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function KeyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: true, output: 'html' });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto font-sans [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">{part}</code>;
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: false, output: 'html' });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
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
function parseContentToSteps(record: any): string[] {
  const rawData = record.content ?? record.solution_steps ?? record.steps ?? record.explanation;

  if (!rawData) return [];

  if (Array.isArray(rawData)) {
    return rawData
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          return item.text || item.content || item.step || item.description || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof rawData === 'string') {
    const trimmed = rawData.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseContentToSteps({ content: parsed });
      } catch (e) {
        // Abaikan parser error jika bukan JSON array valid
      }
    }
    return trimmed.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  return [];
}

export default function AdminSolutionSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SolutionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);

    const { data: subData, error } = await supabase
      .from('solution_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching solution_submissions:', error.message);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const rawList = subData || [];
    const problemIds = Array.from(new Set(rawList.map((s: any) => s.problem_id).filter(Boolean)));
    const userIds = Array.from(new Set(rawList.map((s: any) => s.user_id).filter(Boolean)));

    // 1. Fetch Detail Soal Master
    let problemMap = new Map<string, string>();
    if (problemIds.length > 0) {
      const { data: probData } = await supabase
        .from('problems')
        .select('id, title')
        .in('id', problemIds);
      problemMap = new Map((probData || []).map((p: any) => [p.id, p.title]));
    }

    // 2. Fetch Detail Profil Peserta (full_name & email)
    let profileMap = new Map<string, { full_name?: string; email?: string }>();
    if (userIds.length > 0) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      profileMap = new Map((profData || []).map((p: any) => [p.id, { full_name: p.full_name, email: p.email }]));
    }

    const formatted: SolutionSubmission[] = rawList.map((s: any) => {
      const parsedSteps = parseContentToSteps(s);
      const userProfile = profileMap.get(s.user_id);

      return {
        ...s,
        brief: s.brief || s.solution_brief || '',
        steps: parsedSteps,
        final_answer: s.final_answer || s.correct_answer || '',
        problem_title: problemMap.get(s.problem_id) || s.problem_id,
        user_name: userProfile?.full_name || 'Tanpa Nama',
        user_email: userProfile?.email || '',
        status: s.status || 'pending',
      };
    });

    setSubmissions(formatted);
    setLoading(false);
  }

  // UPDATE STATUS (SETUJUI / TOLAK) & APPEND KE ARRAY solutions DI TABEL PROBLEMS
  const handleUpdateStatus = async (item: SolutionSubmission, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('solution_submissions')
      .update({ status: newStatus })
      .eq('id', item.id);

    if (error) {
      alert(`Gagal memperbarui status: ${error.message}`);
      return;
    }

    // JIKA DISETUJUI, APPEND SOLUSI BARU KE ARRAY solutions
    if (newStatus === 'approved') {
      const { data: probData } = await supabase
        .from('problems')
        .select('solutions')
        .eq('id', item.problem_id)
        .maybeSingle();

      const existingSolutions = Array.isArray(probData?.solutions) ? probData.solutions : [];

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

      if (updateProbError) {
        console.error('Error updating problems solutions array:', updateProbError.message);
      }
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
    );
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ajuan solusi ini?')) return;

    const { error } = await supabase.from('solution_submissions').delete().eq('id', id);
    if (!error) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const filteredSubmissions = submissions.filter((item) => {
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (item.problem_title || '').toLowerCase().includes(q) ||
      (item.user_name || '').toLowerCase().includes(q) ||
      (item.user_email || '').toLowerCase().includes(q) ||
      (item.user_id || '').toLowerCase().includes(q) ||
      (item.brief || '').toLowerCase().includes(q) ||
      (item.steps || []).join(' ').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        <AdminNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Moderasi Ajuan Solusi Pengguna
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Moderasi kontribusi solusi dan ide penyelesaian soal yang diajukan oleh komunitas pengguna.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-xs font-bold flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-amber-600" />
                <span>Pending: {pendingCount} Ajuan</span>
              </span>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
              {(['pending', 'approved', 'rejected', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    filterStatus === st
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {st === 'pending' && <ClockIcon className="w-3.5 h-3.5 text-amber-500" />}
                  {st === 'approved' && <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />}
                  {st === 'rejected' && <XIcon className="w-3.5 h-3.5 text-red-500" />}
                  <span>{st === 'pending' ? 'Menunggu Moderasi' : st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Semua'}</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Cari kata kunci soal / Nama / User ID / Teks ide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none w-full sm:w-80"
            />
          </div>

          {/* LIST AJUAN SOLUSI */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
              Memuat daftar ajuan solusi pengguna...
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="space-y-6">
              {filteredSubmissions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5"
                >
                  {/* Top Metadata Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Soal Master:</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.problem_title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* IDENTITAS PENGGUNA LENGKAP */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white">{item.user_name}</span>
                        {item.user_email && <span className="text-slate-400 hidden sm:inline">({item.user_email})</span>}
                        <span className="text-slate-400 font-mono text-[11px]">ID: {item.user_id?.slice(0, 8)}</span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-900'
                          : item.status === 'rejected'
                          ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/80 dark:border-red-900'
                          : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/80 dark:border-amber-900'
                      }`}>
                        {item.status === 'approved' && <CheckIcon className="w-3 h-3" />}
                        {item.status === 'rejected' && <XIcon className="w-3 h-3" />}
                        {item.status === 'pending' && <ClockIcon className="w-3 h-3" />}
                        <span>{item.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* DETAIL ISI SOLUSI */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
                    
                    {/* 1. IDE RINGKAS / HINT */}
                    {item.brief && (
                      <div className="space-y-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                          <LightbulbIcon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Ide Ringkas / Konsep Utama:</span>
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 pl-5">
                          <MathText text={item.brief} />
                        </div>
                      </div>
                    )}

                    {/* 2. LANGKAH-LANGKAH PENYELESAIAN LENGKAP */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <ListBulletIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Langkah-Langkah Penyelesaian ({item.steps?.length || 0} Langkah):</span>
                      </span>

                      {item.steps && item.steps.length > 0 ? (
                        <div className="space-y-2.5 pl-2">
                          {item.steps.map((st, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
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
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                        <KeyIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Kunci / Jawaban Akhir:</span>
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 rounded-md border border-indigo-200 dark:border-indigo-900">
                          {item.final_answer}
                        </span>
                      </div>
                    )}

                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-400">
                      Diajukan pada {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(item, 'approved')}
                        disabled={item.status === 'approved'}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <CheckIcon />
                        <span>Setujui (Approve)</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(item, 'rejected')}
                        disabled={item.status === 'rejected'}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <XIcon />
                        <span>Tolak</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSubmission(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition"
                        title="Hapus Ajuan"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              Tidak ada ajuan solusi pengguna yang sesuai dengan filter.
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}