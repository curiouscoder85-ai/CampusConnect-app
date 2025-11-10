'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import type { Feedback, Course } from '@/lib/types';
import { FeedbackTable } from '@/app/admin/feedback/_components/feedback-table'; // Re-using the admin component
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherFeedbackPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFeedback = async () => {
      if (!user) return;
      
      setIsLoading(true);
      // 1. Find all courses for the current teacher
      const coursesQuery = query(collection(firestore, 'courses'), where('teacherId', '==', user.id));
      const coursesSnapshot = await getDocs(coursesQuery);
      const courseIds = coursesSnapshot.docs.map(doc => doc.id);

      if (courseIds.length > 0) {
        // 2. Query the 'feedback' collection group where courseId is in the teacher's course list
        const feedbackQuery = query(collectionGroup(firestore, 'feedback'), where('courseId', 'in', courseIds));
        const feedbackSnapshot = await getDocs(feedbackQuery);
        const feedbackData = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
        setFeedback(feedbackData);
      } else {
        setFeedback([]);
      }
      setIsLoading(false);
    };

    fetchFeedback();
  }, [user, firestore]);

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
      ) : feedback.length > 0 ? (
        <FeedbackTable feedback={feedback} />
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
