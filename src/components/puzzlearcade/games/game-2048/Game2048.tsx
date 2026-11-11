'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameShell } from '../../GameShell';
import { save2048Stats } from '@/lib/puzzle-stats';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
  isMergedSource?: boolean;
}

interface Game2048Props {
  onBackToCatalog?: () => void;
}

export default function Game2048({ onBackToCatalog }: Game2048Props) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const nextIdRef = useRef(1);

  // Inisialisasi Papan Permainan
  const initBoard = useCallback(() => {
    nextIdRef.current = 1;
    
    const pos1 = { row: Math.floor(Math.random() * 4), col: Math.floor(Math.random() * 4) };
    let pos2 = { row: Math.floor(Math.random() * 4), col: Math.floor(Math.random() * 4) };
    while (pos1.row === pos2.row && pos1.col === pos2.col) {
      pos2 = { row: Math.floor(Math.random() * 4), col: Math.floor(Math.random() * 4) };
    }

    const initialTiles: Tile[] = [
      { id: nextIdRef.current++, value: Math.random() < 0.9 ? 2 : 4, ...pos1, isNew: true },
      { id: nextIdRef.current++, value: Math.random() < 0.9 ? 2 : 4, ...pos2, isNew: true },
    ];

    setTiles(initialTiles);
    setScore(0);
    setMoves(0);
    setIsWon(false);
    setIsGameOver(false);
    setResetKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Otomatis menyimpan skor tertinggi & ubin terbesar secara real-time
  useEffect(() => {
    if (score > 0) {
      const activeTiles = tiles.filter((t) => !t.isMergedSource);
      const maxTile = activeTiles.length > 0 ? Math.max(...activeTiles.map((t) => t.value)) : 0;
      save2048Stats(score, maxTile);
    }
  }, [score, tiles]);

  // Cek Game Over
  const checkGameOver = (activeTiles: Tile[]) => {
    if (activeTiles.length < 16) return false;

    const grid: number[][] = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));

    activeTiles.forEach((t) => {
      grid[t.row][t.col] = t.value;
    });

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Handler Pergerakan & Penggabungan Berbasis Animasi Murni
  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (isGameOver) return;

      // Bersihkan tile sisa merge pergerakan sebelumnya
      const activeTiles = tiles.filter((t) => !t.isMergedSource);

      const grid: (Tile | null)[][] = Array(4)
        .fill(null)
        .map(() => Array(4).fill(null));

      activeTiles.forEach((t) => {
        grid[t.row][t.col] = { ...t, isNew: false, isMerged: false };
      });

      let hasChanged = false;
      let scoreAdded = 0;

      const rows = direction === 'DOWN' ? [3, 2, 1, 0] : [0, 1, 2, 3];
      const cols = direction === 'RIGHT' ? [3, 2, 1, 0] : [0, 1, 2, 3];

      const dr = direction === 'UP' ? -1 : direction === 'DOWN' ? 1 : 0;
      const dc = direction === 'LEFT' ? -1 : direction === 'RIGHT' ? 1 : 0;

      const nextTiles: Tile[] = [];

      for (const r of rows) {
        for (const c of cols) {
          const tile = grid[r][c];
          if (!tile) continue;

          let currR = r;
          let currC = c;

          while (true) {
            const nextR = currR + dr;
            const nextC = currC + dc;

            if (nextR < 0 || nextR >= 4 || nextC < 0 || nextC >= 4) break;

            const target = grid[nextR][nextC];

            if (!target) {
              // Bergeser ke sel kosong
              grid[nextR][nextC] = tile;
              grid[currR][currC] = null;
              currR = nextR;
              currC = nextC;
              hasChanged = true;
            } else if (
              target.value === tile.value &&
              !target.isMerged &&
              !tile.isMerged
            ) {
              // Penggabungan dua tile: Target mendapatkan nilai ganda
              target.value *= 2;
              target.isMerged = true;
              grid[currR][currC] = null;

              scoreAdded += target.value;
              hasChanged = true;

              // Tile asal ikut meluncur (slide) sampai ke koordinat target
              tile.row = nextR;
              tile.col = nextC;
              tile.isMergedSource = true;
              nextTiles.push(tile);
              break;
            } else {
              break;
            }
          }

          if (!tile.isMergedSource) {
            tile.row = currR;
            tile.col = currC;
            if (currR !== r || currC !== c) {
              hasChanged = true;
            }
          }
        }
      }

      if (!hasChanged) return;

      // Kumpulkan seluruh tile grid utama
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const t = grid[r][c];
          if (t) {
            nextTiles.push(t);
          }
        }
      }

      // Spawn tile baru (2 atau 4)
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!grid[r][c]) emptyCells.push([r, c]);
        }
      }

      if (emptyCells.length > 0) {
        const [randR, randC] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        nextTiles.push({
          id: nextIdRef.current++,
          value: Math.random() < 0.9 ? 2 : 4,
          row: randR,
          col: randC,
          isNew: true,
        });
      }

      setTiles(nextTiles);
      setScore((s) => s + scoreAdded);
      setMoves((m) => m + 1);

      if (!isWon && nextTiles.some((t) => t.value === 2048)) {
        setIsWon(true);
      }

      if (checkGameOver(nextTiles.filter((t) => !t.isMergedSource))) {
        setIsGameOver(true);
      }
    },
    [tiles, isGameOver, isWon]
  );

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        move('UP');
      } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        move('DOWN');
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
        move('LEFT');
      } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        move('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50';
      case 4: return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/40';
      case 8: return 'bg-orange-500 text-white';
      case 16: return 'bg-orange-600 text-white';
      case 32: return 'bg-red-500 text-white';
      case 64: return 'bg-red-600 text-white';
      case 128: return 'bg-amber-400 text-slate-950 font-black';
      case 256: return 'bg-amber-500 text-white font-black';
      case 512: return 'bg-yellow-400 text-slate-950 font-black';
      case 1024: return 'bg-yellow-500 text-white font-black';
      case 2048: return 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/40';
      default: return 'bg-blue-600 text-white font-black';
    }
  };

  return (
    <GameShell
      title="2048"
      gameId="2048"
      category="Number & Math"
      difficulty="Easy"
      instructions="Gunakan tombol panah keyboard atau kontrol arah layar untuk menggeser ubin. Ubin berangka sama akan menggabungkan diri saat bersentuhan. Capai angka 2048 untuk menang!"
      moves={moves}
      isCompleted={isWon}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      {/* KEYFRAMES ANIMASI POP-OUT & MERGE-POP */}
      <style>{`
        @keyframes tilePopIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.15);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes tileMergePop {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.18);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-pop-out {
          animation: tilePopIn 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-merge-pop {
          animation: tileMergePop 180ms ease-in-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center space-y-4">
        
        {/* SKOR MONITOR */}
        <div className="w-full flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
          <span className="text-slate-500">Skor Saat Ini:</span>
          <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">{score}</span>
        </div>

        {/* BOARD 4x4 */}
        <div className="relative p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner w-[290px] h-[290px] sm:w-[330px] sm:h-[330px]">
          
          {/* BACKGROUND GRID (SLOT KOSONG) */}
          <div className="grid grid-cols-4 gap-2.5 w-full h-full">
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="bg-slate-200/70 dark:bg-slate-800/50 rounded-xl border border-slate-300/60 dark:border-slate-800/80" />
              ))}
          </div>

          {/* FOREGROUND ANIMATED TILES LAYER */}
          <div className="absolute inset-3 pointer-events-none">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                style={{
                  transform: `translate3d(calc(${tile.col} * (100% + 0.625rem)), calc(${tile.row} * (100% + 0.625rem)), 0)`,
                  willChange: 'transform',
                  zIndex: tile.isMergedSource ? 10 : 20,
                }}
                className="absolute top-0 left-0 w-[calc((100%-1.875rem)/4)] h-[calc((100%-1.875rem)/4)] transition-transform duration-150 ease-out"
              >
                <div
                  className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-sm sm:text-base ${
                    tile.isNew
                      ? 'animate-pop-out'
                      : tile.isMerged
                      ? 'animate-merge-pop'
                      : ''
                  } ${getTileColor(tile.value)}`}
                >
                  {tile.value}
                </div>
              </div>
            ))}
          </div>

          {/* OVERLAY GAME OVER */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-3 z-30">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Permainan Selesai</span>
              <h3 className="text-lg font-black text-white">Tidak Ada Langkah Tersisa</h3>
              <button
                onClick={initBoard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* KONTROL LAYAR SENTUH MOBILE */}
        <div className="sm:hidden flex flex-col items-center gap-1 pt-2">
          <button
            onClick={() => move('UP')}
            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => move('LEFT')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => move('DOWN')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => move('RIGHT')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </GameShell>
  );
}