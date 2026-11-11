'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameShell } from '../../GameShell';

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

interface SlidingPuzzleProps {
  onBackToCatalog?: () => void;
}

export default function SlidingPuzzleGame({ onBackToCatalog }: SlidingPuzzleProps) {
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Inisialisasi Papan Permainan (Dipastikan Solvable)
  const initBoard = useCallback(() => {
    let currentBoard = Array.from({ length: TOTAL_TILES }, (_, i) =>
      i === TOTAL_TILES - 1 ? 0 : i + 1
    );

    let emptyIndex = TOTAL_TILES - 1;
    let lastSwapped = -1;

    for (let i = 0; i < 120; i++) {
      const row = Math.floor(emptyIndex / GRID_SIZE);
      const col = emptyIndex % GRID_SIZE;
      const neighbors: number[] = [];

      if (row > 0) neighbors.push(emptyIndex - GRID_SIZE);
      if (row < GRID_SIZE - 1) neighbors.push(emptyIndex + GRID_SIZE);
      if (col > 0) neighbors.push(emptyIndex - 1);
      if (col < GRID_SIZE - 1) neighbors.push(emptyIndex + 1);

      const validNeighbors = neighbors.filter((idx) => idx !== lastSwapped);
      const randomIndex = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];

      currentBoard[emptyIndex] = currentBoard[randomIndex];
      currentBoard[randomIndex] = 0;

      lastSwapped = emptyIndex;
      emptyIndex = randomIndex;
    }

    setBoard(currentBoard);
    setMoves(0);
    setIsWon(false);
    setResetKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Cek Kondisi Menang [1, 2, ..., 15, 0]
  const checkWin = (currentBoard: number[]) => {
    for (let i = 0; i < TOTAL_TILES - 1; i++) {
      if (currentBoard[i] !== i + 1) return false;
    }
    return currentBoard[TOTAL_TILES - 1] === 0;
  };

  // Handler Klik Ubin Langsung (Optimized & Clean State Update)
  const handleTileClick = (targetIndex: number) => {
    if (isWon || board.length === 0) return;

    const emptyIndex = board.indexOf(0);
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;
    const targetRow = Math.floor(targetIndex / GRID_SIZE);
    const targetCol = targetIndex % GRID_SIZE;

    const isAdjacent =
      (Math.abs(emptyRow - targetRow) === 1 && emptyCol === targetCol) ||
      (Math.abs(emptyCol - targetCol) === 1 && emptyRow === targetRow);

    if (!isAdjacent) return;

    const nextBoard = [...board];
    nextBoard[emptyIndex] = nextBoard[targetIndex];
    nextBoard[targetIndex] = 0;

    setBoard(nextBoard);
    setMoves((m) => m + 1);

    if (checkWin(nextBoard)) {
      setIsWon(true);
    }
  };

  // Handler Pergerakan Berdasarkan Arah (Keyboard & D-Pad)
  const handleDirectionMove = useCallback(
    (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (isWon || board.length === 0) return;

      const emptyIndex = board.indexOf(0);
      const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
      const emptyCol = emptyIndex % GRID_SIZE;

      let targetRow = emptyRow;
      let targetCol = emptyCol;

      if (dir === 'UP') targetRow = emptyRow + 1;
      else if (dir === 'DOWN') targetRow = emptyRow - 1;
      else if (dir === 'LEFT') targetCol = emptyCol + 1;
      else if (dir === 'RIGHT') targetCol = emptyCol - 1;

      if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) {
        return;
      }

      const targetIndex = targetRow * GRID_SIZE + targetCol;
      const nextBoard = [...board];
      nextBoard[emptyIndex] = nextBoard[targetIndex];
      nextBoard[targetIndex] = 0;

      setBoard(nextBoard);
      setMoves((m) => m + 1);

      if (checkWin(nextBoard)) {
        setIsWon(true);
      }
    },
    [board, isWon]
  );

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        handleDirectionMove('UP');
      } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        handleDirectionMove('DOWN');
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
        handleDirectionMove('LEFT');
      } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        handleDirectionMove('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirectionMove]);

  if (board.length === 0)
    return <div className="text-xs text-slate-400">Memuat puzzle...</div>;

  return (
    <GameShell
      title="Sliding Puzzle"
      gameId="sliding-puzzle"
      category="Spatial & Visual"
      difficulty="Medium"
      instructions="Klik ubin di samping ruang kosong atau gunakan tombol panah keyboard (WASD) untuk menggeser angka. Urutkan angka 1-15 hingga posisi kosong berada di pojok kanan bawah."
      moves={moves}
      isCompleted={isWon}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col items-center space-y-4">
        
        {/* BOARD 4x4 */}
        <div className="relative p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner w-[290px] h-[290px] sm:w-[330px] sm:h-[330px]">
          
          {/* BACKGROUND GRID (SLOT KOSONG) */}
          <div className="grid grid-cols-4 gap-2 w-full h-full">
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="bg-slate-200/70 dark:bg-slate-800/40 rounded-xl border border-slate-300/60 dark:border-slate-800/60" />
              ))}
          </div>

          {/* LAYER UBIN BERGERAK (SMOOTH SLIDING TRANSITION) */}
          <div className="absolute inset-3">
            {board.map((val, idx) => {
              if (val === 0) return null; // Kotak kosong tidak dirender

              const row = Math.floor(idx / GRID_SIZE);
              const col = idx % GRID_SIZE;

              return (
                <button
                  key={val}
                  disabled={isWon}
                  onClick={() => handleTileClick(idx)}
                  style={{
                    transform: `translate3d(calc(${col} * (100% + 0.5rem)), calc(${row} * (100% + 0.5rem)), 0)`,
                    willChange: 'transform',
                  }}
                  className="absolute top-0 left-0 w-[calc((100%-1.5rem)/4)] h-[calc((100%-1.5rem)/4)] rounded-xl font-black text-base sm:text-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-transform duration-150 ease-out cursor-pointer active:scale-95"
                >
                  {val}
                </button>
              );
            })}
          </div>

        </div>

        {/* KONTROL ARAH MOBILE */}
        <div className="sm:hidden flex flex-col items-center gap-1 pt-2">
          <button
            onClick={() => handleDirectionMove('UP')}
            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => handleDirectionMove('LEFT')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleDirectionMove('DOWN')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleDirectionMove('RIGHT')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 active:bg-blue-600 active:text-white transition shadow-xs cursor-pointer"
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