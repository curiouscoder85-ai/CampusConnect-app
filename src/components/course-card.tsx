'use client';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Course, User } from '@/lib/types';
import { BookOpen } from 'lucide-react';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from './ui/skeleton';

interface CourseCardProps {
  course: Course;
  enrollmentProgress?: number;
  link: string;
  action?: 'view' | 'enroll';
}

export function CourseCard({
  course,
  enrollmentProgress,
  link,
  action = 'view',
}: CourseCardProps) {
  const firestore = useFirestore();
  const teacherRef = useMemoFirebase(() => doc(firestore, 'users', course.teacherId), [firestore, course.teacherId]);
  const { data: teacher, isLoading: teacherLoading } = useDoc<User>(teacherRef);
  
  const showProgress = typeof enrollmentProgress === 'number';

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <Link href={link}>
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={course.image || 'https://picsum.photos/seed/1/600/400'}
              alt={course.title}
              fill
              className="object-cover"
              data-ai-hint="course thumbnail"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        {course.status === 'pending' && <Badge variant="secondary" className="mb-2">Pending</Badge>}
        <CardTitle className="font-headline mb-2 text-lg">
          <Link href={link} className="hover:text-primary transition-colors">
            {course.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {course.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
        {showProgress && (
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{enrollmentProgress}%</span>
            </div>
            <Progress value={enrollmentProgress} className="h-2" />
          </div>
        )}
        <div className="flex w-full items-center justify-between">
          {teacherLoading ? (
             <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
             </div>
          ) : teacher && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{teacher.name}</span>
            </div>
          )}
          <Button asChild variant={action === 'enroll' ? 'default' : 'secondary'} size="sm">
            <Link href={link}>
              <BookOpen className="mr-2 h-4 w-4" />
              {action === 'enroll' ? 'Enroll' : 'View'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
