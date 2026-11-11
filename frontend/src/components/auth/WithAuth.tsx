'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-context';

export interface WithAuthOptions {
  requiredRole?: 'COACH' | 'STUDENT';
  redirectTo?: string;
}

/**
 * Custom hook to enforce authentication.
 * Redirects unauthenticated users to /login.
 */
export function useWithAuth(options?: WithAuthOptions) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const redirectTo = options?.redirectTo || '/login';

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace(redirectTo);
      } else if (options?.requiredRole && user.role !== options.requiredRole) {
        router.replace('/tournaments');
      }
    }
  }, [user, isLoading, router, redirectTo, options?.requiredRole]);

  return { user, isLoading, isAuthenticated: !!user };
}

/**
 * Higher-Order Component (HOC) to wrap protected pages.
 * Usage: export default withAuth(MyPageComponent);
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithAuthOptions
) {
  return function ProtectedComponent(props: P) {
    const { user, isLoading } = useWithAuth(options);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#F5EBDD] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#C49A52] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#887765]">Verifying Arena Access...</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Wrapper component to wrap protected UI trees.
 * Usage: <WithAuth>{children}</WithAuth>
 */
export function WithAuth({
  children,
  ...options
}: WithAuthOptions & { children: React.ReactNode }) {
  const { user, isLoading } = useWithAuth(options);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5EBDD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C49A52] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#887765]">Verifying Arena Access...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
