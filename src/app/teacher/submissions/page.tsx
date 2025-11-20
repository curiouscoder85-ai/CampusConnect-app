'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Do not run the query until the user is fully loaded and available.
    if (isUserLoading || !user) {
      // If the user logs out or is not yet loaded, clear data and wait.
      if (!isUserLoading) {
         setSubmissions([]);
         setIsLoading(false);
      }
      return;
    }

    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const submissionsQuery = query(
          collectionGroup(firestore, 'submissions'),
          where('teacherId', '==', user.id),
          orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(submissionsQuery);
        const fetchedSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setSubmissions(fetchedSubmissions);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        // In a real app, you might want to show an error state to the user.
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [firestore, user, isUserLoading]);

  // Combine initial user loading with data fetching loading state.
  const displayLoading = isLoading || isUserLoading;

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
      {displayLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <SubmissionsTable submissions={submissions} />
      )}
    </div>
  );
}
