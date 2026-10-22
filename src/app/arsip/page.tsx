'use client';

import { useState, useEffect } from 'react';
import katex from 'katex';
import { supabase } from '../../lib/supabase';
import { Problem, Folder, SolutionItem } from '@/types';

function FolderIcon({ className = "w-4 h-4" }: { className?: string }) {
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

function EyeIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function ShareIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span className="leading-relaxed font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, output: 'html' });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <code key={index}>{part}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default function ArsipPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // State Fitur
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');
  const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: folderData } = await supabase.from('folders').select('*').order('name', { ascending: true });
      if (folderData) setFolders(folderData as Folder[]);

      const { data: problemData } = await supabase.from('problems').select('*').order('order_index', { ascending: true });
      if (problemData) setProblems(problemData as Problem[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const currentSubFolders = folders.filter((f) =>
    currentFolderId === null ? !f.parent_id : f.parent_id === currentFolderId
  );
  
  // Ambil semua soal dalam folder aktif
  const baseProblems = problems.filter((p) =>
    currentFolderId === null ? !p.folder_id : p.folder_id === currentFolderId
  );

  // Filter Soal berdasarkan Topik & Pencarian Real-Time
  const filteredProblems = baseProblems.filter((p) => {
    const matchesSearch = p.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'Semua' || p.topic?.toLowerCase() === selectedTopic.toLowerCase();
    return matchesSearch && matchesTopic;
  });

  // Ambil daftar topik unik dari soal yang ada
  const availableTopics = ['Semua', ...Array.from(new Set(baseProblems.map((p) => p.topic).filter(Boolean)))];

  const getBreadcrumbs = () => {
    const crumbs: Folder[] = [];
    let curr = currentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find((f) => f.id === curr?.parent_id);
    }
    return crumbs;
  };
  const breadcrumbs = getBreadcrumbs();

  const handleCopyLink = (problemId: string) => {
    const url = `${window.location.origin}/problems/${problemId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(problemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-20">
      
      {/* Top Bar Konsisten */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
            <span className="text-blue-600">√</span>TheoQED<span className="text-blue-600">.</span>
          </a>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="/" className="hover:text-slate-900 transition">Beranda</a>
            <a href="/arsip" className="text-blue-600 font-semibold">Arsip Soal</a>
          </nav>

          <a
            href="https://instagram.com/davemarcellino_"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition inline-flex items-center gap-2 border border-slate-200/60"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
            <span>@davemarcellino_</span>
          </a>
        </div>
      </header>

      {/* Header Penjelajah Folder & Search Bar */}
      <div className="bg-white border-b border-slate-200/80 py-6 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Eksplorasi Bank Soal</span>
              
              {/* Breadcrumb Folder */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                    currentFolderId === null ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FolderIcon className="w-3.5 h-3.5" />
                  <span>Root</span>
                </button>

                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-2">
                    <span className="text-slate-300">/</span>
                    <button
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                        idx === breadcrumbs.length - 1
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <FolderIcon className="w-3.5 h-3.5" />
                      <span>{crumb.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Filter Pencarian */}
            <div className="relative min-w-[260px]">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari dalam folder ini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 transition"
              />
            </div>
          </div>

          {/* Filter Pill Topik */}
          {availableTopics.length > 2 && (
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Topik:</span>
              {availableTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    selectedTopic.toLowerCase() === topic.toLowerCase()
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Area Konten Utama */}
      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        
        {/* SUB-FOLDERS */}
        {currentSubFolders.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Folder ({currentSubFolders.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentSubFolders.map((folder) => {
                const childFolderCount = folders.filter((f) => f.parent_id === folder.id).length;
                const childProblemCount = problems.filter((p) => p.folder_id === folder.id).length;

                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setSearchQuery('');
                      setSelectedTopic('Semua');
                    }}
                    className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 shadow-sm transition cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 truncate flex-1 pr-2">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                        <FolderIcon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {folder.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {childFolderCount > 0 && `${childFolderCount} folder `}
                          {childProblemCount > 0 && `${childProblemCount} soal`}
                          {childFolderCount === 0 && childProblemCount === 0 && 'Kosong'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* DAFTAR SOAL */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Daftar Soal ({filteredProblems.length})
            </h2>
          </div>

          {loading ? (
            <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Memuat data...
            </div>
          ) : filteredProblems.length > 0 ? (
            <div className="space-y-3">
              {filteredProblems.map((problem, idx) => {
                const primaryBrief = problem.solutions?.[0]?.brief;
                const solutionCount = problem.solutions?.length || 0;

                return (
                  <div key={problem.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                          {problem.competition} {problem.year} ({problem.level})
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        {problem.topic}
                      </span>
                    </div>

                    <div className="text-slate-800 text-base leading-relaxed">
                      <MathText text={problem.statement} />
                    </div>

                    {/* Toggle Hint / Solusi Ringkas dari Solusi Pertama */}
                    {primaryBrief && (
                      <div className="pt-2">
                        <button
                          onClick={() => setExpandedHintId(expandedHintId === problem.id ? null : problem.id)}
                          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl"
                        >
                          <EyeIcon />
                          <span>{expandedHintId === problem.id ? 'Sembunyikan Petunjuk' : 'Intip Petunjuk / Ide Solusi'}</span>
                        </button>

                        {expandedHintId === problem.id && (
                          <div className="mt-2 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-blue-800 block mb-1">
                              Ide Ringkas ({problem.solutions[0].title || 'Solusi 1'}):
                            </span>
                            <MathText text={primaryBrief} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono">ID: {problem.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium">
                          {solutionCount > 0 ? `${solutionCount} Metode Solusi` : 'Belum Ada Solusi'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCopyLink(problem.id)}
                          className="text-slate-400 hover:text-slate-700 font-medium transition inline-flex items-center gap-1"
                          title="Salin Tautan Soal"
                        >
                          <ShareIcon />
                          <span>{copiedId === problem.id ? 'Tersalin!' : 'Bagikan'}</span>
                        </button>
                        <a
                          href={`/problems/${problem.id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          Buka Pembahasan Lengkap →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : currentSubFolders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Tidak ada soal yang ditemukan di dalam folder ini.
            </div>
          ) : null}
        </section>

      </div>
    </div>
  );
}