'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import type { Feedback, User, Course } from '@/lib/types';
import { FeedbackTable } from './_components/feedback-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminFeedbackPage() {
  const firestore = useFirestore();

  // 1. Fetch all feedback efficiently
  const feedbackQuery = useMemoFirebase(() => query(collectionGroup(firestore, 'feedback')), [firestore]);
  const { data: feedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackQuery);

  // 2. From feedback, get unique IDs for courses and users
  const { courseIds, userIds } = React.useMemo(() => {
    if (!feedback) return { courseIds: [], userIds: [] };
    const courseIds = [...new Set(feedback.map(f => f.courseId))];
    const userIds = [...new Set(feedback.map(f => f.userId))];
    return { courseIds, userIds };
  }, [feedback]);

  // 3. Fetch all needed courses in a single batch query
  const coursesQuery = useMemoFirebase(() => {
    if (courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where('__name__', 'in', courseIds));
  }, [firestore, courseIds]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // 4. Fetch all needed users in a single batch query
  const usersQuery = useMemoFirebase(() => {
    if (userIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', userIds));
  }, [firestore, userIds]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  // 5. Create maps for efficient data lookup in the child component
  const coursesMap = React.useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  const usersMap = React.useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.id, u]));
  }, [users]);
  
  const sortedFeedback = React.useMemo(() => {
    if (!feedback) return [];
    return feedback.slice().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [feedback]);

  const isLoading = feedbackLoading || (courseIds.length > 0 && coursesLoading) || (userIds.length > 0 && usersLoading);

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
        <FeedbackTable 
            feedback={sortedFeedback} 
            usersMap={usersMap}
            coursesMap={coursesMap}
        />
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
