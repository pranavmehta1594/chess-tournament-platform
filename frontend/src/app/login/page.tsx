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
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center lg:justify-end px-4 sm:px-8 lg:pr-20 xl:pr-28 py-10 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/chess-login-bg.jpg')",
      }}
    >
      {/* Subtle ambient darkening vignette overlay */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#FFF9EF] border border-[#E4D5C0] rounded-[32px] p-8 sm:p-10 shadow-2xl backdrop-blur-sm">
        {/* Emblem / Brand Header */}
        <div className="flex flex-col items-center text-center">
          {/* Logo Emblem with Crown & Laurel Wreath */}
          <div className="relative w-20 h-16 flex items-center justify-center">
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
          <h1 className="font-serif text-[26px] font-bold text-[#261A13] tracking-tight mt-1">
            Kingdom of Chess
          </h1>

          {/* Subtitle */}
          <h2 className="text-[22px] font-bold text-[#261A13] mt-3">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-[#887765] mt-0.5">
            Sign in to continue your chess journey
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email / Username field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#887765]">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              className="w-full h-12 pl-11 pr-4 bg-[#FBF5EC] border border-[#E4D5C0] rounded-xl text-sm text-[#261A13] placeholder-[#9C8B7A] focus:outline-none focus:ring-2 focus:ring-[#8B5738]/40 focus:border-[#8B5738] transition-all"
            />
          </div>

          {/* Password field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#887765]">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 pl-11 pr-11 bg-[#FBF5EC] border border-[#E4D5C0] rounded-xl text-sm text-[#261A13] placeholder-[#9C8B7A] focus:outline-none focus:ring-2 focus:ring-[#8B5738]/40 focus:border-[#8B5738] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#887765] hover:text-[#261A13] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot Password link */}
            <div className="text-right mt-2">
              <button
                type="button"
                onClick={() => alert('Please contact your tournament coach or admin to reset your password.')}
                className="text-xs font-semibold text-[#8B5738] hover:text-[#3B2418] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#3B2418] hover:bg-[#8B5738] text-white font-semibold text-sm sm:text-base rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E4D5C0]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#FFF9EF] px-3 text-[#887765] font-normal">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin('tradercompany@gmail.com', 'Password123!')}
            className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[#E4D5C0] bg-white/70 hover:bg-[#F3E7D5] text-[#261A13] text-sm font-medium transition-colors"
          >
            {/* Google Colorful Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('coach@kingdom.chess', 'CoachPass123!')}
            className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[#E4D5C0] bg-white/70 hover:bg-[#F3E7D5] text-[#261A13] text-sm font-medium transition-colors"
          >
            {/* GitHub Icon */}
            <svg className="w-4 h-4 shrink-0 fill-[#261A13]" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-xs sm:text-sm text-[#887765]">
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
        <div className="mt-5 pt-4 border-t border-[#E4D5C0]/60">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#887765] hover:text-[#261A13] transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C49A52]" />
              Quick Demo Accounts
            </span>
            {showDemoAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDemoAccounts && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {SEED_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u.email, u.pass)}
                  disabled={isLoading}
                  className="w-full p-2 rounded-lg bg-[#FBF5EC] hover:bg-[#F3E7D5] border border-[#E4D5C0] text-left transition-all flex items-center justify-between text-xs group"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-[#261A13] group-hover:text-[#8B5738] transition-colors">
                      {u.name}
                    </span>
                    <span className="text-[10px] text-[#887765] block truncate">
                      {u.email}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
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
