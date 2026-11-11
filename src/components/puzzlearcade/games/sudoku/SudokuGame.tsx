'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameShell } from '../../GameShell';

interface SudokuProps {
  onBackToCatalog?: () => void;
}

// Preset papan Sudoku berdasarkan tingkat kesulitan
const PRESET_PUZZLES: Record<string, { initial: number[][]; solution: number[][] }> = {
  Easy: {
    initial: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  Medium: {
    initial: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9],
    ],
  },
  Hard: {
    initial: [
      [0, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 6, 0, 0, 0, 0, 3],
      [0, 7, 4, 0, 8, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 3, 0, 0, 2],
      [0, 8, 0, 0, 4, 0, 0, 1, 0],
      [6, 0, 0, 5, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 7, 8, 0],
      [5, 0, 0, 0, 0, 9, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 4, 0],
    ],
    solution: [
      [1, 2, 6, 4, 3, 7, 9, 5, 8],
      [8, 9, 5, 6, 2, 1, 4, 7, 3],
      [3, 7, 4, 9, 8, 5, 1, 2, 6],
      [4, 5, 7, 1, 9, 3, 8, 6, 2],
      [9, 8, 3, 2, 4, 6, 5, 1, 7],
      [6, 1, 2, 5, 7, 8, 3, 9, 4],
      [2, 4, 9, 3, 1, 4, 7, 8, 5],
      [5, 3, 8, 7, 6, 9, 2, 4, 1],
      [7, 6, 1, 8, 5, 2, 3, 4, 9],
    ],
  },
};

export default function SudokuGame({ onBackToCatalog }: SudokuProps) {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [grid, setGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Inisialisasi Papan
  const initBoard = useCallback(() => {
    const puzzle = PRESET_PUZZLES[difficulty];
    const deepCopy = puzzle.initial.map((row) => [...row]);
    setGrid(deepCopy);
    setSelectedCell(null);
    setMoves(0);
    setIsWon(false);
    setResetKey((prev) => prev + 1);
  }, [difficulty]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Cek Apakah Angka Mengalami Konflik (Duplikat di Baris/Kolom/Blok 3x3)
  const isConflict = (r: number, c: number, val: number) => {
    if (val === 0) return false;

    // Cek Baris & Kolom
    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === val) return true;
      if (i !== r && grid[i][c] === val) return true;
    }

    // Cek Subgrid 3x3
    const startR = Math.floor(r / 3) * 3;
    const startC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const currR = startR + i;
        const currC = startC + j;
        if ((currR !== r || currC !== c) && grid[currR][currC] === val) {
          return true;
        }
      }
    }

    return false;
  };

  // Cek Kondisi Menang Full & Bebas Konflik
  const checkWin = (currentGrid: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentGrid[r][c];
        if (val === 0 || isConflict(r, c, val)) {
          return false;
        }
      }
    }
    return true;
  };

  // Input Nilai ke Sel Terpilih
  const handleInputNumber = useCallback(
    (num: number) => {
      if (!selectedCell || isWon) return;

      const [r, c] = selectedCell;
      const initialVal = PRESET_PUZZLES[difficulty].initial[r][c];

      // Sel bawaan puzzle tidak dapat diubah
      if (initialVal !== 0) return;

      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = num;

      setGrid(newGrid);
      setMoves((m) => m + 1);

      if (checkWin(newGrid)) {
        setIsWon(true);
      }
    },
    [selectedCell, isWon, difficulty, grid]
  );

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const keyNum = parseInt(e.key, 10);

      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        handleInputNumber(keyNum);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleInputNumber(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleInputNumber]);

  if (grid.length === 0) return <div className="text-xs text-slate-400">Memuat Sudoku...</div>;

  return (
    <GameShell
      title="Sudoku"
      gameId="sudoku"
      category="Logic"
      difficulty={difficulty}
      instructions="Isi seluruh grid 9x9 dengan angka 1-9 tanpa ada duplikasi angka pada setiap baris, kolom, maupun area blok 3x3. Klik sel dan gunakan numpad di layar atau keyboard untuk memasukkan angka."
      moves={moves}
      isCompleted={isWon}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col items-center space-y-5 w-full">
        
        {/* SELECTOR TINGKAT KESULITAN */}
        <div className="w-full flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
          <span className="text-slate-500">Tingkat Kesulitan:</span>
          <div className="flex gap-1">
            {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  difficulty === level
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* BOARD 9x9 CONTAINER */}
        <div className="p-2 sm:p-3 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-9 w-[310px] h-[310px] sm:w-[370px] sm:h-[370px]">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isInitial = PRESET_PUZZLES[difficulty].initial[r][c] !== 0;
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasConflict = isConflict(r, c, val);

              // Penentuan tebal border untuk grid 3x3
              const borderRightClass = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-slate-400 dark:border-r-slate-600' : 'border-r border-r-slate-200/40 dark:border-r-slate-800/80';
              const borderBottomClass = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-slate-400 dark:border-b-slate-600' : 'border-b border-b-slate-200/40 dark:border-b-slate-800/80';

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setSelectedCell([r, c])}
                  className={`w-full h-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-100 cursor-pointer ${borderRightClass} ${borderBottomClass} ${
                    isSelected
                      ? 'bg-blue-500 text-white z-10 scale-105 rounded-md shadow-md'
                      : hasConflict
                      ? 'bg-red-500/30 text-red-400 font-black'
                      : isInitial
                      ? 'bg-slate-200 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-black'
                      : val !== 0
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold'
                      : 'bg-white/80 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {val !== 0 ? val : ''}
                </button>
              );
            })
          )}
        </div>

        {/* NUMPAD CONTROL UNTUK MOBILE & DESKTOP */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleInputNumber(num)}
              className="w-8 h-9 sm:w-9 sm:h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-xs sm:text-sm hover:border-blue-500 active:bg-blue-600 active:text-white transition shadow-xs cursor-pointer flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleInputNumber(0)}
            className="px-2.5 h-9 sm:h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 transition shadow-xs cursor-pointer flex items-center justify-center"
          >
            Hapus
          </button>
        </div>

      </div>
    </GameShell>
  );
}