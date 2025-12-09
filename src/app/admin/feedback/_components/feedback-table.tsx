'use client';

import * as React from 'react';
import type { Feedback, User, Course } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackTableProps {
  feedback: Feedback[];
  usersMap: Map<string, User>;
  coursesMap: Map<string, Course>;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

function FeedbackItem({ item, student, course }: { item: Feedback, student?: User, course?: Course }) {
  const formattedDate = item.createdAt ? formatDistanceToNow(new Date(item.createdAt.seconds * 1000), { addSuffix: true }) : 'unknown date';

  return (
    <TableRow>
      <TableCell>
        <div className="line-clamp-2">{item.comment}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            i < item.rating ? <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" /> : <Star key={i} className="h-4 w-4 text-muted-foreground/50" />
          ))}
        </div>
      </TableCell>
      <TableCell>
        {student ? (
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
        {course ? (
          <span className="font-medium">{course.title}</span>
        ) : (
          <span className="text-muted-foreground">Unknown Course</span>
        )}
      </TableCell>
       <TableCell className="text-right text-muted-foreground">
          {formattedDate}
       </TableCell>
    </TableRow>
  );
}

export function FeedbackTable({ feedback, usersMap, coursesMap }: FeedbackTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Comment</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead className="text-right">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedback.map((item) => {
            const student = usersMap.get(item.userId);
            const course = coursesMap.get(item.courseId);
            return <FeedbackItem key={item.id} item={item} student={student} course={course} />
          })}
        </TableBody>
      </Table>
    </div>
  );
}
