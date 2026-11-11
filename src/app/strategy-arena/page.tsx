'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Dynamic Imports (Lazy Loading agar performa tetap ringan)
const TicTacToeGame = dynamic(() => import('@/components/strategy-arena/games/tic-tac-toe/TicTacToeGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Tic-Tac-Toe...</div>,
});

const ConnectFourGame = dynamic(() => import('@/components/strategy-arena/games/connect-four/ConnectFourGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Connect Four...</div>,
});

const ChessGame = dynamic(() => import('@/components/strategy-arena/games/chess/ChessGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Chess...</div>,
});

const ReversiGame = dynamic(() => import('@/components/strategy-arena/games/reversi/ReversiGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Reversi...</div>,
});

const GomokuGame = dynamic(() => import('@/components/strategy-arena/games/gomoku/GomokuGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Gomoku...</div>,
});

interface StrategyGameItem {
  id: string;
  title: string;
  category: 'Abstract Strategy' | 'Territory & Connection' | 'Traditional Strategy';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  icon: string;
  badgeColor: string;
  isAvailable: boolean;
}

const STRATEGY_GAMES: StrategyGameItem[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    category: 'Abstract Strategy',
    difficulty: 'Easy',
    description: 'Susun 3 tanda sejajar secara vertikal, horizontal, atau diagonal untuk mengungguli lawan atau AI.',
    icon: '❌',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    isAvailable: true,
  },
  {
    id: 'connect-four',
    title: 'Connect Four',
    category: 'Territory & Connection',
    difficulty: 'Medium',
    description: 'Jatuhkan keping bergiliran untuk membentuk 4 keping berurutan sambil memblokir taktik lawan.',
    icon: '🔴',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    isAvailable: true,
  },
  {
    id: 'chess',
    title: 'Chess (Catur)',
    category: 'Abstract Strategy',
    difficulty: 'Hard',
    description: 'Permainan strategi catur klasik penuh taktik pergerakan bidak dan skakmat (Tahap 2).',
    icon: '♟️',
    badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    isAvailable: true,
  },
  {
    id: 'reversi',
    title: 'Reversi / Othello',
    category: 'Abstract Strategy',
    difficulty: 'Medium',
    description: 'Jepit dan balik keping lawan untuk menguasai dominasi warna terbanyak di papan (Tahap 3).',
    icon: '⚪',
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    isAvailable: true,
  },
  {
    id: 'gomoku',
    title: 'Gomoku',
    category: 'Territory & Connection',
    difficulty: 'Medium',
    description: 'Susun 5 batu segaris di papan grid terbuka mendahului perangkap strategi lawan (Tahap 3).',
    icon: '⚫',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    isAvailable: true,
  },
];

function StrategyArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeGame = searchParams.get('game');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSelectGame = (gameId: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    router.push(`/strategy-arena?game=${gameId}`);
  };

  const handleBackToCatalog = () => {
    router.push('/strategy-arena');
  };

  const categories = ['ALL', 'Abstract Strategy', 'Territory & Connection', 'Traditional Strategy'];

  const filteredGames = STRATEGY_GAMES.filter((game) => {
    const matchesCategory = selectedCategory === 'ALL' || game.category === selectedCategory;
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 my-8">
      {activeGame ? (
        <div className="space-y-4">
          <button
            onClick={handleBackToCatalog}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Katalog Arena</span>
          </button>

          {/* RENDER GAME AKTIF */}
          {activeGame === 'tic-tac-toe' && <TicTacToeGame onBackToCatalog={handleBackToCatalog} />}
          {activeGame === 'connect-four' && <ConnectFourGame onBackToCatalog={handleBackToCatalog} />}
          {activeGame === 'chess' && <ChessGame onBackToCatalog={handleBackToCatalog} />}
          {activeGame === 'reversi' && <ReversiGame onBackToCatalog={handleBackToCatalog} />}
          {activeGame === 'gomoku' && <GomokuGame onBackToCatalog={handleBackToCatalog} />}
        </div>
      ) : (
        /* KATALOG UTAMA */
        <div className="space-y-6">
          {/* FILTER CATEGORY & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Game' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari permainan strategi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* GRID KARTU GAME */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleSelectGame(game.id, game.isAvailable)}
                  className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between relative overflow-hidden ${
                    game.isAvailable
                      ? 'hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer'
                      : 'opacity-65 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-2xl ${game.badgeColor} flex items-center justify-center text-2xl font-bold`}>
                        {game.icon}
                      </div>
                      {!game.isAvailable && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                          Segera Hadir
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {game.category} • {game.difficulty}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {game.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-end text-xs font-bold text-blue-600 dark:text-blue-400">
                    {game.isAvailable ? (
                      <div className="flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                        <span>Bertanding</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Terkunci</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              Tidak ada permainan yang sesuai dengan kata kunci pencarian.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StrategyArenaPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between">
      <div>
        <Navbar />

        {/* HEADER KATALOG */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>TheoQED Arena</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Strategy Arena — Permainan Taktik & Pengambilan Keputusan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Uji ketangkasan analisis, antisipasi respons lawan, dan dominasi papan secara lokal maupun melawan AI.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Memuat Strategy Arena...</div>}>
          <StrategyArenaContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}