'use client';

import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/course-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';

export default function TeacherCoursesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'courses'), where('teacherId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const isLoading = isUserLoading || coursesLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">Manage your courses and course content.</p>
        </div>
        <Button asChild>
          <Link href="/teacher/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              link={`/teacher/courses/${course.id}/edit`}
              action="view"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="font-semibold">No Courses Created Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Click the button above to create your first course.
          </p>
          <Button asChild className="mt-4">
            <Link href="/teacher/courses/new">Create New Course</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
