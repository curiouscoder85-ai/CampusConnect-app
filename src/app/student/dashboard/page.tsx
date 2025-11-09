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

function EnrolledCourseCard({ enrollment }: { enrollment: Enrollment }) {
  const firestore = useFirestore();
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', enrollment.courseId), [firestore, enrollment.courseId]);
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  if (isLoading || !course) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <CourseCard
      course={course}
      enrollmentProgress={enrollment.progress}
      link={`/student/courses/${course.id}`}
    />
  );
}

export default function StudentDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: userLoading } = useDoc<User>(userDocRef);

  const enrollmentsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.uid)) : null, 
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  const isLoading = userLoading || enrollmentsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Welcome back, {userData?.firstName || 'Student'}!
        </h1>
        <p className="text-muted-foreground">Let's continue your learning journey.</p>
      </div>

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
          ) : enrollments && enrollments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
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
