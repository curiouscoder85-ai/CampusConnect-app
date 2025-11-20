'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const submissionsQuery = useMemoFirebase(
    () => {
      // Do not construct the query until the user is fully loaded and available.
      // This is the critical fix for the race condition.
      if (!user) {
        return null;
      }
      
      // This is a collectionGroup query to get all submissions across all courses
      // where the teacherId matches the current user's ID.
      return query(
        collectionGroup(firestore, 'submissions'),
        where('teacherId', '==', user.id),
        orderBy('submittedAt', 'desc')
      );
    },
    [firestore, user] // The query is re-evaluated only when the user object changes.
  );
  
  // The useCollection hook will safely handle the null query during initial load.
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);
  
  // The page is considered loading if the user is loading OR if the user is loaded but submissions are still fetching.
  const isLoading = isUserLoading || submissionsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Student Submissions</h1>
          <p className="text-muted-foreground">
            Review and grade assignments submitted by students across all your courses.
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
        <SubmissionsTable submissions={submissions || []} />
      )}
    </div>
  );
}
