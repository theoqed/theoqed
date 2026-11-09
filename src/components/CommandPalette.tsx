'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigasi' | 'TheoNotes' | 'Fitur';
  href: string;
  description?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Daftar Perintah & Navigasi Cepat TheoQED
  const commands: CommandItem[] = [
    { id: 'nav-home', title: 'Beranda', category: 'Navigasi', href: '/', description: 'Kembali ke halaman utama TheoQED' },
    { id: 'nav-arsip', title: 'Arsip Soal', category: 'Navigasi', href: '/arsip', description: 'Jelajahi dan cari bank soal matematika' },
    { id: 'nav-notes', title: 'TheoNotes Library', category: 'Navigasi', href: '/notes', description: 'Modul materi & pembuktian terstruktur' },
    { id: 'nav-tryout', title: 'Simulasi Try Out', category: 'Navigasi', href: '/tryout', description: 'Uji kemampuan matematika dengan timer CBT' },
    { id: 'nav-bookmarks', title: 'Bookmarks / Tersimpan', category: 'Navigasi', href: '/bookmarks', description: 'Lihat soal & catatan yang kamu simpan' },
    { id: 'nav-profile', title: 'Profil Saya', category: 'Navigasi', href: '/profile', description: 'Pengaturan akun dan statistik pengerjaan' },
    { id: 'nav-admin', title: 'Admin Portal', category: 'Navigasi', href: '/admin', description: 'Kelola soal, modul, dan pengguna' },
    
    // Quick Links Modul TheoNotes
    { id: 'note-logika', title: 'Modul: Logika & Himpunan', category: 'TheoNotes', href: '/notes/logika-dan-himpunan', description: 'Pernyataan, tabel kebenaran, & diagram Venn' },
    { id: 'note-analisis', title: 'Modul: Analisis Real', category: 'TheoNotes', href: '/notes/analisis-real', description: 'Sifat sistem bilangan real & limit fungsi' },
    { id: 'note-aljabar', title: 'Modul: Aljabar Linear', category: 'TheoNotes', href: '/notes/aljabar-linear', description: 'Vektor, matriks, & ruang vektor' },
  ];

  // Filter berdasarkan input pencarian
  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard Shortcut Listener (Ctrl + K / Cmd + K & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigasi Keyboard (Panah Atas/Bawah & Enter)
  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        router.push(target.href);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 transition-all animate-in fade-in duration-200">
      {/* Backdrop Click Close */}
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

      {/* Main Command Box */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <svg className="w-5 h-5 text-slate-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder="Ketik tujuan, nama modul, atau halaman... (Ctrl + K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownModal}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 max-h-[360px]">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    router.push(cmd.href);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{cmd.title}</span>
                    {cmd.description && (
                      <span className={`text-[10px] line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {cmd.description}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                    isSelected
                      ? 'bg-blue-700 border-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}>
                    {cmd.category}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada navigasi atau modul yang cocok dengan pencarian.
            </div>
          )}
        </div>

        {/* Footer Shortcut Instructions */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">↓</kbd> Pilih</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">↵</kbd> Buka</span>
          </div>
          <span className="font-bold">TheoQED Quick Access</span>
        </div>

      </div>
    </div>
  );
}