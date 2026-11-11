'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';
import { Button } from './Button';
import { Badge } from './Badge';
import { Trophy, Swords, User, LogOut, ChevronDown, ShieldAlert } from 'lucide-react';

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
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/tournaments" className="flex items-center gap-2.5 group">
              <span className="text-2xl">♚</span>
              <div>
                <span className="font-extrabold text-amber-500 tracking-tight text-lg group-hover:text-amber-400 transition-colors">
                  KINGDOM
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-400 block -mt-1 font-semibold">
                  OF CHESS
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/tournaments"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/tournaments')
                    ? 'bg-slate-800 text-amber-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Tournaments
              </Link>

              {user.role === 'STUDENT' && (
                <Link
                  href="/my-matches"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === '/my-matches'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  My Match History
                </Link>
              )}
            </div>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Switcher dropdown for Evaluators */}
            <div className="relative">
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                title="Quick switch account for testing"
              >
                <span>Switch User</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showSwitcher && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Fast Account Switcher
                  </div>
                  {SEED_USERS.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => switchAccount(u.email, u.role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        user.email === u.email
                          ? 'text-amber-400 font-bold bg-amber-950/20'
                          : 'text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <div>{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </div>
                      <Badge
                        variant={u.role === 'COACH' ? 'warning' : 'info'}
                        className="text-[10px] scale-90"
                      >
                        {u.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current user badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-200">{user.name}</span>
              <Badge variant={user.role === 'COACH' ? 'warning' : 'info'}>
                {user.role === 'COACH' ? '♚ Coach' : '♟ Student'}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Sign out"
              className="text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

