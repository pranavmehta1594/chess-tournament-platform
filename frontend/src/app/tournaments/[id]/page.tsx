'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/auth-context';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  Trophy,
  Swords,
  Users,
  Clock,
  Sparkles,
  Search,
  Eye,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

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
  whitePlayer: { id: string; name: string };
  blackPlayer: { id: string; name: string };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  terminationReason?: string;
  startedAt: string;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'matches' | 'participants'>('leaderboard');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [queueLength, setQueueLength] = useState(1);

  // Fetch tournament details
  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => fetchApi(`/tournaments/${id}`),
    enabled: !!id,
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['tournament-leaderboard', id],
    queryFn: () => fetchApi(`/tournaments/${id}/leaderboard`),
    enabled: !!id,
  });

  // Fetch matches
  const { data: matches } = useQuery<MatchItem[]>({
    queryKey: ['tournament-matches', id],
    queryFn: () => fetchApi(`/tournaments/${id}/matches`),
    enabled: !!id,
  });

  // Check if current user is participant
  const isEnrolled = tournament?.participants?.some(
    (p: any) => p.userId === user?.id,
  );

  // Join tournament mutation
  const joinMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/tournaments/${id}/join`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-leaderboard', id] });
    },
  });

  // Status update mutation (Coach)
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      fetchApi(`/tournaments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    },
  });

  // Matchmaking Queue & Real-time Socket listener
  useEffect(() => {
    if (!id || !user) return;
    const socket = getSocket();

    // Listen for automatic pairing push!
    const handlePaired = (data: { matchId: string }) => {
      setIsSearching(false);
      router.push(`/matches/${data.matchId}`);
    };

    // Listen for live leaderboard updates
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

  // Searching elapsed timer
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
        alert(res.error || 'Failed to enter queue');
      } else if (res && res.queueLength) {
        setQueueLength(res.queueLength);
      }
    });
  };

  const handleCancelSearching = () => {
    const socket = getSocket();
    setIsSearching(false);
    socket.emit('queue:leave', { tournamentId: id });
  };

  if (isLoading || !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner Card */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  tournament.status === 'OPEN'
                    ? 'success'
                    : tournament.status === 'ONGOING'
                      ? 'warning'
                      : 'default'
                }
              >
                ● {tournament.status}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-500 mr-1" />
                {tournament.timeControl}
              </Badge>
              <span className="text-xs text-slate-400">
                Created by {tournament.creatorName || 'Coach'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                {tournament.participantCount} Players Enrolled
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Scheduled: {new Date(tournament.startDateTime).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex flex-col gap-3 sm:items-end">
            {user?.role === 'STUDENT' && (
              <>
                {!isEnrolled ? (
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={joinMutation.isPending}
                    onClick={() => joinMutation.mutate()}
                    className="gap-2 shadow-lg shadow-amber-600/30"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Join Tournament
                  </Button>
                ) : (
                  <div>
                    {!isSearching ? (
                      <Button
                        variant="primary"
                        size="lg"
                        disabled={tournament.status === 'COMPLETED'}
                        onClick={handleStartSearching}
                        className="gap-2.5 font-bold shadow-xl shadow-amber-600/30 text-base px-8 py-4"
                      >
                        <Swords className="w-5 h-5" />
                        Find Opponent
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2 bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 max-w-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                            <span className="text-xs font-bold text-amber-300">
                              Searching for opponent ({searchTimer}s)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelSearching}
                            className="text-xs text-slate-400 hover:text-rose-400 h-7 px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Waiting for another player. Open an incognito window, log in as Student 2 (or any other student), and click <strong>&quot;Find Opponent&quot;</strong> to start!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {user?.role === 'COACH' && (
              <div className="flex flex-wrap items-center gap-2">
                {tournament.status === 'OPEN' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => statusMutation.mutate('ONGOING')}
                    isLoading={statusMutation.isPending}
                  >
                    Start Matches (Ongoing)
                  </Button>
                )}
                {tournament.status === 'ONGOING' && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => statusMutation.mutate('COMPLETED')}
                    isLoading={statusMutation.isPending}
                  >
                    Complete Tournament & Declare Winner
                  </Button>
                )}
                {tournament.status === 'COMPLETED' && (
                  <Badge variant="success" className="text-sm py-1.5 px-3">
                    🏆 Tournament Concluded
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'leaderboard'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Live Leaderboard
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'matches'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords className="w-4 h-4" />
          Matches & Results ({matches?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'participants'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Participants ({tournament.participantCount})
        </button>
      </div>

      {/* Tab 1: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <Card className="overflow-hidden p-0 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4 text-center">Points</th>
                  <th className="py-3.5 px-4 text-center">W / D / L</th>
                  <th className="py-3.5 px-4 text-center" title="Sum of opponents' points">
                    Buchholz Tiebreak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                      No matches completed yet. Scores will update live as games finish.
                    </td>
                  </tr>
                ) : (
                  leaderboard?.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        entry.userId === user?.id ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold">
                        {entry.rank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="text-slate-400">#{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{entry.name}</span>
                          {entry.userId === user?.id && (
                            <Badge variant="outline" className="text-[10px]">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{entry.email}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-base font-extrabold text-amber-400">
                          {entry.score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                        <span className="text-emerald-400">{entry.wins}W</span>
                        {' / '}
                        <span className="text-sky-400">{entry.draws}D</span>
                        {' / '}
                        <span className="text-rose-400">{entry.losses}L</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                        {(entry.buchholzScore / 1000).toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Matches */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches?.length === 0 ? (
            <Card className="text-center py-12 text-slate-400">
              No matches have taken place yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches?.map((m) => (
                <Card
                  key={m.id}
                  className="p-5 flex items-center justify-between border-slate-800 bg-slate-900/60"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={m.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                        className="text-[10px]"
                      >
                        {m.status === 'IN_PROGRESS' ? '● LIVE' : 'Completed'}
                      </Badge>
                      {m.terminationReason && (
                        <span className="text-[10px] text-slate-500 uppercase">
                          {m.terminationReason}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
                        {m.whitePlayer?.name}
                      </div>
                      <span className="text-xs font-semibold text-slate-500">vs</span>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600 inline-block" />
                        {m.blackPlayer?.name}
                      </div>
                    </div>

                    {m.result !== 'ONGOING' && (
                      <div className="text-xs font-mono font-bold text-amber-400">
                        Result: {m.result === 'WHITE_WIN' ? '1 - 0' : m.result === 'BLACK_WIN' ? '0 - 1' : '½ - ½'}
                      </div>
                    )}
                  </div>

                  <div className="pl-4">
                    {m.status === 'IN_PROGRESS' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/matches/${m.id}`)}
                        className="gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {user?.id === m.whitePlayer?.id || user?.id === m.blackPlayer?.id
                          ? 'Resume'
                          : 'Spectate'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/matches/${m.id}`)}
                      >
                        View Game
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Participants */}
      {activeTab === 'participants' && (
        <Card className="p-6 border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tournament.participants?.map((p: any) => (
              <div
                key={p.userId}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-200">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.email}</div>
                </div>
                <Badge variant="info">Enrolled</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
