
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, getDocs, Timestamp } from 'firebase/firestore';
import type { Submission, Course, User, Assignment } from '@/lib/types';
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
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [students, setStudents] = React.useState<User[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = React.useState(false);
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

  // 2. When a course is selected, fetch all submissions for it
  React.useEffect(() => {
    if (!selectedCourseId) {
      setSubmissions([]);
      setStudents([]);
      return;
    }

    const fetchSubmissionsForCourse = async () => {
      setSubmissionsLoading(true);
      
      const course = teacherCourses?.find(c => c.id === selectedCourseId);
      if (!course || !course.modules) {
        setSubmissions([]);
        setSubmissionsLoading(false);
        return;
      }
      
      const allSubmissions: Submission[] = [];
      const studentIds = new Set<string>();

      // Iterate through modules and assignments to fetch submissions
      for (const module of course.modules) {
        for (const contentItem of module.content) {
          if (contentItem.type === 'assignment') {
            const submissionsRef = collection(firestore, `courses/${selectedCourseId}/assignments/${contentItem.id}/submissions`);
            try {
              const submissionsSnapshot = await getDocs(submissionsRef);
              submissionsSnapshot.forEach(doc => {
                const submissionData = { id: doc.id, ...doc.data() } as Submission;
                allSubmissions.push(submissionData);
                studentIds.add(submissionData.userId);
              });
            } catch (error: any) {
               if (error.code === 'permission-denied') {
                  const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path: submissionsRef.path,
                  });
                  errorEmitter.emit('permission-error', contextualError);
                } else {
                   toast({
                    variant: 'destructive',
                    title: 'Error Fetching Submissions',
                    description: error.message || 'An unexpected error occurred.',
                  });
                }
            }
          }
        }
      }
      
      setSubmissions(allSubmissions);

      // Fetch student data for the submissions
      if (studentIds.size > 0) {
        try {
          const usersQuery = query(collection(firestore, 'users'), where('__name__', 'in', Array.from(studentIds)));
          const usersSnapshot = await getDocs(usersQuery);
          const studentData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
          setStudents(studentData);
        } catch (error: any) {
           if (error.code === 'permission-denied') {
              const contextualError = new FirestorePermissionError({
                operation: 'list',
                path: 'users',
              });
              errorEmitter.emit('permission-error', contextualError);
            } else {
               toast({
                variant: 'destructive',
                title: 'Error Fetching Students',
                description: error.message || 'An unexpected error occurred.',
              });
            }
        }
      } else {
        setStudents([]);
      }

      setSubmissionsLoading(false);
    };

    fetchSubmissionsForCourse();
  }, [selectedCourseId, firestore, teacherCourses, fetchTrigger, toast]);

  // 3. Create maps for efficient data lookup in the table component
  const studentsMap = React.useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const coursesMap = React.useMemo(() => new Map(teacherCourses?.map(c => [c.id, c]) || []), [teacherCourses]);

  const isLoading = isUserLoading || coursesLoading || submissionsLoading;

  const sortedSubmissions = React.useMemo(() => {
    return submissions.slice().sort((a, b) => {
       const dateA = a.submittedAt instanceof Timestamp ? a.submittedAt.toMillis() : a.submittedAt?.seconds * 1000 || 0;
       const dateB = b.submittedAt instanceof Timestamp ? b.submittedAt.toMillis() : b.submittedAt?.seconds * 1000 || 0;
       return dateB - dateA;
    });
  }, [submissions]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="Student Submissions"
        subtitle="Review and grade submissions for your courses."
      />
      
      <div className="max-w-xs">
          <Select onValueChange={(value) => setSelectedCourseId(value)} >
            <SelectTrigger>
                <SelectValue placeholder="Filter by course..." />
            </SelectTrigger>
            <SelectContent>
                {coursesLoading ? (
                    <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : (
                  <>
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
