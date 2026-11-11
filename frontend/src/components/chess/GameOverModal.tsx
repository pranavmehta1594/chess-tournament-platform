'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trophy, Swords, ArrowRight, ShieldCheck, Clock, Flag } from 'lucide-react';
import { sounds } from '../../lib/sounds';

interface GameOverModalProps {
  isOpen: boolean;
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  reason?: 'CHECKMATE' | 'TIMEOUT' | 'RESIGNATION' | 'STALEMATE' | 'INSUFFICIENT_MATERIAL' | 'AGREEMENT';
  winnerId?: string;
  currentUserId?: string;
  whitePlayerName: string;
  blackPlayerName: string;
  onRequeue: () => void;
  onReturnToTournament: () => void;
  isSpectator?: boolean;
}

export function GameOverModal({
  isOpen,
  result,
  reason,
  winnerId,
  currentUserId,
  whitePlayerName,
  blackPlayerName,
  onRequeue,
  onReturnToTournament,
  isSpectator = false,
}: GameOverModalProps) {
  const isWinner = currentUserId && winnerId === currentUserId;
  const isDraw = result === 'DRAW';

  useEffect(() => {
    if (isOpen) {
      if (isWinner) {
        sounds.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  let title = 'Game Ended';
  let subtitle = '';
  if (isDraw) {
    title = 'Match Drawn';
    subtitle = `Reason: ${reason || 'Stalemate / Agreement'}`;
  } else if (isSpectator) {
    const winnerName = result === 'WHITE_WIN' ? whitePlayerName : blackPlayerName;
    title = `${winnerName} Wins!`;
    subtitle = `by ${reason || 'Decision'}`;
  } else if (isWinner) {
    title = 'Victory! 🎉';
    subtitle = `You won by ${reason || 'Decision'}`;
  } else {
    title = 'Defeat';
    subtitle = `Opponent won by ${reason || 'Decision'}`;
  }

  const getReasonIcon = () => {
    switch (reason) {
      case 'TIMEOUT':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'RESIGNATION':
        return <Flag className="w-5 h-5 text-rose-400" />;
      case 'CHECKMATE':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
              isWinner
                ? 'bg-amber-950/60 border-amber-500/80 text-amber-400'
                : isDraw
                  ? 'bg-sky-950/60 border-sky-500/80 text-sky-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {getReasonIcon()}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="text-sm text-slate-400 mt-1 capitalize">{subtitle}</p>
        </div>

        {/* Players Summary */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 grid grid-cols-3 items-center">
          <div className="text-left truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {whitePlayerName}
            </div>
            <div className="text-[10px] text-slate-500">White</div>
            <Badge
              variant={result === 'WHITE_WIN' ? 'success' : result === 'DRAW' ? 'info' : 'outline'}
              className="mt-1"
            >
              {result === 'WHITE_WIN' ? '+1.0' : result === 'DRAW' ? '+0.5' : '0.0'}
            </Badge>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
            VS
          </div>

          <div className="text-right truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {blackPlayerName}
            </div>
            <div className="text-[10px] text-slate-500">Black</div>
            <Badge
              variant={result === 'BLACK_WIN' ? 'success' : result === 'DRAW' ? 'info' : 'outline'}
              className="mt-1"
            >
              {result === 'BLACK_WIN' ? '+1.0' : result === 'DRAW' ? '+0.5' : '0.0'}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-2">
          {!isSpectator && (
            <Button
              variant="primary"
              size="lg"
              onClick={onRequeue}
              className="w-full gap-2 font-bold shadow-lg shadow-amber-600/20"
            >
              <Swords className="w-5 h-5" />
              Find Next Opponent
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={onReturnToTournament}
            className="w-full gap-2 text-slate-300"
          >
            <ArrowRight className="w-4 h-4" />
            Back to Tournament Lobby & Standings
          </Button>
        </div>
      </div>
    </div>
  );
}
