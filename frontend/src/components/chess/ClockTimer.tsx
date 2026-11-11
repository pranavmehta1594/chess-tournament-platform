'use client';

import React, { useEffect, useState } from 'react';
import { formatTime } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface ClockTimerProps {
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  turn: 'w' | 'b';
  isGameOver: boolean;
  whitePlayerName: string;
  blackPlayerName: string;
}

export function ClockTimer({
  whiteTimeRemainingMs,
  blackTimeRemainingMs,
  turn,
  isGameOver,
  whitePlayerName,
  blackPlayerName,
}: ClockTimerProps) {
  const [whiteMs, setWhiteMs] = useState(whiteTimeRemainingMs);
  const [blackMs, setBlackMs] = useState(blackTimeRemainingMs);

  useEffect(() => {
    setWhiteMs(whiteTimeRemainingMs);
  }, [whiteTimeRemainingMs]);

  useEffect(() => {
    setBlackMs(blackTimeRemainingMs);
  }, [blackTimeRemainingMs]);

  // Countdown timer loop
  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      if (turn === 'w') {
        setWhiteMs((prev) => Math.max(0, prev - 100));
      } else {
        setBlackMs((prev) => Math.max(0, prev - 100));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [turn, isGameOver]);

  const isWhiteLow = whiteMs < 30000 && !isGameOver;
  const isBlackLow = blackMs < 30000 && !isGameOver;

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {/* Black Player Clock */}
      <div
        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
          turn === 'b' && !isGameOver
            ? 'bg-slate-800/90 border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
            : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-[10px] text-white">
            ♟
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {blackPlayerName}
            </div>
            <div className="text-[10px] text-slate-400">Black</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xl font-bold">
          <Clock className={`w-4 h-4 ${isBlackLow ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          <span className={isBlackLow ? 'text-rose-400 animate-pulse' : 'text-white'}>
            {formatTime(blackMs)}
          </span>
        </div>
      </div>

      {/* White Player Clock */}
      <div
        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
          turn === 'w' && !isGameOver
            ? 'bg-slate-800/90 border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
            : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-900 font-bold">
            ♙
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {whitePlayerName}
            </div>
            <div className="text-[10px] text-slate-400">White</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xl font-bold">
          <Clock className={`w-4 h-4 ${isWhiteLow ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          <span className={isWhiteLow ? 'text-rose-400 animate-pulse' : 'text-white'}>
            {formatTime(whiteMs)}
          </span>
        </div>
      </div>
    </div>
  );
}

