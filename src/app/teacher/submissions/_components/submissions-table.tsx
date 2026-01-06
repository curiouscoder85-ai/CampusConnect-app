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
import { Download, Edit } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GradeSubmissionDialog } from './grade-submission-dialog';

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
            <div>
                 <div className="font-medium">{submission.assignmentTitle || 'Unknown Assignment'}</div>
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
        {submission.grade !== null && submission.grade !== undefined ? (
          <Button variant="outline" onClick={() => onGradeClick(submission)}>
            <span className="font-bold text-lg">{submission.grade}</span>
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={() => onGradeClick(submission)}>
            <Edit className="mr-2 h-4 w-4" /> Grade
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
