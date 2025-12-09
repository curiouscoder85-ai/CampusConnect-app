
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Download } from 'lucide-react';
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

interface SubmissionItemProps {
  submission: Submission;
  course?: Course;
  assignmentTitle?: string;
  isLoading: boolean;
}

function SubmissionItem({ submission, course, assignmentTitle, isLoading }: SubmissionItemProps) {
  const formattedDate = submission.submittedAt?.seconds 
    ? formatDistanceToNow(new Date(submission.submittedAt.seconds * 1000), { addSuffix: true }) 
    : 'a few moments ago';

  return (
    <TableRow>
      <TableCell>
        {isLoading ? <Skeleton className="h-4 w-32" /> : (
            <div>
                 <div className="font-medium">{assignmentTitle || 'Unknown Assignment'}</div>
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

interface SubmissionsTableProps {
  submissions: Submission[];
  coursesMap: Map<string, Course>;
  isLoading: boolean;
}

export function SubmissionsTable({ submissions, coursesMap, isLoading }: SubmissionsTableProps) {
  if (isLoading) {
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
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-8 mx-auto rounded-md" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
  }

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
          {submissions.map((item) => {
              const course = coursesMap.get(item.courseId);
              const assignmentTitle = course?.modules?.flatMap(m => m.content).find(c => c.id === item.assignmentId)?.title;
              return <SubmissionItem key={item.id} submission={item} course={course} assignmentTitle={assignmentTitle} isLoading={isLoading} />
          })}
        </TableBody>
      </Table>
    </div>
  );
}
