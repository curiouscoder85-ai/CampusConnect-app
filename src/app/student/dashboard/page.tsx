'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Enrollment, Course, User } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase';
import { CourseCard } from '@/components/course-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { SectionHeader } from '@/components/section-header';

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const enrollmentsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  // Fetch all courses at once for better performance
  const coursesQuery = useMemoFirebase(() => query(collection(firestore, 'courses'), where('status', '==', 'approved')), [firestore]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const isLoading = isUserLoading || enrollmentsLoading || coursesLoading;
  
  // Create a map of courses for quick lookup
  const coursesMap = useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);
  
  // Filter and enrich enrollments with course data
  const enrolledCourses = useMemo(() => {
    if (!enrollments || !coursesMap) return [];
    return enrollments
        .map(enrollment => {
            const course = coursesMap.get(enrollment.courseId);
            if (!course) return null;
            return {
                ...course,
                progress: enrollment.progress // Add progress to the course object
            }
        })
        .filter(Boolean) as (Course & {progress: number})[];
  }, [enrollments, coursesMap]);


  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title={`Welcome back, ${user?.firstName || 'Student'}!`}
        subtitle="Let's continue your learning journey."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">My Courses</CardTitle>
          <CardDescription>Courses you are currently enrolled in.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
          ) : enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard
                    key={course.id}
                    course={course}
                    link={`/student/courses/${course.id}`}
                    progress={course.progress}
                    isEnrolled={true}
                    action="enroll"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="font-semibold">No Courses Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">You haven't enrolled in any courses.</p>
              <Button asChild className="mt-4">
                <Link href="/student/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
