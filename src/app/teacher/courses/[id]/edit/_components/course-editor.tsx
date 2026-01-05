'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { CourseForm } from '../../../_components/course-form';
import type { Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleEditor } from '../../../_components/module-editor';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CourseEditor({ courseId }: { courseId?: string }) {
  const firestore = useFirestore();

  // Only fetch the document if a courseId is provided.
  const courseRef = useMemoFirebase(() => (courseId ? doc(firestore, 'courses', courseId) : null), [
    firestore,
    courseId,
  ]);
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  // Show a loading skeleton only when we expect a course to be loaded.
  if (isLoading && courseId) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // If we were fetching a course but it wasn't found, show a 404.
  if (!course && courseId) {
    return notFound();
  }
  
  // If we are creating a new course (no courseId), or editing an existing one,
  // render the full editor layout.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div className="lg:col-span-2">
        <CourseForm course={course} />
      </div>
      <div className="space-y-8">
        {course ? (
            <ModuleEditor course={course} />
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Course Modules</CardTitle>
                    <CardDescription>Organize your course content into modules.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                        <p>Please create and save the course first to add modules.</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
