'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Skeleton } from './ui/skeleton';

type AuthGuardProps = {
  children: React.ReactNode;
  role: 'admin' | 'teacher' | 'student';
};

export default function AuthGuard({ children, role }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== role) {
        // Redirect to their own dashboard if they try to access the wrong area
        const dashboardUrl = `/${user.role}/dashboard`;
        router.push(dashboardUrl);
      }
    }
  }, [user, loading, router, role]);

  if (loading || !user || user.role !== role) {
    // Show a loading state or a blank screen while checking auth
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
