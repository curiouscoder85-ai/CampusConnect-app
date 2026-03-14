
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
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
  const [allSubmissions, setAllSubmissions] = React.useState<Submission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = React.useState(false);
  
  const [fetchTrigger, setFetchTrigger] = React.useState(0);
  const forceRefetchSubmissions = () => {
    setFetchTrigger(prev => prev + 1);
  };

  // 1. Fetch teacher's courses
  const teacherCoursesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user?.id) return null;
    return query(collection(firestore, 'courses'), where('teacherId', '==', user.id));
  }, [firestore, user?.id, isUserLoading]);
  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(teacherCoursesQuery);

  // 2. Real-time query for the selected course
  const selectedCourseSubmissionsQuery = useMemoFirebase(() => {
    if (!selectedCourseId || selectedCourseId === 'all' || !user) return null;
    return query(
      collection(firestore, `courses/${selectedCourseId}/submissions`),
      where('teacherId', '==', user.id)
    );
  }, [firestore, selectedCourseId, user]);
  const { data: realTimeSubmissions, isLoading: isRealTimeLoading } = useCollection<Submission>(selectedCourseSubmissionsQuery);

  // 3. One-time fetch for "All Courses" logic
  React.useEffect(() => {
    async function fetchAllSubmissions() {
      if (!user || !teacherCourses || (selectedCourseId && selectedCourseId !== 'all')) return;

      setIsSubmissionsLoading(true);
      try {
        const results: Submission[] = [];
        const promises = teacherCourses.map(async (course) => {
          const subsRef = collection(firestore, `courses/${course.id}/submissions`);
          const q = query(subsRef, where('teacherId', '==', user.id));
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        });
        const subsArrays = await Promise.all(promises);
        subsArrays.forEach(arr => results.push(...arr));
        
        setAllSubmissions(results);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsSubmissionsLoading(false);
      }
    }

    if (!coursesLoading && teacherCourses) {
      fetchAllSubmissions();
    }
  }, [user, teacherCourses, coursesLoading, selectedCourseId, fetchTrigger]);

  // Determine which submissions to display
  const displaySubmissions = React.useMemo(() => {
    if (selectedCourseId && selectedCourseId !== 'all') {
      return realTimeSubmissions || [];
    }
    return allSubmissions;
  }, [selectedCourseId, realTimeSubmissions, allSubmissions]);

  const studentIds = React.useMemo(() => {
    return [...new Set(displaySubmissions.map(s => s.userId))];
  }, [displaySubmissions]);

  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', studentIds.slice(0, 30)));
  }, [firestore, studentIds]);

  const { data: students, isLoading: studentsLoading } = useCollection<User>(studentsQuery);
  
  const studentsMap = React.useMemo(() => new Map(students?.map((s) => [s.id, s]) || []), [students]);
  const coursesMap = React.useMemo(() => new Map(teacherCourses?.map(c => [c.id, c]) || []), [teacherCourses]);
  
  const sortedSubmissions = React.useMemo(() => {
    return displaySubmissions.slice().sort((a, b) => {
       const dateA = a.submittedAt instanceof Timestamp ? a.submittedAt.toMillis() : a.submittedAt?.seconds * 1000 || 0;
       const dateB = b.submittedAt instanceof Timestamp ? b.submittedAt.toMillis() : b.submittedAt?.seconds * 1000 || 0;
       return dateB - dateA;
    });
  }, [displaySubmissions]);

  const isLoading = isUserLoading || coursesLoading || (selectedCourseId === 'all' ? isSubmissionsLoading : isRealTimeLoading) || (studentIds.length > 0 && studentsLoading);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="Student Submissions"
        subtitle="Review and grade submissions for your courses."
      />
      
      <div className="max-w-xs">
          <Select onValueChange={(value) => setSelectedCourseId(value)} defaultValue="all">
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
