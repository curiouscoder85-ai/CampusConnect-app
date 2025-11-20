'use client';

import * as React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // This function fetches the submissions.
    const fetchSubmissions = async () => {
      // It will only proceed if the user is loaded and exists.
      if (isUserLoading || !user) {
        return;
      }
      
      setIsLoading(true);

      try {
        // Construct the query to get all submissions from all courses
        // where the teacherId matches the current user's ID.
        const submissionsQuery = query(
          collectionGroup(firestore, 'submissions'),
          where('teacherId', '==', user.id),
          orderBy('submittedAt', 'desc')
        );

        const querySnapshot = await getDocs(submissionsQuery);
        const fetchedSubmissions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Submission[];
        
        setSubmissions(fetchedSubmissions);

      } catch (error) {
        console.error("Error fetching submissions:", error);
        // In a real app, you'd want to show an error state to the user.
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
    // This effect runs whenever the user or loading state changes.
  }, [user, isUserLoading, firestore]);

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
        <SubmissionsTable submissions={submissions} />
      )}
    </div>
  );
}
