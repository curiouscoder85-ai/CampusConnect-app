'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import type { Submission, Course, User } from '@/lib/types';
import { useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface SubmissionWithCourse extends Submission {
    courseTitle: string;
    assignmentTitle: string;
}

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
};

function StudentInfo({ studentId }: { studentId: string }) {
  const firestore = useFirestore();
  const studentRef = useMemoFirebase(() => doc(firestore, 'users', studentId), [firestore, studentId]);
  const { data: student, isLoading } = useDoc<User>(studentRef);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={student?.avatar} alt={student?.name} />
        <AvatarFallback>{getInitials(student?.name || '')}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{student?.name || 'Unknown Student'}</span>
    </div>
  );
}


function SubmissionRow({ submission }: { submission: SubmissionWithCourse }) {
    const { toast } = useToast();
    const [grade, setGrade] = React.useState(submission.grade?.toString() || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const firestore = useFirestore();

    const handleSaveGrade = () => {
        setIsSaving(true);
        const submissionRef = doc(firestore, `submissions/${submission.id}`);
        const newGrade = grade === '' ? null : parseInt(grade, 10);

        if (newGrade !== null && (isNaN(newGrade) || newGrade < 0 || newGrade > 100)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Grade',
                description: 'Please enter a number between 0 and 100.',
            });
            setIsSaving(false);
            return;
        }

        updateDocumentNonBlocking(submissionRef, { grade: newGrade });
        toast({
            title: 'Grade Saved',
            description: `The grade has been updated.`,
        });
        setIsSaving(false);
    };

    return (
        <TableRow>
            <TableCell>
                <StudentInfo studentId={submission.userId} />
            </TableCell>
            <TableCell>
                <div className="font-medium">{submission.courseTitle}</div>
                <div className="text-sm text-muted-foreground">{submission.assignmentTitle}</div>
            </TableCell>
            <TableCell className="text-muted-foreground">
                {format(submission.submittedAt.toDate(), 'PP')}
            </TableCell>
            <TableCell>
                {submission.grade !== null && submission.grade !== undefined ? (
                    <Badge variant="default">{submission.grade}</Badge>
                ) : (
                    <Badge variant="secondary">Ungraded</Badge>
                )}
            </TableCell>
            <TableCell className="w-[200px]">
                <div className="flex items-center gap-2">
                    <Input 
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="h-9 w-24"
                    />
                    <Button size="sm" onClick={handleSaveGrade} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

export default function TeacherPerformancePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [submissions, setSubmissions] = React.useState<SubmissionWithCourse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;

      setIsLoading(true);
      const coursesQuery = query(collection(firestore, 'courses'), where('teacherId', '==', user.id));
      const coursesSnapshot = await getDocs(coursesQuery);
      const courses = coursesSnapshot.docs.map(d => ({id: d.id, ...d.data()})) as Course[];
      const courseIds = courses.map(c => c.id);

      if (courseIds.length > 0) {
        const subsQuery = query(collection(firestore, 'submissions'), where('courseId', 'in', courseIds));
        const subsSnapshot = await getDocs(subsQuery);
        
        const submissionsData = subsSnapshot.docs.map(doc => {
            const data = doc.data() as Submission;
            const course = courses.find(c => c.id === data.courseId);
            const assignment = course?.assignments?.find(a => a.id === data.assignmentId);

            return {
                ...data,
                id: doc.id,
                courseTitle: course?.title || 'Unknown Course',
                assignmentTitle: assignment?.title || 'Unknown Assignment',
            } as SubmissionWithCourse;
        });

        setSubmissions(submissionsData);

      } else {
        setSubmissions([]);
      }
      setIsLoading(false);
    };

    fetchSubmissions();
  }, [user, firestore]);
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Student Performance</h1>
        <p className="text-muted-foreground">
          View and grade student submissions for your courses.
        </p>
      </div>

       {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : submissions.length > 0 ? (
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead>Current Grade</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((sub) => (
                           <SubmissionRow key={sub.id} submission={sub} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold">No Submissions Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Students have not submitted any assignments for your courses.
                </p>
            </div>
      )}
    </div>
  );
}
