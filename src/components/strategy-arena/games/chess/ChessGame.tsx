'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { GameBoardShell } from '../../GameBoardShell';
import { GameMode, AIDifficulty } from '@/lib/strategy-arena/types';

// Simbol Bidak Catur Unicode
const PIECE_SYMBOLS: Record<string, string> = {
  w_p: '♙', w_r: '♖', w_n: '♘', w_b: '♗', w_q: '♕', w_k: '♔',
  b_p: '♟', b_r: '♜', b_n: '♞', b_b: '♝', b_q: '♛', b_k: '♚',
};

// Nilai Material Bidak untuk Evaluasi AI
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

export default function ChessGame({ onBackToCatalog }: { onBackToCatalog?: () => void }) {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [mode, setMode] = useState<GameMode>('VS_AI');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [turn, setTurn] = useState<Color>('w');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerText, setWinnerText] = useState<string | null>(null);

  // Perbarui status permainan
  const updateGameState = useCallback((g: Chess) => {
    setTurn(g.turn());
    if (g.isGameOver()) {
      setIsGameOver(true);
      if (g.isCheckmate()) {
        const winner = g.turn() === 'w' ? 'Hitam (B2)' : 'Putih (P1)';
        setWinnerText(`Skakmat! Pemain ${winner} Menang!`);
      } else if (g.isDraw()) {
        setWinnerText('Permainan Seri (Draw)!');
      }
    }
  }, []);

  // Evaluasi Posisi Papan untuk AI (Heuristic Material)
  const evaluateBoard = (g: Chess): number => {
    let totalEvaluation = 0;
    const board = g.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type];
          totalEvaluation += piece.color === 'b' ? val : -val;
        }
      }
    }
    return totalEvaluation;
  };

  // Minimax dengan Alpha-Beta Pruning untuk AI Catur
  const minimax = (
    g: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number => {
    if (depth === 0 || g.isGameOver()) {
      return evaluateBoard(g);
    }

    const moves = g.moves({ verbose: true });

    if (isMaximizing) {
      let maxEval = -9999;
      for (const move of moves) {
        g.move(move);
        const evalVal = minimax(g, depth - 1, alpha, beta, false);
        g.undo();
        maxEval = Math.max(maxEval, evalVal);
        alpha = Math.max(alpha, evalVal);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = 9999;
      for (const move of moves) {
        g.move(move);
        const evalVal = minimax(g, depth - 1, alpha, beta, true);
        g.undo();
        minEval = Math.min(minEval, evalVal);
        beta = Math.min(beta, evalVal);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  // Logika AI Catur
  const makeAIMove = useCallback(() => {
    if (game.isGameOver()) return;

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    let selectedMove = moves[0];

    if (difficulty === 'EASY') {
      // Langkah acak
      selectedMove = moves[Math.floor(Math.random() * moves.length)];
    } else {
      // Minimax Search Depth (Medium = depth 2, Hard = depth 3)
      const depth = difficulty === 'MEDIUM' ? 2 : 3;
      let bestValue = -9999;

      for (const move of moves) {
        game.move(move);
        const boardValue = minimax(game, depth - 1, -10000, 10000, false);
        game.undo();

        if (boardValue > bestValue) {
          bestValue = boardValue;
          selectedMove = move;
        }
      }
    }

    const newGame = new Chess(game.fen());
    newGame.move(selectedMove);
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    updateGameState(newGame);
  }, [game, difficulty, updateGameState]);

  // Efek Giliran AI (Hitam / 'b')
  useEffect(() => {
    if (mode === 'VS_AI' && turn === 'b' && !isGameOver) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [turn, mode, isGameOver, makeAIMove]);

  // Handler Klik Petak
  const handleSquareClick = (square: Square) => {
    if (isGameOver || (mode === 'VS_AI' && turn === 'b')) return;

    // 1. Jika sudah memilih petak asal dan memilih petak tujuan yang valid
    if (selectedSquare && possibleMoves.includes(square)) {
      const newGame = new Chess(game.fen());
      try {
        newGame.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // otomatis promosi ke Queen
        });
        setGame(newGame);
        setSelectedSquare(null);
        setPossibleMoves([]);
        updateGameState(newGame);
        return;
      } catch {
        // Abaikan jika eksekusi gagal
      }
    }

    // 2. Pilih bidak baru
    const piece = game.get(square);
    if (piece && piece.color === turn) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handleReset = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsGameOver(false);
    setWinnerText(null);
    setTurn('w');
  };

  const currentTurnLabel = isGameOver
    ? 'Permainan Selesai'
    : mode === 'VS_AI' && turn === 'b'
    ? 'AI sedang memikirkan taktik...'
    : `Giliran: Bidak ${turn === 'w' ? 'Putih (P1)' : 'Hitam (P2)'}${
        game.inCheck() ? ' — SKAK!' : ''
      }`;

  const boardArray = game.board();

  return (
    <GameBoardShell
      title="Chess (Catur)"
      category="Abstract Strategy"
      instructions="Lindungi Raja dan matikan Raja lawan melalui skakmat. Klik bidak milikmu untuk melihat opsi langkah yang tersedia."
      mode={mode}
      aiDifficulty={difficulty}
      currentTurnLabel={currentTurnLabel}
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
      {/* PAPAN CATUR 8x8 */}
      <div className="border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-800">
        <div className="grid grid-rows-8 w-72 h-72 sm:w-96 sm:h-96">
          {boardArray.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-8">
              {row.map((cell, cIdx) => {
                const squareName = `${String.fromCharCode(97 + cIdx)}${
                  8 - rIdx
                }` as Square;
                const isDark = (rIdx + cIdx) % 2 === 1;
                const isSelected = selectedSquare === squareName;
                const isPossibleMove = possibleMoves.includes(squareName);

                let bgClass = isDark
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-amber-100 text-amber-950';

                if (isSelected) {
                  bgClass = 'bg-yellow-400 text-slate-900 font-bold';
                }

                return (
                  <button
                    key={squareName}
                    onClick={() => handleSquareClick(squareName)}
                    className={`relative flex items-center justify-center text-2xl sm:text-4xl transition-all cursor-pointer font-serif select-none ${bgClass}`}
                  >
                    {/* Render Bidak */}
                    {cell && (
                      <span className={cell.color === 'w' ? 'drop-shadow-sm' : 'drop-shadow-md'}>
                        {PIECE_SYMBOLS[`${cell.color}_${cell.type}`]}
                      </span>
                    )}

                    {/* Indikator Pilihan Langkah Legitim */}
                    {isPossibleMove && (
                      <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/80 border-2 border-white shadow-xs" />
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