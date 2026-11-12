'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';
import {
  Trophy,
  Swords,
  User,
  LogOut,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
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
} from './alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!user) return null;

  const isMatchPage = pathname?.startsWith('/matches/');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Sleek Match Mode Header matching mockup
  if (isMatchPage) {
    return (
      <nav className="border-b border-[#3A2214] bg-[#24130A]/95 backdrop-blur-md sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Brand */}
            <Link href="/tournaments" className="flex items-center gap-2.5 group">
              <span className="text-2xl text-[#C49A52] group-hover:scale-105 transition-transform">
                ♚
              </span>
              <div>
                <span className="font-extrabold text-white tracking-wider text-base sm:text-lg block leading-tight">
                  KINGDOM
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#C49A52] block font-bold leading-none">
                  OF CHESS
                </span>
              </div>
            </Link>

            {/* Match Mode Controls */}
            <div className="flex items-center gap-2">
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Settings / Sound Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Match Settings"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Help Button */}
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                title="Match Rules & Help"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Exit to Tournaments Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    title="Exit to Tournament Lobby"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-900/40 border border-white/10 hover:border-rose-700/50 flex items-center justify-center text-white/80 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave this match?</AlertDialogTitle>
                    <AlertDialogDescription>
                      If your game is currently in progress, your timer will continue running. You can return from the tournament lobby anytime.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel className="rounded-xl border border-[#E4D5C0] text-[#261A13] hover:bg-[#F5EBDD] cursor-pointer">
                      Stay in Match
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => router.push('/tournaments')}
                      className="rounded-xl bg-[#3B2418] hover:bg-[#8B5738] text-white shadow-sm cursor-pointer"
                    >
                      Exit to Lobby
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-sm bg-[#FFF9EF] border border-[#E4D5C0] text-[#261A13] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold text-lg text-[#3B2418]">
                Match Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5EBDD] border border-[#E4D5C0]">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#C49A52]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#887765]" />
                  )}
                  <span className="text-sm font-semibold text-[#261A13]">Move Sounds</span>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'bg-[#3B2418] text-white'
                      : 'bg-[#E4D5C0] text-[#887765]'
                  }`}
                >
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Help Dialog */}
        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <DialogContent className="max-w-md bg-[#FFF9EF] border border-[#E4D5C0] text-[#261A13] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold text-lg text-[#3B2418]">
                Kingdom of Chess Match Rules
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#887765]">
              <p>
                • <strong>Clock Timer:</strong> Each player begins with the tournament time control (e.g., 5 min). Clocks tick down on your turn.
              </p>
              <p>
                • <strong>Movement:</strong> Click or drag a piece to an allowable square to make your move.
              </p>
              <p>
                • <strong>Draw Offers &amp; Resignation:</strong> Use the game controls to propose a draw or resign if the position is lost.
              </p>
              <p>
                • <strong>Scores:</strong> Win = 1 point, Draw = 0.5 points, Loss = 0 points, updating live on the tournament leaderboard!
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    );
  }

  // Standard Global Navbar for all other pages
  return (
    <nav className="border-b border-[#2A180E] bg-[#3B2418] sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-7">
            <Link href="/tournaments" className="flex items-center gap-2.5 group">
              <span className="text-2xl text-[#C49A52] group-hover:scale-105 transition-transform">
                ♚
              </span>
              <div>
                <span className="font-extrabold text-white tracking-wider text-base sm:text-lg block leading-tight">
                  KINGDOM
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#C49A52] block font-bold leading-none">
                  OF CHESS
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/tournaments"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname.startsWith('/tournaments')
                  ? 'bg-[#8B5738] text-white shadow-sm font-semibold'
                  : 'text-[#E4D5C0] hover:text-white hover:bg-[#4E3020]'
                  }`}
              >
                <Trophy className="w-4 h-4 text-[#C49A52]" />
                Tournaments
              </Link>

              {user.role === 'STUDENT' && (
                <Link
                  href="/my-matches"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === '/my-matches'
                    ? 'bg-[#8B5738] text-white shadow-sm font-semibold'
                    : 'text-[#E4D5C0] hover:text-white hover:bg-[#4E3020]'
                    }`}
                >
                  <Swords className="w-4 h-4 text-[#C49A52]" />
                  My Match History
                </Link>
              )}
            </div>
          </div>

          {/* Right User Actions */}
          <div className="flex items-center gap-3">
            {/* Current user container pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#2A170F] border border-[#8B5738]/50">
              <User className="w-4 h-4 text-[#C49A52]" />
              <span className="text-xs sm:text-sm font-medium text-white">{user.name}</span>
              <span className="bg-[#8B5738] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <span>{user.role === 'COACH' ? '♚' : '♟'}</span>
                <span>{user.role === 'COACH' ? 'Coach' : 'Student'}</span>
              </span>
            </div>

            {/* Sign out button with confirmation AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  title="Sign out"
                  className="p-1.5 rounded-lg text-[#E4D5C0] hover:text-[#C49A52] hover:bg-[#4E3020] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll be signed out of your Kingdom of Chess account. You can log back in anytime to continue your chess journey.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2">
                  <AlertDialogCancel className="rounded-xl border border-[#E4D5C0] text-[#261A13] hover:bg-[#F5EBDD] cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logout}
                    className="rounded-xl bg-[#3B2418] hover:bg-rose-700 text-white shadow-sm cursor-pointer"
                  >
                    Confirm Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </nav>
  );
}
