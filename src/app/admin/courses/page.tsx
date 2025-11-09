'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, doc } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { CoursesTable } from './_components/courses-table';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function AdminCoursesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const coursesQuery = useMemoFirebase(() => collection(firestore, 'courses'), [firestore]);
  const { data: courses, isLoading, forceRefetch } = useCollection<Course>(coursesQuery);

  const handleUpdateStatus = (courseId: string, status: 'approved' | 'rejected') => {
    const courseRef = doc(firestore, 'courses', courseId);
    updateDocumentNonBlocking(courseRef, { status });
    toast({
      title: 'Course Updated',
      description: `The course has been ${status}.`,
    });
    forceRefetch();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">
            Approve, reject, and manage all courses on the platform.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <CoursesTable courses={courses || []} onUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
}
