
'use client';

import * as React from 'react';
import type { Submission, Course } from '@/lib/types';
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
import { cn } from '@/lib/utils';


function GradeBadge({ grade }: { grade: number | null }) {
    if (grade === null) {
        return <Badge variant="secondary">Pending</Badge>;
    }
    
    let colorClass = '';
    if (grade >= 90) colorClass = 'bg-green-500 text-white';
    else if (grade >= 80) colorClass = 'bg-blue-500 text-white';
    else if (grade >= 70) colorClass = 'bg-yellow-500 text-white';
    else colorClass = 'bg-red-500 text-white';

    return <Badge className={cn("text-base", colorClass)}>{grade}</Badge>
}

function SubmissionItem({ submission }: { submission: Submission }) {
  const firestore = useFirestore();
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', submission.courseId), [firestore, submission.courseId]);
  
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const assignment = React.useMemo(() => {
    if (!course) return null;
    for (const module of course.modules || []) {
      const found = module.content.find(c => c.id === submission.assignmentId);
      if (found) return found;
    }
    return null;
  }, [course, submission.assignmentId]);

  const isLoading = courseLoading;
  
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
      <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
      <TableCell className="text-center">
        {submission.uploading ? (
            <Badge variant="secondary">Uploading...</Badge>
        ) : submission.fileUrl ? (
            <Button variant="outline" size="icon" asChild>
                <Link href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4"/>
                </Link>
            </Button>
        ) : (
            <span className="text-xs text-muted-foreground italic">No File</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <GradeBadge grade={submission.grade} />
      </TableCell>
    </TableRow>
  );
}

export function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="font-semibold">No Submissions Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
              You have not submitted any assignments yet.
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
            <TableHead>Submitted</TableHead>
            <TableHead className="text-center">File</TableHead>
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
