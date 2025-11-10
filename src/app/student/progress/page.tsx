'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Enrollment, Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, Award } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

function ProgressRow({ enrollment }: { enrollment: Enrollment }) {
  const firestore = useFirestore();
  const courseRef = useMemoFirebase(
    () => doc(firestore, 'courses', enrollment.courseId),
    [firestore, enrollment.courseId]
  );
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  if (isLoading || !course) {
    return (
      <TableRow>
        <TableCell>
          <Skeleton className="h-5 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-24" />
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
          <Progress value={enrollment.progress} className="w-32 h-2" />
          <span className="text-sm text-muted-foreground">{enrollment.progress}%</span>
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

export default function StudentProgressPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const enrollmentsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.id)) : null),
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } =
    useCollection<Enrollment>(enrollmentsQuery);

  const isLoading = isUserLoading || enrollmentsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="text-primary" />
          My Progress
        </h1>
        <p className="text-muted-foreground">
          Track your course completion and access your certificates.
        </p>
      </div>

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
                <ProgressRow key={i} enrollment={{ id: i.toString() } as Enrollment} />
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
    </div>
  );
}
