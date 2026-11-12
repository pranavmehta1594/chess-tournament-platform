'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';
import { Trophy, Swords, User, LogOut } from 'lucide-react';
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

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

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
