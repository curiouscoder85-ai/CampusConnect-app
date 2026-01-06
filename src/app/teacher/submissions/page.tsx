
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

  // 2. Fetch all submissions for the teacher using a collectionGroup query
  const allSubmissionsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user?.id) return null;
    // This query finds all submissions where the teacherId matches the current user.
    // The security rules will enforce that this filter is present.
    return query(
      collectionGroup(firestore, 'submissions'),
      where('teacherId', '==', user.id)
    );
  }, [firestore, user?.id, isUserLoading]);

  const { data: allSubmissions, isLoading: submissionsLoading } = useCollection<Submission>(allSubmissionsQuery);
  
  // 3. Filter submissions client-side based on the selected course
  const filteredSubmissions = React.useMemo(() => {
    if (!allSubmissions) return [];
    if (!selectedCourseId) return allSubmissions; // Show all if no course is selected
    return allSubmissions.filter(s => s.courseId === selectedCourseId);
  }, [allSubmissions, selectedCourseId]);


  // 4. Fetch the student data needed for the displayed submissions
  const studentIds = React.useMemo(() => {
    if (!filteredSubmissions) return [];
    return [...new Set(filteredSubmissions.map((s) => s.userId))];
  }, [filteredSubmissions]);

  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', studentIds));
  }, [firestore, studentIds]);
  const { data: students, isLoading: studentsLoading } = useCollection<User>(studentsQuery);

  // 5. Create maps for efficient data lookup
  const studentsMap = React.useMemo(() => {
    if (!students) return new Map();
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);
  
  const coursesMap = React.useMemo(() => {
      if (!teacherCourses) return new Map();
      return new Map(teacherCourses.map(c => [c.id, c]));
  }, [teacherCourses]);

  const isLoading = isUserLoading || coursesLoading || submissionsLoading || studentsLoading;
  
  const sortedSubmissions = React.useMemo(() => {
    if (!filteredSubmissions) return [];
    return filteredSubmissions.slice().sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
  }, [filteredSubmissions]);


  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="Student Submissions"
        subtitle="Review and grade submissions for your courses."
      />
      
      <div className="max-w-xs">
          <Select onValueChange={(value) => setSelectedCourseId(value === 'all' ? null : value)} >
            <SelectTrigger>
                <SelectValue placeholder="Filter by course..." />
            </SelectTrigger>
            <SelectContent>
                {coursesLoading ? (
                    <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : (
                  <>
                    <SelectItem value="all">All Courses</SelectItem>
                    {teacherCourses?.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                    ))}
                  </>
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
