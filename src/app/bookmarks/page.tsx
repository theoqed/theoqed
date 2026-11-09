'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Problem } from '@/types';
import katex from 'katex';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

function BookmarkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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

function MathText({ text }: { text?: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);
  return (
    <span className="leading-relaxed font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: true, output: 'html' });
            return <span key={index} className="block my-2 text-center overflow-x-auto overflow-y-hidden py-1.5 [&_.katex-display]:my-0" dangerouslySetInnerHTML={{ __html: html }} />;
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

export default function BookmarksPage() {
  const supabase = createClient();
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    setLoading(true);

    // 1. Ambil Sesi User Login
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);

    let problemIds: string[] = [];

    if (currentUser) {
      // Fetch dari Supabase Cloud Bookmarks
      const { data: bmData } = await supabase
        .from('user_bookmarks')
        .select('problem_id')
        .eq('user_id', currentUser.id);

      if (bmData) {
        problemIds = bmData.map((b: any) => b.problem_id);
      }
    } else {
      // Fallback LocalStorage untuk Tamu
      try {
        const saved = localStorage.getItem('theoqed_bookmarked_problems');
        if (saved) problemIds = JSON.parse(saved);
      } catch (e) {}
    }

    // 2. Ambil Detail Soal dari Database berdasarkan ID
    if (problemIds.length > 0) {
      const { data: problemData } = await supabase
        .from('problems')
        .select('*')
        .in('id', problemIds);

      if (problemData) {
        setBookmarkedProblems(problemData as Problem[]);
      }
    } else {
      setBookmarkedProblems([]);
    }

    setLoading(false);
  }

  const handleRemoveBookmark = async (problemId: string) => {
    if (user) {
      // Hapus dari Supabase Cloud
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_id', problemId);

      if (!error) {
        setBookmarkedProblems((prev) => prev.filter((p) => p.id !== problemId));
      } else {
        alert(`Gagal menghapus bookmark: ${error.message}`);
      }
    } else {
      // Hapus dari LocalStorage
      try {
        const saved = localStorage.getItem('theoqed_bookmarked_problems');
        const ids: string[] = saved ? JSON.parse(saved) : [];
        const updated = ids.filter((bId) => bId !== problemId);
        localStorage.setItem('theoqed_bookmarked_problems', JSON.stringify(updated));
        setBookmarkedProblems((prev) => prev.filter((p) => p.id !== problemId));
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          {/* Header Title */}
          <div className="space-y-2 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-amber-500">
              <BookmarkIcon />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Koleksi Bookmarks
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar soal pilihan yang Anda simpan untuk dipelajari kembali nanti.
            </p>
          </div>

          {/* List Bookmarked Items */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Memuat bookmark tersimpan...
            </div>
          ) : bookmarkedProblems.length > 0 ? (
            <div className="space-y-4">
              {bookmarkedProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                        {problem.competition} {problem.year}
                      </span>
                      {problem.topic && (
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                          {problem.topic}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">ID: {problem.id}</span>
                    </div>

                    <div className="text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                      <MathText text={problem.statement} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleRemoveBookmark(problem.id)}
                      className="p-2.5 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition border border-red-100 dark:border-red-900/40"
                      title="Hapus dari Bookmark"
                    >
                      <TrashIcon />
                    </button>
                    <a
                      href={`/problems/${problem.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-1"
                    >
                      <span>Buka Solusi</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mx-auto text-xl">
                🔖
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Bookmark</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tandai soal yang menarik saat Anda menjelajahi arsip untuk menyimpannya di halaman ini.
              </p>
              <a href="/arsip" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition">
                Jelajahi Arsip Soal
              </a>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}