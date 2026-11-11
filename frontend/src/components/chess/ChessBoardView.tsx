'use client';

import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { sounds } from '../../lib/sounds';

interface ChessBoardViewProps {
  fen: string;
  orientation: 'white' | 'black';
  isTurn: boolean;
  isSpectator: boolean;
  onMakeMove: (move: { from: string; to: string; promotion?: string }) => boolean | Promise<boolean>;
  disabled?: boolean;
}

export function ChessBoardView({
  fen,
  orientation,
  isTurn,
  isSpectator,
  onMakeMove,
  disabled = false,
}: ChessBoardViewProps) {
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  // Calculate legal move squares on click for high usability
  const getMoveOptions = (square: string) => {
    if (disabled || isSpectator || !isTurn) return;

    try {
      const tempChess = new Chess(fen);
      const moves = tempChess.moves({
        square: square as any,
        verbose: true,
      });

      if (moves.length === 0) {
        setPossibleMoves([]);
        return;
      }

      const targets = moves.map((m: any) => m.to);
      setPossibleMoves(targets);
      setMoveFrom(square);
    } catch {
      setPossibleMoves([]);
    }
  };

  const handlePieceDrop = ({
    sourceSquare,
    targetSquare,
    piece,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
    piece: any;
  }): boolean => {
    if (disabled || isSpectator || !isTurn || !targetSquare) {
      return false;
    }

    try {
      const tempChess = new Chess(fen);
      const isCapture = tempChess.get(targetSquare as any) !== null;
      const pieceOnSource = tempChess.get(sourceSquare as any);
      const isPawn = pieceOnSource?.type === 'p';
      const isPromotion = isPawn && (targetSquare.endsWith('8') || targetSquare.endsWith('1'));

      const move = tempChess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      });

      if (!move) {
        return false;
      }

      // Play local audio feedback immediately
      if (tempChess.isCheck()) {
        sounds.playCheck();
      } else if (isCapture) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }

      // Propagate to server
      onMakeMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      });

      setMoveFrom(null);
      setPossibleMoves([]);
      return true;
    } catch {
      return false;
    }
  };

  const onSquareClick = ({ square }: { square: string }) => {
    if (disabled || isSpectator || !isTurn) return;

    if (!moveFrom) {
      getMoveOptions(square);
      return;
    }

    // If clicking a legal target square
    if (possibleMoves.includes(square)) {
      handlePieceDrop({ sourceSquare: moveFrom, targetSquare: square, piece: 'wP' });
      setMoveFrom(null);
      setPossibleMoves([]);
      return;
    }

    // Else switch piece selection
    getMoveOptions(square);
  };

  // Custom square styles to highlight selected and target squares
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (moveFrom) {
    customSquareStyles[moveFrom] = {
      backgroundColor: 'rgba(245, 158, 11, 0.4)',
    };
  }
  possibleMoves.forEach((sq) => {
    customSquareStyles[sq] = {
      background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5) 25%, transparent 30%)',
      borderRadius: '50%',
    };
  });

  return (
    <div className="w-full max-w-[560px] mx-auto aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: !disabled && !isSpectator && isTurn,
          canDragPiece: ({ piece }: any) => {
            if (disabled || isSpectator || !isTurn) return false;
            const pieceColor = piece?.pieceType?.[0];
            const myColor = orientation === 'white' ? 'w' : 'b';
            return pieceColor === myColor;
          },
          onPieceDrop: handlePieceDrop as any,
          onSquareClick: onSquareClick as any,
          squareStyles: customSquareStyles,
          darkSquareStyle: { backgroundColor: '#2f3b4f' },
          lightSquareStyle: { backgroundColor: '#5f6f87' },
          animationDurationInMs: 200,
        }}
      />
    </div>
  );
}
