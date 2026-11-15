'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';
import { MathText } from '@/components/MathText';
import { ProofStep, Theorem } from '@/types/theorem';

// --- SVG CUSTOM ICONS ---
function PlusIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PencilIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
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

function ExternalLinkIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function SearchIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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

function ChevronUpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const DEFAULT_FIELDS = [
  'Aljabar',
  'Geometri',
  'Teori Bilangan',
  'Kombinatorika',
  'Kalkulus',
  'Trigonometri',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminTheoremsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [theorems, setTheorems] = useState<Theorem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filter & Pencarian
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // State Pop-up Form Editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [field, setField] = useState('Aljabar');
  const [topic, setTopic] = useState('');
  const [mathematicians, setMathematicians] = useState('');
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [statement, setStatement] = useState('');
  const [intuition, setIntuition] = useState('');
  const [proofSteps, setProofSteps] = useState<ProofStep[]>([
    { step: 1, tag: '', content: '' },
  ]);

  useEffect(() => {
    fetchTheorems();
  }, []);

  // Kunci scroll halaman & dukung tombol Escape saat pop-up terbuka
  useEffect(() => {
    if (!isEditorOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        setIsEditorOpen(false);
        setEditingId(null);
        setModalError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditorOpen, saving]);

  async function fetchTheorems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('theorems')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      setFeedback({
        type: 'error',
        text: `Gagal memuat daftar teorema: ${error.message}`,
      });
    } else if (data) {
      setTheorems(data as Theorem[]);
    }
    setLoading(false);
  }

  const availableFields = useMemo(() => {
    return Array.from(new Set(theorems.map((t) => t.field).filter(Boolean)));
  }, [theorems]);

  const suggestedFields = useMemo(() => {
    return Array.from(new Set([...DEFAULT_FIELDS, ...availableFields]));
  }, [availableFields]);

  const nextOrderIndex = useMemo(() => {
    if (theorems.length === 0) return 1;
    return Math.max(...theorems.map((t) => Number(t.order_index) || 0)) + 1;
  }, [theorems]);

  const filteredTheorems = useMemo(() => {
    return theorems.filter((t) => {
      const matchField = selectedField === 'ALL' || t.field === selectedField;
      if (!matchField) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        t.title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.field.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        (t.mathematicians || '').toLowerCase().includes(q) ||
        t.statement.toLowerCase().includes(q)
      );
    });
  }, [theorems, selectedField, searchQuery]);

  // --- HANDLER POP-UP FORM ---
  const openCreateEditor = () => {
    setEditingId(null);
    setSlugTouched(false);
    setTitle('');
    setSlug('');
    setField(selectedField !== 'ALL' ? selectedField : 'Aljabar');
    setTopic('');
    setMathematicians('');
    setOrderIndex(nextOrderIndex);
    setStatement('');
    setIntuition('');
    setProofSteps([{ step: 1, tag: '', content: '' }]);
    setModalError(null);
    setFeedback(null);
    setIsEditorOpen(true);
  };

  const openEditEditor = (item: Theorem) => {
    setEditingId(item.id);
    setSlugTouched(true);
    setTitle(item.title || '');
    setSlug(item.slug || '');
    setField(item.field || 'Aljabar');
    setTopic(item.topic || '');
    setMathematicians(item.mathematicians || '');
    setOrderIndex(Number(item.order_index) || 1);
    setStatement(item.statement || '');
    setIntuition(item.intuition || '');

    const existingSteps =
      Array.isArray(item.proof_steps) && item.proof_steps.length > 0
        ? [...item.proof_steps]
            .sort((a, b) => a.step - b.step)
            .map((s, idx) => ({
              step: idx + 1,
              tag: s.tag || '',
              content: s.content || '',
            }))
        : [{ step: 1, tag: '', content: '' }];

    setProofSteps(existingSteps);
    setModalError(null);
    setFeedback(null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setIsEditorOpen(false);
    setEditingId(null);
    setModalError(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched && !editingId) {
      setSlug(slugify(val));
    }
  };

  // --- PROOF STEPS BUILDER ---
  const handleAddStep = () => {
    setProofSteps((prev) => [
      ...prev,
      { step: prev.length + 1, tag: '', content: '' },
    ]);
  };

  const handleUpdateStep = (index: number, key: 'tag' | 'content', value: string) => {
    setProofSteps((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
  };

  const handleRemoveStep = (index: number) => {
    setProofSteps((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, step: idx + 1 }))
    );
  };

  const handleMoveStep = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= proofSteps.length) return;

    setProofSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, step: idx + 1 }));
    });
  };

  // --- SIMPAN TEOREMA ---
  const handleSaveTheorem = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setFeedback(null);

    const cleanTitle = title.trim();
    const cleanSlug = slugify(slug || title);
    const cleanField = field.trim();
    const cleanTopic = topic.trim();
    const cleanStatement = statement.trim();

    if (!cleanTitle || !cleanSlug || !cleanField || !cleanTopic || !cleanStatement) {
      setModalError('Judul, slug, bidang, topik, dan pernyataan teorema wajib diisi.');
      return;
    }

    const cleanedSteps: ProofStep[] = proofSteps
      .filter((s) => s.content.trim().length > 0)
      .map((s, idx) => ({
        step: idx + 1,
        ...(s.tag?.trim() ? { tag: s.tag.trim() } : {}),
        content: s.content.trim(),
      }));

    const payload = {
      title: cleanTitle,
      slug: cleanSlug,
      field: cleanField,
      topic: cleanTopic,
      mathematicians: mathematicians.trim() || null,
      order_index: Number(orderIndex) || 1,
      statement: cleanStatement,
      intuition: intuition.trim(),
      proof_steps: cleanedSteps,
    };

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('theorems')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;

        setFeedback({
          type: 'success',
          text: `Teorema "${cleanTitle}" berhasil diperbarui.`,
        });
      } else {
        const { error } = await supabase.from('theorems').insert([payload]);
        if (error) throw error;

        setFeedback({
          type: 'success',
          text: `Teorema baru "${cleanTitle}" berhasil ditambahkan.`,
        });
      }

      setIsEditorOpen(false);
      setEditingId(null);
      await fetchTheorems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.';
      setModalError(`Gagal menyimpan teorema: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  // --- UBAH URUTAN LANGSUNG ---
  const handleSwapOrder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= filteredTheorems.length) return;

    const currentItem = filteredTheorems[index];
    const targetItem = filteredTheorems[targetIndex];

    setBusyId(currentItem.id);
    setFeedback(null);

    try {
      const currentOrder = currentItem.order_index;
      const targetOrder =
        targetItem.order_index === currentOrder
          ? currentOrder + direction
          : targetItem.order_index;

      const [res1, res2] = await Promise.all([
        supabase.from('theorems').update({ order_index: targetOrder }).eq('id', currentItem.id),
        supabase.from('theorems').update({ order_index: currentOrder }).eq('id', targetItem.id),
      ]);

      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;

      await fetchTheorems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah urutan.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setBusyId(null);
    }
  };

  // --- HAPUS TEOREMA ---
  const handleDeleteTheorem = async (item: Theorem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${item.title}"?`)) return;

    setBusyId(item.id);
    setFeedback(null);

    try {
      const { error } = await supabase.from('theorems').delete().eq('id', item.id);
      if (error) throw error;

      setTheorems((prev) => prev.filter((t) => t.id !== item.id));
      if (editingId === item.id) {
        setIsEditorOpen(false);
        setEditingId(null);
      }
      setFeedback({
        type: 'success',
        text: `Teorema "${item.title}" berhasil dihapus.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus teorema.';
      setFeedback({
        type: 'error',
        text: `Gagal menghapus: ${message}`,
      });
    } finally {
      setBusyId(null);
    }
  };

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
              Manajemen Perpustakaan Teorema
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <Link
              href="/teorema"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <ExternalLinkIcon />
              <span>Halaman Publik</span>
            </Link>

            <button
              type="button"
              onClick={fetchTheorems}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshIcon />
              <span>Muat Ulang</span>
            </button>

            <button
              type="button"
              onClick={openCreateEditor}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <PlusIcon />
              <span>Tambah Teorema</span>
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
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Cari judul teorema, topik, tokoh, slug, atau pernyataan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 inline-flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white">{theorems.length}</span>
                <span className="text-slate-500">Teorema</span>
              </span>
              <span className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 inline-flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {availableFields.length}
                </span>
                <span className="text-slate-500">Bidang</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Bidang:
            </span>
            <button
              type="button"
              onClick={() => setSelectedField('ALL')}
              className={`h-8 px-3 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                selectedField === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua ({theorems.length})
            </button>
            {availableFields.map((f) => {
              const count = theorems.filter((t) => t.field === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedField(f)}
                  className={`h-8 px-3 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedField === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* DAFTAR TEOREMA */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredTheorems.length > 0 ? (
          <div className="space-y-4">
            {filteredTheorems.map((item, idx) => {
              const isBusy = busyId === item.id;
              const stepCount = Array.isArray(item.proof_steps) ? item.proof_steps.length : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold">
                          #{item.order_index}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                          {item.field}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.topic}
                        </span>
                        {item.mathematicians && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.mathematicians}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          /teorema/{item.slug} · {stepCount} langkah pembuktian
                        </span>
                      </div>
                    </div>

                    {/* AKSI */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        type="button"
                        disabled={isBusy || idx === 0}
                        onClick={() => handleSwapOrder(idx, -1)}
                        className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center transition cursor-pointer"
                        title="Naikkan Urutan"
                      >
                        <ChevronUpIcon />
                      </button>

                      <button
                        type="button"
                        disabled={isBusy || idx === filteredTheorems.length - 1}
                        onClick={() => handleSwapOrder(idx, 1)}
                        className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center transition cursor-pointer"
                        title="Turunkan Urutan"
                      >
                        <ChevronDownIcon />
                      </button>

                      <Link
                        href={`/teorema/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
                      >
                        <ExternalLinkIcon />
                        <span>Lihat</span>
                      </Link>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => openEditEditor(item)}
                        className="h-8 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <PencilIcon />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteTheorem(item)}
                        className="h-8 w-8 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 disabled:opacity-40 inline-flex items-center justify-center transition cursor-pointer"
                        title="Hapus Teorema"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* RINGKASAN PERNYATAAN */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <MathText text={item.statement} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Belum ada teorema yang tersimpan atau sesuai dengan filter pencarian.
            </p>
            <button
              type="button"
              onClick={openCreateEditor}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusIcon />
              <span>Tambah Teorema Pertama</span>
            </button>
          </div>
        )}
      </main>

      {/* POP-UP MODAL EDITOR + LIVE KATEX PREVIEW */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={closeEditor}
          />

          {/* Dialog Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="theorem-modal-title"
            className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  {editingId ? 'Mode Sunting' : 'Entri Baru'}
                </span>
                <h2
                  id="theorem-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
                >
                  {editingId ? `Edit Teorema: ${title || 'Tanpa Judul'}` : 'Tambah Teorema Baru'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                aria-label="Tutup Pop-up"
                className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {modalError && (
                <div className="p-3.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3">
                  <span>{modalError}</span>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-[11px] font-bold opacity-75 hover:opacity-100 shrink-0 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}

              <form
                id="theorem-editor-form"
                onSubmit={handleSaveTheorem}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* KOLOM KIRI: INPUT DATA */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Judul Teorema <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Contoh: Ketaksamaan AM-GM"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Slug URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(e.target.value);
                        }}
                        placeholder="ketaksamaan-am-gm"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Bidang <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        list="theorem-fields-list"
                        required
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        placeholder="Aljabar / Geometri"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 transition"
                      />
                      <datalist id="theorem-fields-list">
                        {suggestedFields.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Topik <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Contoh: Ketaksamaan"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Urutan Tampil
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Tokoh / Tahun (Opsional)
                    </label>
                    <input
                      type="text"
                      value={mathematicians}
                      onChange={(e) => setMathematicians(e.target.value)}
                      placeholder="Contoh: Augustin-Louis Cauchy (1821)"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* PERNYATAAN TEOREMA */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Pernyataan Teorema (Mendukung KaTeX $...$ dan $$...$$){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      placeholder="Untuk setiap bilangan real tak negatif $a_1, a_2, \dots, a_n$, berlaku $$\frac{a_1 + a_2 + \dots + a_n}{n} \ge \sqrt[n]{a_1 a_2 \cdots a_n}$$"
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* INTUISI */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Intuisi &amp; Kapan Dipakai
                    </label>
                    <textarea
                      rows={3}
                      value={intuition}
                      onChange={(e) => setIntuition(e.target.value)}
                      placeholder="Jelaskan intuisi geometris/aljabar serta ciri-ciri soal yang cocok menggunakan teorema ini..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* LANGKAH PEMBUKTIAN FORMAL */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Langkah Pembuktian Formal ({proofSteps.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="h-8 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <PlusIcon />
                        <span>Tambah Langkah</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {proofSteps.map((stepItem, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={stepItem.tag || ''}
                                onChange={(e) => handleUpdateStep(idx, 'tag', e.target.value)}
                                placeholder="Tag langkah (opsional, misal: Basis Induksi)"
                                className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition"
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStep(idx, -1)}
                                className="h-7 w-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 flex items-center justify-center transition cursor-pointer"
                                title="Geser Naik"
                              >
                                <ChevronUpIcon />
                              </button>
                              <button
                                type="button"
                                disabled={idx === proofSteps.length - 1}
                                onClick={() => handleMoveStep(idx, 1)}
                                className="h-7 w-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 flex items-center justify-center transition cursor-pointer"
                                title="Geser Turun"
                              >
                                <ChevronDownIcon />
                              </button>
                              {proofSteps.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(idx)}
                                  className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 flex items-center justify-center transition cursor-pointer"
                                  title="Hapus Langkah"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={stepItem.content}
                            onChange={(e) => handleUpdateStep(idx, 'content', e.target.value)}
                            placeholder="Tulis isi langkah pembuktian (mendukung KaTeX)..."
                            className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN: LIVE PREVIEW KATEX */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Pratinjau Langsung (KaTeX)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        #{orderIndex || 1}
                      </span>
                    </div>

                    {/* Header Preview */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                          {field || 'Bidang'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {topic || 'Topik'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {title || 'Judul Teorema'}
                      </h3>
                      {mathematicians && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {mathematicians}
                        </p>
                      )}
                    </div>

                    {/* Statement Preview */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BookOpenIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Pernyataan</span>
                      </span>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {statement.trim() ? (
                          <MathText text={statement} />
                        ) : (
                          <span className="text-slate-400 italic text-xs">
                            Pratinjau pernyataan teorema akan muncul di sini...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Intuition Preview */}
                    {intuition.trim() && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <LightbulbIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>Intuisi</span>
                        </span>
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-700 dark:text-slate-300">
                          <MathText text={intuition} />
                        </div>
                      </div>
                    )}

                    {/* Proof Steps Preview */}
                    {proofSteps.some((s) => s.content.trim()) && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Langkah Pembuktian
                        </span>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {proofSteps
                            .filter((s) => s.content.trim())
                            .map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                              >
                                <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  {s.tag && (
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                      {s.tag}
                                    </p>
                                  )}
                                  <div className="text-slate-800 dark:text-slate-200">
                                    <MathText text={s.content} />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="h-9 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="theorem-editor-form"
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
              >
                {saving
                  ? 'Menyimpan...'
                  : editingId
                  ? 'Simpan Perubahan'
                  : 'Terbitkan Teorema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}