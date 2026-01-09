'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, collectionGroup } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';

export default function TeacherSubmissionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  
  // Refetch trigger for when a grade is saved
  const [fetchTrigger, setFetchTrigger] = React.useState(0);
  const forceRefetchSubmissions = () => {
    setFetchTrigger(prev => prev + 1);
  };

  // 1. Fetch the teacher's courses to populate the dropdown
  const teacherCoursesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user?.id) return null;
    return query(collection(firestore, 'courses'), where('teacherId', '==', user.id));
  }, [firestore, user?.id, isUserLoading]);
  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(teacherCoursesQuery);

  // 2. Fetch submissions reactively based on selection.
  // This now queries the subcollection for the selected course, or uses a collectionGroup for 'all'.
  const submissionsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user?.id) return null;

    if (selectedCourseId) {
      // Query the subcollection for a specific course
      return query(
        collection(firestore, `courses/${selectedCourseId}/submissions`),
        where('teacherId', '==', user.id) // Still good practice for rules
      );
    } else {
      // Query for all submissions for the teacher using collectionGroup
      return query(
        collectionGroup(firestore, 'submissions'),
        where('teacherId', '==', user.id)
      );
    }
  }, [firestore, user?.id, isUserLoading, selectedCourseId, fetchTrigger]);
  
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  // 3. Fetch student data based on the fetched submissions
  const studentIds = React.useMemo(() => {
    if (!submissions) return [];
    return [...new Set(submissions.map(s => s.userId))];
  }, [submissions]);

  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', studentIds));
  }, [firestore, studentIds]);

  const { data: students, isLoading: studentsLoading } = useCollection<User>(studentsQuery);
  
  // 4. Create maps for efficient data lookup in the table component
  const studentsMap = React.useMemo(() => new Map(students?.map((s) => [s.id, s]) || []), [students]);
  const coursesMap = React.useMemo(() => new Map(teacherCourses?.map(c => [c.id, c]) || []), [teacherCourses]);
  
  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    return submissions.slice().sort((a, b) => {
       const dateA = a.submittedAt instanceof Timestamp ? a.submittedAt.toMillis() : a.submittedAt?.seconds * 1000 || 0;
       const dateB = b.submittedAt instanceof Timestamp ? b.submittedAt.toMillis() : b.submittedAt?.seconds * 1000 || 0;
       return dateB - dateA;
    });
  }, [submissions]);

  const isLoading = isUserLoading || coursesLoading || submissionsLoading || (studentIds.length > 0 && studentsLoading);

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
        onSubmissionsUpdate={forceRefetchSubmissions}
      />
    </div>
  );
}
