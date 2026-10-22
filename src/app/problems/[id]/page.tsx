'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import katex from 'katex';
import { supabase } from '../../../lib/supabase';
import { Problem, SolutionItem } from '@/types';

function UserIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
            return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params?.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProblemDetail() {
      if (!problemId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .single();

      if (!error && data) {
        setProblem(data as Problem);
      }
      setLoading(false);
    }

    fetchProblemDetail();
  }, [problemId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentSol: SolutionItem | undefined = problem?.solutions?.[activeTab];

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
            <a href="/arsip" className="hover:text-slate-900 transition">Arsip Soal</a>
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

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        
        {/* Tombol Kembali & Action */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <ArrowLeftIcon />
            <span>Kembali ke Arsip</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <ShareIcon />
            <span>{copied ? 'Tautan Tersalin!' : 'Bagikan Soal'}</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Memuat pembahasan soal...
          </div>
        ) : !problem ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <p className="text-sm font-bold text-slate-800">Soal tidak ditemukan</p>
            <p className="text-xs text-slate-500">Soal dengan ID "{problemId}" mungkin telah dihapus atau dipindahkan.</p>
            <a href="/arsip" className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">
              Kembali ke Daftar Arsip →
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KARTU DOKUMEN SOAL */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              
              {/* Header Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {problem.competition} {problem.year}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {problem.level}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-600">Topik: {problem.topic}</span>
                  <span>•</span>
                  <span className="font-mono">ID: {problem.id}</span>
                </div>
              </div>

              {/* Judul & Pernyataan Soal */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pernyataan Soal</span>
                <div className="text-slate-900 text-base sm:text-lg leading-relaxed">
                  <MathText text={problem.statement} />
                </div>
              </div>

            </div>

            {/* SEKSI TABULASI SOLUSI (ALA MATHNET MIT) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pembahasan & Solusi ({problem.solutions?.length || 0})
                </h2>
              </div>

              {problem.solutions && problem.solutions.length > 0 ? (
                <div className="space-y-4">
                  
                  {/* Tab Selector Buttons */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                    {problem.solutions.map((sol, index) => (
                      <button
                        key={sol.id || index}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                          activeTab === index
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                        }`}
                      >
                        <span>{sol.title || `Solusi ${index + 1}`}</span>
                      </button>
                    ))}
                  </div>

                  {/* Isi Solusi yang Aktif */}
                  {currentSol && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                      
                      {/* Sub-Header: Penulis & Hasil Akhir */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">Solusi oleh:</span>
                          <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                            <UserIcon />
                            {currentSol.author || 'Tim TheoQED'}
                          </span>
                        </div>

                        {currentSol.final_answer && (
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-slate-700">
                            <span className="text-slate-400 font-sans font-medium text-[11px]">Hasil Akhir:</span>
                            <strong>
                              <MathText text={currentSol.final_answer.startsWith('$') ? currentSol.final_answer : `$${currentSol.final_answer}$`} />
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Ide Ringkas / Hint */}
                      {currentSol.brief && (
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed">
                          <span className="font-bold text-slate-900 block mb-1">Ide Ringkas / Gagasan Utama:</span>
                          <MathText text={currentSol.brief} />
                        </div>
                      )}

                      {/* Langkah-Langkah Solusi Runtut */}
                      {currentSol.steps && currentSol.steps.length > 0 ? (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Langkah Pembahasan:</h4>
                          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-800 leading-relaxed">
                            {currentSol.steps.map((step, idx) => (
                              <li key={idx} className="pl-1">
                                <MathText text={step} />
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada penjabaran langkah rinci untuk metode ini.</p>
                      )}

                    </div>
                  )}

                </div>
              ) : (
                <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  Belum ada pembahasan yang diunggah untuk soal ini.
                </div>
              )}

            </div>

          </div>
        )}

      </main>

    </div>
  );
}