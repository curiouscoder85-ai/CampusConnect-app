
'use client';

import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/course-card';
import { useCollection, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Course, Enrollment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function CourseCatalogPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  // Query for all approved courses
  const coursesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'courses'), where('status', '==', 'approved'))
    },
    [firestore]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // Query for the current user's enrollments
  const enrollmentsQuery = useMemoFirebase(
    () => {
        if (!user) return null;
        return query(collection(firestore, 'enrollments'), where('userId', '==', user.id));
    },
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments?.map(e => e.courseId) || []);
  }, [enrollments]);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (!searchTerm) return courses;
    return courses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const isLoading = coursesLoading || enrollmentsLoading;

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        {!isLoading && filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            link={`/student/courses/${course.id}`}
            action="enroll"
            isEnrolled={enrolledCourseIds.has(course.id)}
          />
        ))}
      </div>
       {!isLoading && filteredCourses.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg col-span-full">
            <h3 className="font-semibold">No Courses Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? `No courses match your search for "${searchTerm}".` : 'There are no courses available at this time.'}
            </p>
        </div>
      )}
    </div>
  );
}
