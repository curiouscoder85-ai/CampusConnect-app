
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Submission, User, Course } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const submissionsQuery = useMemoFirebase(
    () => {
      if (!user?.id) {
        return null;
      }
      return query(
        collectionGroup(firestore, 'submissions'),
        where('userId', '==', user.id)
      );
    },
    [firestore, user?.id]
  );
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const isLoading = isUserLoading || submissionsLoading;

  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    return submissions.slice().sort((a, b) => {
      const dateA = a.submittedAt?.seconds || 0;
      const dateB = b.submittedAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [submissions]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">My Grades</h1>
          <p className="text-muted-foreground">
            View your grades for all submitted assignments.
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
