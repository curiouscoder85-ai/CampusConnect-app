'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseForm } from '../_components/course-form';
import { ModuleEditor } from '../_components/module-editor';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewCoursePage() {
  const router = useRouter();
  const [courseId, setCourseId] = React.useState<string | null>(null);

  const firestore = useFirestore();
  const courseRef = useMemoFirebase(() => (courseId ? doc(firestore, 'courses', courseId) : null), [firestore, courseId]);
  const { data: course, isLoading } = useDoc<Course>(courseRef);

  const handleCourseCreated = (newCourseId: string) => {
    // This seems redundant with router.push in the form, but it's a good way
    // to trigger a re-render of this page if we stay on it.
    // Let's just do the redirect here.
    router.push(`/teacher/courses/${newCourseId}/edit`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div className="lg:col-span-2">
        <CourseForm onCourseCreated={handleCourseCreated} />
      </div>
      <div className="space-y-8">
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
      </div>
    </div>
  );
}
