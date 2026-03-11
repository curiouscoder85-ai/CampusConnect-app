'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Submission, Course, Enrollment } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { SectionHeader } from '@/components/section-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipboardCheck, Star, Award } from 'lucide-react';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 1. Fetch all of the user's submissions across all courses using collectionGroup.
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

  const stats = React.useMemo(() => {
    if (!submissions) return { average: 0, total: 0, pending: 0 };
    const graded = submissions.filter(s => s.grade !== null);
    const average = graded.length > 0 
      ? Math.round(graded.reduce((acc, s) => acc + (s.grade || 0), 0) / graded.length) 
      : 0;
    return {
      average,
      total: submissions.length,
      pending: submissions.length - graded.length
    };
  }, [submissions]);

  const finalIsLoading = isUserLoading || submissionsLoading || (courseIds.length > 0 && coursesLoading);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="My Academic Performance"
        subtitle="Review your grades and submission status across all enrolled courses."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-primary">Average Grade</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
              {stats.average}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Submissions</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Pending Review</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-muted-foreground" />
              {stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <SubmissionsTable 
        submissions={sortedSubmissions} 
        coursesMap={coursesMap}
        isLoading={finalIsLoading}
      />
    </div>
  );
}
