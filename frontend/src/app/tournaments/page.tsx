'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/auth-context';
import { fetchApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import {
  Trophy,
  Plus,
  Users,
  Clock,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  timeControl: string;
  initialTimeSeconds: number;
  incrementSeconds: number;
  startDateTime: string;
  status: 'DRAFT' | 'OPEN' | 'ONGOING' | 'COMPLETED';
  participantCount: number;
  creatorName?: string;
  createdAt: string;
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Create tournament modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [timeControl, setTimeControl] = useState('5+0');
  const [status, setStatus] = useState<'OPEN' | 'DRAFT'>('OPEN');

  const { data: tournaments, isLoading, error } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: () => fetchApi('/tournaments'),
  });

  const createMutation = useMutation({
    mutationFn: (newTourney: any) =>
      fetchApi('/tournaments', {
        method: 'POST',
        body: JSON.stringify(newTourney),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setIsModalOpen(false);
      setName('');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      timeControl,
      startDateTime: new Date().toISOString(),
      status,
    });
  };

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success">● Registration Open</Badge>;
      case 'ONGOING':
        return <Badge variant="warning">● Matches in Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Tournaments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {user?.role === 'COACH'
              ? 'Organize tournaments, oversee student live matches, and view real-time standings'
              : 'Join open tournaments, auto-match against peers, and rise up the leaderboard'}
          </p>
        </div>

        {user?.role === 'COACH' && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Tournament
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-slate-900 border border-slate-800 animate-pulse p-6"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>Failed to load tournaments. Please check your backend connection.</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tournaments && tournaments.length === 0 && (
        <Card className="text-center py-16">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Tournaments Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {user?.role === 'COACH'
              ? 'Click the button below to create the first tournament.'
              : 'Waiting for coach to create a tournament. Check back shortly.'}
          </p>
          {user?.role === 'COACH' && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create Tournament
            </Button>
          )}
        </Card>
      )}

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments?.map((tourney) => (
          <Card
            key={tourney.id}
            className="hover:border-slate-700 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                {getStatusBadge(tourney.status)}
                <Badge variant="outline" className="font-mono text-xs">
                  <Clock className="w-3 h-3 text-amber-500 mr-1" />
                  {tourney.timeControl}
                </Badge>
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                {tourney.name}
              </h3>

              <div className="space-y-2 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Scheduled: {formatDate(tourney.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{tourney.participantCount} Players Enrolled</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-between"
                onClick={() => router.push(`/tournaments/${tourney.id}`)}
              >
                <span>
                  {user?.role === 'COACH' ? 'Manage Tournament' : 'Enter Arena'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Tournament Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                New Tournament
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tournament Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kingdom Blitz Championship"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Time Control
                </label>
                <select
                  value={timeControl}
                  onChange={(e) => setTimeControl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="5+0">5+0 (5 minutes, no increment)</option>
                  <option value="3+2">3+2 (3 minutes, +2s increment)</option>
                  <option value="3+0">3+0 (3 minutes Blitz)</option>
                  <option value="10+0">10+0 (10 minutes Rapid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="OPEN">OPEN (Students can self-join & play)</option>
                  <option value="DRAFT">DRAFT (Hidden from matchmaking)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createMutation.isPending}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

