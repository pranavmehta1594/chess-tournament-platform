'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Swords, ArrowRight, ShieldCheck, Clock, Flag, Award } from 'lucide-react';
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
          particleCount: 90,
          spread: 75,
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
    subtitle = `Concluded by ${reason || 'Decision'}`;
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
        return <Clock className="w-7 h-7 text-[#C49A52]" />;
      case 'RESIGNATION':
        return <Flag className="w-7 h-7 text-rose-600" />;
      case 'CHECKMATE':
        return <Trophy className="w-7 h-7 text-[#C49A52]" />;
      default:
        return <Award className="w-7 h-7 text-[#8B5738]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFF9EF] border border-[#E4D5C0] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-6 text-[#261A13] animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-xs ${
              isWinner
                ? 'bg-[#FDF3DE] border-[#C49A52] text-[#C49A52]'
                : isDraw
                ? 'bg-[#F5EBDD] border-[#C49A52]/60 text-[#8B5738]'
                : 'bg-[#F5EBDD] border-[#E4D5C0] text-[#887765]'
            }`}
          >
            {getReasonIcon()}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#887765] capitalize">
            {subtitle}
          </p>
        </div>

        {/* Players Summary Box */}
        <div className="bg-[#F5EBDD] border border-[#E4D5C0] rounded-xl p-4 grid grid-cols-3 items-center">
          {/* White Player */}
          <div className="text-left truncate">
            <div className="text-xs sm:text-sm font-bold text-[#261A13] truncate">
              {whitePlayerName}
            </div>
            <div className="text-[11px] text-[#887765]">White</div>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                result === 'WHITE_WIN'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : result === 'DRAW'
                  ? 'bg-[#D4A359]/25 text-[#3B2418] border border-[#C49A52]/40'
                  : 'bg-white/80 text-[#887765] border border-[#E4D5C0]'
              }`}
            >
              {result === 'WHITE_WIN' ? '+1.0' : result === 'DRAW' ? '+0.5' : '0.0'}
            </span>
          </div>

          {/* VS Divider */}
          <div className="text-xs font-bold text-[#C49A52] uppercase tracking-widest text-center">
            VS
          </div>

          {/* Black Player */}
          <div className="text-right truncate">
            <div className="text-xs sm:text-sm font-bold text-[#261A13] truncate">
              {blackPlayerName}
            </div>
            <div className="text-[11px] text-[#887765]">Black</div>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                result === 'BLACK_WIN'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : result === 'DRAW'
                  ? 'bg-[#D4A359]/25 text-[#3B2418] border border-[#C49A52]/40'
                  : 'bg-white/80 text-[#887765] border border-[#E4D5C0]'
              }`}
            >
              {result === 'BLACK_WIN' ? '+1.0' : result === 'DRAW' ? '+0.5' : '0.0'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          {!isSpectator && (
            <button
              onClick={onRequeue}
              className="w-full py-3 px-5 rounded-xl bg-[#D4A359] hover:bg-[#C49A52] text-[#261A13] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <Swords className="w-5 h-5 text-[#261A13]" />
              <span>Find Next Opponent</span>
            </button>
          )}

          <button
            onClick={onReturnToTournament}
            className="w-full py-2.5 px-4 rounded-xl bg-[#3B2418] hover:bg-[#8B5738] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-[#C49A52]" />
            <span>Back to Tournament Lobby &amp; Standings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
