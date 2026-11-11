'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/auth-context';
import { fetchApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import {
  Plus,
  Users,
  Clock,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Trophy,
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

function TrophyHeaderIcon() {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Trophy cup */}
        <path
          d="M23 18H37V28C37 32 34 35 30 35C26 35 23 32 23 28V18Z"
          fill="#C49A52"
        />
        {/* Handles */}
        <path
          d="M23 20H18C16.5 20 16 21 16 23C16 26 19 28 23 28"
          stroke="#C49A52"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M37 20H42C43.5 20 44 21 44 23C44 26 41 28 37 28"
          stroke="#C49A52"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Stem and Base */}
        <path d="M28 35H32V41H28V35Z" fill="#C49A52" />
        <path d="M22 41H38V44H22V41Z" fill="#C49A52" />
        {/* Left Laurel */}
        <path
          d="M14 22C10 28 10 36 14 42C15 43.5 13.5 45 12 44C7 38 7 28 12 21C13 20 14.5 21 14 22Z"
          fill="#C49A52"
        />
        <circle cx="8" cy="28" r="1.8" fill="#C49A52" />
        <circle cx="7" cy="34" r="1.8" fill="#C49A52" />
        <circle cx="9" cy="40" r="1.8" fill="#C49A52" />
        {/* Right Laurel */}
        <path
          d="M46 22C50 28 50 36 46 42C45 43.5 46.5 45 48 44C53 38 53 28 48 21C47 20 45.5 21 46 22Z"
          fill="#C49A52"
        />
        <circle cx="52" cy="28" r="1.8" fill="#C49A52" />
        <circle cx="53" cy="34" r="1.8" fill="#C49A52" />
        <circle cx="51" cy="40" r="1.8" fill="#C49A52" />
      </svg>
    </div>
  );
}

