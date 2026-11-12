'use client';

import React from 'react';
import { Handshake } from 'lucide-react';

interface DrawOfferModalProps {
  isOpen: boolean;
  fromUserName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function DrawOfferModal({
  isOpen,
  fromUserName,
  onAccept,
  onDecline,
}: DrawOfferModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFF9EF] border border-[#E4D5C0] rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200 text-[#261A13]">
        {/* Top Icon Badge */}
        <div className="w-14 h-14 rounded-full bg-[#F5EBDD] border-2 border-[#C49A52]/50 text-[#C49A52] mx-auto flex items-center justify-center shadow-xs">
          <Handshake className="w-7 h-7" />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="font-serif font-bold text-xl text-[#3B2418]">
            Draw Offer
          </h3>
          <p className="text-sm text-[#887765]">
            <span className="font-bold text-[#261A13]">{fromUserName}</span> has offered a draw.
          </p>
          <p className="text-xs text-[#887765]/80">
            Accepting will conclude the game immediately as a tie (0.5 points each).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onDecline}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E4D5C0] bg-white hover:bg-[#F5EBDD] text-[#261A13] font-semibold text-sm transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-2.5 px-4 rounded-xl bg-[#3B2418] hover:bg-[#8B5738] text-white font-bold text-sm transition-all shadow-md cursor-pointer active:scale-[0.99]"
          >
            Accept Draw
          </button>
        </div>
      </div>
    </div>
  );
}
