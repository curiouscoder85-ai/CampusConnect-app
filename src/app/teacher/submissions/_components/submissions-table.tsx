'use client';

import * as React from 'react';
import type { Submission, Course, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Download, Edit } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

function SubmissionItem({ submission }: { submission: Submission }) {
  const firestore = useFirestore();
  
  // Memoize document references to prevent unnecessary re-renders
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', submission.courseId), [firestore, submission.courseId]);
  const studentRef = useMemoFirebase(() => doc(firestore, 'users', submission.userId), [firestore, submission.userId]);

  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  const { data: student, isLoading: studentLoading } = useDoc<User>(studentRef);

  const assignment = React.useMemo(() => {
    if (!course) return null;
    for (const module of course.modules || []) {
      const found = module.content.find(c => c.id === submission.assignmentId);
      if (found) return found;
    }
    return null;
  }, [course, submission.assignmentId]);

  const isLoading = courseLoading || studentLoading;
  
  const formattedDate = submission.submittedAt?.seconds 
    ? formatDistanceToNow(new Date(submission.submittedAt.seconds * 1000), { addSuffix: true }) 
    : 'a few moments ago';

  return (
    <TableRow>
      <TableCell>
        {isLoading ? <Skeleton className="h-4 w-32" /> : (
            <div>
                 <div className="font-medium">{assignment?.title || 'Unknown Assignment'}</div>
                 <div className="text-sm text-muted-foreground">{course?.title || 'Unknown Course'}</div>
            </div>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : student ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{student.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Unknown Student</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
      <TableCell>
        {submission.uploading ? (
            <Badge variant="secondary">Uploading...</Badge>
        ) : submission.fileUrl ? (
            <Button variant="outline" size="sm" asChild>
                <Link href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4"/> View File
                </Link>
            </Button>
        ) : (
            <span className="text-xs text-muted-foreground italic">No File</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {submission.grade !== null ? (
          <span className="font-bold text-lg">{submission.grade}</span>
        ) : (
          <Button variant="default" size="sm">
            <Edit className="mr-2 h-4 w-4" /> Grade
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="font-semibold">No Submissions Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
              No students have submitted assignments for your courses yet.
          </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assignment</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>File</TableHead>
            <TableHead className="text-right">Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((item) => (
              <SubmissionItem key={item.id} submission={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
