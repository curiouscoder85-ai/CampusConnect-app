'use client';

import { useMemo } from 'react';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course, Enrollment } from '@/lib/types';
import { BookCopy, Users } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'courses'), where('teacherId', '==', user.id)) : null),
    [firestore, user]
  );
  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const courseIds = useMemo(() => teacherCourses?.map((c) => c.id) || [], [teacherCourses]);

  const enrollmentsQuery = useMemoFirebase(
    () => {
        // This is the critical fix: Do not run the query until the courseIds array has been populated.
        if (!firestore || courseIds.length === 0) return null;
        return query(collection(firestore, 'enrollments'), where('courseId', 'in', courseIds));
    },
    [firestore, courseIds]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  const totalEnrollments = enrollments?.length ?? 0;
  
  const isLoading = userLoading || coursesLoading || enrollmentsLoading;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="My Courses"
          value={String(teacherCourses?.length ?? 0)}
          icon={BookCopy}
          description="Total courses you manage"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Total Students"
          value={String(totalEnrollments)}
          icon={Users}
          description="Across all your courses"
          isLoading={isLoading}
        />
      </div>
      {/* Additional components like recent activity or notifications can be added here */}
    </div>
  );
}
