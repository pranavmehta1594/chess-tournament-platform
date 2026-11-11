'use client';

import React from 'react';
import { Skull, Swords } from 'lucide-react';

interface CapturedPiecesProps {
  fen: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const STARTING_PIECES = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

// Unicode piece icons
const PIECE_SYMBOLS: Record<string, string> = {
  P: '♙',
  N: '♘',
  B: '♗',
  R: '♖',
  Q: '♕',
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
};

export function getCapturedPieces(fen: string) {
  const boardFen = (fen || '').split(' ')[0] || '';

  // Count remaining pieces on the board
  const currentCounts: Record<string, number> = {
    P: 0,
    N: 0,
    B: 0,
    R: 0,
    Q: 0,
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
  };

  for (const char of boardFen) {
    if (char in currentCounts) {
      currentCounts[char]++;
    }
  }

  // Calculate captured (eliminated) pieces
  const capturedWhite: { type: string; symbol: string; value: number }[] = [];
  const capturedBlack: { type: string; symbol: string; value: number }[] = [];

  // White pieces captured by Black
  for (const [pieceLower, startCount] of Object.entries(STARTING_PIECES)) {
    const pieceUpper = pieceLower.toUpperCase();
    const lostCount = Math.max(0, startCount - (currentCounts[pieceUpper] || 0));
    for (let i = 0; i < lostCount; i++) {
      capturedWhite.push({
        type: pieceUpper,
        symbol: PIECE_SYMBOLS[pieceUpper],
        value: PIECE_VALUES[pieceLower],
      });
    }
  }

  // Black pieces captured by White
  for (const [pieceLower, startCount] of Object.entries(STARTING_PIECES)) {
    const lostCount = Math.max(0, startCount - (currentCounts[pieceLower] || 0));
    for (let i = 0; i < lostCount; i++) {
      capturedBlack.push({
        type: pieceLower,
        symbol: PIECE_SYMBOLS[pieceLower],
        value: PIECE_VALUES[pieceLower],
      });
    }
  }

  // Calculate material difference
  const whiteLostValue = capturedWhite.reduce((sum, p) => sum + p.value, 0);
  const blackLostValue = capturedBlack.reduce((sum, p) => sum + p.value, 0);

  // Black captured White pieces => Black gain = whiteLostValue
  // White captured Black pieces => White gain = blackLostValue
  const whiteAdvantage = blackLostValue - whiteLostValue;

  return {
    capturedWhite, // eliminated White pieces
    capturedBlack, // eliminated Black pieces
    whiteAdvantage,
  };
}

export function CapturedPieces({
  fen,
  whitePlayerName = 'White',
  blackPlayerName = 'Black',
}: CapturedPiecesProps) {
  const { capturedWhite, capturedBlack, whiteAdvantage } = getCapturedPieces(fen);

  const totalCaptured = capturedWhite.length + capturedBlack.length;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Skull className="w-4 h-4 text-rose-500" />
          Eliminated Pieces
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {totalCaptured} {totalCaptured === 1 ? 'piece' : 'pieces'} taken
        </span>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {totalCaptured === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-xs py-12 space-y-2">
            <Swords className="w-8 h-8 opacity-30 text-amber-500" />
            <p>No pieces eliminated yet.</p>
            <p className="text-[11px] text-slate-600">Captured pieces will appear here as the battle unfolds!</p>
          </div>
        ) : (
          <>
            {/* Captured Black Pieces (Eliminated by White) */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Taken from {blackPlayerName} (Black)
                  </span>
                </div>
                {whiteAdvantage > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                    +{whiteAdvantage}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center p-2 rounded-lg bg-slate-900/70 border border-slate-800/60">
                {capturedBlack.length === 0 ? (
                  <span className="text-xs text-slate-600 italic">None yet</span>
                ) : (
                  capturedBlack.map((piece, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 text-2xl text-slate-200 hover:scale-110 transition-transform select-none shadow-sm"
                      title={`${piece.type.toUpperCase()} (Value: ${piece.value})`}
                    >
                      {piece.symbol}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Captured White Pieces (Eliminated by Black) */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Taken from {whitePlayerName} (White)
                  </span>
                </div>
                {whiteAdvantage < 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                    +{Math.abs(whiteAdvantage)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center p-2 rounded-lg bg-slate-900/70 border border-slate-800/60">
                {capturedWhite.length === 0 ? (
                  <span className="text-xs text-slate-600 italic">None yet</span>
                ) : (
                  capturedWhite.map((piece, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 text-2xl text-slate-900 font-bold hover:scale-110 transition-transform select-none shadow-sm"
                      title={`${piece.type} (Value: ${piece.value})`}
                    >
                      {piece.symbol}
                    </span>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

