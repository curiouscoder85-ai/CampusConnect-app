'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Enrollment, Course, Submission } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, Award, FileText } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

function ProgressRow({ enrollment }: { enrollment?: Enrollment }) {
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(
    () => (enrollment?.courseId ? doc(firestore, 'courses', enrollment.courseId) : null),
    [firestore, enrollment?.courseId]
  );
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  if (isLoading || !enrollment || !course) {
    return (
      <TableRow>
        <TableCell>
          <Skeleton className="h-5 w-48" />
        </TableCell>
        <TableCell className="w-[200px]">
           <Skeleton className="h-5 w-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-8 w-36" />
        </TableCell>
      </TableRow>
    );
  }

  const isCompleted = enrollment.progress === 100;

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/student/courses/${course.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {course.title}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Progress value={enrollment.progress} className="w-24" />
          <span className="text-xs font-medium text-muted-foreground">{enrollment.progress}%</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={isCompleted ? 'default' : 'secondary'}>
          {isCompleted ? 'Completed' : 'In Progress'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {isCompleted ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/student/courses/${course.id}/certificate`}>
              <Award className="mr-2 h-4 w-4" />
              View Certificate
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground italic">Not yet earned</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function GradeRow({ submission }: { submission: Submission }) {
  const firestore = useFirestore();
  const courseRef = useMemoFirebase(
    () => doc(firestore, 'courses', submission.courseId),
    [firestore, submission.courseId]
  );
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  if (isLoading) {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        </TableRow>
    )
  }

  const assignment = course?.modules?.flatMap(m => m.content).find(c => c.id === submission.assignmentId);

  return (
      <TableRow>
          <TableCell className="font-medium">{course?.title || 'Unknown Course'}</TableCell>
          <TableCell>{assignment?.title || 'Unknown Assignment'}</TableCell>
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
      </TableRow>
  )
}

export default function StudentProgressPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const enrollmentsQuery = useMemoFirebase(
    () => (user?.id ? query(collection(firestore, 'enrollments'), where('userId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } =
    useCollection<Enrollment>(enrollmentsQuery);

  const submissionsQuery = useMemoFirebase(
    () => (user?.id ? query(collection(firestore, 'submissions'), where('userId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: submissions, isLoading: submissionsLoading } = useCollection<Submission>(submissionsQuery);

  const isLoading = isUserLoading || enrollmentsLoading || submissionsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="text-primary" />
          My Progress & Grades
        </h1>
        <p className="text-muted-foreground">
          Track your course completion, review grades, and access your certificates.
        </p>
      </div>

      <Tabs defaultValue="progress">
        <TabsList>
            <TabsTrigger value="progress">Course Progress</TabsTrigger>
            <TabsTrigger value="grades">My Grades</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Certificate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <ProgressRow key={i} />
                  ))
                ) : enrollments && enrollments.length > 0 ? (
                  enrollments.map((enrollment) => (
                    <ProgressRow key={enrollment.id} enrollment={enrollment} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      You are not enrolled in any courses yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="grades" className="mt-4">
           <div className="rounded-lg border">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Submitted On</TableHead>
                          <TableHead>Grade</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? (
                           Array.from({ length: 3 }).map((_, i) => (
                              <GradeRow key={i} submission={{} as Submission} />
                          ))
                      ) : submissions && submissions.length > 0 ? (
                          submissions.map((submission) => (
                              <GradeRow key={submission.id} submission={submission} />
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                  No assignments have been submitted yet.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
