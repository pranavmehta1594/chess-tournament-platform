'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/auth-context';
import { fetchApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import { Swords, Trophy, Clock, ArrowRight, Eye } from 'lucide-react';

export default function MyMatchesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: matches, isLoading } = useQuery<any[]>({
    queryKey: ['my-matches'],
    queryFn: () => fetchApi('/matches/my-history'),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Swords className="w-8 h-8 text-amber-500" />
          My Match History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your past games, results, and played PGN records
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && matches?.length === 0 && (
        <Card className="text-center py-16 text-slate-400">
          <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Matches Found</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            You haven't played any matches yet. Enter an open tournament to get matched!
          </p>
          <Button variant="primary" onClick={() => router.push('/tournaments')}>
            Browse Tournaments
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {matches?.map((m) => {
          const isWhite = user?.id === m.whitePlayerId;
          const opponent = isWhite ? m.blackPlayer : m.whitePlayer;
          const isWinner =
            (isWhite && m.result === 'WHITE_WIN') || (!isWhite && m.result === 'BLACK_WIN');
          const isDraw = m.result === 'DRAW';

          let badgeVariant: any = 'default';
          let resultLabel = 'Loss (0.0)';
          if (m.result === 'ONGOING') {
            badgeVariant = 'warning';
            resultLabel = 'In Progress';
          } else if (isWinner) {
            badgeVariant = 'success';
            resultLabel = 'Win (+1.0)';
          } else if (isDraw) {
            badgeVariant = 'info';
            resultLabel = 'Draw (+0.5)';
          }

          return (
            <Card
              key={m.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant}>{resultLabel}</Badge>
                  {m.tournament && (
                    <span className="text-xs text-slate-400">
                      in <span className="font-semibold text-slate-300">{m.tournament.name}</span>
                    </span>
                  )}
                </div>

                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>vs {opponent?.name || 'Unknown'}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({isWhite ? 'White' : 'Black'})
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  {formatDate(m.startedAt)}
                  {m.terminationReason && ` • by ${m.terminationReason}`}
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/matches/${m.id}`)}
                  className="gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Board
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

