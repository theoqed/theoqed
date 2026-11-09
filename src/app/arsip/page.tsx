'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { Problem, Folder } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

// --- ICONS ---
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

function BookmarkIcon({ className = "w-4 h-4", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

// --- HELPER UNTUK CEK KEABSAHAN SOLUSI ---
function getValidSolutions(problem: Problem): any[] {
  if (!problem.solutions || !Array.isArray(problem.solutions)) return [];
  return problem.solutions.filter((sol: any) => {
    const hasBrief = Boolean(sol.brief && sol.brief.trim());
    const hasSteps = Array.isArray(sol.steps)
      ? sol.steps.some((s: string) => s && s.trim())
      : Boolean(sol.steps && sol.steps.trim());
    const hasExplanation = Boolean(sol.explanation && sol.explanation.trim());
    const hasFinalAnswer = Boolean(sol.final_answer && sol.final_answer.trim());
    return hasBrief || hasSteps || hasExplanation || hasFinalAnswer;
  });
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
                className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0 font-sans"
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

function ArsipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const currentFolderId = searchParams.get('folder') || null;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: bmData } = await supabase
          .from('user_bookmarks')
          .select('problem_id')
          .eq('user_id', currentUser.id);

        if (bmData) {
          setBookmarkedIds(bmData.map((b: any) => b.problem_id));
        }
      } else {
        try {
          const saved = localStorage.getItem('theoqed_bookmarked_problems');
          if (saved) setBookmarkedIds(JSON.parse(saved));
        } catch (e) {}
      }

      const { data: folderData } = await supabase.from('folders').select('*');
      if (folderData) {
        const sortedFolders = (folderData as Folder[]).sort((a, b) => {
          const orderA = (a as any).order_index ?? 0;
          const orderB = (b as any).order_index ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        setFolders(sortedFolders);
      }

      const { data: problemData } = await supabase
        .from('problems')
        .select('*')
        .order('order_index', { ascending: true });

      if (problemData) setProblems(problemData as Problem[]);
      setLoading(false);
    }

    fetchData();
  }, []);

  const navigateToFolder = (folderId: string | null) => {
    setSelectedTopic('Semua');
    if (folderId) {
      router.push(`/arsip?folder=${folderId}`);
    } else {
      router.push('/arsip');
    }
  };

  const toggleBookmark = async (problemId: string) => {
    if (!user) {
      alert('Silakan masuk (login) ke akun TheoQED kamu terlebih dahulu melalui beranda untuk menyimpan soal ke Cloud Bookmarks!');
      return;
    }

    const isBookmarked = bookmarkedIds.includes(problemId);

    if (isBookmarked) {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_id', problemId);

      if (!error) {
        setBookmarkedIds((prev) => prev.filter((id) => id !== problemId));
      }
    } else {
      const { error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: user.id,
          problem_id: problemId,
        });

      if (!error) {
        setBookmarkedIds((prev) => [...prev, problemId]);
      }
    }
  };

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const currentSubFolders = folders.filter((f) =>
    currentFolderId === null ? !f.parent_id : f.parent_id === currentFolderId
  );
  
  const baseProblems = onlyBookmarks
    ? problems.filter((p) => bookmarkedIds.includes(p.id))
    : problems.filter((p) =>
        currentFolderId === null ? !p.folder_id : p.folder_id === currentFolderId
      );

  const filteredProblems = baseProblems.filter((p) => {
    const matchesSearch =
      p.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTopic = selectedTopic === 'Semua' || p.topic?.toLowerCase() === selectedTopic.toLowerCase();
    const matchesBookmark = !onlyBookmarks || bookmarkedIds.includes(p.id);

    return matchesSearch && matchesTopic && matchesBookmark;
  });

  const availableTopics = [
    'Semua',
    ...Array.from(new Set(baseProblems.map((p) => p.topic).filter(Boolean) as string[])),
  ];

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

  const getTotalProblemsInFolder = (folderId: string): number => {
    const directCount = problems.filter((p) => p.folder_id === folderId).length;
    const childFolders = folders.filter((f) => f.parent_id === folderId);
    const subCount = childFolders.reduce(
      (acc, child) => acc + getTotalProblemsInFolder(child.id),
      0
    );
    return directCount + subCount;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div>
        <Navbar />

        {/* Header Penjelajah Folder & Control Panel */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 px-4 sm:px-6 transition-colors duration-200">
          <div className="max-w-6xl mx-auto space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Eksplorasi Bank Soal
                </span>
                
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <button
                    onClick={() => navigateToFolder(null)}
                    className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                      currentFolderId === null 
                        ? 'bg-slate-900 dark:bg-blue-600 text-white font-bold shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span>Root</span>
                  </button>

                  {breadcrumbs.map((crumb, idx) => {
                    const isLast = idx === breadcrumbs.length - 1;
                    return (
                      <div key={crumb.id} className="flex items-center gap-2">
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <button
                          onClick={() => navigateToFolder(crumb.id)}
                          className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                            isLast
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <FolderIcon className="w-3.5 h-3.5" />
                          <span>{crumb.name}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Search Live */}
              <div className="relative min-w-[260px]">
                <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kata kunci soal / ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-800 dark:focus:border-blue-500 transition shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
                {availableTopics.length > 2 ? (
                  <>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">Topik:</span>
                    {availableTopics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                          selectedTopic.toLowerCase() === topic.toLowerCase()
                            ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {onlyBookmarks ? 'Menampilkan semua soal tersimpan' : `Folder: ${currentFolder ? currentFolder.name : 'Root'}`}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Area Konten Utama */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-8">
          
          {/* SUB-FOLDERS GRID */}
          {currentSubFolders.length > 0 && !onlyBookmarks && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Folder Sub-kategori ({currentSubFolders.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentSubFolders.map((folder) => {
                  const childFolderCount = folders.filter((f) => f.parent_id === folder.id).length;
                  const totalProblemCount = getTotalProblemsInFolder(folder.id);
                  const isKosong = childFolderCount === 0 && totalProblemCount === 0;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className="group relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between space-y-3"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/40 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shrink-0 shadow-sm">
                            <FolderIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                              {folder.name}
                            </h3>
                          </div>
                        </div>

                        <span className="text-slate-300 dark:text-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 pt-0.5">
                          <ArrowRightIcon />
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {childFolderCount > 0 && (
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {childFolderCount} folder
                          </span>
                        )}
                        {totalProblemCount > 0 ? (
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/60">
                            {totalProblemCount} soal
                          </span>
                        ) : null}
                        {isKosong && (
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic">
                            Folder Kosong
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* DAFTAR SOAL */}
          {(loading || filteredProblems.length > 0 || currentSubFolders.length === 0) && (
            <section className="space-y-3">
              {filteredProblems.length > 0 && (
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {onlyBookmarks ? `Soal Tersimpan (${filteredProblems.length})` : `Daftar Soal (${filteredProblems.length})`}
                  </h2>
                </div>
              )}

              {loading ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs shadow-sm">
                  Memuat bank soal...
                </div>
              ) : filteredProblems.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(
                    filteredProblems.reduce((acc, problem) => {
                      const sec = problem.section || '';
                      if (!acc[sec]) acc[sec] = [];
                      acc[sec].push(problem);
                      return acc;
                    }, {} as Record<string, typeof filteredProblems>)
                  ).map(([sectionName, problemsList]) => (
                    <div key={sectionName || 'default'} className="space-y-3">
                      
                      {sectionName && (
                        <div className="flex items-center gap-4 pt-4 pb-1">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 shrink-0">
                            {sectionName}
                          </h3>
                          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                      )}

                      {problemsList.map((problem) => {
                        const idx = filteredProblems.indexOf(problem);
                        
                        // Gunakan pengecekan keabsahan pembahasan presisi
                        const validSolutions = getValidSolutions(problem);
                        const primaryBrief = validSolutions[0]?.brief;
                        const solutionCount = validSolutions.length;
                        
                        const isBookmarked = bookmarkedIds.includes(problem.id);
                        
                        const isPG = (problem as any).problem_type === 'multiple_choice';
                        const options = (problem as any).options || {};
                        const hasOptions = Object.keys(options).some((k) => options[k]);

                        // Cek apakah ada teks opsi yang panjang (> 35 karakter atau mengandung baris baru)
                        const isLongOption = Object.values(options).some(
                          (optText: any) => optText && typeof optText === 'string' && (optText.length > 35 || optText.includes('\n'))
                        );

                        const renderOptionCard = (opt: string) => {
  const optionText = options[opt];
  if (!optionText) return null;
  return (
    <div
      key={opt}
      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3 transition"
    >
      <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-black flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900">
        {opt}
      </span>
      <div className="flex-1 min-w-0 py-0.5">
        <MathText text={optionText} />
      </div>
    </div>
  );
};

                        return (
                          <div key={problem.id} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3 sm:space-y-4">
                            
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-[10px] sm:text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900">
                                  #{idx + 1}
                                </span>
                                <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  {problem.competition} {problem.year} ({problem.level})
                                </span>
                                {isPG && (
                                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-900 px-2 py-0.5 rounded uppercase tracking-wider">
                                    Pilihan Ganda
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                                  {problem.topic}
                                </span>
                                <button
                                  onClick={() => toggleBookmark(problem.id)}
                                  className={`p-1.5 rounded-lg transition ${
                                    isBookmarked
                                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title={isBookmarked ? 'Hapus Simpan' : 'Simpan Soal Ini'}
                                >
                                  <BookmarkIcon className="w-4 h-4" filled={isBookmarked} />
                                </button>
                              </div>
                            </div>

                            {/* Teks Pernyataan Soal */}
                            <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                              <MathText text={problem.statement} />
                            </div>

                            {/* RENDER OPSI PILIHAN GANDA (A-E) DENGAN KOLOM TERATUR */}
                            {(isPG || hasOptions) && (
                              <div>
                                {isLongOption ? (
                                  /* Layout 1 Kolom (5 Baris Vertikal) jika Opsi Panjang / Kalimat */
                                  <div className="space-y-2.5 pt-2">
                                    {['A', 'B', 'C', 'D', 'E'].map((opt) => renderOptionCard(opt))}
                                  </div>
                                ) : (
                                  /* Layout 2 Kolom: Kiri (A, B, C) & Kanan (D, E) */
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                    <div className="space-y-2.5">
                                      {['A', 'B', 'C'].map((opt) => renderOptionCard(opt))}
                                    </div>
                                    <div className="space-y-2.5">
                                      {['D', 'E'].map((opt) => renderOptionCard(opt))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {primaryBrief && (
                              <div className="pt-1 sm:pt-2">
                                <button
                                  onClick={() => setExpandedHintId(expandedHintId === problem.id ? null : problem.id)}
                                  className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl"
                                >
                                  <EyeIcon />
                                  <span>{expandedHintId === problem.id ? 'Sembunyikan Petunjuk' : 'Intip Petunjuk / Ide Solusi'}</span>
                                </button>

                                {expandedHintId === problem.id && (
                                  <div className="mt-2 p-3 sm:p-3.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">
                                      Ide Ringkas ({validSolutions[0].title || 'Solusi 1'}):
                                    </span>
                                    <MathText text={primaryBrief} />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono">ID: {problem.id}</span>
                                <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">•</span>
                                {solutionCount > 0 ? (
                                  <span className="hidden sm:inline-block text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900">
                                    {solutionCount} metode solusi
                                  </span>
                                ) : (
                                  <span className="hidden sm:inline-block text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
                                    Solusi belum ditambahkan
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
                                <button
                                  onClick={() => handleCopyLink(problem.id)}
                                  className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] sm:text-xs"
                                  title="Salin Tautan Soal"
                                >
                                  <ShareIcon />
                                  <span className={copiedId === problem.id ? 'inline font-bold text-blue-600 dark:text-blue-400' : 'hidden sm:inline'}>
                                    {copiedId === problem.id ? 'Tersalin!' : 'Bagikan'}
                                  </span>
                                </button>

                                {solutionCount > 0 ? (
                                  <a
                                    href={`/problems/${problem.id}`}
                                    className="font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 bg-blue-100/80 dark:bg-blue-950/80 hover:bg-blue-200/80 dark:hover:bg-blue-900/80 border border-blue-300/60 dark:border-blue-800/60 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition inline-flex items-center gap-1 text-[10px] sm:text-xs whitespace-nowrap"
                                  >
                                    <span>Buka Solusi ↗</span>
                                  </a>
                                ) : (
                                  <a
                                    href={`/problems/${problem.id}/submit`}
                                    className="font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 bg-amber-100/80 dark:bg-amber-950/80 hover:bg-amber-200/80 dark:hover:bg-amber-900/80 border border-amber-300/60 dark:border-amber-800/60 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition inline-flex items-center gap-1 text-[10px] sm:text-xs whitespace-nowrap"
                                  >
                                    <span>Ajukan Solusi +</span>
                                  </a>
                                )}
                              </div>

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs shadow-sm">
                  {onlyBookmarks
                    ? 'Belum ada soal yang Anda simpan. Klik ikon bookmark pada soal untuk menyimpannya di sini.'
                    : 'Tidak ada soal yang ditemukan di folder ini.'}
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ArsipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-8 text-center text-xs text-slate-400">Memuat halaman...</div>}>
      <ArsipContent />
    </Suspense>
  );
}