'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface LanguageItem {
  id: string;
  code: string;
  name: string;
  native_name: string;
  region_tag: string;
  speech_lang: string;
  direction: 'ltr' | 'rtl';
  accent_gradient: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
}

interface ModuleItem {
  id: string;
  language_id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
}

interface LessonItem {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  content_md: string;
  grammar_notes: string | null;
  sort_order: number;
}

interface VocabItem {
  id: string;
  module_id: string;
  term: string;
  phonetic: string | null;
  meaning: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_phonetic: string | null;
  example_meaning: string | null;
  sort_order: number;
}

const GRADIENT_PRESETS = [
  { label: 'Indigo Biru', value: 'from-indigo-500 via-blue-600 to-slate-900' },
  { label: 'Merah Mawar', value: 'from-rose-500 via-red-600 to-amber-800' },
  { label: 'Pink Sakura', value: 'from-pink-500 via-rose-600 to-indigo-900' },
  { label: 'Biru Langit', value: 'from-sky-500 via-blue-600 to-indigo-900' },
  { label: 'Zamrud', value: 'from-emerald-500 via-teal-600 to-slate-900' },
  { label: 'Oranye Amber', value: 'from-amber-500 via-orange-600 to-stone-900' },
];

function slugify(text: string, fallbackPrefix = 'item') {
  const clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || `${fallbackPrefix}-${Date.now().toString(36)}`;
}

