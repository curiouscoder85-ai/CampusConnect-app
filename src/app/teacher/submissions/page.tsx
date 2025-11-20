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
      // Do not construct the query until the user is fully loaded.
      if (!user) {
        return null;
      }
      // This is a collectionGroup query to get all submissions for the current teacher.
      return query(
        collectionGroup(firestore, 'submissions'),
        where('teacherId', '==', user.id),
        orderBy('submittedAt', 'desc')
      );
    },
    [firestore, user]
  );
  
  // The useCollection hook handles loading, errors, and data fetching.
  // It is already equipped to throw a detailed FirestorePermissionError.
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);
  
  // The page is loading if the user is loading or the submissions are loading.
  const isLoading = isUserLoading || (user && submissionsLoading);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Student Submissions</h1>
          <p className="text-muted-foreground">
            Review and grade assignments submitted by students.
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
