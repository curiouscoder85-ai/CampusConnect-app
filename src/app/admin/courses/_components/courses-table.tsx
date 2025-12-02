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
import { Skeleton } from '@/components/ui/skeleton';

interface CoursesTableProps {
  courses: Course[];
  teachers: Record<string, User>; // Using a Record for efficient lookup
  isLoading: boolean;
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


export function CoursesTable({ courses, teachers, isLoading, onUpdateStatus }: CoursesTableProps) {
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
  
  if (isLoading) {
    return (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )
  }

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
          {courses.map((course) => {
            const teacher = teachers[course.teacherId];
            return (
              <TableRow key={course.id}>
                <TableCell>
                  <div className="font-medium">{course.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
                </TableCell>
                <TableCell>
                  {teacher ? (
                     <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{teacher.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unknown Teacher</span>
                  )}
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
            )
        })}
        </TableBody>
      </Table>
    </div>
  );
}
