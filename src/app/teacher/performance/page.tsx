
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
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup, doc, updateDoc } from 'firebase/firestore';
import type { Submission, Course, User, Enrollment } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentProgressTable } from './_components/student-progress-table';

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


function SubmissionRow({ submission }: { submission: Submission }) {
    const { toast } = useToast();
    const [grade, setGrade] = React.useState(submission.grade?.toString() || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const firestore = useFirestore();

    const courseRef = useMemoFirebase(() => doc(firestore, 'courses', submission.courseId), [firestore, submission.courseId]);
    const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

    const handleSaveGrade = () => {
        setIsSaving(true);
        const submissionRef = doc(firestore, 'courses', submission.courseId, 'assignments', submission.assignmentId, 'submissions', submission.id);

        const newGrade = grade === '' ? null : parseInt(grade, 10);
        const gradeData = { grade: newGrade };

        if (newGrade !== null && (isNaN(newGrade) || newGrade < 0 || newGrade > 100)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Grade',
                description: 'Please enter a number between 0 and 100.',
            });
            setIsSaving(false);
            return;
        }

        updateDoc(submissionRef, gradeData).then(() => {
            toast({
                title: 'Grade Saved',
                description: `The grade has been updated.`,
            });
        }).catch(() => {
             const contextualError = new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'update',
                requestResourceData: gradeData
            });
            errorEmitter.emit('permission-error', contextualError);
        }).finally(() => {
            setIsSaving(false);
        });
    };
    
    const assignmentTitle = course?.modules?.flatMap(m => m.content).find(c => c.id === submission.assignmentId)?.title || 'Unknown Assignment';

    return (
        <TableRow>
            <TableCell>
                <StudentInfo studentId={submission.userId} />
            </TableCell>
            <TableCell>
                {courseLoading ? <Skeleton className="h-4 w-32" /> : (
                  <>
                    <div className="font-medium">{course?.title}</div>
                    <div className="text-sm text-muted-foreground">{assignmentTitle}</div>
                  </>
                )}
            </TableCell>
            <TableCell className="text-muted-foreground">
                {submission.submittedAt ? format(new Date(submission.submittedAt.seconds * 1000), 'PP') : 'N/A'}
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
  const { user, isUserLoading } = useUser();

  const submissionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'submissions'), where('teacherId', '==', user.id));
  }, [user, firestore]);
  
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.id));
  }, [user, firestore]);

  const {data: submissions, isLoading: submissionsLoading} = useCollection<Submission>(submissionsQuery);
  const {data: enrollments, isLoading: enrollmentsLoading} = useCollection<Enrollment>(enrollmentsQuery);

  const isLoading = isUserLoading || submissionsLoading || enrollmentsLoading;
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Student Performance</h1>
        <p className="text-muted-foreground">
          Track student progress and grade their submissions for your courses.
        </p>
      </div>

      <Tabs defaultValue="progress">
        <TabsList>
            <TabsTrigger value="progress">Overall Progress</TabsTrigger>
            <TabsTrigger value="submissions">Grade Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="mt-6">
            <StudentProgressTable enrollments={enrollments || []} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-6">
            {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            ) : submissions && submissions.length > 0 ? (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
