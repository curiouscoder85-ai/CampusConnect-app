
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import type { Submission, Course, Enrollment } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import { SectionHeader } from '@/components/section-header';

export default function StudentGradesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // 1. Fetch enrollments first
  const enrollmentsQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user?.id) return null;
      return query(collection(firestore, 'enrollments'), where('userId', '==', user.id));
    },
    [firestore, user?.id, isUserLoading]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  React.useEffect(() => {
    if (enrollmentsLoading) {
      setIsLoading(true);
      return;
    }
    if (!enrollments || enrollments.length === 0 || !user) {
      setSubmissions([]);
      setCourses([]);
      setIsLoading(false);
      return;
    }

    const fetchSubmissionsAndCourses = async () => {
      setIsLoading(true);
      const courseIds = enrollments.map(e => e.courseId);
      
      if (courseIds.length === 0) {
        setSubmissions([]);
        setCourses([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch all submissions for the user using a collectionGroup query
      const submissionsQuery = query(
        collectionGroup(firestore, 'submissions'),
        where('userId', '==', user.id)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const allSubmissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      
      // Filter submissions to only include those from enrolled courses
      const enrolledSubmissions = allSubmissions.filter(sub => courseIds.includes(sub.courseId));
      setSubmissions(enrolledSubmissions);

      // 3. Fetch course data for the submitted courses
      if (enrolledSubmissions.length > 0) {
        const submittedCourseIds = [...new Set(enrolledSubmissions.map(s => s.courseId))];
         const coursesQuery = query(
            collection(firestore, 'courses'),
            where('__name__', 'in', submittedCourseIds)
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(coursesData);
      } else {
        setCourses([]);
      }
      
      setIsLoading(false);
    };

    fetchSubmissionsAndCourses();
  }, [enrollments, enrollmentsLoading, firestore, user]);

  const coursesMap = React.useMemo(() => {
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);
  
  const sortedSubmissions = React.useMemo(() => {
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
        isLoading={isLoading || isUserLoading || enrollmentsLoading}
      />
    </div>
  );
}
