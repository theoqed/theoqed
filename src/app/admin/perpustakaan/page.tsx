'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

interface BookRecord {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  level: string;
  year: number | null;
  pages: number | null;
  description: string | null;
  cover_drive_id: string | null;
  is_premium: boolean;
  is_published: boolean;
  order_index: number;
  book_sources?: { pdf_drive_id: string } | { pdf_drive_id: string }[] | null;
}

const CATEGORIES = [
  'Aljabar',
  'Geometri',
  'Kombinatorika',
  'Teori Bilangan',
  'Kalkulus & Analisis',
  'Olimpiade',
  'Diktat Kuliah',
  'Matematika Umum',
];

const LEVELS = ['Umum', 'SMP', 'SMA', 'Olimpiade', 'Perguruan Tinggi'];

function parseDriveId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (pathMatch?.[1]) return pathMatch[1];
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (queryMatch?.[1]) return queryMatch[1];
  return trimmed;
}

function extractPdfId(
  rel: { pdf_drive_id: string } | { pdf_drive_id: string }[] | null | undefined
): string {
  if (!rel) return '';
  if (Array.isArray(rel)) return rel[0]?.pdf_drive_id || '';
  return rel.pdf_drive_id || '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function formatSupabaseError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    if (parts.length > 0) {
      return `${parts.join(' — ')}${e.code ? ` [${e.code}]` : ''}`;
    }
  }
  return fallback;
}

