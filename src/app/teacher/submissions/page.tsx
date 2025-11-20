
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
  
  const submissionsQuery = useMemoFirebase(
    () => {
      // This is the critical fix: Do not create the query until the user object is available.
      // If `user` is null, this will return null, and useCollection will correctly wait.
      if (!user) {
        return null;
      }
      return query(collectionGroup(firestore, 'submissions'), where('teacherId', '==', user.id));
    },
    [firestore, user] // The dependency array now correctly only depends on `user`.
  );
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    // Sort by timestamp, newest first
    return submissions.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
  }, [submissions]);

  // The loading state now correctly combines the user loading state and the data loading state.
  const isLoading = isUserLoading || (user && submissions === null);

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
