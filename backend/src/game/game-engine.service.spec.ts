import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('GameEngine Move Legality & Turn Enforcement', () => {
  it('allows legal opening move and alternates turn', () => {
    const chess = new Chess();
    expect(chess.turn()).toBe('w');

    // Legal move for White: e2 to e4
    const move = chess.move({ from: 'e2', to: 'e4' });
    expect(move).toBeDefined();
    expect(move.san).toBe('e4');
    expect(chess.turn()).toBe('b');

    // Legal response for Black: e7 to e5
    const blackMove = chess.move({ from: 'e7', to: 'e5' });
    expect(blackMove).toBeDefined();
    expect(blackMove.san).toBe('e5');
    expect(chess.turn()).toBe('w');
  });

  it('rejects illegal moves (e.g. pawn moving backwards or knight through impossible square)', () => {
    const chess = new Chess();

    // White cannot move e2 to e5 on first move (pawn can only move 1 or 2 squares)
    expect(() => {
      chess.move({ from: 'e2', to: 'e5' });
    }).toThrow();
  });

  it('detects checkmate properly (Scholar\'s Mate)', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Bc4');
    chess.move('Nc6');
    chess.move('Qh5');
    chess.move('Nf6');
    chess.move('Qxf7#');

    expect(chess.isCheckmate()).toBe(true);
    expect(chess.isGameOver()).toBe(true);
    // After checkmate on Black, turn is 'b' (who is in checkmate)
    expect(chess.turn()).toBe('b');
  });

  it('detects stalemate properly', () => {
    // Known stalemate position: Black king on h8, White queen on f7, White king on g6
    // Black king has no legal moves and is not in check
    const stalemateChess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(stalemateChess.isStalemate()).toBe(true);
    expect(stalemateChess.isGameOver()).toBe(true);
    expect(stalemateChess.isCheckmate()).toBe(false);
  });
});
