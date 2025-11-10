'use client';

import { useMemo } from 'react';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Course, Enrollment, Feedback } from '@/lib/types';
import { BookCopy, Users, Star } from 'lucide-react';

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
        if (userLoading || coursesLoading || courseIds.length === 0) return null;
        return query(collection(firestore, 'enrollments'), where('courseId', 'in', courseIds));
    },
    [firestore, userLoading, coursesLoading, courseIds]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
  
  const feedbackQuery = useMemoFirebase(
    () => {
        if (userLoading || coursesLoading || courseIds.length === 0) return null;
        return query(collectionGroup(firestore, 'feedback'), where('courseId', 'in', courseIds))
    },
    [firestore, userLoading, coursesLoading, courseIds]
  );
  const { data: courseFeedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackQuery);


  const totalEnrollments = enrollments?.length ?? 0;
  
  const averageRating =
    courseFeedback && courseFeedback.length > 0
      ? (
          courseFeedback.reduce((acc, f) => acc + f.rating, 0) / courseFeedback.length
        ).toFixed(1)
      : 'N/A';

  const isLoading = userLoading || coursesLoading || enrollmentsLoading || feedbackLoading;

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
        <DashboardStatCard
          title="Average Rating"
          value={String(averageRating)}
          icon={Star}
          description="Average feedback rating from students"
          isLoading={isLoading}
        />
      </div>
      {/* Additional components like recent activity or notifications can be added here */}
    </div>
  );
}
