'use client';

import { CourseCard } from '@/components/course-card';
import { useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseCatalogPage() {
  const firestore = useFirestore();
  const coursesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'courses'), where('status', '==', 'approved'))
    },
    [firestore]
  );
  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Course Catalog
        </h1>
        <p className="text-muted-foreground">
          Explore new skills and enroll in courses to expand your knowledge.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        {courses?.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            link={`/student/courses/${course.id}`}
            action="enroll"
          />
        ))}
      </div>
    </div>
  );
}
