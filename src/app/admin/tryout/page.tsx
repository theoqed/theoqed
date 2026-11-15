'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminNavbar } from '@/components/AdminNavbar';

// --- SVG ICON HELPERS ---
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
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

function ArrowUpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ClockIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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

function LockClosedIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function BookOpenIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
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

interface ProblemItem {
  id: string;
  title: string;
  topic: string;
  competition: string;
  section?: string;
  problem_type?: 'multiple_choice' | 'short_answer';
  options?: { [key: string]: string };
  solutions?: { final_answer?: string }[];
}

interface ProblemConfigItem {
  problem_id: string;
  section?: string;
  scoring_type: 'standard' | 'weighted_tkp';
  correct_answer?: string;
  weight_correct: number;
  weight_wrong: number;
  weight_unanswered?: number;
  option_weights: { [key: string]: number };
}

interface TryoutItem {
  id: string;
  title: string;
  slug: string;
  category?: string;
  description: string;
  duration_minutes: number;
  status?: 'draft' | 'published';
  is_premium?: boolean;
  problem_configs: ProblemConfigItem[] | string;
  created_at: string;
}

function parseProblemConfigs(raw: ProblemConfigItem[] | string | undefined): ProblemConfigItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AdminTryoutsPage() {
  const [tryouts, setTryouts] = useState<TryoutItem[]>([]);
  const [allProblems, setAllProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('SKD');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isPremium, setIsPremium] = useState(false);
  const [selectedConfigs, setSelectedConfigs] = useState<ProblemConfigItem[]>([]);

  // Search Bank Soal Picker
  const [problemSearch, setProblemSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [tryoutsRes, problemsRes] = await Promise.all([
      supabase.from('tryouts').select('*').order('title', { ascending: true }),
      supabase
        .from('problems')
        .select('id, title, topic, competition, section, problem_type, options, solutions')
        .order('title', { ascending: true }),
    ]);

    if (tryoutsRes.data) setTryouts(tryoutsRes.data as TryoutItem[]);
    if (problemsRes.data) setAllProblems(problemsRes.data as ProblemItem[]);
    setLoading(false);
  }

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('SKD');
    setDescription('');
    setDurationMinutes(60);
    setStatus('draft');
    setIsPremium(false);
    setSelectedConfigs([]);
    setProblemSearch('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: TryoutItem) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setSlug(item.slug || '');
    setCategory(item.category || 'SKD');
    setDescription(item.description || '');
    setDurationMinutes(item.duration_minutes || 60);
    setStatus(item.status || 'draft');
    setIsPremium(Boolean(item.is_premium));
    setProblemSearch('');
    setSelectedConfigs(parseProblemConfigs(item.problem_configs));
    setShowModal(true);
  };

  const handleAddProblemToPackage = (probId: string) => {
    if (selectedConfigs.some((c) => c.problem_id === probId)) return;

    const prob = allProblems.find((p) => p.id === probId);

    const defaultKey =
      prob?.problem_type === 'multiple_choice'
        ? prob.solutions?.[0]?.final_answer || 'A'
        : prob?.solutions?.[0]?.final_answer || '';

    const defaultSection = prob?.section || 'TWK';

    setSelectedConfigs((prev) => [
      ...prev,
      {
        problem_id: probId,
        section: defaultSection,
        scoring_type: 'standard',
        correct_answer: defaultKey,
        weight_correct: 5,
        weight_wrong: 0,
        weight_unanswered: 0,
        option_weights: { A: 5, B: 4, C: 3, D: 2, E: 1 },
      },
    ]);
  };

  const handleRemoveProblem = (probId: string) => {
    setSelectedConfigs((prev) => prev.filter((c) => c.problem_id !== probId));
  };

  const handleUpdateConfig = (probId: string, updates: Partial<ProblemConfigItem>) => {
    setSelectedConfigs((prev) =>
      prev.map((c) => (c.problem_id === probId ? { ...c, ...updates } : c))
    );
  };

  const handleMoveConfigOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedConfigs.length) return;

    const updated = [...selectedConfigs];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSelectedConfigs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul Paket Try Out wajib diisi!');
      return;
    }

    setSaving(true);

    const generatedSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload = {
      title: title.trim(),
      slug: generatedSlug,
      category: category.trim() || 'SKD',
      description: description.trim(),
      duration_minutes: Number(durationMinutes),
      status,
      is_premium: Boolean(isPremium),
      problem_configs: selectedConfigs,
    };

    if (editingId) {
      const { error } = await supabase.from('tryouts').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) {
        alert(`Gagal memperbarui: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from('tryouts').insert([payload]);
      setSaving(false);
      if (error) {
        alert(`Gagal membuat: ${error.message}`);
        return;
      }
    }

    setShowModal(false);
    fetchData();
  };

  const handleDeleteTryout = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket Try Out ini?')) return;
    const { error } = await supabase.from('tryouts').delete().eq('id', id);
    if (!error) fetchData();
    else alert(`Gagal menghapus: ${error.message}`);
  };

  const inputClass =
    'p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition w-full';

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
              Manajemen Paket Try Out (CBT)
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <a
              href="/tryouts"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-flex items-center"
            >
              Lihat Publik ↗
            </a>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Buat Paket Baru</span>
            </button>
          </div>
        </div>

        {/* LIST PAKET TRY OUT */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : tryouts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tryouts.map((item) => {
              const configList = parseProblemConfigs(item.problem_configs);
              const isPublished = item.status === 'published';

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-900'
                              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-900'
                          }`}
                        >
                          {isPublished ? '● Published' : '○ Draft'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          {item.category || 'SKD'}
                        </span>

                        {item.is_premium ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 inline-flex items-center gap-1">
                            <LockClosedIcon className="w-2.5 h-2.5" />
                            <span>Terbatas</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Gratis
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 shrink-0">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon />
                          <span>{item.duration_minutes || 60}m</span>
                        </span>
                        <span>•</span>
                        <span>{configList.length} Soal</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {item.description || 'Tidak ada deskripsi.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition text-center cursor-pointer"
                    >
                      Edit &amp; Racik Soal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTryout(item.id)}
                      className="h-9 w-9 inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition cursor-pointer shrink-0"
                      title="Hapus Paket"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Belum ada paket Try Out. Klik tombol &quot;Buat Paket Baru&quot; di atas untuk merakit.
          </div>
        )}
      </main>

      {/* MODAL MERAKIT PAKET */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingId ? 'Edit Paket Try Out' : 'Racik Paket Try Out Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            <form
              id="tryoutForm"
              onSubmit={handleSubmit}
              className="space-y-5 text-xs flex-1 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Paket Try Out
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Simulasi SKD Kedinasan 1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Ujian
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mis. SKD / UTBK / ONMIPA"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL Slug (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="simulasi-skd-kedinasan-1"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Publikasi Paket
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold rounded-xl text-xs text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Draft (Belum Dipublikasikan)</option>
                    <option value="published">Published (Tampil untuk Peserta)</option>
                  </select>
                </div>

                {/* PENGATURAN AKSES PAKET (GRATIS VS TERBATAS) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hak Akses Paket
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPremium(false)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        !isPremium
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                      }`}
                    >
                      <p className="font-black text-xs">Gratis</p>
                      <p className="text-[10px] opacity-80">Terbuka untuk semua</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPremium(true)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isPremium
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                      }`}
                    >
                      <p className="font-black text-xs flex items-center gap-1">
                        <LockClosedIcon className="w-3 h-3" />
                        <span>Terbatas</span>
                      </p>
                      <p className="text-[10px] opacity-80">Khusus akun Premium</p>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Ringkas
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi simulasi pengerjaan CBT"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* SECTION: RACIKAN SOAL & REORDER */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpenIcon className="w-4 h-4 text-indigo-500" />
                    <span>Racikan Soal CBT ({selectedConfigs.length} Soal Dipilih)</span>
                  </h4>
                </div>

                {/* Search & Select */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Cari &amp; Tambah Soal dari Bank Soal Master:
                  </span>
                  <input
                    type="text"
                    placeholder="Ketik kata kunci judul / topik / ID soal..."
                    value={problemSearch}
                    onChange={(e) => setProblemSearch(e.target.value)}
                    className="p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition w-full"
                  />

                  {problemSearch.trim() && (
                    <div className="max-h-40 overflow-y-auto space-y-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      {allProblems
                        .filter((p) => {
                          const q = problemSearch.toLowerCase();
                          const matchTitle = (p.title || '').toLowerCase().includes(q);
                          const matchTopic = (p.topic || '').toLowerCase().includes(q);
                          const matchId = (p.id || '').toLowerCase().includes(q);
                          return matchTitle || matchTopic || matchId;
                        })
                        .map((p) => {
                          const isAdded = selectedConfigs.some((c) => c.problem_id === p.id);
                          const isPG = p.problem_type === 'multiple_choice';

                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                    isPG
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {isPG ? 'PG' : 'Isian'}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                                  {p.title || p.id} ({p.topic || 'Umum'})
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={isAdded}
                                onClick={() => handleAddProblemToPackage(p.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer ${
                                  isAdded
                                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                }`}
                              >
                                {isAdded ? 'Sudah Ditambahkan' : '+ Tambah'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* DAFTAR SOAL DALAM PAKET DENGAN FUNGSI REORDER */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {selectedConfigs.map((config, idx) => {
                    const matchedProb = allProblems.find((p) => p.id === config.problem_id);
                    const isPG = matchedProb?.problem_type === 'multiple_choice';

                    return (
                      <div
                        key={config.problem_id}
                        className="p-4 bg-slate-50/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 mr-1">
                              <button
                                type="button"
                                onClick={() => handleMoveConfigOrder(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Naikkan Urutan Nomor Soal"
                              >
                                <ArrowUpIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveConfigOrder(idx, 'down')}
                                disabled={idx === selectedConfigs.length - 1}
                                className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Turunkan Urutan Nomor Soal"
                              >
                                <ArrowDownIcon />
                              </button>
                            </div>

                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              Soal #{idx + 1}: {matchedProb?.title || config.problem_id}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                isPG
                                  ? 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900'
                                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {isPG ? 'PG' : 'Isian'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Seksi:
                              </span>
                              <input
                                type="text"
                                placeholder="mis. TWK / TIU / TKP"
                                value={config.section || 'TWK'}
                                onChange={(e) =>
                                  handleUpdateConfig(config.problem_id, { section: e.target.value })
                                }
                                className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold rounded-md text-[11px] w-20 text-center uppercase"
                              />
                            </div>

                            <select
                              value={config.scoring_type}
                              onChange={(e) =>
                                handleUpdateConfig(config.problem_id, {
                                  scoring_type: e.target.value as 'standard' | 'weighted_tkp',
                                })
                              }
                              className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold rounded-md text-[11px]"
                            >
                              <option value="standard">Standard (Benar/Salah)</option>
                              <option value="weighted_tkp">SKD TKP (Opsi 1-5 Poin)</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveProblem(config.problem_id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg ml-1 cursor-pointer"
                              title="Hapus Soal dari Paket"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>

                        {/* Pengaturan Poin & Kunci Jawaban Resmi */}
                        {config.scoring_type === 'standard' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                            <div>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold block mb-1">
                                Kunci Jawaban Benar:
                              </span>
                              {isPG ? (
                                <select
                                  value={config.correct_answer || 'A'}
                                  onChange={(e) =>
                                    handleUpdateConfig(config.problem_id, {
                                      correct_answer: e.target.value,
                                    })
                                  }
                                  className="p-1.5 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/50 rounded-lg w-full font-black text-indigo-700 dark:text-indigo-300"
                                >
                                  {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                                    <option key={opt} value={opt}>
                                      Opsi {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Kunci Jawaban Teks / Angka"
                                  value={config.correct_answer || ''}
                                  onChange={(e) =>
                                    handleUpdateConfig(config.problem_id, {
                                      correct_answer: e.target.value,
                                    })
                                  }
                                  className="p-1.5 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/50 rounded-lg w-full font-bold text-indigo-700 dark:text-indigo-300"
                                />
                              )}
                            </div>

                            <div>
                              <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                                Poin Benar:
                              </span>
                              <input
                                type="number"
                                value={config.weight_correct}
                                onChange={(e) =>
                                  handleUpdateConfig(config.problem_id, {
                                    weight_correct: Number(e.target.value),
                                  })
                                }
                                className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg w-full font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                                Poin Salah (Penalti):
                              </span>
                              <input
                                type="number"
                                value={config.weight_wrong}
                                onChange={(e) =>
                                  handleUpdateConfig(config.problem_id, {
                                    weight_wrong: Number(e.target.value),
                                  })
                                }
                                className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg w-full font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                                Poin Kosong:
                              </span>
                              <input
                                type="number"
                                value={config.weight_unanswered ?? 0}
                                onChange={(e) =>
                                  handleUpdateConfig(config.problem_id, {
                                    weight_unanswered: Number(e.target.value),
                                  })
                                }
                                className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg w-full font-bold"
                              />
                            </div>
                          </div>
                        ) : (
                          /* Pengaturan Poin SKD TKP (A-E) */
                          <div className="grid grid-cols-5 gap-2 text-[10px] text-center">
                            {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                              <div key={opt}>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                                  Opsi {opt}
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={5}
                                  value={config.option_weights?.[opt] ?? 0}
                                  onChange={(e) =>
                                    handleUpdateConfig(config.problem_id, {
                                      option_weights: {
                                        ...config.option_weights,
                                        [opt]: Number(e.target.value),
                                      },
                                    })
                                  }
                                  className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg w-full text-center font-bold"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                form="tryoutForm"
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Paket Try Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}