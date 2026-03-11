'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookCopy, PlusCircle, ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/section-header';

export default function TeacherDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'courses'), where('teacherId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const stats = React.useMemo(() => {
    return {
      totalCourses: courses?.length ?? 0,
    };
  }, [courses]);

  const isLoading = isUserLoading || coursesLoading;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title={`Welcome, ${user?.firstName || 'Teacher'}!`}
        subtitle="Manage your courses and track student performance."
      />

      <div className="grid gap-4 md:grid-cols-1">
        <DashboardStatCard
          title="My Courses"
          value={String(stats.totalCourses)}
          icon={BookCopy}
          description="Courses you have created"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your courses.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-between group">
              <Link href="/teacher/courses/new">
                <span className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Course
                </span>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Your Courses</CardTitle>
            <CardDescription>List of courses you are currently teaching.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : courses && courses.length > 0 ? (
              <ul className="space-y-3">
                {courses.slice(0, 5).map(course => (
                  <li key={course.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm font-medium truncate pr-4">{course.title}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{course.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No courses created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