export default function AdminPerpustakaanPage() {
  const supabase = useMemo(() => createClient(), []);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Olimpiade');
  const [level, setLevel] = useState('SMA');
  const [year, setYear] = useState('');
  const [pages, setPages] = useState('');
  const [description, setDescription] = useState('');
  const [coverInput, setCoverInput] = useState('');
  const [pdfInput, setPdfInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [orderIndex, setOrderIndex] = useState('0');
  const [previewPdfMode, setPreviewPdfMode] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*, book_sources(pdf_drive_id)')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat daftar buku:', error);
    }
    if (data) setBooks(data as BookRecord[]);
    setLoading(false);
  }

  const cleanCoverId = useMemo(() => parseDriveId(coverInput), [coverInput]);
  const cleanPdfId = useMemo(() => parseDriveId(pdfInput), [pdfInput]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (accessFilter === 'FREE' && b.is_premium) return false;
      if (accessFilter === 'PREMIUM' && !b.is_premium) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    });
  }, [books, search, accessFilter]);

  function openCreateModal() {
    setEditingId(null);
    setTitle('');
    setAuthor('');
    setCategory('Olimpiade');
    setLevel('SMA');
    setYear('');
    setPages('');
    setDescription('');
    setCoverInput('');
    setPdfInput('');
    setIsPremium(false);
    setIsPublished(true);
    setOrderIndex(String(books.length + 1));
    setPreviewPdfMode(false);
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(book: BookRecord) {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setLevel(book.level || 'Umum');
    setYear(book.year ? String(book.year) : '');
    setPages(book.pages ? String(book.pages) : '');
    setDescription(book.description || '');
    setCoverInput(book.cover_drive_id || '');
    setPdfInput(extractPdfId(book.book_sources));
    setIsPremium(book.is_premium);
    setIsPublished(book.is_published);
    setOrderIndex(String(book.order_index || 0));
    setPreviewPdfMode(false);
    setFormError(null);
    setShowModal(true);
  }

  async function handleSaveBook(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !author.trim() || !cleanPdfId) {
      const validationMsg = 'Judul, Penulis, dan Link/ID Google Drive PDF wajib diisi.';
      setFormError(validationMsg);
      alert(validationMsg);
      return;
    }

    setSaving(true);
    const parsedYear = year ? parseInt(year, 10) : null;
    const parsedPages = pages ? parseInt(pages, 10) : null;
    const parsedOrder = parseInt(orderIndex, 10);

    const payload = {
      title: title.trim(),
      author: author.trim(),
      category,
      level,
      year: parsedYear !== null && !Number.isNaN(parsedYear) ? parsedYear : null,
      pages: parsedPages !== null && !Number.isNaN(parsedPages) ? parsedPages : null,
      description: description.trim() || null,
      cover_drive_id: cleanCoverId || null,
      is_premium: isPremium,
      is_published: isPublished,
      order_index: !Number.isNaN(parsedOrder) ? parsedOrder : 0,
    };

    try {
      let targetBookId = editingId;

      if (editingId) {
        const { error } = await supabase.from('books').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const baseSlug = slugify(title) || 'buku';
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
        const { data: inserted, error } = await supabase
          .from('books')
          .insert({ ...payload, slug: uniqueSlug })
          .select('id')
          .single();
        if (error) throw error;
        targetBookId = inserted?.id || null;
      }

      if (targetBookId) {
        const { error: srcError } = await supabase.from('book_sources').upsert(
          {
            book_id: targetBookId,
            pdf_drive_id: cleanPdfId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'book_id' }
        );
        if (srcError) throw srcError;
      }

      setShowModal(false);
      await fetchBooks();
    } catch (err: unknown) {
      console.error('Detail error simpan buku:', err);
      const msg = formatSupabaseError(err, 'Terjadi kesalahan saat menyimpan buku.');
      setFormError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBook(book: BookRecord) {
    if (!confirm(`Hapus buku "${book.title}" dari katalog perpustakaan?`)) return;
    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) {
      console.error('Detail error hapus buku:', error);
      alert(formatSupabaseError(error, 'Gagal menghapus buku.'));
      return;
    }
    await fetchBooks();
  }

  const inputClass =
    'w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              TheoQED Digital Library
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Perpustakaan Buku
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/perpustakaan"
              target="_blank"
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition"
            >
              <span>Lihat Katalog Publik</span>
            </Link>
            <button
              type="button"
              onClick={openCreateModal}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>+ Tambah Buku</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Cari judul buku, penulis, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm h-9 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-1.5">
            {(['ALL', 'FREE', 'PREMIUM'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAccessFilter(tab)}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  accessFilter === tab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab === 'ALL' ? `Semua (${books.length})` : tab === 'FREE' ? 'Gratis' : 'Premium'}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Buku */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const pdfId = extractPdfId(book.book_sources);
              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex gap-4"
                >
                  {/* Thumbnail Cover */}
                  <div className="w-20 aspect-[3/4] rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {book.cover_drive_id ? (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${book.cover_drive_id}&sz=w300`}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 text-center px-1">
                        No Cover
                      </span>
                    )}
                  </div>

                  {/* Metadata & Aksi */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            book.is_premium
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {book.is_premium ? 'Premium' : 'Gratis'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {book.category}
                        </span>
                        {!book.is_published && (
                          <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-[10px] font-bold text-red-600 dark:text-red-400">
                            Draft
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {book.author}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        PDF ID: {pdfId || 'Belum terpasang'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => openEditModal(book)}
                        className="flex-1 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 text-slate-700 dark:text-slate-200 hover:text-white transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/perpustakaan/${book.slug}`}
                        target="_blank"
                        className="h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center transition"
                      >
                        Buka
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(book)}
                        className="h-7 px-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Belum ada koleksi buku. Klik <strong>+ Tambah Buku</strong> untuk mulai uji coba.
          </div>
        )}
      </main>

      {/* MODAL FORM TAMBAH / EDIT BUKU */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />

          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Koleksi Buku' : 'Tambah Buku Baru (Google Drive Embed)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium break-words">
                  <strong className="font-bold block mb-0.5">Gagal menyimpan:</strong>
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Form Kiri */}
                <div className="md:col-span-8 space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Judul Buku / Modul <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Misal: Diktat Pembinaan Olimpiade Matematika - Teori Bilangan"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Penulis / Penyusun <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Tim Akademik TheoQED"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Kategori Bidang
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputClass}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Jenjang
                      </label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className={inputClass}
                      >
                        {LEVELS.map((lv) => (
                          <option key={lv} value={lv}>
                            {lv}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Tahun Terbit
                      </label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="2026"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Jml Halaman
                      </label>
                      <input
                        type="number"
                        value={pages}
                        onChange={(e) => setPages(e.target.value)}
                        placeholder="120"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Input Link / ID Google Drive PDF */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Link / File ID Google Drive PDF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={pdfInput}
                      onChange={(e) => setPdfInput(e.target.value)}
                      placeholder="Paste link https://drive.google.com/file/d/... atau ID file-nya"
                      className={inputClass}
                    />
                    {cleanPdfId && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-0.5">
                        <span>ID Terdeteksi: {cleanPdfId}</span>
                        <button
                          type="button"
                          onClick={() => setPreviewPdfMode((v) => !v)}
                          className="underline font-sans font-bold cursor-pointer"
                        >
                          {previewPdfMode ? 'Tutup Uji PDF' : 'Uji Embed PDF'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input Link / ID Google Drive Cover */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Link / File ID Gambar Cover di Google Drive (Opsional)
                    </label>
                    <input
                      type="text"
                      value={coverInput}
                      onChange={(e) => setCoverInput(e.target.value)}
                      placeholder="Paste link gambar JPG/PNG di Google Drive (set akses Viewer)"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Sinopsis / Deskripsi Singkat
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ringkasan cakupan materi di dalam buku..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Kolom Kanan: Pratinjau Cover & Hak Akses */}
                <div className="md:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Pratinjau Cover
                    </span>
                    <div className="w-36 mx-auto aspect-[3/4] rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                      {cleanCoverId ? (
                        <img
                          src={`https://drive.google.com/thumbnail?id=${cleanCoverId}&sz=w400`}
                          alt="Preview Cover"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400 text-center px-3">
                          Cover Otomatis / Belum Diisi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-amber-600 dark:text-amber-400">
                      <input
                        type="checkbox"
                        checked={isPremium}
                        onChange={(e) => setIsPremium(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600"
                      />
                      <span>Khusus Member Premium</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span>Publikasikan di Katalog</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Panel Uji Coba Embed PDF */}
              {previewPdfMode && cleanPdfId && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">
                    Uji Pratinjau Embed PDF Google Drive:
                  </span>
                  <iframe
                    src={`https://drive.google.com/file/d/${cleanPdfId}/preview`}
                    className="w-full h-72 rounded-xl border border-slate-200 dark:border-slate-800"
                    allow="autoplay"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Buku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}