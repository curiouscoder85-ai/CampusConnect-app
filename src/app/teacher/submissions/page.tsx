
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, collectionGroup } from 'firebase/firestore';
import type { Submission, Course, User } from '@/lib/types';
import { SubmissionsTable } from './_components/submissions-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionHeader } from '@/components/section-header';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);

  // 1. Fetch the teacher's courses to populate the dropdown
  const teacherCoursesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user?.id) return null;
    return query(collection(firestore, 'courses'), where('teacherId', '==', user.id));
  }, [firestore, user?.id, isUserLoading]);
  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(teacherCoursesQuery);

  // 2. Fetch submissions only for the selected course using a subcollection query
  const submissionsQuery = useMemoFirebase(() => {
    if (!selectedCourseId) return null;
    // The query is now correctly pointing to the subcollection without the redundant where clause.
    return query(
      collection(firestore, 'courses', selectedCourseId, 'assignments', 'submissions')
    );
  }, [firestore, selectedCourseId]);

  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  // 3. Fetch the student data needed for the displayed submissions
  const studentIds = React.useMemo(() => {
    if (!submissions) return [];
    return [...new Set(submissions.map((s) => s.userId))];
  }, [submissions]);

  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', studentIds));
  }, [firestore, studentIds]);
  const { data: students, isLoading: studentsLoading } = useCollection<User>(studentsQuery);

  // 4. Create maps for efficient data lookup
  const studentsMap = React.useMemo(() => {
    if (!students) return new Map();
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);
  
  const coursesMap = React.useMemo(() => {
      if (!teacherCourses) return new Map();
      return new Map(teacherCourses.map(c => [c.id, c]));
  }, [teacherCourses]);

  const isLoading = isUserLoading || coursesLoading || (selectedCourseId && (submissionsLoading || studentsLoading));
  
  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    return submissions.slice().sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
  }, [submissions]);


  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="Student Submissions"
        subtitle="Review and grade submissions for your courses."
      />
      
      <div className="max-w-xs">
          <Select onValueChange={setSelectedCourseId} value={selectedCourseId || undefined}>
            <SelectTrigger>
                <SelectValue placeholder="Select a course to view submissions" />
            </SelectTrigger>
            <SelectContent>
                {coursesLoading ? (
                    <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : (
                    teacherCourses?.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                    ))
                )}
            </SelectContent>
          </Select>
      </div>

      <SubmissionsTable 
        submissions={sortedSubmissions} 
        coursesMap={coursesMap} 
        studentsMap={studentsMap} 
        isLoading={isLoading} 
        selectedCourseId={selectedCourseId}
      />
    </div>
  );
}
