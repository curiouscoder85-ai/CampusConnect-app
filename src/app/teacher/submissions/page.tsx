
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, getDocs, Timestamp, collectionGroup } from 'firebase/firestore';
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

  // 2. When a course is selected (or for all courses), fetch relevant submissions
  React.useEffect(() => {
    if (!user) {
      setSubmissions([]);
      setStudents([]);
      return;
    }

    const fetchSubmissionsForCourse = async () => {
      setSubmissionsLoading(true);

      try {
        let submissionsQuery;
        // If a course is selected, filter by that course. Otherwise, fetch all for the teacher.
        if (selectedCourseId) {
            submissionsQuery = query(
                collectionGroup(firestore, 'submissions'), 
                where('teacherId', '==', user.id),
                where('courseId', '==', selectedCourseId)
            );
        } else {
            submissionsQuery = query(
                collectionGroup(firestore, 'submissions'), 
                where('teacherId', '==', user.id)
            );
        }

        const submissionsSnapshot = await getDocs(submissionsQuery);
        const allSubmissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        
        setSubmissions(allSubmissions);

        const studentIds = new Set<string>(allSubmissions.map(s => s.userId));

        // Fetch student data for the submissions
        if (studentIds.size > 0) {
            const usersQuery = query(collection(firestore, 'users'), where('__name__', 'in', Array.from(studentIds)));
            const usersSnapshot = await getDocs(usersQuery);
            const studentData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setStudents(studentData);
        } else {
            setStudents([]);
        }

      } catch (error: any) {
        console.error("Error fetching submissions:", error);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Submissions',
          description: error.message || 'An unexpected error occurred.',
        });
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchSubmissionsForCourse();
  }, [selectedCourseId, firestore, user, fetchTrigger, toast]);

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
