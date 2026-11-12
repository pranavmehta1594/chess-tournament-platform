'use client';

import React, { useState, useMemo } from 'react';
import { Chessboard, defaultPieces } from 'react-chessboard';
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

  // Calculate legal move squares on click
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

  // Custom square styles to highlight selected and target squares with gold theme
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (moveFrom) {
    customSquareStyles[moveFrom] = {
      backgroundColor: 'rgba(196, 154, 82, 0.45)',
      boxShadow: 'inset 0 0 0 2px #C49A52',
    };
  }
  possibleMoves.forEach((sq) => {
    customSquareStyles[sq] = {
      background: 'radial-gradient(circle, rgba(196, 154, 82, 0.75) 25%, transparent 30%)',
      borderRadius: '50%',
    };
  });

  // Theme-colored pieces: Ivory White (#FFFDF7) & Dark Walnut Espresso (#1A1009)
  const customThemedPieces = useMemo(() => {
    const piecesMap: Record<string, any> = {};
    const whiteKeys = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK'];
    const blackKeys = ['bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

    whiteKeys.forEach((key) => {
      const OriginalPiece = defaultPieces[key];
      if (OriginalPiece) {
        piecesMap[key] = (props: any) =>
          OriginalPiece({
            ...props,
            fill: '#FFFDF7',
          });
      }
    });

    blackKeys.forEach((key) => {
      const OriginalPiece = defaultPieces[key];
      if (OriginalPiece) {
        piecesMap[key] = (props: any) =>
          OriginalPiece({
            ...props,
            fill: '#1A1009',
          });
      }
    });

    return piecesMap;
  }, []);

  const files =
    orientation === 'white'
      ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const ranks =
    orientation === 'white'
      ? ['8', '7', '6', '5', '4', '3', '2', '1']
      : ['1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div className="w-full max-w-[530px] mx-auto select-none">
      {/* Wooden Bezel Frame around board */}
      <div className="relative rounded-[22px] p-2.5 sm:p-3 bg-gradient-to-b from-[#56351F] via-[#432714] to-[#2E180B] border-2 border-[#6E4629] shadow-[0_20px_45px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5)]">
        {/* Top File Coordinates (a-h) */}
        <div className="grid grid-cols-8 text-center text-[11px] sm:text-xs font-mono font-bold text-[#EED8B3]/90 pb-1.5 pl-4 pr-4">
          {files.map((file) => (
            <span key={`top-${file}`}>{file}</span>
          ))}
        </div>

        {/* Board with Left and Right Rank Coordinates (8-1) */}
        <div className="flex items-center">
          {/* Left Rank Coordinates */}
          <div className="w-4 shrink-0 flex flex-col justify-around text-center text-[11px] sm:text-xs font-mono font-bold text-[#EED8B3]/90 py-1 h-full">
            {ranks.map((rank) => (
              <span key={`left-${rank}`} className="flex-1 flex items-center justify-center">
                {rank}
              </span>
            ))}
          </div>

          {/* The Chessboard Grid */}
          <div className="flex-1 aspect-square rounded-md overflow-hidden shadow-[inset_0_0_12px_rgba(0,0,0,0.45)]">
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
                showNotation: false, // coordinates are on the wooden frame
                darkSquareStyle: { backgroundColor: '#84593D' },
                lightSquareStyle: { backgroundColor: '#F0E5CE' },
                pieces: customThemedPieces,
                animationDurationInMs: 200,
              }}
            />
          </div>

          {/* Right Rank Coordinates */}
          <div className="w-4 shrink-0 flex flex-col justify-around text-center text-[11px] sm:text-xs font-mono font-bold text-[#EED8B3]/90 py-1 h-full">
            {ranks.map((rank) => (
              <span key={`right-${rank}`} className="flex-1 flex items-center justify-center">
                {rank}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom File Coordinates (a-h) */}
        <div className="grid grid-cols-8 text-center text-[11px] sm:text-xs font-mono font-bold text-[#EED8B3]/90 pt-1.5 pl-4 pr-4">
          {files.map((file) => (
            <span key={`bottom-${file}`}>{file}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
