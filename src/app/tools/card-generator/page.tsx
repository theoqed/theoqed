'use client';

import { useState, useRef } from 'react';
import Script from 'next/script';
import katex from 'katex';
import { ThemeToggle } from '@/components/ThemeToggle';

declare global {
  interface Window {
    htmlToImage?: any;
  }
}

// Preset Tema Visual Card
const THEME_PRESETS = [
  {
    id: 'midnight',
    name: 'Midnight Dark',
    bg: 'bg-slate-950 text-slate-100 border-slate-800',
    accent: 'text-blue-400 bg-blue-950/80 border-blue-900',
    border: 'border-slate-800',
    cardBg: '#020617',
  },
  {
    id: 'light',
    name: 'Academic Light',
    bg: 'bg-white text-slate-900 border-slate-200',
    accent: 'text-blue-700 bg-blue-50 border-blue-200',
    border: 'border-slate-200',
    cardBg: '#ffffff',
  },
  {
    id: 'blueprint',
    name: 'Gradient Blueprint',
    bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white border-indigo-900/50',
    accent: 'text-indigo-300 bg-indigo-900/50 border-indigo-700/50',
    border: 'border-indigo-900/60',
    cardBg: '#0f172a',
  },
];

// Preset Rasio Ukuran Kartu
const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square (Feed)', width: 'w-[480px]', height: 'h-[480px]' },
  { id: '4:5', label: '4:5 Portrait (Story)', width: 'w-[440px]', height: 'h-[550px]' },
  { id: '16:9', label: '16:9 Landscape (Slide)', width: 'w-[600px]', height: 'h-[337.5px]' },
];

// --- ICONS ---
function ImageIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function DownloadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
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

export default function MathCardGeneratorPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Form States
  const [topic, setTopic] = useState('TEORI BILANGAN');
  const [title, setTitle] = useState('Teorema Sisa Cina (CRT)');
  const [latexContent, setLatexContent] = useState(
    'Diberikan sistem kongruensi linier:\n$$x \\equiv a_1 \\pmod{m_1}$$\n$$x \\equiv a_2 \\pmod{m_2}$$\nJika $\\gcd(m_1, m_2) = 1$, maka solusi $x$ bersifat unik secara modulo $M = m_1 m_2$.'
  );
  const [watermark, setWatermark] = useState('TheoQED Academy • @davemarcellino_');

  // Design Customization States
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);

  // Handler Export Gambar Ke PNG (Menggunakan html-to-image)
  const handleExportPNG = async () => {
    if (!cardRef.current) return;

    if (!window.htmlToImage) {
      alert('Modul ekspor sedang dimuat, silakan coba beberapa detik lagi.');
      return;
    }

    try {
      setDownloading(true);

      const dataUrl = await window.htmlToImage.toPng(cardRef.current, {
        pixelRatio: 3, // High Resolution 3x
        backgroundColor: selectedTheme.cardBg,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `TheoQED_MathCard_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error('Export Failed:', err);
      alert('Gagal mengekspor kartu ke gambar. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
      
      {/* Script html-to-image via CDN */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js" />

      {/* Top Bar Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Beranda</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                LaTeX Math Card Generator
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <a
              href="https://instagram.com/davemarcellino_"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold p-2 sm:px-3.5 sm:py-2 rounded-xl transition inline-flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60"
            >
              <InstagramIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="hidden sm:inline">@davemarcellino_</span>
            </a>
          </div>

        </div>
      </header>

      {/* Main Workspace (Editor Kiri + Card Canvas Preview Kanan) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL KIRI: EDITOR KONTEN & GAYA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Pengaturan Konten & Kartu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sesuaikan teks, rumus LaTeX, dan tampilan visual kartu.
              </p>
            </div>

            {/* Pilihan Rasio Ukuran */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Aspek Rasio Kartu:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      selectedRatio.id === ratio.id
                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ratio.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Preset Tema */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Tema Warna Visual:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_PRESETS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      selectedTheme.id === theme.id
                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Input Teks */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Kategori / Subjek Topik:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Teorema / Soal:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pernyataan & Kode LaTeX ($ ... $ / $$ ... $$):
                </label>
                <textarea
                  rows={6}
                  value={latexContent}
                  onChange={(e) => setLatexContent(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Watermark Footer:
                </label>
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Action Export Button */}
            <button
              onClick={handleExportPNG}
              disabled={downloading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <DownloadIcon />
              <span>{downloading ? 'Mengekspor Gambar...' : 'Unduh Kartu PNG High-Res'}</span>
            </button>

          </div>
        </div>

        {/* PANEL KANAN: LIVE PRATINJAU KARTU MATH CARD */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Pratinjau Hasil Ekspor ({selectedRatio.id})
          </span>

          <div className="w-full overflow-x-auto flex items-center justify-center p-4 bg-slate-200/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 min-h-[420px]">
            
            {/* ELEMENT TARGET UNDUH PNG (cardRef) */}
            <div
              ref={cardRef}
              className={`${selectedTheme.bg} ${selectedRatio.width} ${selectedRatio.height} p-8 rounded-3xl border ${selectedTheme.border} shadow-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden shrink-0`}
            >
              {/* Header Topic & Logo */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${selectedTheme.accent}`}>
                    {topic || 'MATEMATIKA'}
                  </span>
                  <span className="text-[11px] font-black tracking-tight font-sans">
                    <span className="text-blue-500">√</span>TheoQED<span className="text-blue-500">.</span>
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                  {title || 'Judul Kartu'}
                </h3>
              </div>

              {/* Main Math Content (KaTeX Rendered) */}
              <div className="my-auto py-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line relative z-10">
                <MathText text={latexContent} />
              </div>

              {/* Footer Watermark */}
              <div className="pt-3 border-t border-current/10 flex items-center justify-between text-[10px] font-mono opacity-60 relative z-10">
                <span>{watermark}</span>
                <span>Q.E.D.</span>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}