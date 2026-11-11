'use client';

import React from 'react';
import { Button } from '../ui/Button';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-amber-950/50 border border-amber-600/40 text-amber-400 mx-auto flex items-center justify-center">
          <Handshake className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Draw Offer</h3>
          <p className="text-sm text-slate-300 mt-1">
            <span className="font-semibold text-amber-400">{fromUserName}</span> has offered a draw.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button variant="primary" onClick={onAccept}>
            Accept Draw
          </Button>
        </div>
      </div>
    </div>
  );
}