function LaurelBranchIcon() {
  return (
    <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-7 shrink-0 mr-1.5 self-center">
      <path
        d="M14 4C8 10 7 20 12 28C13 29.5 11.5 31 10 30C4 22 5 11 11 3C12.2 2 14.5 3 14 4Z"
        fill="#C49A52"
      />
      <circle cx="6" cy="11" r="2" fill="#C49A52" />
      <circle cx="5" cy="18" r="2" fill="#C49A52" />
      <circle cx="7" cy="25" r="2" fill="#C49A52" />
    </svg>
  );
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

  const getStatusLabel = (status: Tournament['status']) => {
    switch (status) {
      case 'OPEN':
        return 'Registration Open';
      case 'ONGOING':
        return 'Matches in Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'DRAFT':
        return 'Draft';
      default:
        return 'Active';
    }
  };

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] bg-cover bg-right sm:bg-center bg-no-repeat bg-fixed overflow-x-hidden"
      style={{
        backgroundImage: "url('/images/tournaments-bg.jpg')",
        backgroundColor: '#F5EBDD',
      }}
    >
      {/* Soft White Atmospheric Wash Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/60 via-50% to-white/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/5 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4D5C0]">
          <div className="flex items-center gap-3.5">
            <TrophyHeaderIcon />
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#261A13] tracking-tight">
                Tournaments
              </h1>
              <p className="text-xs sm:text-sm text-[#887765] mt-0.5">
                {user?.role === 'COACH'
                  ? 'Organize tournaments, oversee student live matches, and view real-time standings'
                  : 'Join open tournaments, auto-match against peers, and rise up the leaderboard'}
              </p>
            </div>
          </div>

          {user?.role === 'COACH' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B2418] hover:bg-[#8B5738] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-[0.99] self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tournament</span>
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-[22px] bg-[#FFF9EF] border border-[#E4D5C0] animate-pulse p-6"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>Failed to load tournaments. Please check your connection.</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tournaments && tournaments.length === 0 && (
          <div className="text-center py-16 bg-[#FFF9EF] border border-[#E4D5C0] rounded-2xl max-w-md mx-auto p-8 shadow-sm">
            <Trophy className="w-12 h-12 text-[#C49A52] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#261A13]">No Tournaments Found</h3>
            <p className="text-xs text-[#887765] mt-1 mb-6">
              {user?.role === 'COACH'
                ? 'Click below to create the first tournament.'
                : 'Waiting for coach to create a tournament. Check back shortly.'}
            </p>
            {user?.role === 'COACH' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#3B2418] hover:bg-[#8B5738] text-white text-xs font-semibold rounded-xl"
              >
                Create Tournament
              </button>
            )}
          </div>
        )}

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments?.map((tourney) => (
            <div
              key={tourney.id}
              className="w-full max-w-[360px] bg-[#FFF9EF] border border-[#E4D5C0] rounded-[22px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Card Image Header (Top Half) */}
              <div
                className="relative h-44 sm:h-48 bg-cover bg-center flex flex-col justify-between p-4"
                style={{
                  backgroundImage: "url('/images/tournament-card-bg.jpg')",
                }}
              >
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

                {/* Top badges row */}
                <div className="relative z-10 flex items-center justify-between">
                  {/* Status Badge */}
                  <span className="bg-black/50 backdrop-blur-sm border border-[#C49A52]/40 text-[#E4D5C0] text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C49A52] animate-pulse" />
                    <span>{getStatusLabel(tourney.status)}</span>
                  </span>

                  {/* Time Control Badge */}
                  <span className="bg-black/50 backdrop-blur-sm border border-[#C49A52]/40 text-[#E4D5C0] text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm font-mono">
                    <Clock className="w-3 h-3 text-[#C49A52]" />
                    <span>{tourney.timeControl}</span>
                  </span>
                </div>

                {/* Title & Laurel */}
                <div className="relative z-10 flex items-center">
                  <LaurelBranchIcon />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide leading-tight drop-shadow-md group-hover:text-[#F5EBDD] transition-colors">
                    {tourney.name}
                  </h3>
                </div>
              </div>

              {/* Card Details (Bottom Half) */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-[#FFF9EF]">
                <div className="space-y-2.5 text-xs text-[#261A13] font-medium">
                  <div className="flex items-center gap-2 text-[#887765]">
                    <Calendar className="w-4 h-4 text-[#887765] shrink-0" />
                    <span className="text-[#261A13]">
                      Scheduled: {formatDate(tourney.startDateTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#887765]">
                    <Users className="w-4 h-4 text-[#887765] shrink-0" />
                    <span className="text-[#261A13]">
                      {tourney.participantCount} Players Enrolled
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 mt-4 border-t border-[#E4D5C0]">
                  <button
                    onClick={() => router.push(`/tournaments/${tourney.id}`)}
                    className="w-full h-11 bg-[#3B2418] hover:bg-[#8B5738] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group-hover:shadow-md active:scale-[0.99]"
                  >
                    <span>
                      {user?.role === 'COACH' ? 'Manage Tournament' : 'Enter Arena'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Tournament Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#FFF9EF] border border-[#E4D5C0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#261A13]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4D5C0]">
                <h3 className="font-serif text-lg font-bold text-[#261A13] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C49A52]" />
                  New Tournament
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#887765] hover:text-[#261A13] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#261A13] mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kingdom Blitz Championship 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF5EC] border border-[#E4D5C0] text-[#261A13] text-sm focus:ring-2 focus:ring-[#8B5738] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#261A13] mb-1">
                    Time Control
                  </label>
                  <select
                    value={timeControl}
                    onChange={(e) => setTimeControl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF5EC] border border-[#E4D5C0] text-[#261A13] text-sm focus:ring-2 focus:ring-[#8B5738] focus:outline-none"
                  >
                    <option value="5+0">5+0 (5 minutes, no increment)</option>
                    <option value="3+2">3+2 (3 minutes, +2s increment)</option>
                    <option value="3+0">3+0 (3 minutes Blitz)</option>
                    <option value="10+0">10+0 (10 minutes Rapid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#261A13] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF5EC] border border-[#E4D5C0] text-[#261A13] text-sm focus:ring-2 focus:ring-[#8B5738] focus:outline-none"
                  >
                    <option value="OPEN">OPEN (Students can self-join & play)</option>
                    <option value="DRAFT">DRAFT (Hidden from matchmaking)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E4D5C0] bg-white/70 hover:bg-[#F5EBDD] text-[#261A13] text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2.5 rounded-xl bg-[#3B2418] hover:bg-[#8B5738] text-white text-xs font-semibold transition-colors shadow-md disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
