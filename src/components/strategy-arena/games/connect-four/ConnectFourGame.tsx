'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameBoardShell } from '../../GameBoardShell';
import { GameMode, AIDifficulty } from '@/lib/strategy-arena/types';

const ROWS = 6;
const COLS = 7;
type Player = 1 | 2; // 1: Red (X), 2: Yellow (O/AI)
type BoardGrid = (Player | 0)[][];

export default function ConnectFourGame({ onBackToCatalog }: { onBackToCatalog?: () => void }) {
  const [board, setBoard] = useState<BoardGrid>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
  );
  const [turn, setTurn] = useState<Player>(1);
  const [mode, setMode] = useState<GameMode>('VS_AI');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);

  // Validasi Kemenangan 4 Berturut-turut
  const checkWin = useCallback((b: BoardGrid): Player | 'DRAW' | null => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = b[r][c];
        if (val !== 0 && val === b[r][c + 1] && val === b[r][c + 2] && val === b[r][c + 3]) {
          return val;
        }
      }
    }
    // Vertikal
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = b[r][c];
        if (val !== 0 && val === b[r + 1][c] && val === b[r + 2][c] && val === b[r + 3][c]) {
          return val;
        }
      }
    }
    // Diagonal Positif
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = b[r][c];
        if (val !== 0 && val === b[r + 1][c + 1] && val === b[r + 2][c + 2] && val === b[r + 3][c + 3]) {
          return val;
        }
      }
    }
    // Diagonal Negatif
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = b[r][c];
        if (val !== 0 && val === b[r - 1][c + 1] && val === b[r - 2][c + 2] && val === b[r - 3][c + 3]) {
          return val;
        }
      }
    }
    // Cek Penuh (Seri)
    if (b.every((row) => row.every((cell) => cell !== 0))) {
      return 'DRAW';
    }
    return null;
  }, []);

  // Jatuhkan Keping ke Kolom
  const dropPiece = (b: BoardGrid, col: number, player: Player): BoardGrid | null => {
    const newBoard = b.map((row) => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === 0) {
        newBoard[r][col] = player;
        return newBoard;
      }
    }
    return null; // Kolom penuh
  };

  // AI Connect Four (Evaluasi Sederhana / Minimax)
  const getAIMove = useCallback((b: BoardGrid): number => {
    const validCols: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (b[0][c] === 0) validCols.push(c);
    }
    if (validCols.length === 0) return -1;

    // 1. Cek apakah AI (Player 2) bisa langsung menang
    for (const c of validCols) {
      const nextB = dropPiece(b, c, 2);
      if (nextB && checkWin(nextB) === 2) return c;
    }

    // 2. Cek apakah harus memblokir Player 1
    for (const c of validCols) {
      const nextB = dropPiece(b, c, 1);
      if (nextB && checkWin(nextB) === 1) return c;
    }

    if (difficulty === 'EASY') {
      return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // Prioritaskan Kolom Tengah (Strategi Heuristik)
    const preferredCols = [3, 2, 4, 1, 5, 0, 6];
    for (const c of preferredCols) {
      if (validCols.includes(c)) return c;
    }

    return validCols[0];
  }, [difficulty, checkWin]);

  const handleSelectColumn = (col: number) => {
    if (winner || (mode === 'VS_AI' && turn === 2)) return;

    const newBoard = dropPiece(board, col, turn);
    if (!newBoard) return;

    setBoard(newBoard);
    const result = checkWin(newBoard);
    if (result) {
      setWinner(result);
    } else {
      setTurn(turn === 1 ? 2 : 1);
    }
  };

  // Efek Giliran AI
  useEffect(() => {
    if (mode === 'VS_AI' && turn === 2 && !winner) {
      const timer = setTimeout(() => {
        const col = getAIMove(board);
        if (col !== -1) {
          const newBoard = dropPiece(board, col, 2);
          if (newBoard) {
            setBoard(newBoard);
            const result = checkWin(newBoard);
            if (result) {
              setWinner(result);
            } else {
              setTurn(1);
            }
          }
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [board, mode, turn, winner, getAIMove, checkWin]);

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
    setTurn(1);
    setWinner(null);
  };

  const currentTurnLabel = winner
    ? 'Permainan Selesai'
    : mode === 'VS_AI' && turn === 2
    ? 'AI sedang berpikir...'
    : `Giliran: Pemain ${turn === 1 ? 'Merah (P1)' : 'Kuning (P2)'}`;

  const winnerText =
    winner === 'DRAW'
      ? 'Hasil Seri!'
      : winner
      ? `Pemain ${winner === 1 ? 'Merah' : 'Kuning'} Menang!`
      : null;

  return (
    <GameBoardShell
      title="Connect Four"
      category="Territory & Connection"
      instructions="Jatuhkan keping ke dalam kolom untuk menyusun 4 keping bergandengan secara vertikal, horizontal, atau diagonal."
      mode={mode}
      aiDifficulty={difficulty}
      currentTurnLabel={currentTurnLabel}
      isGameOver={winner !== null}
      winnerText={winnerText}
      onModeChange={(m) => {
        setMode(m);
        resetGame();
      }}
      onDifficultyChange={(d) => {
        setDifficulty(d);
        resetGame();
      }}
      onReset={resetGame}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col gap-2">
        {/* TOMBOL PENJATUH KOLOM */}
        <div className="grid grid-cols-7 gap-2 px-2">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              onClick={() => handleSelectColumn(c)}
              disabled={winner !== null || (mode === 'VS_AI' && turn === 2) || board[0][c] !== 0}
              className="py-1 text-xs font-bold text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ▼
            </button>
          ))}
        </div>

        {/* GRID PAPAN 6x7 */}
        <div className="bg-blue-600 p-3 sm:p-4 rounded-2xl border-4 border-blue-700 shadow-inner grid grid-rows-6 gap-2">
          {board.map((row, r) => (
            <div key={r} className="grid grid-cols-7 gap-2">
              {row.map((cell, c) => (
                <div
                  key={c}
                  onClick={() => handleSelectColumn(c)}
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-900/40 border-2 border-blue-800 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {cell === 1 && (
                    <div className="w-full h-full bg-red-500 border-2 border-red-600 rounded-full shadow-inner animate-in zoom-in-50 duration-150" />
                  )}
                  {cell === 2 && (
                    <div className="w-full h-full bg-amber-400 border-2 border-amber-500 rounded-full shadow-inner animate-in zoom-in-50 duration-150" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </GameBoardShell>
  );
}