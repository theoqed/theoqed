'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameBoardShell } from '../../GameBoardShell';
import { GameMode, AIDifficulty, PlayerMark } from '@/lib/strategy-arena/types';

type BoardState = Array<PlayerMark | null>;

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Baris
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Kolom
  [0, 4, 8], [2, 4, 6],          // Diagonal
];

export default function TicTacToeGame({ onBackToCatalog }: { onBackToCatalog?: () => void }) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [turn, setTurn] = useState<PlayerMark>('X');
  const [mode, setMode] = useState<GameMode>('VS_AI');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('HARD');
  const [winner, setWinner] = useState<PlayerMark | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // Evaluasi Kemenangan
  const checkWinner = (b: BoardState) => {
    for (const combo of WINNING_COMBOS) {
      const [a, c, d] = combo;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], line: combo };
      }
    }
    if (b.every((cell) => cell !== null)) {
      return { winner: 'DRAW' as const, line: null };
    }
    return null;
  };

  // Minimax AI Algorithm
  const minimax = (b: BoardState, depth: number, isMax: boolean): number => {
    const result = checkWinner(b);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      if (result.winner === 'DRAW') return 0;
    }

    if (isMax) {
      let best = -1000;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'O';
          best = Math.max(best, minimax(b, depth + 1, false));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = 1000;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'X';
          best = Math.min(best, minimax(b, depth + 1, true));
          b[i] = null;
        }
      }
      return best;
    }
  };

  // AI Langkah
  const getAIMove = useCallback(
    (currentBoard: BoardState): number => {
      const emptyIndices = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return -1;

      // Easy: Langkah Acak
      if (difficulty === 'EASY') {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }

      // Medium: 50% Minimax / 50% Acak
      if (difficulty === 'MEDIUM' && Math.random() > 0.5) {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }

      // Hard: Minimax Sempurna
      let bestVal = -1000;
      let bestMove = emptyIndices[0];

      for (const idx of emptyIndices) {
        currentBoard[idx] = 'O';
        const moveVal = minimax(currentBoard, 0, false);
        currentBoard[idx] = null;

        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = idx;
        }
      }

      return bestMove;
    },
    [difficulty]
  );

  const handleClickCell = (idx: number) => {
    if (board[idx] || winner || (mode === 'VS_AI' && turn === 'O')) return;

    const newBoard = [...board];
    newBoard[idx] = turn;
    setBoard(newBoard);

    const res = checkWinner(newBoard);
    if (res) {
      setWinner(res.winner);
      setWinningLine(res.line);
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  // Efek Giliran AI
  useEffect(() => {
    if (mode === 'VS_AI' && turn === 'O' && !winner) {
      const timer = setTimeout(() => {
        const aiIdx = getAIMove(board);
        if (aiIdx !== -1) {
          const newBoard = [...board];
          newBoard[aiIdx] = 'O';
          setBoard(newBoard);

          const res = checkWinner(newBoard);
          if (res) {
            setWinner(res.winner);
            setWinningLine(res.line);
          } else {
            setTurn('X');
          }
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [board, mode, turn, winner, getAIMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
  };

  const currentTurnLabel = winner
    ? 'Permainan Selesai'
    : mode === 'VS_AI' && turn === 'O'
    ? 'AI sedang berpikir...'
    : `Giliran: Pemain ${turn}`;

  const winnerText =
    winner === 'DRAW'
      ? 'Hasil Seri!'
      : winner
      ? `Pemain ${winner} Menang!`
      : null;

  return (
    <GameBoardShell
      title="Tic-Tac-Toe"
      category="Abstract Strategy"
      instructions="Susun 3 tanda sejajar secara horizontal, vertikal, atau diagonal untuk memenangkan pertandingan."
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
      <div className="grid grid-cols-3 gap-3 w-64 h-64">
        {board.map((cell, idx) => {
          const isHighlight = winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleClickCell(idx)}
              className={`w-full h-full rounded-2xl border-2 font-black text-3xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isHighlight
                  ? 'bg-emerald-500 border-emerald-600 text-white scale-105 shadow-md'
                  : cell === 'X'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-600 dark:text-blue-400'
                  : cell === 'O'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </GameBoardShell>
  );
}