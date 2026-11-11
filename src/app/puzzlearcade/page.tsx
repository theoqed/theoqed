'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getAllStats, GameStats, GameId } from '@/lib/puzzle-stats';

// Dynamic Imports (Lazy Loaded)
const LightsOutGame = dynamic(() => import('@/components/puzzlearcade/games/lights-out/LightsOutGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Lights Out...</div>,
});

const Game2048 = dynamic(() => import('@/components/puzzlearcade/games/game-2048/Game2048'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat 2048...</div>,
});

const SlidingPuzzleGame = dynamic(() => import('@/components/puzzlearcade/games/sliding-puzzle/SlidingPuzzleGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Sliding Puzzle...</div>,
});

const MinesweeperGame = dynamic(() => import('@/components/puzzlearcade/games/minesweeper/MinesweeperGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Minesweeper...</div>,
});

const TowerOfHanoiGame = dynamic(() => import('@/components/puzzlearcade/games/tower-of-hanoi/TowerOfHanoiGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Tower of Hanoi...</div>,
});

const SudokuGame = dynamic(() => import('@/components/puzzlearcade/games/sudoku/SudokuGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Sudoku...</div>,
});

const WordleGame = dynamic(() => import('@/components/puzzlearcade/games/wordle/WordleGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Wordle...</div>,
});

const NonogramGame = dynamic(() => import('@/components/puzzlearcade/games/nonogram/NonogramGame'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-xs text-slate-400">Memuat Nonogram...</div>,
});

interface GameItem {
  id: GameId;
  title: string;
  category: 'Logic' | 'Number & Math' | 'Spatial & Visual';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  icon: string;
  badgeColor: string;
}

const GAMES: GameItem[] = [
  {
    id: 'lights-out',
    title: 'Lights Out',
    category: 'Logic',
    difficulty: 'Easy',
    description: 'Matikan seluruh lampu di papan 5x5 dengan memperhitungkan efek saklar tetangga.',
    icon: '💡',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  {
    id: '2048',
    title: '2048',
    category: 'Number & Math',
    difficulty: 'Easy',
    description: 'Geser dan gabungkan ubin berangka sama untuk mencapai ubin target 2048.',
    icon: '🔢',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  },
  {
    id: 'sliding-puzzle',
    title: 'Sliding Puzzle',
    category: 'Spatial & Visual',
    difficulty: 'Medium',
    description: 'Urutkan ubin angka 1-15 dengan menggeser kotak ke area kosong yang tepat.',
    icon: '🧩',
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    category: 'Logic',
    difficulty: 'Medium',
    description: 'Temukan sel aman dan tandai lokasi ranjau berbekal petunjuk jumlah tetangga.',
    icon: '💣',
    badgeColor: 'text-red-600 dark:text-red-400 bg-red-500/10',
  },
  {
    id: 'tower-of-hanoi',
    title: 'Tower of Hanoi',
    category: 'Spatial & Visual',
    difficulty: 'Medium',
    description: 'Pindahkan seluruh tumpukan cakram ke tiang tujuan dengan efisiensi langkah terbaik.',
    icon: '🏰',
    badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    category: 'Logic',
    difficulty: 'Medium',
    description: 'Isi grid 9x9 dengan angka 1-9 tanpa duplikasi angka di baris, kolom, atau subgrid 3x3.',
    icon: '✏️',
    badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
  },
  {
    id: 'wordle',
    title: 'Wordle (Tebak Kata)',
    category: 'Logic',
    difficulty: 'Medium',
    description: 'Tebak kata rahasia 5 huruf dalam 6 kesempatan menggunakan indikator warna huruf.',
    icon: '🔤',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
  },
  {
    id: 'nonogram',
    title: 'Nonogram (Picross)',
    category: 'Spatial & Visual',
    difficulty: 'Medium',
    description: 'Hitamkan kotak berbekal petunjuk angka tepi baris dan kolom untuk mengungkap gambar.',
    icon: '🎨',
    badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
  },
];

function PuzzleArcadeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeGame = searchParams.get('game');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allStats, setAllStats] = useState<Record<string, GameStats>>({});

  useEffect(() => {
    if (!activeGame) {
      setAllStats(getAllStats());
    }
  }, [activeGame]);

  const handleSelectGame = (gameId: string) => {
    router.push(`/puzzlearcade?game=${gameId}`);
  };

  const handleBackToCatalog = () => {
    router.push('/puzzlearcade');
  };

  const categories = ['ALL', 'Logic', 'Number & Math', 'Spatial & Visual'];

  const filteredGames = GAMES.filter((game) => {
    const matchesCategory = selectedCategory === 'ALL' || game.category === selectedCategory;
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatTime = (totalSec: number | null) => {
    if (totalSec === null) return '--:--';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            <span>Kembali ke Katalog Puzzle</span>
          </button>

          {/* RENDER GAME AKTIF */}
          {activeGame === 'lights-out' && (
            <LightsOutGame onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === '2048' && (
            <Game2048 onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === 'sliding-puzzle' && (
            <SlidingPuzzleGame onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === 'minesweeper' && (
            <MinesweeperGame onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === 'tower-of-hanoi' && (
            <TowerOfHanoiGame onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === 'sudoku' && (
            <SudokuGame onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === 'wordle' && (
            <WordleGame onBackToCatalog={handleBackToCatalog} />
          )}
          {activeGame === 'nonogram' && (
            <NonogramGame onBackToCatalog={handleBackToCatalog} />
          )}
        </div>
      ) : (
        /* KATALOG UTAMA */
        <div className="space-y-6">
          
          {/* FILTER CATEGORY & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            
            {/* TAB KATEGORI */}
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
                  {cat === 'ALL' ? 'Semua Puzzle' : cat}
                </button>
              ))}
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full sm:w-64">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari puzzle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* GRID KARTU GAME */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => {
                const stats = allStats[game.id];
                
                const hasPlayed =
                  stats &&
                  (stats.gamesWon > 0 ||
                    (game.id === '2048' && stats.bestScore !== undefined && stats.bestScore !== null && stats.bestScore > 0));

                return (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className={`w-12 h-12 rounded-2xl ${game.badgeColor} flex items-center justify-center text-2xl font-bold`}>
                          {game.icon}
                        </div>

                        {/* STATS BADGE PADA KARTU */}
                        {hasPlayed && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900/60">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span>
                              {game.id === '2048' && stats?.bestScore !== undefined && stats?.bestScore !== null
                                ? `Skor: ${stats.bestScore}`
                                : formatTime(stats?.bestTime ?? null)}
                            </span>
                          </div>
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

                    <div className="pt-6 flex items-center justify-end text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition duration-200">
                      <div className="flex items-center gap-1">
                        <span>{hasPlayed ? 'Main Lagi' : 'Mainkan'}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              Tidak ada puzzle yang sesuai dengan filter atau kata kunci pencarian.
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function PuzzleArcadePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between">
      <div>
        <Navbar />

        {/* HEADER KATALOG */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-800">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>TheoQED Arcade</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              PuzzleArcade — Permainan Logika & Matematika
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Asah kemampuan spasial, angka, dan deduksi logika secara interaktif langsung di browser.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Memuat Katalog...</div>}>
          <PuzzleArcadeContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}