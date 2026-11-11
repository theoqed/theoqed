'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameShell } from '../../GameShell';

interface WordleProps {
  onBackToCatalog?: () => void;
}

// Target kata rahasia bahasa Inggris 5 huruf
const TARGET_WORDS = [
  'APPLE', 'BRAIN', 'CLOUD', 'DRIVE', 'EARTH',
  'FLAME', 'GRACE', 'HOUSE', 'IMAGE', 'LIGHT',
  'MUSIC', 'NIGHT', 'PLANT', 'RIGHT', 'SMART',
  'TRAIN', 'WATER', 'YOUTH', 'SOLVE', 'LOGIC',
  'SHAPE', 'PRIME', 'ANGLE', 'POINT', 'GRAPH'
];

// Memory Cache lokal di browser (RAM)
const validWordCache = new Set<string>();

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

type Status = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY';

export default function WordleGame({ onBackToCatalog }: WordleProps) {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [moves, setMoves] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Inisialisasi Papan Permainan
  const initBoard = useCallback(() => {
    const randomWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('PLAYING');
    setErrorMessage('');
    setIsValidating(false);
    setMoves(0);
    setResetKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Evaluasi Warna Huruf (Green/Yellow/Gray)
  const getLetterStatus = (guess: string, index: number): Status => {
    const char = guess[index];
    if (char === targetWord[index]) return 'CORRECT';

    let targetCount = 0;
    let guessCountBefore = 0;

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (targetWord[i] === char && guess[i] !== char) {
        targetCount++;
      }
    }

    for (let i = 0; i <= index; i++) {
      if (guess[i] === char && targetWord[i] !== char) {
        guessCountBefore++;
      }
    }

    if (targetWord.includes(char) && guessCountBefore <= targetCount) {
      return 'PRESENT';
    }

    return 'ABSENT';
  };

  // Submit Tebakan dengan Validasi API + Cache RAM
  const handleSubmitGuess = useCallback(async () => {
    if (gameStatus !== 'PLAYING' || isValidating) return;

    if (currentGuess.length !== WORD_LENGTH) {
      setErrorMessage('Panjang kata harus 5 huruf!');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    const guessUpper = currentGuess.toUpperCase();
    const guessLower = currentGuess.toLowerCase();

    // 1. Cek dari target list atau cache RAM lokal
    let isValid = TARGET_WORDS.includes(guessUpper) || validWordCache.has(guessUpper);

    // 2. Jika belum ada di cache, verifikasi ke Free Dictionary API
    if (!isValid) {
      setIsValidating(true);
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guessLower}`);
        if (res.ok) {
          isValid = true;
          validWordCache.add(guessUpper); // Simpan ke RAM agar cek berikutnya instan
        }
      } catch {
        // Fallback: Jika offline / API bermasalah, tetap loloskan kata 5 huruf
        isValid = true;
      } finally {
        setIsValidating(false);
      }
    }

    if (!isValid) {
      setErrorMessage('Kata tidak ditemukan dalam kamus!');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    const newGuesses = [...guesses, guessUpper];
    setGuesses(newGuesses);
    setMoves((m) => m + 1);
    setCurrentGuess('');
    setErrorMessage('');

    if (guessUpper === targetWord) {
      setGameStatus('WON');
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameStatus('LOST');
    }
  }, [currentGuess, gameStatus, guesses, isValidating, targetWord]);

  // Input Huruf atau Hapus
  const handleInputChar = useCallback(
    (char: string) => {
      if (gameStatus !== 'PLAYING' || isValidating) return;

      if (char === 'ENTER') {
        handleSubmitGuess();
      } else if (char === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(char)) {
        setCurrentGuess((prev) => prev + char);
      }
    },
    [currentGuess.length, gameStatus, isValidating, handleSubmitGuess]
  );

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleInputChar('ENTER');
      } else if (e.key === 'Backspace') {
        handleInputChar('BACKSPACE');
      } else {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          handleInputChar(key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputChar]);

  const getKeyboardKeyStatus = (char: string): Status => {
    let status: Status = 'EMPTY';
    for (const guess of guesses) {
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === char) {
          const letterStatus = getLetterStatus(guess, i);
          if (letterStatus === 'CORRECT') return 'CORRECT';
          if (letterStatus === 'PRESENT' && status !== 'CORRECT') status = 'PRESENT';
          if (letterStatus === 'ABSENT' && status === 'EMPTY') status = 'ABSENT';
        }
      }
    }
    return status;
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  return (
    <GameShell
      title="Wordle (Word Guess)"
      gameId="wordle"
      category="Logic"
      difficulty="Medium"
      instructions="Tebak kata rahasia 5 huruf bahasa Inggris dalam 6 kesempatan. Warna ubin menunjukkan: HIJAU (huruf dan posisi tepat), KUNING (huruf ada tapi posisi salah), ABU-ABU (huruf tidak ada)."
      moves={moves}
      isCompleted={gameStatus === 'WON'}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col items-center space-y-4 w-full">
        
        {/* WARNING NOTIFIKASI KATA TIDAK VALID */}
        {errorMessage && (
          <div className="px-3 py-1.5 bg-red-500 text-white font-bold text-xs rounded-xl shadow-md animate-bounce">
            {errorMessage}
          </div>
        )}

        {/* INDICATOR MEMERIKSA KAMUS */}
        {isValidating && (
          <div className="px-3 py-1 text-blue-600 dark:text-blue-400 font-bold text-xs animate-pulse">
            Memeriksa kamus...
          </div>
        )}

        {/* GRID 6 BARIS x 5 KOLOM */}
        <div className="grid grid-rows-6 gap-2 p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIdx) => {
            const guess = guesses[rowIdx] || (rowIdx === guesses.length ? currentGuess : '');
            const isSubmitted = rowIdx < guesses.length;

            return (
              <div key={rowIdx} className="grid grid-cols-5 gap-2">
                {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                  const letter = guess[colIdx] || '';
                  const status = isSubmitted ? getLetterStatus(guess, colIdx) : 'EMPTY';

                  let colorClass = 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white';
                  if (status === 'CORRECT') {
                    colorClass = 'bg-emerald-500 border-emerald-600 text-white font-black';
                  } else if (status === 'PRESENT') {
                    colorClass = 'bg-amber-500 border-amber-600 text-white font-black';
                  } else if (status === 'ABSENT') {
                    colorClass = 'bg-slate-400 dark:bg-slate-800 border-slate-500 dark:border-slate-700 text-white dark:text-slate-400';
                  }

                  return (
                    <div
                      key={colIdx}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center font-black text-base sm:text-lg uppercase transition-all duration-200 ${colorClass} ${
                        letter && !isSubmitted ? 'border-blue-500 scale-105' : ''
                      }`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* OVERLAY GAME OVER (KALAH) */}
        {gameStatus === 'LOST' && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-center text-xs text-red-600 dark:text-red-400 font-bold space-y-1">
            <p>Kesempatan Habis!</p>
            <p className="text-slate-900 dark:text-white">
              Kata rahasia adalah: <span className="font-black text-blue-600 dark:text-blue-400">{targetWord}</span>
            </p>
          </div>
        )}

        {/* ON-SCREEN KEYBOARD */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-sm">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 w-full">
              {row.map((key) => {
                const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
                const status = !isSpecial ? getKeyboardKeyStatus(key) : 'EMPTY';

                let keyBg = 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100';
                if (status === 'CORRECT') keyBg = 'bg-emerald-500 text-white font-black';
                else if (status === 'PRESENT') keyBg = 'bg-amber-500 text-white font-black';
                else if (status === 'ABSENT') keyBg = 'bg-slate-400 dark:bg-slate-900 text-slate-200 dark:text-slate-600';

                return (
                  <button
                    key={key}
                    onClick={() => handleInputChar(key)}
                    disabled={isValidating}
                    className={`h-10 sm:h-11 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 flex items-center justify-center ${
                      isSpecial ? 'px-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold' : 'w-7 sm:w-8'
                    } ${keyBg}`}
                  >
                    {key === 'BACKSPACE' ? '⌫' : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </GameShell>
  );
}