'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameShell } from '../../GameShell';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface MinesweeperProps {
  onBackToCatalog?: () => void;
}

export default function MinesweeperGame({ onBackToCatalog }: MinesweeperProps) {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'PLAYING' | 'WON' | 'LOST'>('IDLE');
  const [flagMode, setFlagMode] = useState(false); // Mode saklar bendera untuk mobile
  const [flagsCount, setFlagsCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Inisialisasi Papan Kosong
  const createEmptyBoard = (): Cell[][] => {
    return Array(ROWS)
      .fill(null)
      .map((_, r) =>
        Array(COLS)
          .fill(null)
          .map((_, c) => ({
            r,
            c,
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );
  };

  const initBoard = useCallback(() => {
    setBoard(createEmptyBoard());
    setMoves(0);
    setGameStatus('IDLE');
    setFlagsCount(0);
    setFlagMode(false);
    setResetKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Sebar Ranjau Setelah Klik Pertama (First Click Safety)
  const generateMines = (grid: Cell[][], firstR: number, firstC: number) => {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);

      // Jangan tempatkan ranjau di sel klik pertama atau sel yang sudah beranjau
      if (!grid[r][c].isMine && !(r === firstR && c === firstC)) {
        grid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Hitung Angka Tetangga
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].isMine) {
              count++;
            }
          }
        }
        grid[r][c].neighborMines = count;
      }
    }
  };

  // Algoritma Flood Fill Membuka Sel Kosong
  const revealCellRecursive = (grid: Cell[][], r: number, c: number) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cell = grid[r][c];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

    cell.isRevealed = true;

    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            revealCellRecursive(grid, r + dr, c + dc);
          }
        }
      }
    }
  };

  // Cek Kondisi Menang
  const checkWin = (grid: Cell[][]) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c].isMine && !grid[r][c].isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  // Handler Klik Kiri / Sentuh Sel
  const handleCellClick = (r: number, c: number) => {
    if (gameStatus === 'WON' || gameStatus === 'LOST') return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newBoard[r][c];

    // Jika mode bendera aktif (khusus sentuhan layar mobile)
    if (flagMode) {
      handleToggleFlag(r, c);
      return;
    }

    if (cell.isRevealed || cell.isFlagged) return;

    // Jika Klik Pertama
    let currentGrid = newBoard;
    if (gameStatus === 'IDLE') {
      generateMines(currentGrid, r, c);
      setGameStatus('PLAYING');
    }

    // Jika Mengenai Ranjau (Kalah)
    if (currentGrid[r][c].isMine) {
      // Buka seluruh ranjau
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (currentGrid[i][j].isMine) currentGrid[i][j].isRevealed = true;
        }
      }
      setBoard(currentGrid);
      setGameStatus('LOST');
      setMoves((m) => m + 1);
      return;
    }

    // Buka Sel
    revealCellRecursive(currentGrid, r, c);
    setBoard(currentGrid);
    setMoves((m) => m + 1);

    if (checkWin(currentGrid)) {
      setGameStatus('WON');
    }
  };

  // Handler Klik Kanan / Bendera
  const handleToggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameStatus === 'WON' || gameStatus === 'LOST') return;

    const cell = board[r][c];
    if (cell.isRevealed) return;

    const newBoard = board.map((row) => row.map((item) => ({ ...item })));
    const targetCell = newBoard[r][c];

    targetCell.isFlagged = !targetCell.isFlagged;
    setBoard(newBoard);
    setFlagsCount((prev) => (targetCell.isFlagged ? prev + 1 : prev - 1));
  };

  // Warna Teks Angka Tetangga (Light & Dark Compatible)
  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-blue-600 dark:text-blue-400';
      case 2: return 'text-emerald-600 dark:text-emerald-400';
      case 3: return 'text-red-600 dark:text-red-400';
      case 4: return 'text-indigo-600 dark:text-indigo-400';
      case 5: return 'text-amber-600 dark:text-amber-400';
      case 6: return 'text-teal-600 dark:text-teal-400';
      default: return 'text-purple-600 dark:text-purple-400';
    }
  };

  if (board.length === 0) return <div className="text-xs text-slate-400">Memuat puzzle...</div>;

  return (
    <GameShell
      title="Minesweeper"
      gameId="minesweeper"
      category="Logic"
      difficulty="Medium"
      instructions="Buka seluruh sel aman tanpa memicu ranjau. Angka pada sel menunjukkan jumlah ranjau di 8 kotak sekelilingnya. Gunakan klik kanan atau tombol Mode Bendera untuk menandai tempat ranjau."
      moves={moves}
      isCompleted={gameStatus === 'WON'}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col items-center space-y-4">
        
        {/* BAR MONITOR SISA BENDERA & TOGGLE MODE BENDERA */}
        <div className="w-full flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
            </svg>
            <span>Sisa Ranjau: <span className="font-mono text-slate-900 dark:text-white">{MINES - flagsCount}</span></span>
          </div>

          {/* Tombol Saklar Pasang Bendera (SVG Only) */}
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
              flagMode
                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-bold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
            </svg>
            <span>{flagMode ? 'Mode Bendera [Aktif]' : 'Mode Bendera'}</span>
          </button>
        </div>

        {/* BOARD 9x9 CONTAINER */}
        <div className="relative p-2.5 sm:p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner grid grid-cols-9 gap-1 sm:gap-1.5">
          {board.map((row, r) =>
            row.map((cell, c) => {
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleToggleFlag(r, c, e)}
                  disabled={gameStatus === 'LOST' || gameStatus === 'WON'}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center transition-all duration-100 cursor-pointer ${
                    cell.isRevealed
                      ? cell.isMine
                        ? 'bg-red-500 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800'
                      : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300/70 dark:border-slate-700/60 active:scale-95'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      /* Ikon Vektor Ranjau (Bomb SVG) */
                      <svg className="w-4 h-4 text-white animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="7" />
                        <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="2" />
                        <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
                        <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" />
                        <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    ) : cell.neighborMines > 0 ? (
                      <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                    ) : null
                  ) : cell.isFlagged ? (
                    /* Ikon Vektor Bendera (Flag SVG) */
                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
                    </svg>
                  ) : null}
                </button>
              );
            })
          )}

          {/* OVERLAY GAME OVER (KALAH) */}
          {gameStatus === 'LOST' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-3 z-10 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Permainan Selesai</span>
              <h3 className="text-lg font-black text-white">Kamu Pemicu Ranjau!</h3>
              <button
                onClick={initBoard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

      </div>
    </GameShell>
  );
}