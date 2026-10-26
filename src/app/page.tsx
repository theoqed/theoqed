'use client';

import { useState, useEffect } from 'react';
import katex from 'katex';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface Problem {
  id: string;
  title: string;
  competition: string;
  year: number;
  level: string;
  topic: string;
  statement: string;
  solution_brief: string;
  solution_steps: string[];
  final_answer: string;
  folder_id?: string | null;
  order_index: number;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
}

function FolderIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
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

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BookOpenIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

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
                className="block my-2 text-center overflow-x-auto [&_.katex-display]:my-0"
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
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
              output: 'html',
            });
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

export default function HomePage() {
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeData() {
      setLoading(true);

      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .limit(6);

      if (folderData) setFolders(folderData as Folder[]);

      const { data: problemData } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (problemData) setRecentProblems(problemData as Problem[]);

      setLoading(false);
    }

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/arsip?q=${encodeURIComponent(searchQuery.trim())}`;
    } else {
      window.location.href = '/arsip';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">

      <div>
        {/* Top Bar Navigation */}
        <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">

            {/* Logo */}
            <a href="/" className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 shrink-0">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </a>

            {/* Navigasi */}
            <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="/" className="hover:text-slate-900 dark:hover:text-white transition">Beranda</a>
              <a href="/arsip" className="hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap">Arsip Soal</a>
            </nav>

            {/* Tombol Akses Kanan (Toggle + Instagram Berdampingan) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ThemeToggle />
              <a
                href="https://instagram.com/davemarcellino_"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold p-2 sm:px-3.5 sm:py-2 rounded-xl transition inline-flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60"
                title="Instagram @davemarcellino_"
              >
                <InstagramIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <span className="hidden sm:inline">@davemarcellino_</span>
              </a>
            </div>

          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-16 pb-14 px-6 bg-gradient-to-b from-white via-white to-[#F8FAFC] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800/80 transition-colors duration-200">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <SparklesIcon className="w-4 h-4" />
              <span>Platform Bank Soal & Pembahasan Matematika Tingkat Lanjut dan Olimpiade</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              From Problems to Solutions.<br className="hidden sm:inline" /> From Logic to Excellence.
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Arsip bank soal untuk belajar, berlatih, dan menguji kemampuan matematika tingkat lanjut dan olimpiade. Dirancang dengan format LaTeX terstruktur dan penataan folder yang rapi.<br />
              <strong>Developed by @davemarcellino_</strong>
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-2">
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 dark:text-slate-500">
                  <SearchIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="(fitur search masih dalam pengembangan)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-28 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm rounded-2xl text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Cari Soal
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Konten Utama */}
        <div className="max-w-5xl mx-auto px-6 mt-12 space-y-12">

          {/* Sub-Folder Utama */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Struktur Arsip</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Folder Soal-soal</h2>
              </div>
              <a href="/arsip" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                <span>Buka Semua Folder</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <a
                    key={folder.id}
                    href="/arsip"
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition group flex items-start justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        <FolderIcon />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {folder.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Folder Utama Arsip</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition mt-1" />
                  </a>
                ))
              ) : (
                <a href="/arsip" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 transition flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <FolderIcon />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Arsip Folder</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Jelajahi seluruh koleksi</p>
                  </div>
                </a>
              )}
            </div>
          </section>

          {/* Pratinjau Soal Terbaru */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pilihan Terbaru</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Soal & Pembahasan Terbaru</h2>
              </div>
              <a href="/arsip" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                <span>Lihat Semua Soal</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                Memuat data soal...
              </div>
            ) : recentProblems.length > 0 ? (
              <div className="space-y-3">
                {recentProblems.map((problem) => (
                  <div key={problem.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {problem.competition} {problem.year} ({problem.level})
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {problem.topic}
                      </span>
                    </div>

                    <div className="text-slate-800 dark:text-slate-200 text-base leading-relaxed mb-4">
                      <MathText text={problem.statement} />
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-mono">ID: {problem.id}</span>
                      <a
                        href={`/problems/${problem.id}`}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition inline-flex items-center gap-1"
                      >
                        <span>Buka Pembahasan Lengkap</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                Belum ada soal yang diunggah.
              </div>
            )}
          </section>

          {/* Keunggulan Platform */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <BookOpenIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">LaTeX Presisi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seluruh formula dan persamaan rendered menggunakan KaTeX untuk keterbacaan tinggi ala jurnal ilmiah.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FolderIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Struktur Terorganisir</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Navigasi berbasis hierarki folder yang fleksibel memudahkan pencarian berdasarkan kompetisi dan tahun.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Solusi Tahap demi Tahap</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dilengkapi ide ringkas, langkah komputasi terperinci, hingga hasil akhir untuk pembelajaran mandiri.
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 mt-20 pt-12 pb-8 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">

          <div className="space-y-3 md:col-span-1">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight block">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </span>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Platform bank soal dan pembahasan matematika tingkat olimpiade terstruktur untuk pengerjaan presisi.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-[10px]">Navigasi Utama</h4>
            <ul className="space-y-2">
              <li><a href="/" className="hover:text-slate-900 dark:hover:text-white transition">Beranda</a></li>
              <li><a href="/arsip" className="hover:text-slate-900 dark:hover:text-white transition">Arsip Bank Soal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-[10px]">Bidang / Topik</h4>
            <ul className="space-y-2 text-slate-500 dark:text-slate-400">
              <li>Aljabar & Fungsi</li>
              <li>Analisis Real & Kalkulus</li>
              <li>Kombinatorika</li>
              <li>Teori Bilangan</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-[10px]">Kompetisi</h4>
            <ul className="space-y-2 text-slate-500 dark:text-slate-400">
              <li>ONMIPA-PT Wilayah & Nasional</li>
              <li>OSN Tingkat Kota, Provinsi, & Nasional</li>
              <li>International Mathematics Competition (IMC)</li>
            </ul>
          </div>

        </div>

        <div className="max-w-5xl mx-auto px-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <p>© 2026 TheoQED. Hak cipta dilindungi undang-undang.</p>
          <p>Dirancang untuk persiapan kompetisi matematika sekolah dan perguruan tinggi.</p>
        </div>
      </footer>

    </div>
  );
}