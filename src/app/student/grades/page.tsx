'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Submission, Course, Enrollment } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { SectionHeader } from '@/components/section-header';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 1. Fetch all of the user's submissions across all courses using collectionGroup.
  // This hook is already wired to the central errorEmitter for detailed permission errors.
  const submissionsQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user?.id) return null;
      return query(
        collectionGroup(firestore, 'submissions'),
        where('userId', '==', user.id)
      );
    },
    [firestore, user?.id, isUserLoading]
  );
  const { 
    data: submissions, 
    isLoading: submissionsLoading 
  } = useCollection<Submission>(submissionsQuery);

  // 2. Extract unique course IDs from the submissions to fetch course details.
  const courseIds = React.useMemo(() => {
    if (!submissions) return [];
    return [...new Set(submissions.map(s => s.courseId))];
  }, [submissions]);

  // 3. Fetch course data for the submissions found.
  const coursesQuery = useMemoFirebase(() => {
    if (courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where('__name__', 'in', courseIds));
  }, [firestore, courseIds]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // 4. Create a map of courses for easy lookup in the table.
  const coursesMap = React.useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  // 5. Sort submissions by date (newest first).
  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    return [...submissions].sort((a, b) => {
      const dateA = a.submittedAt?.seconds || 0;
      const dateB = b.submittedAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [submissions]);

  const finalIsLoading = isUserLoading || submissionsLoading || (courseIds.length > 0 && coursesLoading);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="My Grades"
        subtitle="View your grades for all submitted assignments."
      />
      <SubmissionsTable 
        submissions={sortedSubmissions} 
        coursesMap={coursesMap}
        isLoading={finalIsLoading}
      />
    </div>
  );
}
