
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
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [coursesMap, setCoursesMap] = React.useState<Map<string, Course>>(new Map());
  const [isLoading, setIsLoading] = React.useState(true);

  // 1. Fetch all of the user's enrollments.
  const enrollmentsQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user?.id) return null;
      return query(collection(firestore, 'enrollments'), where('userId', '==', user.id));
    },
    [firestore, user?.id, isUserLoading]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  React.useEffect(() => {
    // This effect runs when enrollments are loaded.
    const fetchCoursesAndSubmissions = async () => {
      if (enrollmentsLoading) {
        setIsLoading(true);
        return;
      }
      
      if (!enrollments || enrollments.length === 0) {
        setSubmissions([]);
        setCoursesMap(new Map());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const courseIds = enrollments.map(e => e.courseId);

      // 2. Fetch all course data for the enrolled courses.
      const coursesQuery = query(collection(firestore, 'courses'), where('__name__', 'in', courseIds));
      const coursesSnapshot = await getDocs(coursesQuery);
      const fetchedCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      const newCoursesMap = new Map(fetchedCourses.map(c => [c.id, c]));
      setCoursesMap(newCoursesMap);

      // 3. Fetch submissions for each enrolled course.
      const allSubmissions: Submission[] = [];
      for (const courseId of courseIds) {
        const submissionsQuery = query(
          collection(firestore, `courses/${courseId}/submissions`),
          where('userId', '==', user!.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        submissionsSnapshot.forEach(doc => {
          allSubmissions.push({ id: doc.id, ...doc.data() } as Submission);
        });
      }
      
      setSubmissions(allSubmissions);
      setIsLoading(false);
    };

    if (user) {
        fetchCoursesAndSubmissions();
    } else if (!isUserLoading) {
        setIsLoading(false);
    }
  }, [enrollments, enrollmentsLoading, firestore, user, isUserLoading]);
  
  const sortedSubmissions = React.useMemo(() => {
    return submissions.slice().sort((a, b) => {
      const dateA = a.submittedAt?.seconds || 0;
      const dateB = b.submittedAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [submissions]);

  const finalIsLoading = isLoading || isUserLoading || enrollmentsLoading;

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
