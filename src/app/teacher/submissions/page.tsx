'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionsTable } from './_components/submissions-table';

export default function TeacherSubmissionsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const submissionsQuery = useMemoFirebase(
    () => {
        if (!user) return null;
        return query(collection(firestore, 'submissions'), where('teacherId', '==', user.id))
    },
    [firestore, user]
  );
  const { data: submissions, isLoading: submissionsLoading, forceRefetch } = useCollection<Submission>(submissionsQuery);

  const isLoading = isUserLoading || submissionsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Student Submissions</h1>
          <p className="text-muted-foreground">
            Review and grade assignments submitted by your students.
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
        <SubmissionsTable submissions={submissions || []} onGradeUpdated={forceRefetch} />
      )}
    </div>
  );
}
