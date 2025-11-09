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
  const feedbackQuery = useMemoFirebase(() => query(collectionGroup(firestore, 'feedback')), [firestore]);
  const { data: feedback, isLoading } = useCollection<Feedback>(feedbackQuery);

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
      ) : (
        <FeedbackTable feedback={feedback || []} />
      )}
    </div>
  );
}
