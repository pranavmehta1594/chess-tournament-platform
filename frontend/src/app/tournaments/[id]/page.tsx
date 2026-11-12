'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/auth-context';
import { withAuth } from '../../../components/auth/WithAuth';
import { https } from '../../../services/https';
import { ENDPOINTS } from '../../../services/endpoints';
import { getSocket } from '../../../lib/socket';
import { formatDate } from '../../../lib/utils';
import {
  Trophy,
  Swords,
  Users,
  Clock,
  Calendar,
  Search,
  Eye,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  score: number;
  wins: number;
  draws: number;
  losses: number;
  buchholzScore: number;
  rank: number;
}

interface MatchItem {
  id: string;
  whitePlayer: { id?: string; name: string };
  blackPlayer: { id?: string; name: string };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
  result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  terminationReason?: string;
  startedAt: string;
}

function LeftLaurelBranch() {
  return (
    <svg viewBox="0 0 32 40" fill="none" className="w-5 h-7 sm:w-6 sm:h-8 shrink-0 text-[#C49A52]">
      <path
        d="M20 6C12 14 10 26 18 36C19 37.5 17.5 39 16 38C9 28 9 14 17 5C18 3.5 20.5 4.5 20 6Z"
        fill="currentColor"
      />
      <circle cx="8" cy="14" r="2.2" fill="currentColor" />
      <circle cx="7" cy="22" r="2.2" fill="currentColor" />
      <circle cx="10" cy="30" r="2.2" fill="currentColor" />
      <circle cx="15" cy="36" r="2" fill="currentColor" />
    </svg>
  );
}

function RightLaurelBranch() {
  return (
    <svg viewBox="0 0 32 40" fill="none" className="w-5 h-7 sm:w-6 sm:h-8 shrink-0 text-[#C49A52]">
      <path
        d="M12 6C20 14 22 26 14 36C13 37.5 14.5 39 16 38C23 28 23 14 15 5C14 3.5 11.5 4.5 12 6Z"
        fill="currentColor"
      />
      <circle cx="24" cy="14" r="2.2" fill="currentColor" />
      <circle cx="25" cy="22" r="2.2" fill="currentColor" />
      <circle cx="22" cy="30" r="2.2" fill="currentColor" />
      <circle cx="17" cy="36" r="2" fill="currentColor" />
    </svg>
  );
}

function GoldMedalBadge() {
  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#E5B869] border border-[#C49A52] flex items-center justify-center text-[#3B2418] font-black text-xs shadow-xs">
        1
      </div>
      <div className="flex gap-0.5 -mt-0.5">
        <div className="w-1.5 h-2 bg-[#C49A52] rotate-12 origin-top-left" />
        <div className="w-1.5 h-2 bg-[#C49A52] -rotate-12 origin-top-right" />
      </div>
    </div>
  );
}

function SilverMedalBadge() {
  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#E2E8F0] border border-[#94A3B8] flex items-center justify-center text-[#1E293B] font-black text-xs shadow-xs">
        2
      </div>
      <div className="flex gap-0.5 -mt-0.5">
        <div className="w-1.5 h-2 bg-[#94A3B8] rotate-12 origin-top-left" />
        <div className="w-1.5 h-2 bg-[#94A3B8] -rotate-12 origin-top-right" />
      </div>
    </div>
  );
}

function BronzeMedalBadge() {
  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#D97706]/80 border border-[#B45309] flex items-center justify-center text-white font-black text-xs shadow-xs">
        3
      </div>
      <div className="flex gap-0.5 -mt-0.5">
        <div className="w-1.5 h-2 bg-[#B45309] rotate-12 origin-top-left" />
        <div className="w-1.5 h-2 bg-[#B45309] -rotate-12 origin-top-right" />
      </div>
    </div>
  );
}

