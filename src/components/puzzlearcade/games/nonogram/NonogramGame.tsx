'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameShell } from '../../GameShell';

interface NonogramProps {
  onBackToCatalog?: () => void;
}

// Preset Gambar Rahasia (1 = Hitam/Warna, 0 = Kosong)
const PRESET_PATTERNS = [
  {
    name: 'Hati (Heart)',
    solution: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    name: 'Pohon (Tree)',
    solution: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    name: 'Senyum (Smiley)',
    solution: [
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
  },
];

export default function NonogramGame({ onBackToCatalog }: NonogramProps) {
  const [patternIndex, setPatternIndex] = useState(0);
  const [userGrid, setUserGrid] = useState<number[][]>([]); // 0: Empty, 1: Filled, 2: Marked X
  const [mode, setMode] = useState<'FILL' | 'CROSS'>('FILL');
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const currentPattern = PRESET_PATTERNS[patternIndex];
  const solution = currentPattern.solution;
  const GRID_SIZE = solution.length;

  // Hitung Petunjuk Angka Baris & Kolom Secara Otomatis
  const generateHints = useCallback(() => {
    const rowHints: number[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const hint: number[] = [];
      let count = 0;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (solution[r][c] === 1) {
          count++;
        } else if (count > 0) {
          hint.push(count);
          count = 0;
        }
      }
      if (count > 0) hint.push(count);
      rowHints.push(hint.length > 0 ? hint : [0]);
    }

    const colHints: number[][] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const hint: number[] = [];
      let count = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (solution[r][c] === 1) {
          count++;
        } else if (count > 0) {
          hint.push(count);
          count = 0;
        }
      }
      if (count > 0) hint.push(count);
      colHints.push(hint.length > 0 ? hint : [0]);
    }

    return { rowHints, colHints };
  }, [solution, GRID_SIZE]);

  const { rowHints, colHints } = generateHints();

  // Inisialisasi Papan
  const initBoard = useCallback(() => {
    const emptyBoard = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0));
    setUserGrid(emptyBoard);
    setMoves(0);
    setIsWon(false);
    setResetKey((prev) => prev + 1);
  }, [GRID_SIZE]);

  useEffect(() => {
    initBoard();
  }, [initBoard, patternIndex]);

  // Cek Kondisi Menang
  const checkWin = (grid: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const isSolutionFilled = solution[r][c] === 1;
        const isUserFilled = grid[r][c] === 1;
        if (isSolutionFilled !== isUserFilled) {
          return false;
        }
      }
    }
    return true;
  };

  // Handler Klik Sel
  const handleCellClick = (r: number, c: number) => {
    if (isWon) return;

    const newGrid = userGrid.map((row) => [...row]);
    const currentVal = newGrid[r][c];

    if (mode === 'FILL') {
      newGrid[r][c] = currentVal === 1 ? 0 : 1;
    } else {
      newGrid[r][c] = currentVal === 2 ? 0 : 2;
    }

    setUserGrid(newGrid);
    setMoves((m) => m + 1);

    if (checkWin(newGrid)) {
      setIsWon(true);
    }
  };

  // Klik Kanan untuk Tandai Silang (X)
  const handleContextMenu = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isWon) return;

    const newGrid = userGrid.map((row) => [...row]);
    newGrid[r][c] = newGrid[r][c] === 2 ? 0 : 2;

    setUserGrid(newGrid);
    setMoves((m) => m + 1);

    if (checkWin(newGrid)) {
      setIsWon(true);
    }
  };

  if (userGrid.length === 0) return <div className="text-xs text-slate-400">Memuat Nonogram...</div>;

  return (
    <GameShell
      title="Nonogram (Picross)"
      gameId="nonogram"
      category="Spatial & Visual"
      difficulty="Medium"
      instructions="Hitamkan sel berdasarkan petunjuk angka di tepi baris dan kolom untuk mengungkap gambar rahasia. Angka menunjukkan urutan blok hitam berturut-turut. Gunakan klik kanan atau saklar Mode Silang (X) untuk menandai kotak kosong."
      moves={moves}
      isCompleted={isWon}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col items-center space-y-5 w-full">
        
        {/* GAMBAR PATTERN SELECTOR & TOGGLE MODE */}
        <div className="w-full flex flex-wrap justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Pola Gambar:</span>
            <select
              value={patternIndex}
              onChange={(e) => setPatternIndex(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-xs font-bold cursor-pointer"
            >
              {PRESET_PATTERNS.map((p, idx) => (
                <option key={p.name} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* SAKLAR MODE ISI / SILANG */}
          <div className="flex gap-1">
            <button
              onClick={() => setMode('FILL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'FILL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-2.5 h-2.5 bg-current rounded-xs" />
              <span>Isi Kotak</span>
            </button>
            <button
              onClick={() => setMode('CROSS')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'CROSS'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="font-mono text-xs">✕</span>
              <span>Tanda Silang (X)</span>
            </button>
          </div>
        </div>

        {/* ARENA NONOGRAM CANVAS */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center">
          
          <div className="grid grid-cols-[auto_1fr] gap-2">
            {/* SUDUT KIRI ATAS KOSONG */}
            <div className="w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center border-r border-b border-slate-300 dark:border-slate-800" />

            {/* PETUNJUK ANGKA KOLOM (ATAS) */}
            <div className="grid grid-cols-5 gap-1 text-[10px] sm:text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              {colHints.map((hints, cIdx) => (
                <div key={cIdx} className="w-9 h-12 sm:w-11 sm:h-16 flex flex-col items-center justify-end pb-1 border-b border-slate-300 dark:border-slate-800 gap-0.5">
                  {hints.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              ))}
            </div>

            {/* PETUNJUK ANGKA BARIS (KIRI) */}
            <div className="grid grid-rows-5 gap-1 text-[10px] sm:text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              {rowHints.map((hints, rIdx) => (
                <div key={rIdx} className="w-12 h-9 sm:w-16 sm:h-11 flex items-center justify-end pr-2 border-r border-slate-300 dark:border-slate-800 gap-1">
                  {hints.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              ))}
            </div>

            {/* GRID SEL UTAMA 5x5 */}
            <div className="grid grid-cols-5 gap-1">
              {userGrid.map((row, r) =>
                row.map((val, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleContextMenu(r, c, e)}
                    disabled={isWon}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-all duration-150 cursor-pointer ${
                      val === 1
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-100 scale-95 shadow-xs'
                        : val === 2
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-900/60'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    {val === 2 ? '✕' : ''}
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </GameShell>
  );
}