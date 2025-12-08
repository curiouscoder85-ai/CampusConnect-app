'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const submissionsQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user) {
        return null;
      }
      return query(
        collectionGroup(firestore, 'submissions'),
        where('userId', '==', user.id)
      );
    },
    [firestore, user, isUserLoading]
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
      <SectionHeader 
        title="My Grades"
        subtitle="View your grades for all submitted assignments."
      />
      
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
