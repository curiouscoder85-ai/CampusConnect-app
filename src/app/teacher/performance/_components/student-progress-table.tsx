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
import { useFirestore } from '@/firebase';
import type { Enrollment, Course, User } from '@/lib/types';
import { useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
};

function EnrollmentRow({ enrollment }: { enrollment: Enrollment }) {
  const firestore = useFirestore();
  
  const studentRef = useMemoFirebase(() => doc(firestore, 'users', enrollment.userId), [firestore, enrollment.userId]);
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', enrollment.courseId), [firestore, enrollment.courseId]);
  
  const { data: student, isLoading: studentLoading } = useDoc<User>(studentRef);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const isLoading = studentLoading || courseLoading;

  if (isLoading) {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        </TableRow>
    );
  }

  if (!student || !course) return null;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatar} alt={student.name} />
            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{student.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{course.title}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
            <Progress value={enrollment.progress} className="w-40 h-2" />
            <span className="text-sm text-muted-foreground">{enrollment.progress}%</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function StudentProgressTable({ enrollments, isLoading }: { enrollments: Enrollment[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="font-semibold">No Students Enrolled</h3>
            <p className="text-sm text-muted-foreground mt-1">
                There are no students enrolled in any of your courses yet.
            </p>
        </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
