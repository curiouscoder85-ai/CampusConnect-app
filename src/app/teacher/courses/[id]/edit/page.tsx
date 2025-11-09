'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { CourseForm } from '../../_components/course-form';
import type { Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', params.id), [firestore, params.id]);
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div className="lg:col-span-2">
        <CourseForm course={course} />
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Course Materials</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Feature coming soon! Upload videos, PDFs, and create quizzes here.
            </p>
            <Button disabled className="mt-4">Upload Content</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
