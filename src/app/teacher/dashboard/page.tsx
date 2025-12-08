'use client';

import { useUser } from '@/firebase';

export default function TeacherDashboardPage() {
  const { user, isUserLoading: userLoading } = useUser();
  
  const isLoading = userLoading;

  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
             <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Welcome, {user?.firstName || 'Teacher'}!
      </h1>
      <p className="text-muted-foreground">
        You can manage your courses from the "My Courses" section in the sidebar.
      </p>
    </div>
  );
}
