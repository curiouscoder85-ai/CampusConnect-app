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
import type { Course, User } from '@/lib/types';
import { BookOpen, Check } from 'lucide-react';
import { useDoc, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

interface CourseCardProps {
  course: Course;
  link: string;
  action?: 'view' | 'enroll';
  isEnrolled?: boolean;
  progress?: number;
}

export function CourseCard({
  course,
  link,
  action = 'view',
  isEnrolled = false,
  progress,
}: CourseCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const teacherRef = useMemoFirebase(() => doc(firestore, 'users', course.teacherId), [firestore, course.teacherId]);
  const { data: teacher, isLoading: teacherLoading } = useDoc<User>(teacherRef);
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to enroll in a course.',
      });
      return;
    }
    const enrollmentsCol = collection(firestore, 'enrollments');
    addDocumentNonBlocking(enrollmentsCol, {
      userId: user.id,
      courseId: course.id,
      teacherId: course.teacherId, // Denormalize teacherId
      progress: 0,
      completed: false,
      enrolledAt: serverTimestamp(),
    });
    toast({ title: 'Enrolled!', description: `You have successfully enrolled in ${course.title}.` });
  };
  
  const renderActionButton = () => {
    if (action === 'enroll') {
      if (isEnrolled) {
        return (
          <Button asChild variant="secondary" size="sm">
            <Link href={link}>
              <BookOpen className="mr-2 h-4 w-4" />
              Continue
            </Link>
          </Button>
        );
      }
      return (
        <Button onClick={handleEnroll} variant="default" size="sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Enroll
        </Button>
      );
    }
    // Default 'view' action
    return (
       <Button asChild variant="secondary" size="sm">
            <Link href={link}>
              <BookOpen className="mr-2 h-4 w-4" />
              View
            </Link>
        </Button>
    )
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      <Link href={link} className="p-0 block">
        <CardHeader className="p-0">
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={course.image || 'https://picsum.photos/seed/1/600/400'}
              alt={course.title}
              fill
              className="object-cover"
              data-ai-hint="course thumbnail"
            />
             {progress !== undefined && progress > 0 && (
              <div className="absolute bottom-0 w-full">
                <Progress value={progress} className="h-2 rounded-none" />
              </div>
            )}
          </div>
        </CardHeader>
      </Link>
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
          {renderActionButton()}
        </div>
      </CardFooter>
    </Card>
  );
}
