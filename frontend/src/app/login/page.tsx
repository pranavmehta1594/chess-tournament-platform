'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

const SEED_USERS = [
  {
    role: 'COACH',
    name: 'Coach Magnus',
    email: 'coach@kingdom.chess',
    pass: 'CoachPass123!',
    desc: 'Organizer / Tournament Admin',
  },
  {
    role: 'STUDENT',
    name: 'Aryan Sharma',
    email: 'student1@kingdom.chess',
    pass: 'StudentPass123!',
    desc: 'Student Player 1',
  },
  {
    role: 'STUDENT',
    name: 'Diya Patel',
    email: 'student2@kingdom.chess',
    pass: 'StudentPass123!',
    desc: 'Student Player 2',
  },
  {
    role: 'STUDENT',
    name: 'Rohan Gupta',
    email: 'student3@kingdom.chess',
    pass: 'StudentPass123!',
    desc: 'Student Player 3',
  },
  {
    role: 'STUDENT',
    name: 'Ananya Iyer',
    email: 'student4@kingdom.chess',
    pass: 'StudentPass123!',
    desc: 'Student Player 4',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/tournaments');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(userEmail, userPass);
      router.push('/tournaments');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl">
            ♚
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Kingdom of Chess
          </h1>
          <p className="text-sm text-slate-400">
            Live 1-on-1 Tournament Arena for Young Masters
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter credentials or pick a demo user below
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@kingdom.chess"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-amber-600/20"
              isLoading={isLoading}
            >
              Sign In to Arena
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                1-Click Demo Accounts
              </span>
              <Badge variant="outline" className="text-[10px]">
                Assessment Helper
              </Badge>
            </div>

            <div className="space-y-2">
              {SEED_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u.email, u.pass)}
                  disabled={isLoading}
                  className="w-full p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 text-left transition-all flex items-center justify-between group"
                >
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                      {u.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{u.desc}</div>
                  </div>
                  <Badge variant={u.role === 'COACH' ? 'warning' : 'info'} className="text-[10px]">
                    {u.role === 'COACH' ? '♚ Coach' : '♟ Student'}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
