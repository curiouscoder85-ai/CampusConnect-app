'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Enrollment, Course, User } from '@/lib/types';
import { useCollection } from '@/firebase';
import { CourseCard } from '@/components/course-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { SectionHeader } from '@/components/section-header';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { BookOpen, CheckCircle, GraduationCap, Trophy } from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 1. Fetch all necessary data in parallel
  const enrollmentsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const coursesQuery = useMemoFirebase(() => query(collection(firestore, 'courses'), where('status', '==', 'approved')), [firestore]);
  const teachersQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('role', '==', 'teacher')), [firestore]);

  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);
  const { data: teachers, isLoading: teachersLoading } = useCollection<User>(teachersQuery);

  const isLoading = isUserLoading || enrollmentsLoading || coursesLoading || teachersLoading;
  
  // 2. Create maps for efficient data lookup
  const coursesMap = useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  const teachersMap = useMemo(() => {
    if (!teachers) return new Map();
    return new Map(teachers.map(t => [t.id, t]));
  }, [teachers]);
  
  // 3. Filter and enrich enrollments with course and teacher data
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

  const stats = useMemo(() => {
    if (!enrollments) return { enrolled: 0, completed: 0, avgProgress: 0 };
    const enrolled = enrollments.length;
    const completed = enrollments.filter(e => e.progress === 100).length;
    const avgProgress = enrolled > 0 
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrolled) 
      : 0;
    return { enrolled, completed, avgProgress };
  }, [enrollments]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title={`Welcome back, ${user?.firstName || 'Student'}!`}
        subtitle="Track your progress and dive back into your learning modules."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Courses Enrolled"
          value={String(stats.enrolled)}
          icon={BookOpen}
          description="Total active courses"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Courses Completed"
          value={String(stats.completed)}
          icon={CheckCircle}
          description="Fully finished courses"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Average Progress"
          value={`${stats.avgProgress}%`}
          icon={GraduationCap}
          description="Across all enrollments"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-xl">Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off in your courses.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/courses">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
              </div>
            ) : enrolledCourses && enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {enrolledCourses.slice(0, 4).map((course) => (
                  <CourseCard
                      key={course.id}
                      course={course}
                      teacher={teachersMap.get(course.teacherId)}
                      link={`/student/courses/${course.id}`}
                      progress={course.progress}
                      isEnrolled={true}
                      action="enroll"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No Active Courses</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">You haven't enrolled in any courses yet.</p>
                <Button asChild>
                  <Link href="/student/courses">Browse Catalog</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Recent Achievement</CardTitle>
            <CardDescription>Your latest milestone.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            {stats.completed > 0 ? (
              <>
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Course Conqueror</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  You've successfully completed {stats.completed} {stats.completed === 1 ? 'course' : 'courses'}. Keep up the great work!
                </p>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link href="/student/grades">View My Grades</Link>
                </Button>
              </>
            ) : (
              <div className="text-muted-foreground">
                <Trophy className="h-12 w-12 opacity-20 mx-auto mb-4" />
                <p className="text-sm">Complete your first course to earn your "Course Conqueror" badge!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
