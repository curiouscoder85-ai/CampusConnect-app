'use client';

import * as React from 'react';
import { useCollection, useUser } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  // This is the critical fix. The query is only constructed if the user object is available.
  // When `user` is null during the initial load, this memoized query will also be null,
  // preventing `useCollection` from making a request that causes a permission error.
  const submissionsQuery = useMemoFirebase(
    () => {
      if (!user) {
        return null;
      }
      return query(collectionGroup(firestore, 'submissions'), where('teacherId', '==', user.id));
    },
    [firestore, user] 
  );
  
  // The useCollection hook will correctly wait if `submissionsQuery` is null.
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    // Sort by timestamp, newest first
    return submissions.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
  }, [submissions]);

  // The final loading state correctly combines user loading and data loading.
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
        <SubmissionsTable submissions={sortedSubmissions} />
      )}
    </div>
  );
}
