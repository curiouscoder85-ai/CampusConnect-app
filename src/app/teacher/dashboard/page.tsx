'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Course, Enrollment, Submission } from '@/lib/types';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookCopy, Users, ClipboardCheck, PlusCircle, ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/section-header';

export default function TeacherDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 1. Fetch teacher's courses
  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'courses'), where('teacherId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // 2. Fetch all enrollments for this teacher's courses
  const enrollmentsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'enrollments'), where('teacherId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  // 3. Fetch pending submissions (where grade is null)
  const submissionsQuery = useMemoFirebase(
    () => (user ? query(collectionGroup(firestore, 'submissions'), where('teacherId', '==', user.id), where('grade', '==', null)) : null),
    [firestore, user?.id]
  );
  const { data: pendingSubmissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const stats = React.useMemo(() => {
    return {
      totalCourses: courses?.length ?? 0,
      activeStudents: new Set(enrollments?.map(e => e.userId)).size,
      pendingGrades: pendingSubmissions?.length ?? 0,
    };
  }, [courses, enrollments, pendingSubmissions]);

  const isLoading = isUserLoading || coursesLoading || enrollmentsLoading || submissionsLoading;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title={`Welcome, ${user?.firstName || 'Teacher'}!`}
        subtitle="Here's an overview of your teaching activity."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="My Courses"
          value={String(stats.totalCourses)}
          icon={BookCopy}
          description="Courses you have created"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Total Students"
          value={String(stats.activeStudents)}
          icon={Users}
          description="Unique students enrolled"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Pending Grades"
          value={String(stats.pendingGrades)}
          icon={ClipboardCheck}
          description="Submissions awaiting review"
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
            <Button asChild variant="outline" className="justify-between group">
              <Link href="/teacher/submissions">
                <span className="flex items-center">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Grade Submissions
                </span>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Courses</CardTitle>
            <CardDescription>Your recently modified learning materials.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : courses && courses.length > 0 ? (
              <ul className="space-y-3">
                {courses.slice(0, 3).map(course => (
                  <li key={course.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm font-medium truncate pr-4">{course.title}</span>
                    <Badge variant={course.status === 'approved' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
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
