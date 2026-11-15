'use client';

import { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';
import { getModuleStyle } from '@/lib/note-styles';

interface NoteModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  topic?: string;
  is_premium?: boolean;
  created_at?: string;
  note_chapters?: { id: string }[];
}

interface NoteChapter {
  id: string;
  note_id: string;
  title: string;
  slug: string;
  content: string;
  order_index: number;
  parent_id?: string | null;
  is_preview?: boolean;
}

const TOPIC_OPTIONS = [
  'Aljabar',
  'Struktur Aljabar',
  'Analisis Real',
  'Analisis Kompleks',
  'Persamaan Diferensial',
  'Geometri',
  'Geometri Analitik & Vektor',
  'Trigonometri',
  'Topologi',
  'Kombinatorika',
  'Teori Graf',
  'Teori Bilangan',
  'Logika & Himpunan',
  'Statistika & Peluang',
  'Metode Numerik',
  'Riset Operasi & Optimasi',
  'Metode Penelitian',
  'Pendidikan Matematika',
];

// --- KATEX MATH PARSER UNTUK LIVE PREVIEW ---
function MathText({ text }: { text?: string }) {
  if (!text) return <span className="text-slate-400 italic text-xs">Belum ada konten...</span>;
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

// --- SVG ICON HELPERS ---
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EditIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default function AdminNotesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [modules, setModules] = useState<NoteModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<NoteModule | null>(null);
  const [chapters, setChapters] = useState<NoteChapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    slug: '',
    topic: 'Aljabar',
    description: '',
    is_premium: false,
  });

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    slug: '',
    content: '',
    order_index: 1,
    parent_id: '',
    is_preview: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchChapters(selectedModule.id);
    }
  }, [selectedModule?.id]);

  async function fetchModules() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, slug, description, topic, is_premium, created_at, note_chapters(id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching modules:', error);
    } else if (data) {
      setModules(data as NoteModule[]);
    }
    setLoading(false);
  }

  async function fetchChapters(noteId: string) {
    const { data, error } = await supabase
      .from('note_chapters')
      .select('*')
      .eq('note_id', noteId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching chapters:', error);
    } else if (data) {
      setChapters(data as NoteChapter[]);
    }
  }

  // --- HANDLERS MODUL ---
  const handleOpenModuleModal = (mod?: NoteModule) => {
    if (mod) {
      setEditingModuleId(mod.id);
      setModuleForm({
        title: mod.title || '',
        slug: mod.slug || '',
        topic: mod.topic || 'Aljabar',
        description: mod.description || '',
        is_premium: Boolean(mod.is_premium),
      });
    } else {
      setEditingModuleId(null);
      setModuleForm({
        title: '',
        slug: '',
        topic: 'Aljabar',
        description: '',
        is_premium: false,
      });
    }
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const generatedSlug =
      moduleForm.slug.trim() || moduleForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const updatePayload = {
      title: moduleForm.title,
      slug: generatedSlug,
      topic: moduleForm.topic,
      description: moduleForm.description,
      is_premium: Boolean(moduleForm.is_premium),
    };

    let resError = null;

    if (editingModuleId) {
      const { data, error } = await supabase
        .from('notes')
        .update(updatePayload)
        .eq('id', editingModuleId)
        .select();

      resError = error;

      if (!error && (!data || data.length === 0)) {
        alert(
          'Gagal memperbarui modul: Tidak ada baris yang ter-update. Pastikan Anda sudah login sebagai Admin!'
        );
        setSaving(false);
        return;
      }

      if (data && data[0] && selectedModule?.id === editingModuleId) {
        setSelectedModule((prev) => (prev ? { ...prev, ...data[0] } : null));
      }
    } else {
      const { error } = await supabase.from('notes').insert([updatePayload]);
      resError = error;
    }

    setSaving(false);

    if (resError) {
      alert(`Gagal menyimpan modul: ${resError.message}`);
      return;
    }

    setIsModuleModalOpen(false);
    await fetchModules();
  };

  const handleDeleteModule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus modul ini beserta seluruh bab di dalamnya?')) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) {
        alert(`Gagal menghapus modul: ${error.message}`);
      } else {
        if (selectedModule?.id === id) setSelectedModule(null);
        fetchModules();
      }
    }
  };

  // --- HANDLERS BAB MATERI & SUBBAB ---
  const handleOpenChapterModal = (chap?: NoteChapter, defaultParentId?: string) => {
    if (chap) {
      setEditingChapterId(chap.id);
      setChapterForm({
        title: chap.title,
        slug: chap.slug,
        content: chap.content,
        order_index: chap.order_index,
        parent_id: chap.parent_id || '',
        is_preview: Boolean(chap.is_preview),
      });
    } else {
      setEditingChapterId(null);
      const parentId = defaultParentId || '';
      const siblingCount = chapters.filter((c) =>
        parentId ? c.parent_id === parentId : !c.parent_id
      ).length;
      setChapterForm({
        title: '',
        slug: '',
        content: '',
        order_index: siblingCount + 1,
        parent_id: parentId,
        is_preview: false,
      });
    }
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    setSaving(true);
    const generatedSlug =
      chapterForm.slug.trim() || chapterForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const parentIdValue = chapterForm.parent_id ? chapterForm.parent_id : null;

    let resError = null;

    if (editingChapterId) {
      const { error } = await supabase
        .from('note_chapters')
        .update({
          title: chapterForm.title,
          slug: generatedSlug,
          content: chapterForm.content,
          order_index: Number(chapterForm.order_index),
          parent_id: parentIdValue,
          is_preview: Boolean(chapterForm.is_preview),
        })
        .eq('id', editingChapterId);
      resError = error;
    } else {
      const { error } = await supabase.from('note_chapters').insert([
        {
          note_id: selectedModule.id,
          title: chapterForm.title,
          slug: generatedSlug,
          content: chapterForm.content,
          order_index: Number(chapterForm.order_index),
          parent_id: parentIdValue,
          is_preview: Boolean(chapterForm.is_preview),
        },
      ]);
      resError = error;
    }

    setSaving(false);

    if (resError) {
      alert(`Gagal menyimpan bab/subbab: ${resError.message}`);
      return;
    }

    setIsChapterModalOpen(false);
    fetchChapters(selectedModule.id);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm('Hapus bab/subbab materi ini?')) {
      const { error } = await supabase.from('note_chapters').delete().eq('id', chapterId);
      if (error) {
        alert(`Gagal menghapus: ${error.message}`);
      } else if (selectedModule) {
        fetchChapters(selectedModule.id);
      }
    }
  };

  const rootChapters = chapters.filter((c) => !c.parent_id);
  const previewModuleStyle = getModuleStyle(moduleForm.topic, moduleForm.title);
  const selectedModuleStyle = selectedModule
    ? getModuleStyle(selectedModule.topic, selectedModule.title)
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 pb-16">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {!selectedModule ? (
          /* ================= VIEW 1: KATALOG MANAJEMEN MODUL ================= */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Admin Panel
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  CMS Editor TheoNotes
                </h1>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <a
                  href="/notes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-flex items-center"
                >
                  Lihat Publik ↗
                </a>
                <button
                  type="button"
                  onClick={() => handleOpenModuleModal()}
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Buat Modul Baru</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => {
                  const modStyle = getModuleStyle(mod.topic, mod.title);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => setSelectedModule(mod)}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition cursor-pointer group flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Cover Vector Header dari note-styles.tsx */}
                        <div
                          className={`relative h-32 ${modStyle.bg} flex items-center justify-center overflow-hidden`}
                        >
                          <div className="transform group-hover:scale-105 transition-transform duration-300">
                            {modStyle.svg}
                          </div>

                          {/* Topik Badge */}
                          <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-black/25 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/20">
                            {mod.topic || 'Umum'}
                          </span>

                          {/* Aksi Edit & Hapus */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModuleModal(mod);
                              }}
                              className="p-1.5 text-white/90 hover:text-white rounded-lg bg-black/25 hover:bg-black/40 backdrop-blur-md transition cursor-pointer"
                              title="Edit Metadata Modul"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteModule(mod.id, e)}
                              className="p-1.5 text-white/90 hover:text-red-200 rounded-lg bg-black/25 hover:bg-red-600/80 backdrop-blur-md transition cursor-pointer"
                              title="Hapus Modul"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Body Kartu */}
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            {mod.is_premium ? (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                                🔒 Terbatas
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                                Gratis
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                              /{mod.slug}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {mod.title}
                          </h3>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {mod.description || 'Tidak ada deskripsi.'}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>{mod.note_chapters?.length || 0} Item Pembahasan</span>
                        <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition font-bold">
                          Kelola Bab →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Belum ada modul TheoNotes. Klik tombol &quot;Buat Modul Baru&quot; di atas.
              </div>
            )}
          </div>
        ) : (
          /* ================= VIEW 2: MANAJEMEN BAB & SUBBAB TERPILIH ================= */
          <div className="space-y-6">
            {/* Control Top Bar untuk Modul Terpilih */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Thumbnail Vektor Modul */}
                {selectedModuleStyle && (
                  <div
                    className={`hidden sm:flex w-16 h-16 rounded-2xl ${selectedModuleStyle.bg} items-center justify-center shrink-0 overflow-hidden`}
                  >
                    <div className="scale-[0.55]">{selectedModuleStyle.svg}</div>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mb-1.5 cursor-pointer"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>Kembali ke Daftar Modul</span>
                  </button>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      Kelola Bab: {selectedModule.title}
                    </h2>
                    {selectedModule.is_premium ? (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                        🔒 Terbatas (Premium)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                        Akses Gratis
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>
                      Topik:{' '}
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                        {selectedModule.topic || 'Umum'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Slug:{' '}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                        {selectedModule.slug}
                      </code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenModuleModal(selectedModule)}
                  className="h-9 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                  <span>Edit Metadata Modul</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChapterModal()}
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Tambah Bab Utama</span>
                </button>
              </div>
            </div>

            {/* List Bab & Subbab Hierarkis */}
            {rootChapters.length > 0 ? (
              <div className="space-y-6">
                {rootChapters.map((rootChap) => {
                  const subChapters = chapters.filter((c) => c.parent_id === rootChap.id);

                  return (
                    <div
                      key={rootChap.id}
                      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4"
                    >
                      {/* BARIS BAB UTAMA */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                              {rootChap.order_index}
                            </span>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              {rootChap.title}
                            </h3>
                            {rootChap.is_preview && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold">
                                Preview Gratis
                              </span>
                            )}
                          </div>

                          {rootChap.content && (
                            <div className="pl-8 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                              <MathText text={rootChap.content} />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenChapterModal(undefined, rootChap.id)}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition inline-flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>Subbab</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenChapterModal(rootChap)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            title="Edit Bab Utama"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(rootChap.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition cursor-pointer"
                            title="Hapus Bab Utama"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* LIST SUBBAB DENGAN INDENTASI */}
                      {subChapters.length > 0 ? (
                        <div className="pl-4 sm:pl-6 space-y-3 border-l-2 border-indigo-100 dark:border-indigo-950 ml-3">
                          {subChapters.map((subChap) => (
                            <div
                              key={subChap.id}
                              className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                                    {rootChap.order_index}.{subChap.order_index}
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {subChap.title}
                                  </h4>
                                  {subChap.is_preview && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold">
                                      Preview Gratis
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenChapterModal(subChap)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Edit Subbab"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChapter(subChap.id)}
                                    className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Hapus Subbab"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {subChap.content && (
                                <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                  <MathText text={subChap.content} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic pl-3">
                          Belum ada subbab di bawah {rootChap.title}. Klik tombol &quot;+ Subbab&quot;
                          untuk menambahkan.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Modul ini belum memiliki Bab Utama. Klik &quot;Tambah Bab Utama&quot; di atas.
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL TAMBAH/EDIT MODUL ================= */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingModuleId ? 'Edit Metadata Modul' : 'Buat Modul TheoNotes Baru'}
            </h3>

            {/* Live Pratinjau Sampul & Vektor Otomatis */}
            <div
              className={`relative h-28 rounded-2xl ${previewModuleStyle.bg} flex items-center justify-center overflow-hidden`}
            >
              {previewModuleStyle.svg}
              <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-white/90 bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
                Pratinjau Sampul Otomatis
              </span>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  Judul Modul:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Logika & Himpunan"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  Topik Utama:
                </label>
                <select
                  value={moduleForm.topic}
                  onChange={(e) => setModuleForm({ ...moduleForm, topic: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  {!TOPIC_OPTIONS.includes(moduleForm.topic) && moduleForm.topic && (
                    <option value={moduleForm.topic}>{moduleForm.topic}</option>
                  )}
                  {TOPIC_OPTIONS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              {/* PENGATURAN AKSES MODUL (GRATIS VS TERBATAS) */}
              <div>
                <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">
                  Hak Akses Modul:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModuleForm({ ...moduleForm, is_premium: false })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      !moduleForm.is_premium
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                    }`}
                  >
                    <p className="font-black text-xs">Gratis</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Terbuka untuk semua</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModuleForm({ ...moduleForm, is_premium: true })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      moduleForm.is_premium
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                    }`}
                  >
                    <p className="font-black text-xs">🔒 Terbatas</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Khusus akun Premium</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  Custom Slug (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="logika-himpunan"
                  value={moduleForm.slug}
                  onChange={(e) => setModuleForm({ ...moduleForm, slug: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  Deskripsi Ringkas:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan singkat isi modul..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Modul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDITOR BAB / SUBBAB MATERI ================= */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingChapterId
                  ? 'Edit Item Pembahasan'
                  : chapterForm.parent_id
                  ? 'Tambah Subbab Baru'
                  : 'Tambah Bab Utama Baru'}
              </h3>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                Modul: {selectedModule?.title}
              </span>
            </div>

            <form
              id="chapterForm"
              onSubmit={handleSaveChapter}
              className="space-y-4 text-xs flex-1 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    Tingkat / Induk:
                  </label>
                  <select
                    value={chapterForm.parent_id}
                    onChange={(e) => setChapterForm({ ...chapterForm, parent_id: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="">📌 Bab Utama (Root)</option>
                    {rootChapters.map((r) => (
                      <option key={r.id} value={r.id}>
                        ↳ Subbab dari: {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    No. Urut:
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={chapterForm.order_index}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, order_index: Number(e.target.value) })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-center text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    Judul Bab / Subbab:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      chapterForm.parent_id
                        ? 'Misal: Implikasi dan Biimplikasi'
                        : 'Misal: Bab 1: Pernyataan & Tabel Kebenaran'
                    }
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-6">
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    Slug URL (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="implikasi-biimplikasi"
                    value={chapterForm.slug}
                    onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-6 sm:pt-5">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:border-emerald-400 transition">
                    <input
                      type="checkbox"
                      checked={chapterForm.is_preview}
                      onChange={(e) =>
                        setChapterForm({ ...chapterForm, is_preview: e.target.checked })
                      }
                      className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Jadikan Preview Gratis
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Tetap bisa dibaca akun Free meski modul berstatus Terbatas.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* DUAL PANEL EDITOR: INPUT TEXTAREA (KIRI) VS KATEX PREVIEW (KANAN) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-bold block text-slate-700 dark:text-slate-300">
                    Isi Materi (KaTeX `$formula$` / `$$formula$$`):
                  </label>
                  <textarea
                    rows={12}
                    placeholder="Tuliskan isi bab di sini..."
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block text-indigo-600 dark:text-indigo-400">
                    Live Pratinjau Tampilan Pembaca:
                  </label>
                  <div className="w-full h-[280px] lg:h-[265px] p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-y-auto text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    <MathText text={chapterForm.content} />
                  </div>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsChapterModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                form="chapterForm"
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pembahasan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}