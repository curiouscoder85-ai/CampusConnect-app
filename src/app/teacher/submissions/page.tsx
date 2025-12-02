
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const submissionsQuery = useMemoFirebase(
    () => {
      // This guard is critical. Do not create the query until the user object is available.
      if (isUserLoading || !user) {
        return null;
      }
      return query(
        collectionGroup(firestore, 'submissions'),
        where('teacherId', '==', user.id)
      );
    },
    [firestore, user, isUserLoading] // This query depends on the user object and its loading state
  );
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  // Combine both loading states. The page is loading if the user is loading OR submissions are loading.
  const isLoading = isUserLoading || submissionsLoading;

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
