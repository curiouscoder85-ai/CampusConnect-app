'use client';

import { notFound } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { AiRecommendations } from '@/components/ai-recommendations';
import { Book, CheckCircle, FileText, Video } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import type { Course, Enrollment } from '@/lib/types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentCoursePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', params.id), [firestore, params.id]);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const enrollmentsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'enrollments'),
            where('userId', '==', user.uid),
            where('courseId', '==', params.id)
          )
        : null,
    [firestore, user, params.id]
  );
  const { data: enrollments, isLoading: enrollmentLoading } = useCollection<Enrollment>(enrollmentsQuery);
  const enrollment = enrollments?.[0];

  if (courseLoading || enrollmentLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
             <Skeleton className="h-64 w-full" />
             <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    notFound();
  }
  
  const handleEnroll = () => {
    if (!user) return;
    const enrollmentsCol = collection(firestore, 'enrollments');
    addDocumentNonBlocking(enrollmentsCol, {
      userId: user.uid,
      courseId: course.id,
      progress: 0,
      completed: false
    });
    toast({ title: 'Enrolled!', description: `You have successfully enrolled in ${course.title}.` });
  };

  if (!enrollment) {
    return (
        <div className="mx-auto max-w-3xl text-center py-20">
            <h1 className="font-headline text-4xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{course.description}</p>
            <Button onClick={handleEnroll} className="mt-8" size="lg">Enroll Now</Button>
        </div>
    )
  }

  const recommendationInput = {
    courseName: course.title,
    studentProgress: `Completed ${enrollment.progress}% of the course.`,
    learningMaterials: "Not available",
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="font-headline text-4xl font-bold tracking-tight">{course.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{course.description}</p>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between font-medium">
          <span>Overall Progress</span>
          <span>{enrollment.progress}%</span>
        </div>
        <Progress value={enrollment.progress} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible defaultValue={"m1"}>
                        <AccordionItem value="m1">
                            <AccordionTrigger className="font-semibold">Module 1: Introduction</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-2 pl-4">
                                    <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"><Video className="h-4 w-4" /><span>Welcome to the course</span></li>
                                    <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"><Book className="h-4 w-4" /><span>Course overview reading</span></li>
                                    <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"><FileText className="h-4 w-4" /><span>Introductory Quiz</span></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="m2">
                            <AccordionTrigger className="font-semibold">Module 2: Core Concepts</AccordionTrigger>
                            <AccordionContent>
                                <p className="text-muted-foreground">Content coming soon.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <AiRecommendations recommendationInput={recommendationInput} />

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <h4 className="font-semibold">Final Project</h4>
                        <p className="text-sm text-muted-foreground mb-4">Apply what you've learned to build a final project.</p>
                        <Button>Submit Assignment</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Provide Feedback</CardTitle>
                    <CardDescription>Help the instructor improve this course.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea placeholder="Share your thoughts..." />
                    <Button>Submit Feedback</Button>
                </CardContent>
            </Card>

            {enrollment.progress === 100 && (
                <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700">
                    <Link href={`/student/courses/${course.id}/certificate`}>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Download Certificate
                    </Link>
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
