
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Submission, Course, Enrollment } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { SectionHeader } from '@/components/section-header';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 1. Fetch all of the user's enrollments.
  const enrollmentsQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user?.id) return null;
      return query(collection(firestore, 'enrollments'), where('userId', '==', user.id));
    },
    [firestore, user?.id, isUserLoading]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  // 2. Fetch all course data for the enrolled courses.
  const courseIds = React.useMemo(() => enrollments?.map(e => e.courseId) || [], [enrollments]);
  const coursesQuery = useMemoFirebase(() => {
    if (courseIds.length === 0) return null;
    return query(collection(firestore, 'courses'), where('__name__', 'in', courseIds));
  }, [firestore, courseIds]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // 3. Fetch submissions for each enrolled course.
  // This state will aggregate submissions from multiple queries.
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = React.useState(true);

  React.useEffect(() => {
    if (courseIds.length === 0 && !enrollmentsLoading) {
        setSubmissions([]);
        setSubmissionsLoading(false);
        return;
    }
    if (courseIds.length > 0 && user?.id) {
      setSubmissionsLoading(true);
      const fetchAllSubmissions = async () => {
        const submissionPromises = courseIds.map(courseId => {
          const submissionsQuery = query(
            collection(firestore, `courses/${courseId}/submissions`),
            where('userId', '==', user.id)
          );
          return getDocs(submissionsQuery);
        });

        try {
          const submissionSnapshots = await Promise.all(submissionPromises);
          const allSubmissions = submissionSnapshots.flatMap(snapshot =>
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission))
          );
          setSubmissions(allSubmissions);
        } catch (error: any) {
            // This is where a more detailed error would be thrown if using a custom hook
            // For now, we just log it.
            console.error("Error fetching submissions:", error);
        } finally {
            setSubmissionsLoading(false);
        }
      };

      fetchAllSubmissions();
    }
  }, [courseIds, user?.id, firestore, enrollmentsLoading]);


  // Create a map of courses for easy lookup in the table
  const coursesMap = React.useMemo(() => {
    if (!courses) return new Map();
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  const sortedSubmissions = React.useMemo(() => {
    return submissions.slice().sort((a, b) => {
      const dateA = a.submittedAt?.seconds || 0;
      const dateB = b.submittedAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [submissions]);

  const finalIsLoading = isUserLoading || enrollmentsLoading || coursesLoading || submissionsLoading;

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
