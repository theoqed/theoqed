'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';
import { Problem, Folder } from '@/types';
import { Navbar } from '@/components/Navbar';

type FolderWithAccess = Folder & {
  is_premium?: boolean;
  order_index?: number;
};

type ProblemWithAccess = Problem & {
  is_premium?: boolean;
  problem_type?: 'multiple_choice' | 'short_answer';
  options?: { [key: string]: string };
};

// --- ICONS ---
function FolderIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function EyeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function ShareIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function BookmarkIcon({ className = 'w-4 h-4', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function LockClosedIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
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
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: true,
              output: 'html',
            });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0 font-sans"
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

function ArsipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const currentFolderId = searchParams.get('folder') || null;

  const [folders, setFolders] = useState<FolderWithAccess[]>([]);
  const [problems, setProblems] = useState<ProblemWithAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [isUserPremium, setIsUserPremium] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');
  const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Modal Kunci Akses Premium
  const [lockedModalInfo, setLockedModalInfo] = useState<{
    title: string;
    type: 'folder' | 'problem';
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const [bmRes, profileRes] = await Promise.all([
          supabase.from('user_bookmarks').select('problem_id').eq('user_id', currentUser.id),
          supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
        ]);

        if (bmRes.data) {
          setBookmarkedIds(bmRes.data.map((b: any) => b.problem_id));
        }
        setIsUserPremium(checkPremiumAccess(profileRes.data));
      } else {
        setIsUserPremium(false);
        try {
          const saved = localStorage.getItem('theoqed_bookmarked_problems');
          if (saved) setBookmarkedIds(JSON.parse(saved));
        } catch {
          // Abaikan error localStorage
        }
      }

      const [folderRes, problemRes] = await Promise.all([
        supabase.from('folders').select('*'),
        supabase.from('problems').select('*').order('order_index', { ascending: true }),
      ]);

      if (folderRes.data) {
        const sortedFolders = (folderRes.data as FolderWithAccess[]).sort((a, b) => {
          const orderA = a.order_index ?? 0;
          const orderB = b.order_index ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        setFolders(sortedFolders);
      }

      if (problemRes.data) {
        setProblems(problemRes.data as ProblemWithAccess[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  // Cek apakah folder yang sedang dibuka (atau salah satu parent-nya) bersifat Premium
  const isCurrentPathRestricted = useMemo(() => {
    if (!currentFolderId) return false;
    let curr = folders.find((f) => f.id === currentFolderId);
    while (curr) {
      if (curr.is_premium) return true;
      curr = folders.find((f) => f.id === curr?.parent_id);
    }
    return false;
  }, [currentFolderId, folders]);

  const navigateToFolder = (folder: FolderWithAccess | null) => {
    if (!folder) {
      setSelectedTopic('Semua');
      router.push('/arsip');
      return;
    }

    if (folder.is_premium && !isUserPremium) {
      setLockedModalInfo({
        title: folder.name,
        type: 'folder',
      });
      return;
    }

    setSelectedTopic('Semua');
    router.push(`/arsip?folder=${folder.id}`);
  };

  const toggleBookmark = async (problemId: string) => {
    if (!user) {
      alert(
        'Silakan masuk ke akun TheoQED Anda terlebih dahulu untuk menyimpan soal ke Cloud Bookmarks.'
      );
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
      const { error } = await supabase.from('user_bookmarks').insert({
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

  // Jika pengguna non-premium membuka URL langsung ke folder Premium, blokir daftar soalnya
  const isBlockedFolderView = isCurrentPathRestricted && !isUserPremium && !loading;

  const baseProblems = isBlockedFolderView
    ? []
    : problems.filter((p) =>
        currentFolderId === null ? !p.folder_id : p.folder_id === currentFolderId
      );

  const filteredProblems = baseProblems.filter((p) => {
    const matchesSearch =
      p.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTopic =
      selectedTopic === 'Semua' || p.topic?.toLowerCase() === selectedTopic.toLowerCase();

    return matchesSearch && matchesTopic;
  });

  const availableTopics = [
    'Semua',
    ...Array.from(new Set(baseProblems.map((p) => p.topic).filter(Boolean) as string[])),
  ];

  const getBreadcrumbs = () => {
    const crumbs: FolderWithAccess[] = [];
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

  const currentRedirectUrl = encodeURIComponent(
    currentFolderId ? `/arsip?folder=${currentFolderId}` : '/arsip'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      <Navbar />

      {/* Header Penjelajah Folder & Control Panel — Lebar Standar max-w-7xl */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1.5">
                Eksplorasi Bank Soal
              </span>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => navigateToFolder(null)}
                  className={`h-8 px-3 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer ${
                    currentFolderId === null
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70'
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
                        type="button"
                        onClick={() => navigateToFolder(crumb)}
                        className={`h-8 px-3 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer ${
                          isLast
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70'
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
            <div className="relative min-w-[260px] sm:min-w-[300px]">
              <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kata kunci soal / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
              {availableTopics.length > 2 ? (
                <>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                    Topik:
                  </span>
                  {availableTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`h-8 px-3 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                        selectedTopic.toLowerCase() === topic.toLowerCase()
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Folder: {currentFolder ? currentFolder.name : 'Root'}
                </span>
              )}
            </div>

            {/* Tautan ke Halaman Bookmarks (/bookmarks) */}
            <Link
              href="/bookmarks"
              className="h-8 px-3.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-500/50 hover:bg-amber-500/10"
            >
              <BookmarkIcon className="w-3.5 h-3.5 text-amber-500" filled={bookmarkedIds.length > 0} />
              <span>Bookmarks ({bookmarkedIds.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Area Konten Utama — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* PESAN JIKA FOLDER PREMIUM DIAKSES LANGSUNG OLEH AKUN FREE */}
        {isBlockedFolderView ? (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-amber-500/40 dark:border-amber-500/35 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Folder Khusus Anggota Premium
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Koleksi soal di folder <strong>{currentFolder?.name}</strong> termasuk dalam akses{' '}
                <strong>Premium</strong>. Tingkatkan keanggotaan untuk membuka seluruh koleksi soal
                dan pembahasan lengkap.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateToFolder(null)}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
              >
                Kembali ke Root
              </button>
              <Link
                href={`/upgrade?redirect=${currentRedirectUrl}`}
                className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center justify-center transition"
              >
                Lihat Paket Premium
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* SUB-FOLDERS GRID */}
            {currentSubFolders.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Folder Sub-kategori ({currentSubFolders.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSubFolders.map((folder) => {
                    const childFolderCount = folders.filter((f) => f.parent_id === folder.id).length;
                    const totalProblemCount = getTotalProblemsInFolder(folder.id);
                    const isKosong = childFolderCount === 0 && totalProblemCount === 0;
                    const isFolderLocked = Boolean(folder.is_premium) && !isUserPremium;

                    return (
                      <div
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className={`group relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between space-y-3 ${
                          isFolderLocked
                            ? 'border-amber-500/40 dark:border-amber-500/35 hover:border-amber-500'
                            : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60'
                        }`}
                      >
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                            isFolderLocked
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                          }`}
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2.5 rounded-xl border group-hover:scale-105 transition-all duration-200 shrink-0 ${
                                isFolderLocked
                                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/40 group-hover:bg-amber-500 group-hover:text-white'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100/80 dark:border-indigo-900/50 group-hover:bg-indigo-600 group-hover:text-white'
                              }`}
                            >
                              {isFolderLocked ? (
                                <LockClosedIcon className="w-4 h-4" />
                              ) : (
                                <FolderIcon className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                                {folder.name}
                              </h3>
                            </div>
                          </div>

                          <span className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 pt-0.5">
                            {isFolderLocked ? (
                              <LockClosedIcon className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <ArrowRightIcon />
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                          {folder.is_premium && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/40 inline-flex items-center gap-1 uppercase">
                              <LockClosedIcon className="w-2.5 h-2.5 text-amber-500" />
                              <span>Premium</span>
                            </span>
                          )}
                          {childFolderCount > 0 && (
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {childFolderCount} folder
                            </span>
                          )}
                          {totalProblemCount > 0 ? (
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/60">
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
                      Daftar Soal ({filteredProblems.length})
                    </h2>
                  </div>
                )}

                {loading ? (
                  <div className="py-20 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    <span>Memuat bank soal...</span>
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
                      <div key={sectionName || 'default'} className="space-y-4">
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

                          const validSolutions = getValidSolutions(problem);
                          const primaryBrief = validSolutions[0]?.brief;
                          const solutionCount = validSolutions.length;

                          const isBookmarked = bookmarkedIds.includes(problem.id);
                          const isProblemRestricted = Boolean(problem.is_premium) && !isUserPremium;

                          const isPG = problem.problem_type === 'multiple_choice';
                          const options = problem.options || {};
                          const hasOptions = Object.keys(options).some((k) => options[k]);

                          const isLongOption = Object.values(options).some(
                            (optText: any) =>
                              optText &&
                              typeof optText === 'string' &&
                              (optText.length > 35 || optText.includes('\n'))
                          );

                          const renderOptionCard = (opt: string) => {
                            const optionText = options[opt];
                            if (!optionText) return null;
                            return (
                              <div
                                key={opt}
                                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3 transition"
                              >
                                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center shrink-0 border border-indigo-200/80 dark:border-indigo-900">
                                  {opt}
                                </span>
                                <div className="flex-1 min-w-0 py-0.5">
                                  <MathText text={optionText} />
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div
                              key={problem.id}
                              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="text-[10px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                                    #{idx + 1}
                                  </span>
                                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                                    {problem.competition} {problem.year} ({problem.level})
                                  </span>
                                  {isPG && (
                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border border-purple-200/80 dark:border-purple-900 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                      Pilihan Ganda
                                    </span>
                                  )}
                                  {problem.is_premium && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
                                      <LockClosedIcon className="w-2.5 h-2.5 text-amber-500" />
                                      <span>Premium</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                                    {problem.topic}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleBookmark(problem.id)}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                      isBookmarked
                                        ? 'text-amber-500 bg-amber-500/15'
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

                              {/* RENDER OPSI PILIHAN GANDA (A-E) */}
                              {(isPG || hasOptions) && (
                                <div>
                                  {isLongOption ? (
                                    <div className="space-y-2.5 pt-2">
                                      {['A', 'B', 'C', 'D', 'E'].map((opt) =>
                                        renderOptionCard(opt)
                                      )}
                                    </div>
                                  ) : (
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

                              {/* INTIP PETUNJUK / IDE SOLUSI */}
                              {primaryBrief && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isProblemRestricted) {
                                        setLockedModalInfo({
                                          title: problem.title || problem.id,
                                          type: 'problem',
                                        });
                                        return;
                                      }
                                      setExpandedHintId(
                                        expandedHintId === problem.id ? null : problem.id
                                      );
                                    }}
                                    className="h-8 px-3 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                                  >
                                    {isProblemRestricted ? (
                                      <LockClosedIcon className="w-3.5 h-3.5 text-amber-500" />
                                    ) : (
                                      <EyeIcon />
                                    )}
                                    <span>
                                      {isProblemRestricted
                                        ? 'Petunjuk Khusus Premium'
                                        : expandedHintId === problem.id
                                        ? 'Sembunyikan Petunjuk'
                                        : 'Intip Petunjuk / Ide Solusi'}
                                    </span>
                                  </button>

                                  {!isProblemRestricted && expandedHintId === problem.id && (
                                    <div className="mt-2.5 p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                      <span className="font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
                                        Ide Ringkas ({validSolutions[0].title || 'Solusi 1'}):
                                      </span>
                                      <MathText text={primaryBrief} />
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    ID: {problem.id}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">
                                    •
                                  </span>
                                  {solutionCount > 0 ? (
                                    <span className="hidden sm:inline-block text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                                      {solutionCount} metode solusi
                                    </span>
                                  ) : (
                                    <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                                      Solusi belum ditambahkan
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(problem.id)}
                                    className="h-8 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] sm:text-xs cursor-pointer"
                                    title="Salin Tautan Soal"
                                  >
                                    <ShareIcon />
                                    <span
                                      className={
                                        copiedId === problem.id
                                          ? 'inline font-bold text-indigo-600 dark:text-indigo-400'
                                          : 'hidden sm:inline'
                                      }
                                    >
                                      {copiedId === problem.id ? 'Tersalin!' : 'Bagikan'}
                                    </span>
                                  </button>

                                  {isProblemRestricted ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLockedModalInfo({
                                          title: problem.title || problem.id,
                                          type: 'problem',
                                        })
                                      }
                                      className="h-8 px-3 rounded-xl font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition inline-flex items-center gap-1.5 text-[11px] sm:text-xs whitespace-nowrap cursor-pointer"
                                    >
                                      <LockClosedIcon className="w-3 h-3 text-amber-500" />
                                      <span>Solusi Premium</span>
                                    </button>
                                  ) : solutionCount > 0 ? (
                                    <Link
                                      href={`/problems/${problem.id}`}
                                      className="h-8 px-3 rounded-xl font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50/90 dark:bg-indigo-950/80 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/70 transition inline-flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap"
                                    >
                                      <span>Buka Solusi ↗</span>
                                    </Link>
                                  ) : (
                                    <Link
                                      href={`/problems/${problem.id}/submit`}
                                      className="h-8 px-3 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition inline-flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap"
                                    >
                                      <span>Ajukan Solusi +</span>
                                    </Link>
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
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Tidak ada soal yang ditemukan di folder ini.
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL AKSES PREMIUM */}
      {lockedModalInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Konten Premium
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {lockedModalInfo.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lockedModalInfo.type === 'folder'
                ? 'Folder bank soal ini tersedia khusus untuk anggota Premium. Upgrade akun Anda untuk membuka seluruh koleksi soal dan pembahasannya.'
                : 'Petunjuk dan pembahasan lengkap untuk soal ini tersedia khusus untuk anggota Premium.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLockedModalInfo(null)}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href={`/upgrade?redirect=${currentRedirectUrl}`}
                className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center justify-center transition"
              >
                Upgrade ke Premium
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArsipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-xs text-slate-400">
          Memuat halaman...
        </div>
      }
    >
      <ArsipContent />
    </Suspense>
  );
}