export default function AdminLanguagesPage() {
  const supabase = useMemo(() => createClient(), []);

  // Auth & Role Check
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data Utama
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string>('');
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);

  // Status UI
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'lessons' | 'vocab'>('lessons');

  // Modal Tambah/Edit Bahasa
  const [showLangModal, setShowLangModal] = useState(false);
  const [editingLang, setEditingLang] = useState<LanguageItem | null>(null);
  const [langForm, setLangForm] = useState({
    code: '',
    name: '',
    native_name: '',
    region_tag: 'Eropa',
    speech_lang: 'en-US',
    direction: 'ltr' as 'ltr' | 'rtl',
    accent_gradient: GRADIENT_PRESETS[0].value,
    description: '',
    sort_order: 12,
    is_published: true,
  });

  // Form Modul
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    slug: '',
    level: 'Dasar',
    description: '',
    sort_order: 1,
    is_published: true,
  });

  // Form Materi (Lesson)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    slug: '',
    content_md: '',
    grammar_notes: '',
    sort_order: 1,
  });

  // Form Kosakata (Satuan & Bulk)
  const [vocabInputMode, setVocabInputMode] = useState<'single' | 'bulk'>('single');
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);
  const [vocabForm, setVocabForm] = useState({
    term: '',
    phonetic: '',
    meaning: '',
    part_of_speech: 'Nomina',
    example_sentence: '',
    example_phonetic: '',
    example_meaning: '',
    sort_order: 1,
  });
  const [bulkText, setBulkText] = useState('');

  function notify(type: 'success' | 'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    verifyAdminAndLoad();
  }, []);

  async function verifyAdminAndLoad() {
    setCheckingAuth(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    const adminOk = profile?.role === 'admin';
    setIsAdmin(adminOk);
    setCheckingAuth(false);

    if (adminOk) {
      await fetchLanguages();
    }
  }

  async function fetchLanguages(preferId?: string) {
    const { data } = await supabase
      .from('languages')
      .select('*')
      .order('sort_order', { ascending: true });

    const list = (data as LanguageItem[]) || [];
    setLanguages(list);

    if (list.length > 0) {
      const targetId =
        preferId && list.some((l) => l.id === preferId)
          ? preferId
          : selectedLangId && list.some((l) => l.id === selectedLangId)
          ? selectedLangId
          : list[0].id;
      setSelectedLangId(targetId);
    }
  }

  useEffect(() => {
    if (selectedLangId && isAdmin) {
      fetchModules(selectedLangId);
    }
  }, [selectedLangId, isAdmin]);

  async function fetchModules(langId: string, preferModId?: string) {
    setLoadingModules(true);
    const { data } = await supabase
      .from('lang_modules')
      .select('*')
      .eq('language_id', langId)
      .order('sort_order', { ascending: true });

    const list = (data as ModuleItem[]) || [];
    setModules(list);

    if (list.length > 0) {
      const nextModId =
        preferModId && list.some((m) => m.id === preferModId)
          ? preferModId
          : list[0].id;
      setSelectedModuleId(nextModId);
    } else {
      setSelectedModuleId('');
      setLessons([]);
      setVocabList([]);
    }
    setLoadingModules(false);
  }

  useEffect(() => {
    if (selectedModuleId && isAdmin) {
      fetchModuleDetails(selectedModuleId);
    }
  }, [selectedModuleId, isAdmin]);

  async function fetchModuleDetails(modId: string) {
    setLoadingDetail(true);
    const [{ data: lesData }, { data: vocData }] = await Promise.all([
      supabase
        .from('lang_lessons')
        .select('*')
        .eq('module_id', modId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('lang_vocab')
        .select('*')
        .eq('module_id', modId)
        .order('sort_order', { ascending: true }),
    ]);

    const lesList = (lesData as LessonItem[]) || [];
    const vocList = (vocData as VocabItem[]) || [];

    setLessons(lesList);
    setVocabList(vocList);

    // Reset form urutan berikutnya
    setEditingLessonId(null);
    setLessonForm({
      title: '',
      slug: '',
      content_md: '',
      grammar_notes: '',
      sort_order: lesList.length + 1,
    });

    setEditingVocabId(null);
    setVocabForm({
      term: '',
      phonetic: '',
      meaning: '',
      part_of_speech: 'Nomina',
      example_sentence: '',
      example_phonetic: '',
      example_meaning: '',
      sort_order: vocList.length + 1,
    });

    setLoadingDetail(false);
  }

  const currentLang = useMemo(
    () => languages.find((l) => l.id === selectedLangId) || null,
    [languages, selectedLangId]
  );

  const currentModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) || null,
    [modules, selectedModuleId]
  );

  // --- HANDLER BAHASA ---
  function openNewLangModal() {
    setEditingLang(null);
    setLangForm({
      code: '',
      name: '',
      native_name: '',
      region_tag: 'Eropa',
      speech_lang: 'en-US',
      direction: 'ltr',
      accent_gradient: GRADIENT_PRESETS[0].value,
      description: '',
      sort_order: languages.length + 1,
      is_published: true,
    });
    setShowLangModal(true);
  }

  function openEditLangModal(lang: LanguageItem) {
    setEditingLang(lang);
    setLangForm({
      code: lang.code,
      name: lang.name,
      native_name: lang.native_name,
      region_tag: lang.region_tag,
      speech_lang: lang.speech_lang,
      direction: lang.direction,
      accent_gradient: lang.accent_gradient,
      description: lang.description || '',
      sort_order: lang.sort_order,
      is_published: lang.is_published,
    });
    setShowLangModal(true);
  }

  async function handleSaveLanguage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      code: langForm.code.trim().toLowerCase(),
      name: langForm.name.trim(),
      native_name: langForm.native_name.trim(),
      region_tag: langForm.region_tag.trim() || 'Global',
      speech_lang: langForm.speech_lang.trim(),
      direction: langForm.direction,
      accent_gradient: langForm.accent_gradient,
      description: langForm.description.trim() || null,
      sort_order: Number(langForm.sort_order) || 0,
      is_published: langForm.is_published,
    };

    if (editingLang) {
      const { error } = await supabase
        .from('languages')
        .update(payload)
        .eq('id', editingLang.id);

      if (error) {
        notify('error', `Gagal memperbarui bahasa: ${error.message}`);
      } else {
        notify('success', `Bahasa ${payload.name} berhasil diperbarui.`);
        setShowLangModal(false);
        await fetchLanguages(editingLang.id);
      }
    } else {
      const { data, error } = await supabase
        .from('languages')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        notify('error', `Gagal menambah bahasa: ${error.message}`);
      } else {
        notify('success', `Bahasa ${payload.name} berhasil ditambahkan.`);
        setShowLangModal(false);
        await fetchLanguages(data?.id);
      }
    }

    setSaving(false);
  }

  // --- HANDLER MODUL ---
  function openCreateModule() {
    setEditingModuleId(null);
    setModuleForm({
      title: '',
      slug: '',
      level: 'Dasar',
      description: '',
      sort_order: modules.length + 1,
      is_published: true,
    });
    setShowModuleForm(true);
  }

  function openEditModule(mod: ModuleItem) {
    setEditingModuleId(mod.id);
    setModuleForm({
      title: mod.title,
      slug: mod.slug,
      level: mod.level,
      description: mod.description || '',
      sort_order: mod.sort_order,
      is_published: mod.is_published,
    });
    setShowModuleForm(true);
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLangId || !moduleForm.title.trim()) return;
    setSaving(true);

    const payload = {
      language_id: selectedLangId,
      title: moduleForm.title.trim(),
      slug: moduleForm.slug.trim() || slugify(moduleForm.title, 'modul'),
      level: moduleForm.level.trim() || 'Dasar',
      description: moduleForm.description.trim() || null,
      sort_order: Number(moduleForm.sort_order) || 1,
      is_published: moduleForm.is_published,
    };

    if (editingModuleId) {
      const { error } = await supabase
        .from('lang_modules')
        .update(payload)
        .eq('id', editingModuleId);

      if (error) {
        notify('error', `Gagal memperbarui modul: ${error.message}`);
      } else {
        notify('success', 'Modul berhasil diperbarui.');
        setShowModuleForm(false);
        await fetchModules(selectedLangId, editingModuleId);
      }
    } else {
      const { data, error } = await supabase
        .from('lang_modules')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        notify('error', `Gagal membuat modul: ${error.message}`);
      } else {
        notify('success', 'Modul baru berhasil dibuat.');
        setShowModuleForm(false);
        await fetchModules(selectedLangId, data?.id);
      }
    }

    setSaving(false);
  }

  async function handleDeleteModule(mod: ModuleItem) {
    if (!confirm(`Hapus modul "${mod.title}" beserta seluruh materi dan kosakatanya?`)) return;
    const { error } = await supabase.from('lang_modules').delete().eq('id', mod.id);
    if (error) {
      notify('error', `Gagal menghapus modul: ${error.message}`);
    } else {
      notify('success', 'Modul berhasil dihapus.');
      await fetchModules(selectedLangId);
    }
  }

  // --- HANDLER MATERI (LESSONS) ---
  function startEditLesson(lesson: LessonItem) {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      slug: lesson.slug,
      content_md: lesson.content_md,
      grammar_notes: lesson.grammar_notes || '',
      sort_order: lesson.sort_order,
    });
  }

  function resetLessonForm() {
    setEditingLessonId(null);
    setLessonForm({
      title: '',
      slug: '',
      content_md: '',
      grammar_notes: '',
      sort_order: lessons.length + 1,
    });
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModuleId || !lessonForm.title.trim()) return;
    setSaving(true);

    const payload = {
      module_id: selectedModuleId,
      title: lessonForm.title.trim(),
      slug: lessonForm.slug.trim() || slugify(lessonForm.title, 'materi'),
      content_md: lessonForm.content_md,
      grammar_notes: lessonForm.grammar_notes.trim() || null,
      sort_order: Number(lessonForm.sort_order) || 1,
    };

    if (editingLessonId) {
      const { error } = await supabase
        .from('lang_lessons')
        .update(payload)
        .eq('id', editingLessonId);

      if (error) {
        notify('error', `Gagal menyimpan materi: ${error.message}`);
      } else {
        notify('success', 'Catatan materi diperbarui.');
        await fetchModuleDetails(selectedModuleId);
      }
    } else {
      const { error } = await supabase.from('lang_lessons').insert(payload);

      if (error) {
        notify('error', `Gagal menambah materi: ${error.message}`);
      } else {
        notify('success', 'Catatan materi berhasil ditambahkan.');
        await fetchModuleDetails(selectedModuleId);
      }
    }

    setSaving(false);
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('Hapus bagian materi ini?')) return;
    const { error } = await supabase.from('lang_lessons').delete().eq('id', id);
    if (error) {
      notify('error', `Gagal menghapus materi: ${error.message}`);
    } else {
      notify('success', 'Materi dihapus.');
      await fetchModuleDetails(selectedModuleId);
    }
  }

  // --- HANDLER KOSAKATA (VOCAB) ---
  function startEditVocab(item: VocabItem) {
    setVocabInputMode('single');
    setEditingVocabId(item.id);
    setVocabForm({
      term: item.term,
      phonetic: item.phonetic || '',
      meaning: item.meaning,
      part_of_speech: item.part_of_speech || 'Nomina',
      example_sentence: item.example_sentence || '',
      example_phonetic: item.example_phonetic || '',
      example_meaning: item.example_meaning || '',
      sort_order: item.sort_order,
    });
  }

  function resetVocabForm() {
    setEditingVocabId(null);
    setVocabForm({
      term: '',
      phonetic: '',
      meaning: '',
      part_of_speech: 'Nomina',
      example_sentence: '',
      example_phonetic: '',
      example_meaning: '',
      sort_order: vocabList.length + 1,
    });
  }

  async function handleSaveVocab(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModuleId || !vocabForm.term.trim() || !vocabForm.meaning.trim()) return;
    setSaving(true);

    const payload = {
      module_id: selectedModuleId,
      term: vocabForm.term.trim(),
      phonetic: vocabForm.phonetic.trim() || null,
      meaning: vocabForm.meaning.trim(),
      part_of_speech: vocabForm.part_of_speech.trim() || null,
      example_sentence: vocabForm.example_sentence.trim() || null,
      example_phonetic: vocabForm.example_phonetic.trim() || null,
      example_meaning: vocabForm.example_meaning.trim() || null,
      sort_order: Number(vocabForm.sort_order) || 1,
    };

    if (editingVocabId) {
      const { error } = await supabase
        .from('lang_vocab')
        .update(payload)
        .eq('id', editingVocabId);

      if (error) {
        notify('error', `Gagal memperbarui kosakata: ${error.message}`);
      } else {
        notify('success', 'Kosakata diperbarui.');
        await fetchModuleDetails(selectedModuleId);
      }
    } else {
      const { error } = await supabase.from('lang_vocab').insert(payload);

      if (error) {
        notify('error', `Gagal menambah kosakata: ${error.message}`);
      } else {
        notify('success', 'Kosakata ditambahkan.');
        await fetchModuleDetails(selectedModuleId);
      }
    }

    setSaving(false);
  }

  async function handleBulkImportVocab(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModuleId || !bulkText.trim()) return;

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const rows = lines
      .map((line, idx) => {
        const parts = line.split('|').map((p) => p.trim());
        const term = parts[0] || '';
        const phonetic = parts[1] || null;
        const meaning = parts[2] || '';
        const part_of_speech = parts[3] || null;
        const example_sentence = parts[4] || null;
        const example_meaning = parts[5] || null;

        if (!term || !meaning) return null;
        return {
          module_id: selectedModuleId,
          term,
          phonetic,
          meaning,
          part_of_speech,
          example_sentence,
          example_meaning,
          sort_order: vocabList.length + idx + 1,
        };
      })
      .filter(Boolean);

    if (rows.length === 0) {
      notify('error', 'Format tidak valid. Gunakan minimal: Kata | Fonetik | Arti');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('lang_vocab').insert(rows);
    if (error) {
      notify('error', `Gagal impor massal: ${error.message}`);
    } else {
      notify('success', `${rows.length} kosakata berhasil ditambahkan sekaligus.`);
      setBulkText('');
      await fetchModuleDetails(selectedModuleId);
    }
    setSaving(false);
  }

  async function handleDeleteVocab(id: string) {
    const { error } = await supabase.from('lang_vocab').delete().eq('id', id);
    if (error) {
      notify('error', `Gagal menghapus kosakata: ${error.message}`);
    } else {
      notify('success', 'Kosakata dihapus.');
      await fetchModuleDetails(selectedModuleId);
    }
  }

  function testSpeech(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !currentLang) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = currentLang.speech_lang;
    window.speechSynthesis.speak(utter);
  }

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>Memverifikasi akses administrator...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Akses Terbatas — Khusus Administrator
        </p>
        <Link
          href="/languages"
          className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center"
        >
          Ke Halaman Publik TheoQED Lingo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-rose-600 border-rose-500 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header Admin Lingo */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-900 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              TheoQED Lingo CMS
            </span>
            <span className="text-xs text-slate-400">· {languages.length} Bahasa Terdaftar</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Manajemen Kurikulum &amp; Kosakata Bahasa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola silabus modul, catatan tata bahasa, serta daftar kosakata &amp; flashcard untuk setiap bahasa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={currentLang ? `/languages/${currentLang.code}` : '/languages'}
            target="_blank"
            className="h-9 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition inline-flex items-center gap-1.5"
          >
            <span>Pratinjau Publik ↗</span>
          </Link>

          <button
            type="button"
            onClick={openNewLangModal}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            + Tambah Bahasa
          </button>
        </div>
      </div>

      {/* Pemilih Bahasa (Horizontal Pills) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {languages.map((lang) => {
            const active = lang.id === selectedLangId;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLangId(lang.id)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="uppercase text-[10px] opacity-80">{lang.code}</span>
                <span>{lang.name}</span>
                <span dir={lang.direction} className="opacity-85">
                  ({lang.native_name})
                </span>
              </button>
            );
          })}
        </div>

        {currentLang && (
          <button
            type="button"
            onClick={() => openEditLangModal(currentLang)}
            className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 shrink-0 cursor-pointer"
          >
            Edit Info Bahasa
          </button>
        )}
      </div>

      {/* Grid 2 Kolom: Daftar Modul (Kiri) & Editor Isi Modul (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: DAFTAR MODUL */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Modul {currentLang?.name}
              </h2>
              <p className="text-[11px] text-slate-500">{modules.length} modul tersedia</p>
            </div>
            <button
              type="button"
              onClick={openCreateModule}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
            >
              + Modul
            </button>
          </div>

          {/* Form Tambah / Edit Modul Inline */}
          {showModuleForm && (
            <form
              onSubmit={handleSaveModule}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-indigo-200/80 dark:border-indigo-900/70 space-y-3 text-xs"
            >
              <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                {editingModuleId ? 'Edit Modul' : 'Modul Baru'}
              </div>

              <div>
                <label className="block font-bold mb-1">Judul Modul</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 1 · Pinyin & Salam Dasar"
                  value={moduleForm.title}
                  onChange={(e) =>
                    setModuleForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: editingModuleId ? f.slug : slugify(e.target.value, 'modul'),
                    }))
                  }
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Level</label>
                  <input
                    type="text"
                    placeholder="HSK 1 / N5 / A1"
                    value={moduleForm.level}
                    onChange={(e) => setModuleForm((f) => ({ ...f, level: e.target.value }))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Urutan</label>
                  <input
                    type="number"
                    value={moduleForm.sort_order}
                    onChange={(e) =>
                      setModuleForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
                    }
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Slug URL</label>
                <input
                  type="text"
                  required
                  value={moduleForm.slug}
                  onChange={(e) => setModuleForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={moduleForm.is_published}
                  onChange={(e) =>
                    setModuleForm((f) => ({ ...f, is_published: e.target.checked }))
                  }
                />
                <span>Publikasikan modul ini</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModuleForm(false)}
                  className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-8 px-3.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          )}

          {/* List Modul */}
          {loadingModules ? (
            <div className="py-8 text-center text-xs text-slate-400">Memuat modul...</div>
          ) : modules.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Belum ada modul
              </p>
              <p className="text-[11px] text-slate-400">
                Klik tombol <strong>+ Modul</strong> di atas untuk membuat bab pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod) => {
                const active = mod.id === selectedModuleId;
                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      active
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800'
                        : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400">
                            #{mod.sort_order}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {mod.level}
                          </span>
                          {!mod.is_published && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {mod.title}
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModule(mod)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* KOLOM KANAN: EDITOR MATERI & KOSAKATA */}
        <section className="lg:col-span-8 space-y-5">
          {!currentModule ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Pilih atau buat modul terlebih dahulu
              </p>
              <p className="text-xs text-slate-500">
                Setelah modul aktif, kamu bisa mengisi catatan materi, tata bahasa, dan daftar kosakata di sini.
              </p>
            </div>
          ) : (
            <>
              {/* Header Modul Terpilih & Tab Editor */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Sedang Mengedit Modul · {currentModule.level}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    {currentModule.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('lessons')}
                    className={`h-8 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeEditorTab === 'lessons'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Catatan Materi ({lessons.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('vocab')}
                    className={`h-8 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeEditorTab === 'vocab'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Kosakata &amp; Flashcard ({vocabList.length})
                  </button>
                </div>
              </div>

              {loadingDetail ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
                  Memuat konten modul...
                </div>
              ) : activeEditorTab === 'lessons' ? (
                /* ================= EDITOR CATATAN MATERI ================= */
                <div className="space-y-5">
                  <form
                    onSubmit={handleSaveLesson}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {editingLessonId ? 'Edit Bagian Materi' : 'Tambah Bagian Materi Baru'}
                      </h3>
                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={resetLessonForm}
                          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          + Buat Bagian Baru
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block font-bold mb-1">Judul Sub-Materi</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Sistem 4 Nada dalam Bahasa Mandarin"
                          value={lessonForm.title}
                          onChange={(e) =>
                            setLessonForm((f) => ({
                              ...f,
                              title: e.target.value,
                              slug: editingLessonId ? f.slug : slugify(e.target.value, 'materi'),
                            }))
                          }
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Urutan</label>
                        <input
                          type="number"
                          value={lessonForm.sort_order}
                          onChange={(e) =>
                            setLessonForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
                          }
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold">Isi Penjelasan Materi</label>
                        <span className="text-[10px] text-slate-400">
                          Mendukung ## Subjudul, **tebal**, `istilah`, - daftar, &gt; kutipan
                        </span>
                      </div>
                      <textarea
                        rows={7}
                        required
                        placeholder="Tulis penjelasan konsep, cara baca, atau dialog contoh..."
                        value={lessonForm.content_md}
                        onChange={(e) =>
                          setLessonForm((f) => ({ ...f, content_md: e.target.value }))
                        }
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        Catatan Tata Bahasa / Pola Kalimat (Opsional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Contoh: Pola kalimat tanya dengan 吗 (ma): Subjek + Predikat + 吗?"
                        value={lessonForm.grammar_notes}
                        onChange={(e) =>
                          setLessonForm((f) => ({ ...f, grammar_notes: e.target.value }))
                        }
                        className="w-full p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/60"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={resetLessonForm}
                          className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                        >
                          Batal Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={saving}
                        className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer"
                      >
                        {saving
                          ? 'Menyimpan...'
                          : editingLessonId
                          ? 'Perbarui Materi'
                          : 'Simpan Materi'}
                      </button>
                    </div>
                  </form>

                  {/* Daftar Materi yang Tersimpan */}
                  {lessons.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-2.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
                        Daftar Bagian Materi ({lessons.length})
                      </h4>
                      {lessons.map((les) => (
                        <div
                          key={les.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {les.sort_order}. {les.title}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {les.content_md.slice(0, 100)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditLesson(les)}
                              className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(les.id)}
                              className="h-7 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-[11px] font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ================= EDITOR KOSAKATA & BULK IMPORT ================= */
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {editingVocabId ? 'Edit Entri Kosakata' : 'Tambah Kosakata & Kartu Flashcard'}
                      </h3>

                      {!editingVocabId && (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setVocabInputMode('single')}
                            className={`h-7 px-3 rounded-lg text-[11px] font-bold cursor-pointer ${
                              vocabInputMode === 'single'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                                : 'text-slate-500'
                            }`}
                          >
                            Input Satuan
                          </button>
                          <button
                            type="button"
                            onClick={() => setVocabInputMode('bulk')}
                            className={`h-7 px-3 rounded-lg text-[11px] font-bold cursor-pointer ${
                              vocabInputMode === 'bulk'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                                : 'text-slate-500'
                            }`}
                          >
                            Paste Massal (Cepat)
                          </button>
                        </div>
                      )}
                    </div>

                    {vocabInputMode === 'single' ? (
                      <form onSubmit={handleSaveVocab} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold mb-1">Kata / Aksara Asli *</label>
                            <input
                              type="text"
                              required
                              dir={currentLang?.direction}
                              placeholder="Contoh: 你好"
                              value={vocabForm.term}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, term: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold mb-1">Fonetik / Pinyin / Romaji</label>
                            <input
                              type="text"
                              placeholder="Contoh: nǐ hǎo"
                              value={vocabForm.phonetic}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, phonetic: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block font-bold mb-1">Arti Indonesia *</label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: Halo"
                              value={vocabForm.meaning}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, meaning: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold mb-1">Jenis Kata</label>
                            <input
                              type="text"
                              placeholder="Nomina / Verba / Frasa"
                              value={vocabForm.part_of_speech}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, part_of_speech: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold mb-1">Contoh Kalimat (Opsional)</label>
                            <input
                              type="text"
                              dir={currentLang?.direction}
                              placeholder="Contoh: 你好，很高兴认识你。"
                              value={vocabForm.example_sentence}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, example_sentence: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold mb-1">Fonetik Contoh Kalimat</label>
                            <input
                              type="text"
                              placeholder="Nǐ hǎo, hěn gāoxìng rènshi nǐ."
                              value={vocabForm.example_phonetic}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, example_phonetic: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold mb-1">Arti Contoh Kalimat</label>
                            <input
                              type="text"
                              placeholder="Halo, senang berkenalan denganmu."
                              value={vocabForm.example_meaning}
                              onChange={(e) =>
                                setVocabForm((f) => ({ ...f, example_meaning: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {editingVocabId && (
                            <button
                              type="button"
                              onClick={resetVocabForm}
                              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                            >
                              Batal
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={saving}
                            className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer"
                          >
                            {saving
                              ? 'Menyimpan...'
                              : editingVocabId
                              ? 'Perbarui Kosakata'
                              : '+ Tambah Kosakata'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleBulkImportVocab} className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Format per baris (pisahkan dengan tanda <code className="font-mono">|</code>):
                          </div>
                          <code className="block font-mono text-indigo-600 dark:text-indigo-400">
                            Kata Asli | Fonetik | Arti | Jenis Kata | Contoh Kalimat | Arti Contoh
                          </code>
                        </div>

                        <textarea
                          rows={6}
                          required
                          placeholder={`你好 | nǐ hǎo | Halo | Frasa | 你好吗？ | Apa kabar?\n谢谢 | xièxie | Terima kasih | Verba | 谢谢你！ | Terima kasih banyak!`}
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-xs"
                        />

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={saving}
                            className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer"
                          >
                            {saving ? 'Mengimpor...' : 'Impor Semua Baris'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Daftar Kosakata Modul Ini */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
                      Daftar Kosakata Tersimpan ({vocabList.length})
                    </h4>

                    {vocabList.length === 0 ? (
                      <p className="text-xs text-slate-400 px-1 py-4">
                        Belum ada kosakata di modul ini.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {vocabList.map((item) => (
                          <div
                            key={item.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span
                                  dir={currentLang?.direction}
                                  className="text-base font-black text-slate-900 dark:text-white"
                                >
                                  {item.term}
                                </span>
                                {item.phonetic && (
                                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    {item.phonetic}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  — {item.meaning}
                                </span>
                              </div>
                              {item.example_sentence && (
                                <p className="text-[11px] text-slate-500 truncate">
                                  {item.example_sentence}
                                  {item.example_meaning ? ` (${item.example_meaning})` : ''}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => testSpeech(item.term)}
                                title="Uji pelafalan suara"
                                className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                              >
                                🔊
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditVocab(item)}
                                className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVocab(item.id)}
                                className="h-7 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-[11px] font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* MODAL TAMBAH / EDIT BAHASA */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveLanguage}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingLang ? `Edit Bahasa ${editingLang.name}` : 'Tambah Bahasa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowLangModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">Kode URL *</label>
                <input
                  type="text"
                  required
                  placeholder="pt / tr / la"
                  value={langForm.code}
                  onChange={(e) => setLangForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Nama Indonesia *</label>
                <input
                  type="text"
                  required
                  placeholder="Portugis"
                  value={langForm.name}
                  onChange={(e) => setLangForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Aksara Asli *</label>
                <input
                  type="text"
                  required
                  placeholder="Português"
                  value={langForm.native_name}
                  onChange={(e) => setLangForm((f) => ({ ...f, native_name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">Kawasan</label>
                <input
                  type="text"
                  placeholder="Eropa / Asia Timur"
                  value={langForm.region_tag}
                  onChange={(e) => setLangForm((f) => ({ ...f, region_tag: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Kode Audio TTS *</label>
                <input
                  type="text"
                  required
                  placeholder="pt-PT / tr-TR"
                  value={langForm.speech_lang}
                  onChange={(e) => setLangForm((f) => ({ ...f, speech_lang: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Arah Teks</label>
                <select
                  value={langForm.direction}
                  onChange={(e) =>
                    setLangForm((f) => ({ ...f, direction: e.target.value as 'ltr' | 'rtl' }))
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <option value="ltr">Kiri ke Kanan (LTR)</option>
                  <option value="rtl">Kanan ke Kiri (RTL)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Warna Gradien Kartu</label>
              <select
                value={langForm.accent_gradient}
                onChange={(e) => setLangForm((f) => ({ ...f, accent_gradient: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                {GRADIENT_PRESETS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Deskripsi Singkat</label>
              <textarea
                rows={2}
                value={langForm.description}
                onChange={(e) => setLangForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={langForm.is_published}
                  onChange={(e) =>
                    setLangForm((f) => ({ ...f, is_published: e.target.checked }))
                  }
                />
                <span>Tampilkan di katalog publik</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLangModal(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Bahasa'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}