'use client';

import * as React from 'react';
import type { Submission, User, Course } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradeSubmissionDialog } from './grade-submission-dialog';

interface SubmissionsTableProps {
  submissions: Submission[];
  onGradeUpdated: () => void;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[1][0]}` : name.substring(0, 2);
};

function SubmissionRow({ submission, onGradeUpdated }: { submission: Submission, onGradeUpdated: () => void }) {
  const firestore = useFirestore();
  const [isGrading, setIsGrading] = React.useState(false);

  const studentRef = useMemoFirebase(() => doc(firestore, 'users', submission.userId), [firestore, submission.userId]);
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', submission.courseId), [firestore, submission.courseId]);
  
  const { data: student, isLoading: studentLoading } = useDoc<User>(studentRef);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const isLoading = studentLoading || courseLoading;
  
  const assignment = course?.modules?.flatMap(m => m.content).find(c => c.id === submission.assignmentId);

  return (
    <>
      <TableRow>
        <TableCell>
          {isLoading ? <Skeleton className="h-4 w-32" /> : (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={student?.avatar} alt={student?.name} />
                <AvatarFallback>{getInitials(student?.name || '')}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{student?.name}</span>
            </div>
          )}
        </TableCell>
        <TableCell>{course?.title || <Skeleton className="h-4 w-24" />}</TableCell>
        <TableCell>{assignment?.title || <Skeleton className="h-4 w-24" />}</TableCell>
        <TableCell className="text-muted-foreground">
          {submission.submittedAt ? formatDistanceToNow(new Date(submission.submittedAt.seconds * 1000), { addSuffix: true }) : '...'}
        </TableCell>
        <TableCell>
          {submission.grade !== null ? (
            <Badge variant="default">{submission.grade}</Badge>
          ) : (
            <Badge variant="secondary">Ungraded</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button variant="outline" size="sm" onClick={() => setIsGrading(true)}>
            {submission.grade !== null ? 'View / Edit Grade' : 'Grade'}
          </Button>
        </TableCell>
      </TableRow>
      <GradeSubmissionDialog
        submission={submission}
        studentName={student?.name || 'Student'}
        assignmentTitle={assignment?.title || 'Assignment'}
        isOpen={isGrading}
        onOpenChange={setIsGrading}
        onGradeUpdated={onGradeUpdated}
      />
    </>
  );
}

export function SubmissionsTable({ submissions, onGradeUpdated }: SubmissionsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No submissions yet.
              </TableCell>
            </TableRow>
          )}
          {submissions.map((item) => (
            <SubmissionRow key={item.id} submission={item} onGradeUpdated={onGradeUpdated} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
