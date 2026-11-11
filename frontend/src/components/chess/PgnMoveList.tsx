'use client';

import React, { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';

interface PgnMoveListProps {
  pgn?: string | null;
  onSelectMoveIndex?: (index: number) => void;
  selectedMoveIndex?: number | null;
}

export function PgnMoveList({
  pgn = '',
  onSelectMoveIndex,
  selectedMoveIndex,
}: PgnMoveListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse moves from PGN string
  const safePgn = typeof pgn === 'string' ? pgn : '';
  const cleanPgn = safePgn.replace(/\[.*?\]\s*/g, '').trim();
  const rawTokens = cleanPgn.split(/\s+/).filter(Boolean);

  const movePairs: { num: number; white: string; black?: string; whiteIdx: number; blackIdx?: number }[] = [];
  let currentPair: any = null;
  let moveIdxCounter = 0;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (token.includes('.')) {
      const num = parseInt(token.replace('.', ''), 10);
      currentPair = { num, whiteIdx: moveIdxCounter, white: '' };
      movePairs.push(currentPair);
    } else if (currentPair && !currentPair.white) {
      currentPair.white = token;
      currentPair.whiteIdx = moveIdxCounter++;
    } else if (currentPair && currentPair.white && !currentPair.black) {
      currentPair.black = token;
      currentPair.blackIdx = moveIdxCounter++;
    }
  }

  // Auto-scroll to bottom as moves arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pgn]);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ScrollText className="w-4 h-4 text-amber-500" />
          PGN Move History
        </div>
        <span className="text-xs text-slate-500">
          {moveIdxCounter} {moveIdxCounter === 1 ? 'half-move' : 'moves'}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic text-xs py-8">
            Match started. Waiting for first move...
          </div>
        ) : (
          <table className="w-full text-left">
            <tbody>
              {movePairs.map((pair) => (
                <tr key={pair.num} className="hover:bg-slate-800/40 rounded transition-colors">
                  <td className="w-10 py-1 px-2 text-slate-500 text-right select-none font-semibold">
                    {pair.num}.
                  </td>
                  <td className="py-1 px-2">
                    <button
                      onClick={() => onSelectMoveIndex?.(pair.whiteIdx)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        selectedMoveIndex === pair.whiteIdx
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {pair.white}
                    </button>
                  </td>
                  <td className="py-1 px-2">
                    {pair.black ? (
                      <button
                        onClick={() => onSelectMoveIndex?.(pair.blackIdx!)}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          selectedMoveIndex === pair.blackIdx
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {pair.black}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

