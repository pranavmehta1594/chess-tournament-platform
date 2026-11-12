'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/auth-context';
import { withAuth } from '../../../components/auth/WithAuth';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { ChessBoardView } from '../../../components/chess/ChessBoardView';
import { ClockTimer } from '../../../components/chess/ClockTimer';
import { PgnMoveList } from '../../../components/chess/PgnMoveList';
import { CapturedPieces } from '../../../components/chess/CapturedPieces';
import { GameOverModal } from '../../../components/chess/GameOverModal';
import { DrawOfferModal } from '../../../components/chess/DrawOfferModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Flag,
  Handshake,
  ArrowLeft,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Skull,
  ScrollText,
} from 'lucide-react';
import { Chess } from 'chess.js';

function LiveMatchPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Match State
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [pgn, setPgn] = useState('');
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [whiteMs, setWhiteMs] = useState(300000);
  const [blackMs, setBlackMs] = useState(300000);
  const [matchStatus, setMatchStatus] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');
  const [result, setResult] = useState<'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING'>('ONGOING');
  const [reason, setReason] = useState<any>(null);
  const [winnerId, setWinnerId] = useState<string | undefined>(undefined);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // Draw offer state
  const [isDrawOfferModalOpen, setIsDrawOfferModalOpen] = useState(false);
  const [drawOfferFromUser, setDrawOfferFromUser] = useState('');

  // Right panel tab (defaults to Eliminated Pieces)
  const [rightPanelTab, setRightPanelTab] = useState<'eliminated' | 'pgn'>('eliminated');

  // Fetch match initial details via REST
  const { data: matchData, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchApi(`/matches/${matchId}`),
    enabled: !!matchId,
  });

  const isWhite = user?.id === matchData?.whitePlayerId;
  const isBlack = user?.id === matchData?.blackPlayerId;
  const isSpectator = !isWhite && !isBlack;
  const orientation: 'white' | 'black' = isBlack ? 'black' : 'white';

  // Derive active turn directly from the authoritative FEN string (field 2)
  const activeTurn = (fen ? fen.split(' ')[1] : turn || 'w') as 'w' | 'b';
  const isMyTurn = (isWhite && activeTurn === 'w') || (isBlack && activeTurn === 'b');

  // Socket Connection and Event Listeners
  useEffect(() => {
    if (!matchId || !user) return;
    const socket = getSocket();

    // 1. Join match room and request state
    socket.emit('match:join', { matchId }, (res: any) => {
      if (res && res.success && res.data) {
        const d = res.data;
        setFen(d.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setPgn(d.pgn || '');
        setTurn(d.turn);
        setWhiteMs(d.whiteTimeRemainingMs);
        setBlackMs(d.blackTimeRemainingMs);
        setMatchStatus(d.status);
      }
    });

    // 2. Handle moves applied by server
    const handleMoveApplied = (data: any) => {
      if (data.matchId === matchId) {
        setFen(data.fen);
        setPgn(data.pgn);
        setTurn(data.turn);
        setWhiteMs(data.whiteTimeRemainingMs);
        setBlackMs(data.blackTimeRemainingMs);
      }
    };

    // 3. Handle game over
    const handleGameEnded = (data: any) => {
      if (data.matchId === matchId) {
        setMatchStatus('COMPLETED');
        setResult(data.result);
        setReason(data.reason);
        setWinnerId(data.winnerId);
        if (data.finalFen) setFen(data.finalFen);
        if (data.pgn != null) setPgn(data.pgn);
        if (typeof data.whiteTimeRemainingMs === 'number') setWhiteMs(data.whiteTimeRemainingMs);
        if (typeof data.blackTimeRemainingMs === 'number') setBlackMs(data.blackTimeRemainingMs);
        setIsGameOverModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ['my-matches'] });
        queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      }
    };

    // 4. Handle incoming draw offers
    const handleDrawOffered = (data: any) => {
      if (data.matchId === matchId && data.fromUserId !== user.id) {
        setDrawOfferFromUser(data.fromUserName);
        setIsDrawOfferModalOpen(true);
      }
    };

    const handleDrawDeclined = () => {
      alert('Draw offer was declined by opponent.');
    };

    socket.on('match:move_applied', handleMoveApplied);
    socket.on('match:ended', handleGameEnded);
    socket.on('match:draw_offered', handleDrawOffered);
    socket.on('match:draw_declined', handleDrawDeclined);

    return () => {
      socket.off('match:move_applied', handleMoveApplied);
      socket.off('match:ended', handleGameEnded);
      socket.off('match:draw_offered', handleDrawOffered);
      socket.off('match:draw_declined', handleDrawDeclined);
    };
  }, [matchId, user]);

  // Initial load sync from matchData
  useEffect(() => {
    if (matchData) {
      if (matchData.finalFen) setFen(matchData.finalFen);
      if (matchData.pgn != null) setPgn(matchData.pgn);
      if (typeof matchData.whiteTimeRemainingMs === 'number' && !isNaN(matchData.whiteTimeRemainingMs)) {
        setWhiteMs(matchData.whiteTimeRemainingMs);
      }
      if (typeof matchData.blackTimeRemainingMs === 'number' && !isNaN(matchData.blackTimeRemainingMs)) {
        setBlackMs(matchData.blackTimeRemainingMs);
      }
      if (matchData.status === 'COMPLETED') {
        setMatchStatus('COMPLETED');
        setResult(matchData.result);
        setReason(matchData.terminationReason);
        setIsGameOverModalOpen(true);
      }
    }
  }, [matchData]);

  // Handle local move -> send to server
  const handleMakeMove = (move: { from: string; to: string; promotion?: string }): boolean => {
    const socket = getSocket();
    socket.emit(
      'match:move',
      {
        matchId,
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      },
      (res: any) => {
        if (res && !res.success) {
          alert(res.error || 'Invalid move rejected by server');
        }
      },
    );
    return true;
  };

  const handleResign = () => {
    if (!confirm('Are you sure you want to resign this match?')) return;
    const socket = getSocket();
    socket.emit('match:resign', { matchId });
  };

  const handleOfferDraw = () => {
    const socket = getSocket();
    socket.emit('match:offer_draw', { matchId }, (res: any) => {
      if (res?.success) {
        alert('Draw offer sent to opponent.');
      }
    });
  };

  const handleAcceptDraw = () => {
    const socket = getSocket();
    socket.emit('match:respond_draw', { matchId, accept: true });
    setIsDrawOfferModalOpen(false);
  };

  const handleDeclineDraw = () => {
    const socket = getSocket();
    socket.emit('match:respond_draw', { matchId, accept: false });
    setIsDrawOfferModalOpen(false);
  };

  const handleRequeue = () => {
    setIsGameOverModalOpen(false);
    if (matchData?.tournamentId) {
      router.push(`/tournaments/${matchData.tournamentId}`);
    }
  };

  const handleReturnToTournament = () => {
    setIsGameOverModalOpen(false);
    if (matchData?.tournamentId) {
      router.push(`/tournaments/${matchData.tournamentId}`);
    } else {
      router.push('/tournaments');
    }
  };

  if (isLoading || !matchData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReturnToTournament}
            className="text-slate-400 hover:text-white gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Tournament Lobby
          </Button>

          <div className="flex items-center gap-2">
            {isSpectator && (
              <Badge variant="warning" className="gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Spectator Mode
              </Badge>
            )}
            <Badge variant={matchStatus === 'IN_PROGRESS' ? 'success' : 'default'}>
              {matchStatus === 'IN_PROGRESS' ? '● Live Match' : 'Match Completed'}
            </Badge>
          </div>
        </div>

        {/* Player controls */}
        {!isSpectator && matchStatus === 'IN_PROGRESS' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOfferDraw}
              className="gap-1.5 text-xs text-slate-300"
            >
              <Handshake className="w-4 h-4 text-amber-400" />
              Offer Draw
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleResign}
              className="gap-1.5 text-xs font-semibold"
            >
              <Flag className="w-4 h-4" />
              Resign
            </Button>
          </div>
        )}
      </div>

      {/* Main Arena Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Board & Clocks Column */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          {/* Dual Clock Timer */}
          <ClockTimer
            whiteTimeRemainingMs={whiteMs}
            blackTimeRemainingMs={blackMs}
            turn={activeTurn}
            isGameOver={matchStatus === 'COMPLETED'}
            whitePlayerName={matchData.whitePlayer?.name || 'White'}
            blackPlayerName={matchData.blackPlayer?.name || 'Black'}
          />

          {/* Turn status indicator */}
          <div className="w-full flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeTurn === 'w' ? 'bg-slate-100 ring-2 ring-amber-500' : 'bg-slate-900 ring-1 ring-slate-600'
                }`}
              />
              <span className="font-semibold text-slate-300">
                Turn: {activeTurn === 'w' ? 'White' : 'Black'}
              </span>
              {isMyTurn && !isSpectator && matchStatus === 'IN_PROGRESS' && (
                <span className="text-amber-400 font-bold animate-pulse">
                  (Your Turn!)
                </span>
              )}
            </div>

            <div className="text-slate-400">
              Playing as:{' '}
              <span className="font-bold text-white capitalize">
                {isSpectator ? 'Spectator' : orientation}
              </span>
            </div>
          </div>

          {/* Chessboard View */}
          <ChessBoardView
            fen={fen}
            orientation={orientation}
            isTurn={isMyTurn}
            isSpectator={isSpectator}
            onMakeMove={handleMakeMove}
            disabled={matchStatus === 'COMPLETED'}
          />
        </div>

        {/* Right Column: Eliminated Pieces (Default) & PGN History */}
        <div className="lg:col-span-4 h-[580px] flex flex-col space-y-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 text-xs font-semibold">
            <button
              onClick={() => setRightPanelTab('eliminated')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'eliminated'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Skull className="w-4 h-4" />
              Eliminated Pieces
            </button>
            <button
              onClick={() => setRightPanelTab('pgn')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'pgn'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              PGN History
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {rightPanelTab === 'eliminated' ? (
              <CapturedPieces
                fen={fen}
                whitePlayerName={matchData.whitePlayer?.name || 'White'}
                blackPlayerName={matchData.blackPlayer?.name || 'Black'}
              />
            ) : (
              <PgnMoveList pgn={pgn} />
            )}
          </div>
        </div>
      </div>

      {/* Game Over Dialog */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        result={result}
        reason={reason}
        winnerId={winnerId}
        currentUserId={user?.id}
        whitePlayerName={matchData.whitePlayer?.name || 'White'}
        blackPlayerName={matchData.blackPlayer?.name || 'Black'}
        onRequeue={handleRequeue}
        onReturnToTournament={handleReturnToTournament}
        isSpectator={isSpectator}
      />

      {/* Draw Offer Notification Dialog */}
      <DrawOfferModal
        isOpen={isDrawOfferModalOpen}
        fromUserName={drawOfferFromUser}
        onAccept={handleAcceptDraw}
        onDecline={handleDeclineDraw}
      />
    </div>
  );
}

export default withAuth(LiveMatchPage);
