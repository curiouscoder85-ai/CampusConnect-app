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
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Download, Edit, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GradeSubmissionDialog } from './grade-submission-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

interface SubmissionItemProps {
    submission: Submission;
    course?: Course;
    student?: User;
    isLoading: boolean;
    onGradeClick: (submission: Submission) => void;
}

function SubmissionItem({ submission, course, student, isLoading, onGradeClick }: SubmissionItemProps) {
  const formattedDate = submission.submittedAt?.seconds 
    ? formatDistanceToNow(new Date(submission.submittedAt.seconds * 1000), { addSuffix: true }) 
    : 'a few moments ago';

  return (
    <TableRow>
      <TableCell>
        {isLoading ? <Skeleton className="h-4 w-32" /> : (
            <div className="flex flex-col">
                 <div className="font-medium flex items-center gap-2">
                    {submission.assignmentTitle || 'Unknown Assignment'}
                    {submission.comment && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MessageSquare className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-xs">{submission.comment}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                 </div>
                 <div className="text-xs text-muted-foreground">{course?.title || 'Unknown Course'}</div>
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
            <span className="font-medium text-sm">{student.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Unknown Student</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{formattedDate}</TableCell>
      <TableCell>
        {submission.fileUrl ? (
            <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-3.5 w-3.5"/> View File
                </Link>
            </Button>
        ) : submission.uploading ? (
            <Badge variant="secondary" className="animate-pulse">Uploading...</Badge>
        ) : (
            <span className="text-xs text-muted-foreground italic">No File</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {submission.grade !== null && submission.grade !== undefined ? (
          <Button variant="outline" size="sm" onClick={() => onGradeClick(submission)} className="font-bold min-w-[3rem]">
            {submission.grade}
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={() => onGradeClick(submission)} className="h-8">
            <Edit className="mr-2 h-3.5 w-3.5" /> Grade
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

interface SubmissionsTableProps {
  submissions: Submission[];
  coursesMap: Map<string, Course>;
  studentsMap: Map<string, User>;
  isLoading: boolean;
  selectedCourseId: string | null;
  onSubmissionsUpdate: () => void;
}


export function SubmissionsTable({ submissions, coursesMap, studentsMap, isLoading, selectedCourseId, onSubmissionsUpdate }: SubmissionsTableProps) {
    const [gradingSubmission, setGradingSubmission] = React.useState<Submission | null>(null);
    
    if (isLoading && selectedCourseId) {
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
                        {Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }
  
  if (!selectedCourseId) {
    return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="font-semibold">No Course Selected</h3>
            <p className="text-sm text-muted-foreground mt-1">
                Please select a course from the dropdown above to view submissions.
            </p>
        </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="font-semibold">No Submissions Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
              No students have submitted assignments for this course yet.
          </p>
      </div>
    );
  }

  return (
    <>
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
            {submissions.map((item) => {
              const course = coursesMap.get(item.courseId);
              const student = studentsMap.get(item.userId);
              return (
                <SubmissionItem 
                  key={item.id} 
                  submission={item} 
                  course={course}
                  student={student}
                  isLoading={isLoading}
                  onGradeClick={setGradingSubmission}
                />
              )
            })}
          </TableBody>
        </Table>
      </div>
      <GradeSubmissionDialog 
        submission={gradingSubmission}
        isOpen={!!gradingSubmission}
        onOpenChange={(isOpen) => {
            if (!isOpen) setGradingSubmission(null);
        }}
        onGradeSaved={onSubmissionsUpdate}
      />
    </>
  );
}
