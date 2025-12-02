'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Feedback } from '@/lib/types';
import { FeedbackTable } from '@/app/admin/feedback/_components/feedback-table'; // Re-using the admin component
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherFeedbackPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const feedbackQuery = useMemoFirebase(
    () => {
      if (!user) return null;
      // This efficient query gets all feedback from all courses where the teacherId matches.
      // This requires a composite index on (teacherId, createdAt) for the 'feedback' collection group.
      // However, for simplicity here, we will rely on the client to sort.
      return query(
        collectionGroup(firestore, 'feedback'),
        where('teacherId', '==', user.id)
      );
    },
    [firestore, user]
  );
  
  const { data: feedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackQuery);

  const isLoading = isUserLoading || feedbackLoading;

  const sortedFeedback = React.useMemo(() => {
    if (!feedback) return [];
    return feedback.slice().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [feedback]);


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Student Feedback</h1>
          <p className="text-muted-foreground">
            Review feedback submitted by students for your courses.
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
      ) : sortedFeedback.length > 0 ? (
        <FeedbackTable feedback={sortedFeedback} />
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="font-semibold">No Feedback Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
                Students have not submitted any feedback for your courses.
            </p>
        </div>
      )}
    </div>
  );
}
