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
      if (!user) return null;
      // Query for all submissions where the teacherId matches the current user's ID.
      // The sorting will be done on the client-side after fetching.
      return query(
        collectionGroup(firestore, 'submissions'),
        where('teacherId', '==', user.id)
      );
    },
    [firestore, user]
  );
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  // Sort the submissions on the client-side after they are fetched.
  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    // The `.slice()` creates a shallow copy to avoid mutating the original array
    return submissions.slice().sort((a, b) => {
      const dateA = a.submittedAt?.seconds || 0;
      const dateB = b.submittedAt?.seconds || 0;
      return dateB - dateA; // Sort descending (newest first)
    });
  }, [submissions]);

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
        <SubmissionsTable submissions={sortedSubmissions} />
      )}
    </div>
  );
}
