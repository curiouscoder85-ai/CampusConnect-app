'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

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
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="cube-loader">
          <div className="cube-top"></div>
          <div className="cube-wrapper">
            <span style={{ '--i': 0 } as React.CSSProperties} className="cube-span"></span>
            <span style={{ '--i': 1 } as React.CSSProperties} className="cube-span"></span>
            <span style={{ '--i': 2 } as React.CSSProperties} className="cube-span"></span>
            <span style={{ '--i': 3 } as React.CSSProperties} className="cube-span"></span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
