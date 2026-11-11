'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameBoardShell } from '../../GameBoardShell';
import { GameMode, AIDifficulty } from '@/lib/strategy-arena/types';

type Player = 1 | 2; // 1: Hitam (P1), 2: Putih (P2 / AI)
type BoardGrid = (Player | 0)[][];

const GRID_SIZE = 12;

export default function GomokuGame({ onBackToCatalog }: { onBackToCatalog?: () => void }) {
  const [board, setBoard] = useState<BoardGrid>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [turn, setTurn] = useState<Player>(1);
  const [mode, setMode] = useState<GameMode>('VS_AI');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);

  // Evaluasi Kemenangan 5 Batu Segaris
  const checkWin = useCallback((b: BoardGrid, r: number, c: number, p: Player): boolean => {
    const directions = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertikal
      [1, 1],  // Diagonal Kanan-Bawah
      [1, -1], // Diagonal Kiri-Bawah
    ];

    for (const [dr, dc] of directions) {
      let count = 1;

      // Cek Arah Positif
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && b[nr][nc] === p) {
        count++;
        nr += dr;
        nc += dc;
      }

      // Cek Arah Negatif
      nr = r - dr;
      nc = c - dc;
      while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && b[nr][nc] === p) {
        count++;
        nr -= dr;
        nc -= dc;
      }

      if (count >= 5) return true;
    }

    return false;
  }, []);

  // AI Gomoku (Pattern Matching)
  const getAIMove = useCallback((b: BoardGrid): [number, number] | null => {
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length === 0) return null;

    // 1. Cek apakah AI (2) bisa langsung menang (5 segaris)
    for (const [r, c] of emptyCells) {
      b[r][c] = 2;
      if (checkWin(b, r, c, 2)) {
        b[r][c] = 0;
        return [r, c];
      }
      b[r][c] = 0;
    }

    // 2. Blokir pemain (1) jika akan menang di langkah berikutnya
    for (const [r, c] of emptyCells) {
      b[r][c] = 1;
      if (checkWin(b, r, c, 1)) {
        b[r][c] = 0;
        return [r, c];
      }
      b[r][c] = 0;
    }

    if (difficulty === 'EASY') {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // 3. Pilih posisi di dekat keping yang sudah ada
    const activeNeighbors: [number, number][] = [];
    for (const [r, c] of emptyCells) {
      let hasNeighbor = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && b[nr][nc] !== 0) {
            hasNeighbor = true;
            break;
          }
        }
        if (hasNeighbor) break;
      }
      if (hasNeighbor) activeNeighbors.push([r, c]);
    }

    if (activeNeighbors.length > 0) {
      return activeNeighbors[Math.floor(Math.random() * activeNeighbors.length)];
    }

    return [Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2)];
  }, [difficulty, checkWin]);

  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] !== 0 || winner || (mode === 'VS_AI' && turn === 2)) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = turn;
    setBoard(newBoard);

    if (checkWin(newBoard, r, c, turn)) {
      setWinner(turn);
    } else if (newBoard.every((row) => row.every((cell) => cell !== 0))) {
      setWinner('DRAW');
    } else {
      setTurn(turn === 1 ? 2 : 1);
    }
  };

  // Efek Giliran AI
  useEffect(() => {
    if (mode === 'VS_AI' && turn === 2 && !winner) {
      const timer = setTimeout(() => {
        const move = getAIMove(board);
        if (move) {
          const [r, c] = move;
          const newBoard = board.map((row) => [...row]);
          newBoard[r][c] = 2;
          setBoard(newBoard);

          if (checkWin(newBoard, r, c, 2)) {
            setWinner(2);
          } else if (newBoard.every((row) => row.every((cell) => cell !== 0))) {
            setWinner('DRAW');
          } else {
            setTurn(1);
          }
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [board, mode, turn, winner, getAIMove, checkWin]);

  const handleReset = () => {
    setBoard(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
    setTurn(1);
    setWinner(null);
  };

  const currentTurnLabel = winner
    ? 'Permainan Selesai'
    : mode === 'VS_AI' && turn === 2
    ? 'AI sedang berpikir...'
    : `Giliran: Batu ${turn === 1 ? 'Hitam (P1)' : 'Putih (P2)'}`;

  const winnerText =
    winner === 'DRAW'
      ? 'Hasil Seri!'
      : winner
      ? `Batu ${winner === 1 ? 'Hitam' : 'Putih'} Menang!`
      : null;

  return (
    <GameBoardShell
      title="Gomoku (Five in a Row)"
      category="Territory & Connection"
      instructions="Susun 5 batu sewarna segaris secara vertikal, horizontal, atau diagonal pada grid terbuka untuk memenangkan permainan."
      mode={mode}
      aiDifficulty={difficulty}
      currentTurnLabel={currentTurnLabel}
      isGameOver={winner !== null}
      winnerText={winnerText}
      onModeChange={(m) => {
        setMode(m);
        handleReset();
      }}
      onDifficultyChange={(d) => {
        setDifficulty(d);
        handleReset();
      }}
      onReset={handleReset}
      onBackToCatalog={onBackToCatalog}
    >
      {/* PAPAN GOMOKU 12x12 */}
      <div className="bg-amber-100 dark:bg-amber-950 p-2 sm:p-3 rounded-2xl border-4 border-amber-900 shadow-2xl grid grid-rows-12 gap-1">
        {board.map((row, r) => (
          <div key={r} className="grid grid-cols-12 gap-1">
            {row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={winner !== null || (mode === 'VS_AI' && turn === 2)}
                className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-amber-200/60 dark:bg-amber-900/40 hover:bg-amber-300 border border-amber-400/40 flex items-center justify-center transition-all cursor-pointer relative"
              >
                {cell === 1 && (
                  <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-slate-900 border border-slate-700 shadow-md animate-in zoom-in-50 duration-150" />
                )}
                {cell === 2 && (
                  <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white border border-slate-300 shadow-md animate-in zoom-in-50 duration-150" />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </GameBoardShell>
  );
}