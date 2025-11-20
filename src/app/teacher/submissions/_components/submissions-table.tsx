'use client';

import * as React from 'react';
import type { Submission, User, Course, ContentItem } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


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
  const studentRef = useMemoFirebase(() => doc(firestore, 'users', submission.userId), [firestore, submission.userId]);
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', submission.courseId), [firestore, submission.courseId]);
  
  const { data: student, isLoading: studentLoading } = useDoc<User>(studentRef);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const assignment = React.useMemo(() => {
    if (!course) return null;
    for (const module of course.modules || []) {
      const found = module.content.find(c => c.id === submission.assignmentId);
      if (found) return found;
    }
    return null;
  }, [course, submission.assignmentId]);

  const isLoading = studentLoading || courseLoading;
  
  const formattedDate = submission.submittedAt?.seconds 
    ? formatDistanceToNow(new Date(submission.submittedAt.seconds * 1000), { addSuffix: true }) 
    : 'a few moments ago';

  return (
    <TableRow>
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
      <TableCell>
        {isLoading ? <Skeleton className="h-4 w-32" /> : (
            <div>
                 <div className="font-medium">{assignment?.title || 'Unknown Assignment'}</div>
                 <div className="text-sm text-muted-foreground">{course?.title || 'Unknown Course'}</div>
            </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
       <TableCell className="text-center">
        {submission.uploading ? (
            <Badge variant="secondary">Uploading...</Badge>
        ) : (
            <Button variant="outline" size="icon" asChild>
                <Link href={submission.fileUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4"/>
                </Link>
            </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-center">File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((item) => (
            <SubmissionItem key={item.id} submission={item} />
          ))}
           {submissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No submissions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
