'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/auth-context';
import { withAuth } from '../../components/auth/WithAuth';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatTime } from '../../lib/utils';
import {
  Swords,
  Trophy,
  Clock,
  Calendar,
  Hourglass,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface MatchItem {
  id: string;
  tournamentId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  terminationReason?: string;
  startedAt: string;
  endedAt?: string;
  whiteTimeRemainingMs?: number;
  blackTimeRemainingMs?: number;
  whitePlayer?: { name: string };
  blackPlayer?: { name: string };
  tournament?: { name: string };
}

function formatMatchDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

function WhitePawnAvatar() {
  return (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-xs">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
        <circle cx="12" cy="7" r="3.5" fill="#FFF9EF" stroke="var(--muted)" strokeWidth="1.2" />
        <path
          d="M9 11C9 10.5 10 10.5 12 10.5C14 10.5 15 10.5 15 11C15 12 14 13 14 14C15 15 16 17 17 19H7C8 17 9 15 10 14C10 13 9 12 9 11Z"
          fill="#FFF9EF"
          stroke="var(--muted)"
          strokeWidth="1.2"
        />
        <path d="M6 20H18V21.5H6V20Z" fill="#FFF9EF" stroke="var(--muted)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

function BlackPawnAvatar() {
  return (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-xs">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
        <circle cx="12" cy="7" r="3.5" fill="var(--foreground)" stroke="var(--primary)" strokeWidth="1.2" />
        <path
          d="M9 11C9 10.5 10 10.5 12 10.5C14 10.5 15 10.5 15 11C15 12 14 13 14 14C15 15 16 17 17 19H7C8 17 9 15 10 14C10 13 9 12 9 11Z"
          fill="var(--foreground)"
          stroke="var(--primary)"
          strokeWidth="1.2"
        />
        <path d="M6 20H18V21.5H6V20Z" fill="var(--foreground)" stroke="var(--primary)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

function MyMatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: matches, isLoading, error, refetch } = useQuery<MatchItem[]>({
    queryKey: ['my-matches'],
    queryFn: () => fetchApi('/matches/my-history'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Listen for real-time match completion events to refresh list automatically
  React.useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      refetch();
    };

    socket.on('match:ended', handleUpdate);
    socket.on('match:started', handleUpdate);
    socket.on('leaderboard:updated', handleUpdate);

    return () => {
      socket.off('match:ended', handleUpdate);
      socket.off('match:started', handleUpdate);
      socket.off('leaderboard:updated', handleUpdate);
    };
  }, [queryClient, refetch]);

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3.5 pb-6 border-b border-[var(--border)]">
          <div className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <Swords className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
              My Match History
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
              Review your past games, results, and played PGN records
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-24 rounded-full bg-[var(--border)]" />
                  <div className="h-4 w-48 rounded bg-[var(--border)]/60" />
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[var(--border)]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 rounded bg-[var(--border)]" />
                      <div className="h-3 w-16 rounded bg-[var(--border)]/60" />
                    </div>
                    <div className="w-6 h-4 rounded bg-[var(--border)]/40" />
                    <div className="w-11 h-11 rounded-full bg-[var(--border)]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 rounded bg-[var(--border)]" />
                      <div className="h-3 w-16 rounded bg-[var(--border)]/60" />
                    </div>
                  </div>
                  <div className="h-10 w-28 rounded-xl bg-[var(--border)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>Failed to load match history. Please check your connection.</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches && matches.length === 0 && (
          <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md mx-auto p-8 shadow-sm">
            <Trophy className="w-12 h-12 text-[var(--accent)] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">No Matches Found</h3>
            <p className="text-xs text-[var(--muted)] mt-1 mb-6">
              You haven&apos;t played any matches yet. Enter an open tournament to get matched!
            </p>
            <button
              onClick={() => router.push('/tournaments')}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--secondary)] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Browse Tournaments
            </button>
          </div>
        )}

        {/* Matches List */}
        <div className="space-y-4">
          {matches?.map((m) => {
            const isWhite = user?.id === m.whitePlayerId;
            const isOngoing = m.status === 'IN_PROGRESS' || m.result === 'ONGOING';
            const isDraw = m.result === 'DRAW';
            const isWhiteWin = m.result === 'WHITE_WIN';
            const isBlackWin = m.result === 'BLACK_WIN';

            // Determine left border accent
            let borderAccentClass = 'border-l-4 border-l-[var(--border)]';
            if (isOngoing) {
              borderAccentClass = 'border-l-4 border-l-[var(--accent)]';
            } else if (isWhiteWin || isBlackWin) {
              borderAccentClass = 'border-l-4 border-l-emerald-700';
            } else if (isDraw) {
              borderAccentClass = 'border-l-4 border-l-[var(--muted)]';
            }

            // Status label
            let resultBadgeText = 'Completed';
            if (isOngoing) {
              resultBadgeText = 'In Progress';
            } else if (isWhiteWin) {
              resultBadgeText = 'White Won (+1.0)';
            } else if (isBlackWin) {
              resultBadgeText = 'Black Won (+1.0)';
            } else if (isDraw) {
              resultBadgeText = 'Draw (+0.5)';
            }

            const whiteName = m.whitePlayer?.name || 'White Player';
            const blackName = m.blackPlayer?.name || 'Black Player';
            const tournamentTitle = m.tournament?.name || 'Tournament Arena';

            return (
              <div
                key={m.id}
                className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 ${borderAccentClass} flex flex-col gap-4`}
              >
                {/* Row 1: Status & Tournament Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill Badge */}
                    {isOngoing ? (
                      <span className="bg-[var(--primary)] text-[var(--accent)] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span>In Progress</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-900/90 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Trophy className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{resultBadgeText}</span>
                      </span>
                    )}

                    {/* Tournament Name */}
                    <span className="text-xs sm:text-sm text-[var(--muted)]">
                      in <span className="font-semibold text-[var(--foreground)]">{tournamentTitle}</span>
                    </span>
                  </div>

                  {/* Termination Badge if Completed */}
                  {!isOngoing && m.terminationReason && (
                    <span className="bg-rose-100/90 border border-rose-200 text-rose-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      <span className="capitalize">{m.terminationReason.toLowerCase()}</span>
                    </span>
                  )}
                </div>

                {/* Row 2: Players VS, Match Meta, Action Button */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pt-1">
                  {/* Left: Players VS Column (5 cols) */}
                  <div className="lg:col-span-5 flex items-center gap-3 sm:gap-4">
                    {/* White Player */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <WhitePawnAvatar />
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                          {whiteName}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          (White)
                        </div>
                      </div>
                    </div>

                    {/* VS Badge */}
                    <span className="text-[11px] font-bold text-[var(--muted)] bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded-md shrink-0">
                      vs
                    </span>

                    {/* Black Player */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BlackPawnAvatar />
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                          {blackName}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          (Black)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Match Meta Column (4 cols) */}
                  <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-3 lg:pt-0 lg:pl-6 space-y-1.5 text-xs text-[var(--foreground)]">
                    {isOngoing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                          <span>
                            <span className="text-[var(--muted)]">Started: </span>
                            {formatMatchDate(m.startedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hourglass className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                          <span>
                            <span className="text-[var(--muted)]">Time Left: </span>
                            {formatTime(m.whiteTimeRemainingMs ?? 300000)} (White) | {formatTime(m.blackTimeRemainingMs ?? 300000)} (Black)
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                          <span>
                            <span className="text-[var(--muted)]">Started: </span>
                            {formatMatchDate(m.startedAt)}
                          </span>
                        </div>
                        {m.endedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                            <span>
                              <span className="text-[var(--muted)]">Ended: </span>
                              {formatMatchDate(m.endedAt)}
                            </span>
                          </div>
                        )}
                        {m.terminationReason && (
                          <div className="flex items-center gap-2">
                            <Hourglass className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                            <span>
                              <span className="text-[var(--muted)]">Reason: </span>
                              <span className="capitalize">{m.terminationReason.toLowerCase()}</span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: View Board Action Button (3 cols) */}
                  <div className="lg:col-span-3 flex lg:justify-end items-center pt-2 lg:pt-0">
                    <button
                      onClick={() => router.push(`/matches/${m.id}`)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--secondary)] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Board</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default withAuth(MyMatchesPage);