function LeaderboardTableSkeleton() {
  return (
    <div className="w-full rounded-[20px] overflow-hidden border border-[#E4D5C0] bg-[#FFF9EF] shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {/* Header */}
          <thead className="bg-[#3B2418] text-[#E4D5C0] text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="py-4 px-4 w-20 text-center">Rank</th>
              <th className="py-4 px-6 text-left">Player</th>
              <th className="py-4 px-4 w-28 text-center">Points</th>
              <th className="py-4 px-4 w-40 text-center">W / D / L</th>
              <th className="py-4 px-6 w-44 text-center">Buchholz Tiebreak</th>
            </tr>
          </thead>

          {/* Skeleton Body */}
          <tbody className="divide-y divide-[#E4D5C0]">
            {[1, 2, 3, 4, 5].map((idx) => {
              const isFirst = idx === 1;
              return (
                <tr
                  key={idx}
                  className={`${isFirst ? 'bg-[#FDF3DE]/70' : 'bg-[#FFF9EF]'} transition-colors`}
                >
                  {/* Rank Column Skeleton */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-7 h-7 mx-auto rounded-full bg-[#E4D5C0]/80 animate-pulse" />
                  </td>

                  {/* Player Column Skeleton */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E4D5C0]/80 animate-pulse shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-28 sm:w-36 rounded-md bg-[#E4D5C0]/80 animate-pulse" />
                        <div className="h-3 w-40 sm:w-52 rounded-md bg-[#E4D5C0]/50 animate-pulse" />
                      </div>
                    </div>
                  </td>

                  {/* Points Column Skeleton */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-6 w-10 mx-auto rounded-full bg-[#D4A359]/30 animate-pulse" />
                  </td>

                  {/* W / D / L Column Skeleton */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-4 w-24 mx-auto rounded-md bg-[#E4D5C0]/70 animate-pulse" />
                  </td>

                  {/* Buchholz Tiebreak Column Skeleton */}
                  <td className="py-3.5 px-6 text-center">
                    <div className="h-4 w-12 mx-auto rounded-md bg-[#E4D5C0]/70 animate-pulse" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TournamentPageSkeleton() {
  return (
    <div
      className="relative min-h-[calc(100vh-64px)] bg-cover bg-right sm:bg-center bg-no-repeat bg-fixed overflow-x-hidden"
      style={{
        backgroundImage: "url('/images/tournaments-bg.jpg')",
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/60 via-50% to-white/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/5 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Banner Skeleton */}
        <div
          className="relative w-full rounded-[22px] overflow-hidden border border-[#E4D5C0] shadow-md bg-[#24130A] min-h-[190px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          style={{
            backgroundImage: "url('/images/tournament-card-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#24130A] via-[#24130A]/95 via-45% to-black/40 pointer-events-none" />
          <div className="relative z-10 space-y-3.5 max-w-2xl w-full">
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 rounded-full bg-white/20 animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-white/20 animate-pulse" />
              <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-9 w-3/4 max-w-md rounded-lg bg-white/25 animate-pulse" />
            <div className="flex items-center gap-5">
              <div className="h-4 w-32 rounded bg-white/20 animate-pulse" />
              <div className="h-4 w-40 rounded bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="relative z-10 h-12 w-40 rounded-xl bg-[#D4A359]/30 animate-pulse self-start lg:self-center shrink-0" />
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="flex items-center gap-8 border-b border-[var(--border)] pb-3">
          <div className="h-5 w-36 rounded bg-[#E4D5C0] animate-pulse" />
          <div className="h-5 w-44 rounded bg-[#E4D5C0]/60 animate-pulse" />
          <div className="h-5 w-32 rounded bg-[#E4D5C0]/60 animate-pulse" />
        </div>

        {/* Leaderboard Table Skeleton */}
        <LeaderboardTableSkeleton />
      </div>
    </div>
  );
}

function TournamentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'matches' | 'participants'>('leaderboard');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);

  // Fetch tournament details
  const { data: tournament, isLoading: isTournamentLoading, error } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () =>
      https.get(ENDPOINTS.tournaments.byId(id)).then((response) => response.data),
    enabled: !!id,
    refetchOnMount: 'always',
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['tournament-leaderboard', id],
    queryFn: () =>
      https.get(ENDPOINTS.tournaments.leaderboard(id)).then((response) => response.data),
    enabled: !!id,
    refetchOnMount: 'always',
  });

  // Fetch matches
  const { data: matches, isLoading: isMatchesLoading } = useQuery<MatchItem[]>({
    queryKey: ['tournament-matches', id],
    queryFn: () =>
      https.get(ENDPOINTS.tournaments.matches(id)).then((response) => response.data),
    enabled: !!id,
    refetchOnMount: 'always',
  });

  // Check if current user is participant
  const isEnrolled = tournament?.participants?.some(
    (p: any) => p.userId === user?.id,
  );

  // Join tournament mutation
  const joinMutation = useMutation({
    mutationFn: () =>
      https.post(ENDPOINTS.tournaments.join(id)).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-leaderboard', id] });
    },
  });

  // Status update mutation (Coach)
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      https
        .patch(ENDPOINTS.tournaments.byId(id), { status: newStatus })
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });

  // Real-time Matchmaking Queue & Socket events
  useEffect(() => {
    if (!id || !user) return;
    const socket = getSocket();

    const handlePaired = (data: { matchId: string }) => {
      setIsSearching(false);
      router.push(`/matches/${data.matchId}`);
    };

    const handleLeaderboardUpdate = (data: { tournamentId: string; standings: LeaderboardEntry[] }) => {
      if (data.tournamentId === id) {
        queryClient.setQueryData(['tournament-leaderboard', id], data.standings);
        queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      }
    };

    socket.on('match:paired', handlePaired);
    socket.on('leaderboard:updated', handleLeaderboardUpdate);

    return () => {
      socket.off('match:paired', handlePaired);
      socket.off('leaderboard:updated', handleLeaderboardUpdate);
    };
  }, [id, user, router, queryClient]);

  // Searching timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleStartSearching = () => {
    const socket = getSocket();
    setIsSearching(true);
    socket.emit('queue:join', { tournamentId: id }, (res: any) => {
      if (res && !res.success) {
        setIsSearching(false);
        alert(res.error || 'Failed to enter matchmaking queue');
      }
    });
  };

  const handleCancelSearching = () => {
    const socket = getSocket();
    setIsSearching(false);
    socket.emit('queue:leave', { tournamentId: id });
  };

  // Auto-trigger matchmaking if player arrives via Re-Queue after a match
  useEffect(() => {
    if (
      searchParams?.get('action') === 'find-opponent' &&
      isEnrolled &&
      !isSearching &&
      tournament?.status !== 'COMPLETED'
    ) {
      handleStartSearching();
    }
  }, [searchParams, isEnrolled, tournament?.status]);

  const formatScheduledDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return formatDate(dateStr);
  };

  if (isTournamentLoading || !tournament) {
    return <TournamentPageSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span>Failed to load tournament details. Please check your connection.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] bg-cover bg-right sm:bg-center bg-no-repeat bg-fixed overflow-x-hidden"
      style={{
        backgroundImage: "url('/images/tournaments-bg.jpg')",
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Soft White Atmospheric Wash Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/60 via-50% to-white/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/5 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Top Tournament Banner Card */}
        <div
          className="relative w-full rounded-[22px] overflow-hidden border border-[#E4D5C0] shadow-md bg-cover bg-center min-h-[190px] flex items-center"
          style={{
            backgroundImage: "url('/images/tournament-card-bg.jpg')",
          }}
        >
          {/* Dark Walnut Gradient Mask covering left & middle */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#24130A] via-[#24130A]/95 via-45% to-black/30 pointer-events-none" />

          {/* Banner Content Layout */}
          <div className="relative z-10 w-full p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Metadata & Title */}
            <div className="space-y-3.5 max-w-2xl">
              {/* Row 1: Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="bg-[#C49A52]/20 text-[#E5B869] border border-[#C49A52]/40 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#E5B869] animate-pulse" />
                  <span className="uppercase">{tournament.status}</span>
                </span>

                <span className="bg-white/10 text-white/90 border border-white/20 text-[11px] font-mono px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-[#E5B869]" />
                  <span>{tournament.timeControl}</span>
                </span>

                <span className="text-white/40 hidden sm:inline">|</span>

                <span className="text-xs text-white/80 font-medium">
                  Created by {tournament.creatorName || 'Coach Magnus'}
                </span>
              </div>

              {/* Row 2: Title with Laurel Wreath Branches */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <LeftLaurelBranch />
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-wide leading-tight">
                  {tournament.name}
                </h1>
                <RightLaurelBranch />
              </div>

              {/* Declared Winner Banner on Completion */}
              {tournament.status === 'COMPLETED' && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#FDF3DE]/15 border border-[#C49A52]/60 text-white shadow-md">
                  <Trophy className="w-5 h-5 text-[#E5B869] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">
                    Declared Champion: <span className="text-[#E5B869] font-bold">{tournament.winnerName || leaderboard?.[0]?.name || 'TBD'}</span> 🏆
                  </span>
                </div>
              )}

              {/* Row 3: Enrolled Players & Scheduled Date */}
              <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-white/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#E5B869]" />
                  <span>{tournament.participantCount} Players Enrolled</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#E5B869]" />
                  <span>Scheduled: {formatScheduledDate(tournament.startDateTime)}</span>
                </span>
              </div>
            </div>

            {/* Right Action: Find Opponent or Coach Controls */}
            <div className="shrink-0 flex items-center lg:self-center">
              {user?.role === 'STUDENT' && (
                <>
                  {tournament.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B2418]/90 border border-[#C49A52]/50 text-[#E5B869] font-bold text-sm sm:text-base shadow-lg">
                      <Trophy className="w-5 h-5 text-[#E5B869]" />
                      <span>Tournament Completed</span>
                    </span>
                  ) : !isEnrolled ? (
                    <button
                      onClick={() => joinMutation.mutate()}
                      disabled={joinMutation.isPending}
                      className="px-6 py-3 rounded-xl bg-[#D4A359] hover:bg-[#C49A52] text-[#261A13] font-bold text-sm sm:text-base transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#261A13]" />
                      <span>{joinMutation.isPending ? 'Joining...' : 'Join Tournament'}</span>
                    </button>
                  ) : (
                    <div>
                      {!isSearching ? (
                        <button
                          onClick={handleStartSearching}
                          disabled={tournament.status === 'COMPLETED'}
                          className="px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl bg-[#D4A359] hover:bg-[#C49A52] text-[#261A13] font-bold text-sm sm:text-base transition-all shadow-lg flex items-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Swords className="w-5 h-5 text-[#261A13]" />
                          <span>Find Opponent</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-[#24130A]/90 border border-[#D4A359]/60 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-md">
                          <Search className="w-4 h-4 text-[#D4A359] animate-spin shrink-0" />
                          <div className="text-left">
                            <div className="text-xs font-bold text-[#E5B869]">
                              Searching ({searchTimer}s)
                            </div>
                            <div className="text-[10px] text-white/70">
                              Matching with peer...
                            </div>
                          </div>
                          <button
                            onClick={handleCancelSearching}
                            className="text-xs text-rose-300 hover:text-white px-2 py-1 rounded-md bg-white/10 hover:bg-rose-900/40 ml-1 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {user?.role === 'COACH' && (
                <div className="flex flex-wrap items-center gap-2">
                  {tournament.status === 'OPEN' && (
                    <button
                      onClick={() => statusMutation.mutate('ONGOING')}
                      disabled={statusMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-[#D4A359] hover:bg-[#C49A52] text-[#261A13] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                    >
                      Start Matches (Ongoing)
                    </button>
                  )}
                  {tournament.status === 'ONGOING' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={statusMutation.isPending}
                          className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          {statusMutation.isPending ? 'Completing...' : 'Complete Tournament'}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-serif font-bold text-lg text-rose-800">
                            Complete Tournament?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to end this tournament? All matchmaking will close, current standings will be locked, and the final leaderboard will be declared. This action cannot be reversed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="rounded-xl border border-[#E4D5C0] text-[#261A13] hover:bg-[#F5EBDD] cursor-pointer">
                            Keep Ongoing
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => statusMutation.mutate('COMPLETED')}
                            className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-sm cursor-pointer"
                          >
                            Confirm Completion
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {tournament.status === 'COMPLETED' && (
                    <span className="bg-[#C49A52]/20 text-[#E5B869] border border-[#C49A52]/40 text-xs font-bold px-4 py-2 rounded-xl">
                      🏆 Tournament Concluded
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-8 border-b border-[var(--border)] text-sm">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 transition-colors flex items-center gap-2 font-semibold border-b-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-[#C49A52] text-[#C49A52]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Live Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`pb-3 transition-colors flex items-center gap-2 font-semibold border-b-2 cursor-pointer ${
              activeTab === 'matches'
                ? 'border-[#C49A52] text-[#C49A52]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Matches &amp; Results ({matches?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`pb-3 transition-colors flex items-center gap-2 font-semibold border-b-2 cursor-pointer ${
              activeTab === 'participants'
                ? 'border-[#C49A52] text-[#C49A52]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participants ({tournament.participantCount})</span>
          </button>
        </div>

        {/* Tab 1: Live Leaderboard Table */}
        {activeTab === 'leaderboard' && (
          isLeaderboardLoading || !leaderboard ? (
            <LeaderboardTableSkeleton />
          ) : (
            <div className="w-full rounded-[20px] overflow-hidden border border-[#E4D5C0] bg-[#FFF9EF] shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  {/* Header */}
                  <thead className="bg-[#3B2418] text-[#E4D5C0] text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-4 w-20 text-center">Rank</th>
                      <th className="py-4 px-6 text-left">Player</th>
                      <th className="py-4 px-4 w-28 text-center">Points</th>
                      <th className="py-4 px-4 w-40 text-center">W / D / L</th>
                      <th className="py-4 px-6 w-44 text-center">Buchholz Tiebreak</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="divide-y divide-[#E4D5C0]">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[var(--muted)] italic">
                          No matches completed yet. Scores will update live as games finish.
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((entry) => {
                        const isCurrentUser = entry.userId === user?.id;
                        const rowBg = entry.rank === 1 || isCurrentUser
                          ? 'bg-[#FDF3DE]/90 hover:bg-[#FDF3DE]'
                          : 'bg-[#FFF9EF] hover:bg-[#F5EBDD]/60';

                        return (
                          <tr
                            key={entry.userId}
                            className={`${rowBg} transition-colors`}
                          >
                            {/* Rank Column */}
                            <td className="py-3.5 px-4 text-center font-bold">
                              {entry.rank === 1 ? (
                                <GoldMedalBadge />
                              ) : entry.rank === 2 ? (
                                <SilverMedalBadge />
                              ) : entry.rank === 3 ? (
                                <BronzeMedalBadge />
                              ) : (
                                <span className="text-xs font-semibold text-[var(--muted)]">
                                  #{entry.rank}
                                </span>
                              )}
                            </td>

                            {/* Player Column */}
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                {entry.rank === 1 ? (
                                  <div className="w-10 h-10 rounded-full bg-[#261A13] border border-[#C49A52]/60 flex items-center justify-center text-lg text-[#C49A52] shrink-0 shadow-xs">
                                    ♚
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-base text-[var(--foreground)] shrink-0 shadow-xs">
                                    ♟
                                  </div>
                                )}

                                {/* Info */}
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                    <span>{entry.name}</span>
                                    {isCurrentUser && (
                                      <span className="bg-[#D4A359]/30 text-[#8B5738] border border-[#D4A359]/50 text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-[var(--muted)] truncate">
                                    {entry.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Points Column */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block bg-[#D4A359]/25 text-[#261A13] font-bold text-sm px-3 py-0.5 rounded-full">
                                {entry.score}
                              </span>
                            </td>

                            {/* W / D / L Column */}
                            <td className="py-3.5 px-4 text-center text-xs font-semibold tracking-wide">
                              <span className="text-emerald-700">{entry.wins}W</span>
                              <span className="text-[var(--muted)]"> / </span>
                              <span className="text-amber-800">{entry.draws}D</span>
                              <span className="text-[var(--muted)]"> / </span>
                              <span className="text-rose-700">{entry.losses}L</span>
                            </td>

                            {/* Buchholz Tiebreak Column */}
                            <td className="py-3.5 px-6 text-center text-sm font-medium text-[var(--foreground)]">
                              {(entry.buchholzScore / 1000).toFixed(1)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Tab 2: Matches & Results Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {isMatchesLoading || !matches ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#E4D5C0] shadow-sm flex items-center justify-between gap-4 animate-pulse"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="h-4 w-20 rounded-full bg-[#E4D5C0]" />
                      <div className="h-4 w-44 rounded bg-[#E4D5C0]" />
                      <div className="h-3 w-28 rounded bg-[#E4D5C0]/60" />
                    </div>
                    <div className="h-8 w-16 rounded-xl bg-[#E4D5C0]" />
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 bg-[#FFF9EF] border border-[#E4D5C0] rounded-2xl text-[var(--muted)] italic">
                No matches have taken place yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m) => {
                  const isWhiteWinner = m.result === 'WHITE_WIN';
                  const isBlackWinner = m.result === 'BLACK_WIN';
                  const isDraw = m.result === 'DRAW';

                  const resultScore = isWhiteWinner ? '1 - 0' : isBlackWinner ? '0 - 1' : isDraw ? '½ - ½' : '';
                  const resultText = isWhiteWinner
                    ? `${m.whitePlayer?.name || 'White'} won`
                    : isBlackWinner
                    ? `${m.blackPlayer?.name || 'Black'} won`
                    : isDraw
                    ? 'Drawn'
                    : '';

                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#E4D5C0] shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          {m.status === 'IN_PROGRESS' ? (
                            <span className="bg-[#3B2418] text-[#C49A52] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C49A52] animate-pulse" />
                              LIVE
                            </span>
                          ) : (
                            <span className="bg-emerald-900/90 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <span>Completed</span>
                              {resultScore && (
                                <span className="font-mono text-amber-300 font-extrabold">({resultScore})</span>
                              )}
                            </span>
                          )}
                          {m.terminationReason && (
                            <span className="text-[11px] text-[var(--muted)] font-medium capitalize">
                              • {m.terminationReason.toLowerCase()}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                          <span className={isWhiteWinner ? 'text-[#8B5738] font-extrabold underline decoration-[#C49A52]' : ''}>
                            {m.whitePlayer?.name || 'White'}
                          </span>
                          <span className="text-xs text-[var(--muted)] font-normal">vs</span>
                          <span className={isBlackWinner ? 'text-[#8B5738] font-extrabold underline decoration-[#C49A52]' : ''}>
                            {m.blackPlayer?.name || 'Black'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                          <span>{formatDate(m.startedAt)}</span>
                          {m.status === 'COMPLETED' && resultText && (
                            <span className="text-emerald-700 font-semibold">• {resultText}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/matches/${m.id}`)}
                        className="px-4 py-2 rounded-xl bg-[#3B2418] hover:bg-[#8B5738] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Participants Tab */}
        {activeTab === 'participants' && (
          <div className="p-6 rounded-2xl bg-[#FFF9EF] border border-[#E4D5C0] shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C49A52]" />
              <span>Registered Students ({tournament.participants?.length || 0})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tournament.participants?.map((p: any) => (
                <div
                  key={p.userId}
                  className="p-3.5 rounded-xl bg-[var(--background)] border border-[#E4D5C0] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] truncate">
                      {p.email}
                    </div>
                  </div>
                  <span className="bg-[#C49A52]/20 text-[#8B5738] border border-[#C49A52]/40 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    Enrolled
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(TournamentDetailPage);
