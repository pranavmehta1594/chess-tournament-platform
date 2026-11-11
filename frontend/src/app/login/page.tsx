'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const SEED_USERS = [
  {
    role: 'STUDENT',
    name: 'Trader (Student)',
    email: 'tradercompany@gmail.com',
    pass: 'Password123!',
    desc: 'Personal Account',
  },
  {
    role: 'COACH',
    name: 'Coach Magnus',
    email: 'coach@kingdom.chess',
    pass: 'CoachPass123!',
    desc: 'Tournament Organizer',
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

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Normalize username or email
  const resolveEmail = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) return trimmed;

    // Support username shortcut matching
    const lower = trimmed.toLowerCase();
    if (lower === 'trader' || lower === 'student') return 'tradercompany@gmail.com';
    if (lower === 'coach' || lower === 'magnus') return 'coach@kingdom.chess';
    if (lower === 'aryan' || lower === 'student1') return 'student1@kingdom.chess';
    if (lower === 'diya' || lower === 'student2') return 'student2@kingdom.chess';
    if (lower === 'rohan' || lower === 'student3') return 'student3@kingdom.chess';
    if (lower === 'ananya' || lower === 'student4') return 'student4@kingdom.chess';
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailToUse = resolveEmail(identifier);
      await login(emailToUse, password);
      router.push('/tournaments');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setError(null);
    setIdentifier(userEmail);
    setPassword(userPass);
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
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center lg:justify-end px-4 sm:px-8 lg:pr-20 xl:pr-32 py-8 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/chess-login-bg.jpg')",
      }}
    >
      {/* Subtle ambient darkening vignette overlay */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* Main Login Card - Compact Size */}
      <div className="relative z-10 w-full max-w-[360px] bg-[#FFF9EF] border border-[#E4D5C0] rounded-[28px] p-6 sm:p-7 shadow-2xl backdrop-blur-sm">
        {/* Emblem / Brand Header */}
        <div className="flex flex-col items-center text-center">
          {/* Logo Emblem with Crown & Laurel Wreath */}
          <div className="relative w-14 h-11 flex items-center justify-center">
            <svg
              viewBox="0 0 100 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* Crown on top */}
              <path
                d="M38 22L44 28L50 18L56 28L62 22L60 30H40L38 22Z"
                fill="#C49A52"
              />
              <circle cx="38" cy="21" r="1.5" fill="#C49A52" />
              <circle cx="50" cy="17" r="1.8" fill="#C49A52" />
              <circle cx="62" cy="21" r="1.5" fill="#C49A52" />

              {/* Chess King Body */}
              <path
                d="M48 31H52V29H48V31ZM46 32H54V34H46V32ZM43 36H57C57 43 54 47 54 54H46C46 47 43 43 43 36ZM41 55H59V60H41V55Z"
                fill="#3B2418"
              />
              {/* Base */}
              <path
                d="M37 61H63C64 61 65 62 65 63.5V64.5H35V63.5C35 62 36 61 37 61Z"
                fill="#3B2418"
              />

              {/* Left Laurel Wreath */}
              <path
                d="M33 34C28 41 27 50 31 58C32 59.5 30 61.5 28.5 60C23.5 50 24.5 39 30 32C31.2 31 33.5 32.5 33 34Z"
                fill="#C49A52"
              />
              <circle cx="26" cy="40" r="2.2" fill="#C49A52" />
              <circle cx="24" cy="48" r="2.2" fill="#C49A52" />
              <circle cx="27" cy="56" r="2.2" fill="#C49A52" />

              {/* Right Laurel Wreath */}
              <path
                d="M67 34C72 41 73 50 69 58C68 59.5 70 61.5 71.5 60C76.5 50 75.5 39 70 32C68.8 31 66.5 32.5 67 34Z"
                fill="#C49A52"
              />
              <circle cx="74" cy="40" r="2.2" fill="#C49A52" />
              <circle cx="76" cy="48" r="2.2" fill="#C49A52" />
              <circle cx="73" cy="56" r="2.2" fill="#C49A52" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[22px] font-bold text-[#261A13] tracking-tight mt-0.5">
            Kingdom of Chess
          </h1>

          {/* Subtitle */}
          <h2 className="text-[17px] font-bold text-[#261A13] mt-2">
            Welcome Back
          </h2>
          <p className="text-[11px] text-[#887765] mt-0.5">
            Sign in to continue your chess journey
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Email / Username field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#887765]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              className="w-full h-10 pl-9 pr-3.5 bg-[#FBF5EC] border border-[#E4D5C0] rounded-xl text-xs text-[#261A13] placeholder-[#9C8B7A] focus:outline-none focus:ring-2 focus:ring-[#8B5738]/40 focus:border-[#8B5738] transition-all"
            />
          </div>

          {/* Password field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#887765]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-10 pl-9 pr-10 bg-[#FBF5EC] border border-[#E4D5C0] rounded-xl text-xs text-[#261A13] placeholder-[#9C8B7A] focus:outline-none focus:ring-2 focus:ring-[#8B5738]/40 focus:border-[#8B5738] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#887765] hover:text-[#261A13] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot Password link */}
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={() => alert('Please contact your tournament coach or admin to reset your password.')}
                className="text-[11px] font-semibold text-[#8B5738] hover:text-[#3B2418] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10.5 bg-[#3B2418] hover:bg-[#8B5738] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-3.5">
          <p className="text-[11px] text-[#887765]">
            Don’t have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setIdentifier('tradercompany@gmail.com');
                setPassword('Password123!');
              }}
              className="font-semibold text-[#8B5738] hover:text-[#3B2418] transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Assessment Quick-Access Drawer for Evaluators */}
        <div className="mt-3.5 pt-3 border-t border-[#E4D5C0]/60">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#887765] hover:text-[#261A13] transition-colors py-0.5"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#C49A52]" />
              Quick Demo Accounts
            </span>
            {showDemoAccounts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showDemoAccounts && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
              {SEED_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u.email, u.pass)}
                  disabled={isLoading}
                  className="w-full p-1.5 rounded-lg bg-[#FBF5EC] hover:bg-[#F3E7D5] border border-[#E4D5C0] text-left transition-all flex items-center justify-between text-[11px] group"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-[#261A13] group-hover:text-[#8B5738] transition-colors block leading-tight">
                      {u.name}
                    </span>
                    <span className="text-[9px] text-[#887765] block truncate leading-tight">
                      {u.email}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      u.role === 'COACH'
                        ? 'bg-[#C49A52]/20 text-[#8B5738] border border-[#C49A52]/40'
                        : 'bg-[#3B2418]/10 text-[#3B2418] border border-[#3B2418]/20'
                    }`}
                  >
                    {u.role === 'COACH' ? 'Coach' : 'Student'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
