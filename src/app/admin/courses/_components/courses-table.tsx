'use client';

import * as React from 'react';
import type { Course, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';

interface CoursesTableProps {
  courses: Course[];
  onUpdateStatus: (courseId: string, status: 'approved' | 'rejected') => void;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

function TeacherInfo({ teacherId }: { teacherId: string }) {
  const firestore = useFirestore();
  const teacherRef = useMemoFirebase(() => doc(firestore, 'users', teacherId), [firestore, teacherId]);
  const { data: teacher, isLoading } = useDoc<User>(teacherRef);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!teacher) {
    return <span className="text-muted-foreground">Unknown Teacher</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={teacher.avatar} alt={teacher.name} />
        <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{teacher.name}</span>
    </div>
  );
}

export function CoursesTable({ courses, onUpdateStatus }: CoursesTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell>
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
              </TableCell>
              <TableCell>
                <TeacherInfo teacherId={course.teacherId} />
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(course.status)}>
                  {course.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {course.status !== 'approved' && (
                      <DropdownMenuItem onClick={() => onUpdateStatus(course.id, 'approved')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {course.status !== 'rejected' && (
                      <DropdownMenuItem
                        onClick={() => onUpdateStatus(course.id, 'rejected')}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
