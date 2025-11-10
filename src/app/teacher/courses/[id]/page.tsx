'use client';

import React from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';
import type { Course, ContentItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Edit, FileText, Video, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const contentIcons: Record<ContentItem['type'], React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  reading: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

export default function TeacherCourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const router = useRouter();

  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', id), [firestore, id]);
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!course) {
    return notFound();
  }
  
  const defaultOpenAccordion = course.modules?.map(m => m.id) || [];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{course.description}</p>
        </div>
        <Button asChild>
          <Link href={`/teacher/courses/${course.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Course
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Course Content</CardTitle>
          <CardDescription>A summary of all modules and content for this course.</CardDescription>
        </CardHeader>
        <CardContent>
          {course.modules && course.modules.length > 0 ? (
            <Accordion type="multiple" defaultValue={defaultOpenAccordion}>
              {course.modules.map(module => (
                <AccordionItem value={module.id} key={module.id}>
                  <AccordionTrigger className="font-semibold">{module.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-4">
                      {module.content.map(item => (
                        <li key={item.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                          {contentIcons[item.type]}
                          <span>{item.title}</span>
                        </li>
                      ))}
                      {module.content.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No content in this module.</p>
                      )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold">No Modules Created</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Click the "Edit Course" button to start adding modules and content.
                </p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
