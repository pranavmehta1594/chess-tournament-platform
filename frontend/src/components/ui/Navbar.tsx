'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';
import { Trophy, Swords, User, LogOut, ChevronDown } from 'lucide-react';

const SEED_USERS = [
  { role: 'STUDENT', email: 'tradercompany@gmail.com', name: 'Trader (Student)' },
  { role: 'COACH', email: 'coach@kingdom.chess', name: 'Coach Magnus' },
  { role: 'STUDENT', email: 'student1@kingdom.chess', name: 'Aryan Sharma (S1)' },
  { role: 'STUDENT', email: 'student2@kingdom.chess', name: 'Diya Patel (S2)' },
  { role: 'STUDENT', email: 'student3@kingdom.chess', name: 'Rohan Gupta (S3)' },
  { role: 'STUDENT', email: 'student4@kingdom.chess', name: 'Ananya Iyer (S4)' },
];

export function Navbar() {
  const { user, logout, login } = useAuth();
  const pathname = usePathname();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const switchAccount = async (email: string, role: string) => {
    setShowSwitcher(false);
    const pass = role === 'COACH' ? 'CoachPass123!' : 'StudentPass123!';
    await login(email, pass);
  };

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
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  pathname.startsWith('/tournaments')
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
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    pathname === '/my-matches'
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
            {/* Quick Switcher dropdown for Evaluators */}
            <div className="relative">
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#8B5738]/80 bg-[#2C1910] text-[#E4D5C0] hover:border-[#C49A52] hover:text-white transition-colors"
                title="Quick switch account for testing"
              >
                <span>Switch User</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showSwitcher && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[#8B5738] bg-[#3B2418] shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-[#C49A52] tracking-wider border-b border-[#2A180E] mb-1">
                    Fast Account Switcher
                  </div>
                  {SEED_USERS.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => switchAccount(u.email, u.role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#8B5738]/40 transition-colors ${
                        user.email === u.email
                          ? 'text-[#C49A52] font-bold bg-[#2A180E]'
                          : 'text-[#E4D5C0]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div>{u.name}</div>
                        <div className="text-[10px] text-[#A89887] truncate">{u.email}</div>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                          u.role === 'COACH'
                            ? 'bg-[#C49A52]/20 text-[#C49A52] border border-[#C49A52]/40'
                            : 'bg-[#8B5738]/30 text-[#E4D5C0] border border-[#8B5738]/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current user container pill */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#2A170F] border border-[#8B5738]/50">
              <User className="w-4 h-4 text-[#C49A52]" />
              <span className="text-xs sm:text-sm font-medium text-white">{user.name}</span>
              <span className="bg-[#8B5738] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <span>{user.role === 'COACH' ? '♚' : '♟'}</span>
                <span>{user.role === 'COACH' ? 'Coach' : 'Student'}</span>
              </span>
            </div>

            {/* Sign out button */}
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg text-[#E4D5C0] hover:text-[#C49A52] hover:bg-[#4E3020] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
