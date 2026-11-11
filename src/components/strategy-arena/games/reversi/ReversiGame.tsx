'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameBoardShell } from '../../GameBoardShell';
import { GameMode, AIDifficulty } from '@/lib/strategy-arena/types';

type Player = 1 | 2; // 1: Hitam (P1), 2: Putih (P2 / AI)
type BoardGrid = (Player | 0)[][];

const BOARD_SIZE = 8;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

// Tabel Nilai Bobot Posisi Papan (Sudut bernilai paling tinggi)
const POSITION_WEIGHTS = [
  [100, -20, 10,  5,  5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [ 10,  -2,  5,  1,  1,  5,  -2,  10],
  [  5,  -2,  1,  2,  2,  1,  -2,   5],
  [  5,  -2,  1,  2,  2,  1,  -2,   5],
  [ 10,  -2,  5,  1,  1,  5,  -2,  10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10,  5,  5, 10, -20, 100],
];

export default function ReversiGame({ onBackToCatalog }: { onBackToCatalog?: () => void }) {
  // Inisialisasi Papan Reversi (4 Bidak Awal di Tengah)
  const createInitialBoard = (): BoardGrid => {
    const b: BoardGrid = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0));
    b[3][3] = 2; b[3][4] = 1;
    b[4][3] = 1; b[4][4] = 2;
    return b;
  };

  const [board, setBoard] = useState<BoardGrid>(createInitialBoard);
  const [turn, setTurn] = useState<Player>(1);
  const [mode, setMode] = useState<GameMode>('VS_AI');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerText, setWinnerText] = useState<string | null>(null);

  // Cari keping lawan yang dapat dibalik jika meletakkan di (r, c)
  const getFlippablePieces = useCallback((b: BoardGrid, r: number, c: number, p: Player): [number, number][] => {
    if (b[r][c] !== 0) return [];
    const opponent: Player = p === 1 ? 2 : 1;
    const toFlip: [number, number][] = [];

    for (const [dr, dc] of DIRECTIONS) {
      let nr = r + dr;
      let nc = c + dc;
      const currentLine: [number, number][] = [];

      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === opponent) {
        currentLine.push([nr, nc]);
        nr += dr;
        nc += dc;
      }

      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === p && currentLine.length > 0) {
        toFlip.push(...currentLine);
      }
    }

    return toFlip;
  }, []);

  // Ambil seluruh langkah legal untuk pemain aktif
  const getValidMoves = useCallback((b: BoardGrid, p: Player): { r: number; c: number; flips: [number, number][] }[] => {
    const validMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const flips = getFlippablePieces(b, r, c, p);
        if (flips.length > 0) {
          validMoves.push({ r, c, flips });
        }
      }
    }
    return validMoves;
  }, [getFlippablePieces]);

  // Cek Kondisi Akhir Permainan
  const checkGameOver = useCallback((b: BoardGrid) => {
    const p1Moves = getValidMoves(b, 1);
    const p2Moves = getValidMoves(b, 2);

    if (p1Moves.length === 0 && p2Moves.length === 0) {
      setIsGameOver(true);
      let count1 = 0;
      let count2 = 0;

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (b[r][c] === 1) count1++;
          if (b[r][c] === 2) count2++;
        }
      }

      if (count1 > count2) {
        setWinnerText(`Hitam Menang! (${count1} vs ${count2})`);
      } else if (count2 > count1) {
        setWinnerText(`Putih Menang! (${count2} vs ${count1})`);
      } else {
        setWinnerText(`Seri! (${count1} vs ${count2})`);
      }
      return true;
    }
    return false;
  }, [getValidMoves]);

  // Eksekusi Langkah
  const makeMove = useCallback((r: number, c: number, p: Player, flips: [number, number][]) => {
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = p;
    flips.forEach(([fr, fc]) => {
      newBoard[fr][fc] = p;
    });

    setBoard(newBoard);

    if (!checkGameOver(newBoard)) {
      const nextPlayer: Player = p === 1 ? 2 : 1;
      const nextMoves = getValidMoves(newBoard, nextPlayer);
      if (nextMoves.length > 0) {
        setTurn(nextPlayer);
      } else {
        // Jika pemain berikutnya tidak memiliki langkah, giliran kembali
        setTurn(p);
      }
    }
  }, [board, checkGameOver, getValidMoves]);

  // AI Reversi (Heuristic Board Weighting)
  const getAIMove = useCallback((b: BoardGrid) => {
    const moves = getValidMoves(b, 2);
    if (moves.length === 0) return null;

    if (difficulty === 'EASY') {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    let bestScore = -9999;
    let bestMove = moves[0];

    for (const move of moves) {
      let score = POSITION_WEIGHTS[move.r][move.c] + move.flips.length * 2;
      if (difficulty === 'HARD') {
        // Pertimbangkan pengurangan mobilitas lawan
        score += move.flips.length * 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }, [difficulty, getValidMoves]);

  // Efek Giliran AI (Putih / 2)
  useEffect(() => {
    if (mode === 'VS_AI' && turn === 2 && !isGameOver) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board);
        if (aiMove) {
          makeMove(aiMove.r, aiMove.c, 2, aiMove.flips);
        } else {
          // Pass giliran ke Player 1 jika AI terdesak tidak punya langkah
          setTurn(1);
        }
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [board, mode, turn, isGameOver, getAIMove, makeMove]);

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver || (mode === 'VS_AI' && turn === 2)) return;
    const flips = getFlippablePieces(board, r, c, turn);
    if (flips.length > 0) {
      makeMove(r, c, turn, flips);
    }
  };

  const handleReset = () => {
    setBoard(createInitialBoard());
    setTurn(1);
    setIsGameOver(false);
    setWinnerText(null);
  };

  // Hitung Skor Real-time
  let count1 = 0;
  let count2 = 0;
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell === 1) count1++;
      if (cell === 2) count2++;
    })
  );

  const currentMoves = getValidMoves(board, turn);

  return (
    <GameBoardShell
      title="Reversi / Othello"
      category="Abstract Strategy"
      instructions="Jepit keping lawan secara vertikal, horizontal, atau diagonal untuk membaliknya menjadi warnamu. Pemain dengan keping terbanyak saat papan penuh memenangkan permainan."
      mode={mode}
      aiDifficulty={difficulty}
      currentTurnLabel={
        isGameOver
          ? 'Permainan Selesai'
          : mode === 'VS_AI' && turn === 2
          ? 'AI sedang memikirkan jebakan...'
          : `Giliran: Bidak ${turn === 1 ? 'Hitam' : 'Putih'}`
      }
      isGameOver={isGameOver}
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
      <div className="flex flex-col items-center gap-4">
        {/* HITUNG SKOR KEPING */}
        <div className="flex items-center gap-6 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 shadow-xs" />
            <span>Hitam: {count1}</span>
          </div>
          <span className="text-slate-400">vs</span>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-xs" />
            <span>Putih: {count2}</span>
          </div>
        </div>

        {/* PAPAN REVERSI 8x8 */}
        <div className="bg-emerald-700 p-2 sm:p-3 rounded-2xl border-4 border-emerald-800 shadow-2xl grid grid-rows-8 gap-1">
          {board.map((row, r) => (
            <div key={r} className="grid grid-cols-8 gap-1">
              {row.map((cell, c) => {
                const isValid = currentMoves.some((m) => m.r === r && m.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={isGameOver || (mode === 'VS_AI' && turn === 2)}
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-700/60 flex items-center justify-center transition-all cursor-pointer relative"
                  >
                    {/* Bidak Hitam */}
                    {cell === 1 && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700 shadow-md animate-in zoom-in-50 duration-200" />
                    )}

                    {/* Bidak Putih */}
                    {cell === 2 && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border border-slate-300 shadow-md animate-in zoom-in-50 duration-200" />
                    )}

                    {/* Indikator Langkah Sah */}
                    {isValid && cell === 0 && (
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-300/60 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </GameBoardShell>
  );
}