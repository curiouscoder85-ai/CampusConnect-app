
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import type { Submission, Course } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { SectionHeader } from '@/components/section-header';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

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
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const courseIds = React.useMemo(() => {
    if (!submissions) return [];
    return [...new Set(submissions.map(s => s.courseId))];
  }, [submissions]);

  const coursesQuery = useMemoFirebase(() => {
    if (courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where('__name__', 'in', courseIds));
  }, [firestore, courseIds]);

  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const coursesMap = React.useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  const isLoading = isUserLoading || submissionsLoading || (courseIds.length > 0 && coursesLoading);

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
      <SubmissionsTable 
        submissions={sortedSubmissions} 
        coursesMap={coursesMap}
        isLoading={isLoading}
      />
    </div>
  );
}
