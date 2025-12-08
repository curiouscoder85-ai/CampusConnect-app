'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collectionGroup, query } from 'firebase/firestore';
import type { Feedback } from '@/lib/types';
import { FeedbackTable } from './_components/feedback-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminFeedbackPage() {
  const firestore = useFirestore();
  // Admin needs to see all feedback, so a direct collection group query is appropriate here.
  // The security rules will allow admins to perform this list operation.
  const feedbackQuery = useMemoFirebase(() => query(collectionGroup(firestore, 'feedback')), [firestore]);
  const { data: feedback, isLoading } = useCollection<Feedback>(feedbackQuery);

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
            Review and analyze feedback submitted by students for all courses.
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
                No feedback has been submitted by any student on the platform.
            </p>
        </div>
      )}
    </div>
  );
}
