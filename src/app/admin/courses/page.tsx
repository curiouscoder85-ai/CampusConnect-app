'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, doc } from 'firebase/firestore';
import type { Course, User } from '@/lib/types';
import { CoursesTable } from './_components/courses-table';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function AdminCoursesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const coursesQuery = useMemoFirebase(() => collection(firestore, 'courses'), [firestore]);
  const { data: courses, isLoading: coursesLoading, forceRefetch: forceCoursesRefetch } = useCollection<Course>(coursesQuery);

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  // Create a map of teacherId to teacher object for efficient lookup
  const teachersMap = React.useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      if (user.role === 'teacher') {
        acc[user.id] = user;
      }
      return acc;
    }, {} as Record<string, User>);
  }, [users]);


  const handleUpdateStatus = (courseId: string, status: 'approved' | 'rejected') => {
    const courseRef = doc(firestore, 'courses', courseId);
    updateDocumentNonBlocking(courseRef, { status });
    toast({
      title: 'Course Updated',
      description: `The course has been ${status}.`,
    });
    forceCoursesRefetch();
  };
  
  const isLoading = coursesLoading || usersLoading;

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
       <CoursesTable 
         courses={courses || []} 
         teachers={teachersMap}
         isLoading={isLoading}
         onUpdateStatus={handleUpdateStatus} 
       />
    </div>
  );
}
