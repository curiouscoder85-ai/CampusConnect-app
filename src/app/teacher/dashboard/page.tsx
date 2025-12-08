'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherDashboardPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Welcome, {user?.firstName || 'Teacher'}!
        </h1>
        <p className="text-muted-foreground">
          You can manage your courses from the "My Courses" section.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Module Simplified</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To ensure stability, the dashboard statistics, submissions, and feedback sections have been removed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
