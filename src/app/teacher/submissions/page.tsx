
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import type { Submission, Course, User } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const submissionsQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user?.id) return null;
      return query(
        collectionGroup(firestore, 'submissions'),
        where('teacherId', '==', user.id)
      );
    },
    [firestore, user?.id, isUserLoading]
  );
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const courseIds = React.useMemo(() => {
    if (!submissions) return [];
    return [...new Set(submissions.map(s => s.courseId))];
  }, [submissions]);

  const studentIds = React.useMemo(() => {
    if (!submissions) return [];
    return [...new Set(submissions.map(s => s.userId))];
  }, [submissions]);


  const coursesQuery = useMemoFirebase(() => {
    if (courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where('__name__', 'in', courseIds));
  }, [firestore, courseIds]);

  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', studentIds));
  }, [firestore, studentIds]);

  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);
  const { data: students, isLoading: studentsLoading } = useCollection<User>(studentsQuery);

  const coursesMap = React.useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  const studentsMap = React.useMemo(() => {
    if (!students) return new Map();
    return new Map(students.map(s => [s.id, s]));
  }, [students]);
  
  const isLoading = isUserLoading || submissionsLoading || (courseIds.length > 0 && coursesLoading) || (studentIds.length > 0 && studentsLoading);

  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    return submissions.slice().sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
  }, [submissions]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Student Submissions</h1>
          <p className="text-muted-foreground">
            Review and grade submissions for all of your courses.
          </p>
        </div>
      </div>
      <SubmissionsTable 
        submissions={sortedSubmissions} 
        coursesMap={coursesMap} 
        studentsMap={studentsMap} 
        isLoading={isLoading} 
      />
    </div>
  );
}
