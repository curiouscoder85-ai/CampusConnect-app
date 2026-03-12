'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import type { Submission, Course, Enrollment } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { SectionHeader } from '@/components/section-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipboardCheck, Star, Award, Loader2 } from 'lucide-react';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = React.useState(true);

  // 1. Fetch the user's enrollments first. This is fast and reliable.
  const enrollmentsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  // 2. Fetch all submissions for the enrolled courses.
  // Instead of collectionGroup, we fetch from the subcollections we know the user is part of.
  React.useEffect(() => {
    async function fetchSubmissions() {
      if (!user || !enrollments || enrollments.length === 0) {
        setSubmissions([]);
        setIsSubmissionsLoading(false);
        return;
      }

      setIsSubmissionsLoading(true);
      try {
        const allSubmissions: Submission[] = [];
        
        // Fetch submissions for each enrolled course.
        // This is safe because students typically enroll in a limited number of courses.
        const promises = enrollments.map(async (enrollment) => {
          const subsRef = collection(firestore, `courses/${enrollment.courseId}/submissions`);
          const q = query(subsRef, where('userId', '==', user.id));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        });

        const results = await Promise.all(promises);
        results.forEach(subs => allSubmissions.push(...subs));
        
        setSubmissions(allSubmissions);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsSubmissionsLoading(false);
      }
    }

    if (!enrollmentsLoading) {
      fetchSubmissions();
    }
  }, [user, enrollments, enrollmentsLoading, firestore]);

  // 3. Extract unique course IDs from the enrollments to fetch course details.
  const courseIds = React.useMemo(() => {
    if (!enrollments) return [];
    return enrollments.map(e => e.courseId);
  }, [enrollments]);

  // 4. Fetch course data for the submissions found.
  const coursesQuery = useMemoFirebase(() => {
    if (courseIds.length === 0) return null;
    // Limit to first 30 courses due to Firestore 'in' query limits
    return query(collection(firestore, 'courses'), where('__name__', 'in', courseIds.slice(0, 30)));
  }, [firestore, courseIds]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // 5. Create a map of courses for easy lookup in the table.
  const coursesMap = React.useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  // 6. Sort submissions by date (newest first).
  const sortedSubmissions = React.useMemo(() => {
    return [...submissions].sort((a, b) => {
      const dateA = a.submittedAt?.seconds || 0;
      const dateB = b.submittedAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [submissions]);

  const stats = React.useMemo(() => {
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

  const finalIsLoading = isUserLoading || enrollmentsLoading || isSubmissionsLoading || (courseIds.length > 0 && coursesLoading);

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
              {finalIsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : `${stats.average}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Submissions</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
              {finalIsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Pending Review</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-muted-foreground" />
              {finalIsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stats.pending}
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
