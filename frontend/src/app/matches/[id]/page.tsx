'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/auth-context';
import { withAuth } from '../../../components/auth/WithAuth';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { formatTime } from '../../../lib/utils';
import { ChessBoardView } from '../../../components/chess/ChessBoardView';
import { GameOverModal } from '../../../components/chess/GameOverModal';
import { DrawOfferModal } from '../../../components/chess/DrawOfferModal';
import { getCapturedPieces } from '../../../components/chess/CapturedPieces';
import {
  Trophy,
  Swords,
  ChevronRight,
  Clock,
  Flag,
  Handshake,
  ScrollText,
  Info,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  X,
  Copy,
  Check,
  User,
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

  // Left Sidebar Tabs
  const [leftTab, setLeftTab] = useState<'match' | 'pgn' | 'details'>('match');

  // Move Playback / Replay State
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Eliminated pieces drawer toggle
  const [isEliminatedPiecesOpen, setIsEliminatedPiecesOpen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);

  // Fetch match details via REST
  const { data: matchData, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchApi(`/matches/${matchId}`),
    enabled: !!matchId,
    refetchOnMount: 'always',
  });

  const isWhite = user?.id === matchData?.whitePlayerId;
  const isBlack = user?.id === matchData?.blackPlayerId;
  const isSpectator = !isWhite && !isBlack;
  const orientation: 'white' | 'black' = isBlack ? 'black' : 'white';

  // Authoritative turn
  const activeTurn = (fen ? fen.split(' ')[1] : turn || 'w') as 'w' | 'b';
  const isMyTurn = (isWhite && activeTurn === 'w') || (isBlack && activeTurn === 'b');

  // Real-time local clock countdown loop
  useEffect(() => {
    if (matchStatus === 'COMPLETED') return;

    const interval = setInterval(() => {
      if (activeTurn === 'w') {
        setWhiteMs((prev) => Math.max(0, prev - 100));
      } else {
        setBlackMs((prev) => Math.max(0, prev - 100));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTurn, matchStatus]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    if (!matchId || !user) return;
    const socket = getSocket();

    socket.emit('match:join', { matchId }, (res: any) => {
      if (res && res.success && res.data) {
        const d = res.data;
        if (d.fen) setFen(d.fen);
        if (d.pgn != null) setPgn(d.pgn);
        if (d.turn) setTurn(d.turn);
        if (typeof d.whiteTimeRemainingMs === 'number') setWhiteMs(d.whiteTimeRemainingMs);
        if (typeof d.blackTimeRemainingMs === 'number') setBlackMs(d.blackTimeRemainingMs);
        if (d.status) setMatchStatus(d.status);
      }
    });

    const handleMoveApplied = (data: any) => {
      if (data.matchId === matchId) {
        setFen(data.fen);
        setPgn(data.pgn);
        setTurn(data.turn);
        setWhiteMs(data.whiteTimeRemainingMs);
        setBlackMs(data.blackTimeRemainingMs);
        // Automatically jump to latest move on new move
        setReplayIndex(null);
      }
    };

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
  }, [matchId, user, queryClient]);

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
      }
    }
  }, [matchData]);

  // Parse moves from PGN for the playback controller
  const moveList = useMemo(() => {
    try {
      const chess = new Chess();
      if (!pgn) return { moves: [], positions: [] };
      chess.loadPgn(pgn);
      const moves = chess.history({ verbose: true });
      const positions = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'];
      const sim = new Chess();
      for (const m of moves) {
        sim.move(m);
        positions.push(sim.fen());
      }
      return { moves, positions };
    } catch {
      return { moves: [], positions: [] };
    }
  }, [pgn]);

  const maxIndex = moveList.positions ? Math.max(0, moveList.positions.length - 1) : 0;
  const currentViewFen =
    replayIndex !== null && moveList.positions && moveList.positions[replayIndex]
      ? moveList.positions[replayIndex]
      : fen;

  const isHistoricalView = replayIndex !== null && replayIndex < maxIndex;

  // Handle Playback Controls
  const handleFirstMove = () => {
    setIsAutoPlaying(false);
    setReplayIndex(0);
  };

  const handlePrevMove = () => {
    setIsAutoPlaying(false);
    setReplayIndex((prev) => {
      const current = prev !== null ? prev : maxIndex;
      return Math.max(0, current - 1);
    });
  };

  const handleNextMove = () => {
    setIsAutoPlaying(false);
    setReplayIndex((prev) => {
      const current = prev !== null ? prev : maxIndex;
      const next = Math.min(maxIndex, current + 1);
      return next === maxIndex ? null : next;
    });
  };

  const handleLastMove = () => {
    setIsAutoPlaying(false);
    setReplayIndex(null); // Return to live position
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setReplayIndex((prev) => {
          const current = prev !== null ? prev : 0;
          if (current >= maxIndex) {
            setIsAutoPlaying(false);
            return null;
          }
          const next = current + 1;
          return next === maxIndex ? null : next;
        });
      }, 1200);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, maxIndex]);

  // Handle local move
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

  const handleReturnToTournament = () => {
    setIsGameOverModalOpen(false);
    if (matchData?.tournamentId) {
      router.push(`/tournaments/${matchData.tournamentId}`);
    } else {
      router.push('/tournaments');
    }
  };

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(pgn || 'No moves played yet.');
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  // Compute captured pieces
  const capturedData = useMemo(() => getCapturedPieces(fen), [fen]);
  const totalPiecesTaken =
    (capturedData.capturedWhite?.length || 0) + (capturedData.capturedBlack?.length || 0);

  if (isLoading || !matchData) {
    return (
      <div className="min-h-screen bg-[#180E08] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C49A52] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const whitePlayerName = matchData.whitePlayer?.name || 'White';
  const blackPlayerName = matchData.blackPlayer?.name || 'Black';
  const tournamentName = matchData.tournament?.name || 'Kingdom Blitz Championship 2026';

  return (
    <div
      className="relative min-h-[calc(100vh-56px)] bg-cover bg-center bg-no-repeat bg-fixed flex flex-col justify-between overflow-x-hidden"
      style={{
        backgroundImage: "url('/images/tournament-card-bg.jpg')",
        backgroundColor: '#180E08',
      }}
    >
      {/* Dark Ambient Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/85 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#180E08]/70 via-transparent to-[#180E08]/90 pointer-events-none" />

      {/* Main Arena Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-4">
            {/* Left Floating Card */}
            <div className="rounded-2xl p-4 sm:p-5 bg-[#1C120C]/90 backdrop-blur-md border border-[#3E281A] shadow-2xl space-y-4">
              {/* Tournament Button */}
              <button
                onClick={handleReturnToTournament}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/90 font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Trophy className="w-4 h-4 text-[#C49A52] shrink-0" />
                  <span className="truncate font-serif font-bold text-xs sm:text-sm">
                    {tournamentName}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors shrink-0" />
              </button>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
                <span
                  className={`w-2 h-2 rounded-full ${
                    matchStatus === 'COMPLETED' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span>{matchStatus === 'COMPLETED' ? 'Match Completed' : 'Match In Progress'}</span>
              </div>

              {/* Vertical Navigation Tabs */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => setLeftTab('match')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    leftTab === 'match'
                      ? 'bg-[#E5B869] text-[#261A13] shadow-md font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>Match</span>
                </button>

                <button
                  onClick={() => setLeftTab('pgn')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    leftTab === 'pgn'
                      ? 'bg-[#E5B869] text-[#261A13] shadow-md font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ScrollText className="w-4 h-4 shrink-0" />
                  <span>PGN History</span>
                </button>

                <button
                  onClick={() => setLeftTab('details')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    leftTab === 'details'
                      ? 'bg-[#E5B869] text-[#261A13] shadow-md font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Game Details</span>
                </button>
              </div>

              {/* Tab Content Display when PGN or Details is active */}
              {leftTab === 'pgn' && (
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-white/80 font-bold border-b border-white/10 pb-1.5">
                    <span>Move History</span>
                    <button
                      onClick={handleCopyPgn}
                      className="flex items-center gap-1 text-[11px] text-[#C49A52] hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedPgn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPgn ? 'Copied' : 'Copy PGN'}</span>
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto font-mono text-[11px] text-[#E4D5C0]/90 leading-relaxed pr-1">
                    {pgn || 'No moves recorded yet.'}
                  </div>
                </div>
              )}

              {leftTab === 'details' && (
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs text-white/80">
                  <div className="font-bold text-[#E5B869] border-b border-white/10 pb-1">
                    Match Summary
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Time Control:</span>
                    <span className="font-mono">{matchData.tournament?.timeControl || '5 + 0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Result:</span>
                    <span className="font-semibold text-white">
                      {result === 'WHITE_WIN'
                        ? 'White Won (1 - 0)'
                        : result === 'BLACK_WIN'
                        ? 'Black Won (0 - 1)'
                        : result === 'DRAW'
                        ? 'Draw (½ - ½)'
                        : 'In Progress'}
                    </span>
                  </div>
                  {reason && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Reason:</span>
                      <span className="capitalize">{reason.toLowerCase()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ================= CENTER COLUMN: BOARD & CONTROLLER ================= */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-3">
            {/* Turn Announcement Banner */}
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeTurn === 'w' ? 'bg-[#FFFDF7] ring-2 ring-[#C49A52]' : 'bg-[#1A1009] ring-2 ring-[#84593D]'
                }`}
              />
              <span>
                Turn:{' '}
                <strong className="text-white capitalize">
                  {activeTurn === 'w' ? 'White' : 'Black'}
                </strong>
              </span>
              {isMyTurn && !isSpectator && matchStatus === 'IN_PROGRESS' && (
                <span className="text-[#E5B869] font-bold animate-pulse">(Your Move!)</span>
              )}
              {isHistoricalView && (
                <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md ml-2">
                  Reviewing Move #{replayIndex}
                </span>
              )}
            </div>

            {/* Wooden Chessboard View with Coordinates */}
            <ChessBoardView
              fen={currentViewFen}
              orientation={orientation}
              isTurn={isMyTurn && !isHistoricalView}
              isSpectator={isSpectator || isHistoricalView}
              onMakeMove={handleMakeMove}
              disabled={matchStatus === 'COMPLETED' || isHistoricalView}
            />

            {/* Move Playback Controller Pill underneath board */}
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C120C]/95 border border-[#4A3222] shadow-xl text-white">
              <button
                onClick={handleFirstMove}
                title="First Move"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrevMove}
                title="Previous Move"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Play / Pause Golden Button */}
              <button
                onClick={toggleAutoPlay}
                title={isAutoPlaying ? 'Pause Replay' : 'Auto Play'}
                className="w-8 h-8 rounded-full bg-[#D4A359] hover:bg-[#C49A52] text-[#261A13] flex items-center justify-center transition-transform active:scale-95 shadow-md cursor-pointer mx-1"
              >
                {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={handleNextMove}
                title="Next Move"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleLastMove}
                title="Live / Last Move"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  !isHistoricalView
                    ? 'text-[#E5B869] font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: PLAYERS & ELIMINATED PIECES ================= */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              {/* TOP PLAYER CARD (BLACK) */}
              <div
                className={`relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xl ${
                  activeTurn === 'b' && matchStatus === 'IN_PROGRESS'
                    ? 'bg-[#EED8B3] border-[#C49A52] text-[#261A13] ring-2 ring-[#C49A52]/50 shadow-[0_0_25px_rgba(196,154,82,0.35)]'
                    : 'bg-[#1C120C]/90 border-[#3E281A] text-white'
                }`}
              >
                {/* Crown Watermark */}
                <span className="absolute top-2.5 right-3.5 text-2xl opacity-20 pointer-events-none">
                  ♚
                </span>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Black Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 shadow-md ${
                        activeTurn === 'b' && matchStatus === 'IN_PROGRESS'
                          ? 'bg-[#261A13] text-[#FFFDF7]'
                          : 'bg-[#2E180B] text-white border border-[#4E2F1A]'
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>

                    {/* Name & Side */}
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-sm sm:text-base truncate">
                        {blackPlayerName}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          activeTurn === 'b' && matchStatus === 'IN_PROGRESS'
                            ? 'text-[#5A3821]'
                            : 'text-white/60'
                        }`}
                      >
                        Black
                      </div>
                    </div>
                  </div>

                  {/* Clock Timer Pill */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm shadow-xs ${
                      activeTurn === 'b' && matchStatus === 'IN_PROGRESS'
                        ? 'bg-[#261A13] text-[#FFFDF7]'
                        : 'bg-black/50 border border-white/10 text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C49A52]" />
                    <span>{formatTime(Math.ceil(blackMs / 1000))}</span>
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center my-1 relative">
                <div className="h-px bg-gradient-to-r from-transparent via-[#C49A52]/50 to-transparent w-full" />
                <span className="px-3 py-0.5 rounded-full bg-[#1C120C] border border-[#C49A52]/60 text-[#C49A52] font-black text-[11px] tracking-widest uppercase shrink-0 shadow-sm mx-2">
                  VS
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-[#C49A52]/50 to-transparent w-full" />
              </div>

              {/* BOTTOM PLAYER CARD (WHITE) */}
              <div
                className={`relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xl ${
                  activeTurn === 'w' && matchStatus === 'IN_PROGRESS'
                    ? 'bg-[#EED8B3] border-[#C49A52] text-[#261A13] ring-2 ring-[#C49A52]/50 shadow-[0_0_25px_rgba(196,154,82,0.35)]'
                    : 'bg-[#1C120C]/90 border-[#3E281A] text-white'
                }`}
              >
                {/* Crown Watermark */}
                <span className="absolute top-2.5 right-3.5 text-2xl opacity-20 pointer-events-none">
                  ♔
                </span>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* White Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 shadow-md ${
                        activeTurn === 'w' && matchStatus === 'IN_PROGRESS'
                          ? 'bg-[#FFFDF7] text-[#261A13] border border-[#C49A52]/50'
                          : 'bg-[#FFF9EF]/20 text-[#FFF9EF] border border-white/20'
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>

                    {/* Name & Side */}
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-sm sm:text-base truncate">
                        {whitePlayerName}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          activeTurn === 'w' && matchStatus === 'IN_PROGRESS'
                            ? 'text-[#5A3821]'
                            : 'text-white/60'
                        }`}
                      >
                        White
                      </div>
                    </div>
                  </div>

                  {/* Clock Timer Pill */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm shadow-xs ${
                      activeTurn === 'w' && matchStatus === 'IN_PROGRESS'
                        ? 'bg-[#261A13] text-[#FFFDF7]'
                        : 'bg-black/50 border border-white/10 text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C49A52]" />
                    <span>{formatTime(Math.ceil(whiteMs / 1000))}</span>
                  </div>
                </div>
              </div>

              {/* Player In-Game Action Controls (Draw & Resign) */}
              {!isSpectator && matchStatus === 'IN_PROGRESS' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleOfferDraw}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5 text-[#E5B869]" />
                    <span>Offer Draw</span>
                  </button>

                  <button
                    onClick={handleResign}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-xs font-semibold text-rose-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-400" />
                    <span>Resign</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Right Eliminated Pieces Bar (Matching Mockup) */}
            <div className="relative pt-2">
              <button
                onClick={() => setIsEliminatedPiecesOpen(!isEliminatedPiecesOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#1C120C]/95 hover:bg-[#2A180E] border border-[#3E281A] text-xs text-white/90 shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#C49A52]" />
                  <span className="font-semibold">Eliminated Pieces</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-[11px] group-hover:text-white transition-colors">
                  <span>{totalPiecesTaken} pieces taken</span>
                  {isEliminatedPiecesOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {/* Expandable Captured Pieces Tray */}
              {isEliminatedPiecesOpen && (
                <div className="absolute bottom-12 right-0 w-full p-4 rounded-2xl bg-[#1C120C]/95 backdrop-blur-md border border-[#4A3222] shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between text-xs text-white/80 border-b border-white/10 pb-1.5">
                    <span className="font-bold text-[#E5B869]">Eliminated Pieces</span>
                    <button
                      onClick={() => setIsEliminatedPiecesOpen(false)}
                      className="text-white/50 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Captured by White */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                      Captured by White ({whitePlayerName})
                    </div>
                    <div className="flex flex-wrap gap-1 min-h-[24px] items-center text-lg text-white">
                      {capturedData.capturedBlack?.length === 0 ? (
                        <span className="text-[11px] text-white/40 italic">None yet</span>
                      ) : (
                        capturedData.capturedBlack.map((p, i) => (
                          <span key={i} className="hover:scale-125 transition-transform" title={p.type}>
                            {p.symbol}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Captured by Black */}
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                      Captured by Black ({blackPlayerName})
                    </div>
                    <div className="flex flex-wrap gap-1 min-h-[24px] items-center text-lg text-[#FFFDF7]">
                      {capturedData.capturedWhite?.length === 0 ? (
                        <span className="text-[11px] text-white/40 italic">None yet</span>
                      ) : (
                        capturedData.capturedWhite.map((p, i) => (
                          <span key={i} className="hover:scale-125 transition-transform" title={p.type}>
                            {p.symbol}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        result={result}
        reason={reason}
        winnerId={winnerId}
        currentUserId={user?.id}
        whitePlayerName={whitePlayerName}
        blackPlayerName={blackPlayerName}
        onRequeue={handleReturnToTournament}
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
